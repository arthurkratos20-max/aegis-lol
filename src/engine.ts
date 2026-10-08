import type {Action,CombatEvent,CombatResult,CombatSummary,Dataset,Scenario,Stats,Formula} from './contracts.ts';
import {statsFor,attackAction,hasteCooldown,mitigate,validateScenario,combatResistance} from './model.ts';
import {nativeDamage} from './native.ts';
import {kitActorStats,kitImpact,kitState} from './kitCombat.ts';
import {EXACT_PATCH,exactEffect,exactValue,skillRank} from './exactKits.ts';
import {EMPTY_FORMULA} from './contracts.ts';
import {championKitCoverage} from './championKit.ts';
export function formulaDamage(f:Formula,actor:Stats,baseAD:number,target:Stats,hp:number):number{return Math.max(0,f.base+f.ad*actor.ad+f.bonusAD*(actor.ad-baseAD)+f.ap*actor.ap+f.ownMaxHP*actor.hp+f.targetMaxHP*target.hp+f.targetCurrentHP*hp+f.targetMissingHP*(target.hp-hp));}
export function coverageWarnings(s:Scenario,data:Dataset):string[]{
 const w=['Modelo exploratório: attack speed ratio usa a velocidade base do Data Dragon; exceções, regeneração e passivas nativas ainda não estão validadas.','Tempos, distância e acertos representam condições configuradas, sem simulação geométrica.'];
 for(const [name,f]of [['Você',s.player],['Adversário',s.enemy]] as const){if(f.items.length)w.push(`${name}: atributos numéricos do snapshot, AH/penetrações da seção de atributos e acúmulos cobertos são aplicados. Talhar do Cutelo Negro tem redução dinâmica no snapshot 16.20. Outras passivas, grupos únicos e procs continuam omitidos.`);if(f.runes.selected.length)w.push(`${name}: apenas atributos da linha Lenda e Caça Suprema cobertos pelo painel de acúmulos; demais efeitos de runas omitidos.`);if(Object.values(f.dragons).some(Boolean)||f.soul)w.push(`${name}: dragões/alma configurados, mas seus efeitos foram omitidos por falta de validação.`);if(Object.values(f.stacks).some(Boolean))w.push(`${name}: acúmulos são valores iniciais estáticos; geração/consumo durante combate não automatizados.`);if(!f.actions.length)w.push(`${name}: sequência contém somente ataques básicos; habilidades nativas não incluídas.`);}
 if(Object.values(s.enabledConditions).some(Boolean))w.push('Condições de itens/runa selecionadas não implementadas.');
 for(const [name,f] of [['Você',s.player],['Adversário',s.enemy]] as const){const kit=championKitCoverage(f.champion,data);w.push(`${name}: kit ${kit.status==='partial'?'parcial':'sem fórmulas nativas disponíveis'}; cobertura pendente: ${kit.missing.join(', ')}. A simulação usa apenas as ações configuradas; não inclui automaticamente o kit completo.`);}
 return w;
}
export function simulate(s:Scenario,data:Dataset):CombatResult{
 const invalid=validateScenario(s,data);if(invalid.length)throw Error(invalid.join('; '));
 if(s.mode==='strict')throw Error('Modo Estrito indisponível: ainda faltam fixtures de validação do patch para atributos, ataques e interações usadas.');
 const warnings=coverageWarnings(s,data);const sides=['player','enemy'] as const;
 const st={player:statsFor(s.player,data),enemy:statsFor(s.enemy,data)};
 const bases={player:statsFor({...s.player,items:[],overrides:{},runes:{...s.player.runes,shards:[]}},data),enemy:statsFor({...s.enemy,items:[],overrides:{},runes:{...s.enemy.runes,shards:[]}},data)};
 const kits={player:kitState(s.player),enemy:kitState(s.enemy)};
 if(data.version!==EXACT_PATCH){kits.player.active=false;kits.enemy.active=false;}
 for(const side of sides)if(kits[side].active)warnings.push(`${side}: efeitos explícitos do snapshot 16.20; geometria, bônus de velocidade não mapeados, periodicidade da Hemorragia e demais passivas omitidos. Fórmula exata aplica-se somente à matemática isolada.`);
 const hp={player:st.player.hp*s.player.initialHP,enemy:st.enemy.hp*s.enemy.initialHP};const resource={player:st.player.mana*s.player.initialResource,enemy:st.enemy.mana*s.enemy.initialResource};
 const summary=():CombatSummary=>({damage:0,raw:0,dps:0,hp:0,death:null,healing:0,shielding:0,ccSeconds:0,composition:{physical:0,magic:0,true:0}});
 const results={player:summary(),enemy:summary()};const cooldowns:Record<string,number>={};const locks={player:0,enemy:0};const cc={player:0,enemy:0};const stasis={player:0,enemy:0};const shields:{player:{amount:number;expires:number}[];enemy:{amount:number;expires:number}[]}={player:[],enemy:[]};
 const cleaver={player:{stacks:0,expires:0},enemy:{stacks:0,expires:0}},cleaverHits=new Set<string>();
 const queue:{side:'player'|'enemy';a:Action;order:number;automatic?:boolean;proc?:boolean;parentAction?:string}[]=[];let order=0;
 for(const side of sides){const f=s[side];for(const a of f.actions)queue.push({side,a,order:order++});if(f.automaticAttacks&&f.uptime>0&&s.distance<=st[side].range){const interval=1/(st[side].as*Math.max(.001,f.uptime));for(let t=0;t<s.duration;t+=interval)queue.push({side,a:attackAction(t),order:order++,automatic:true});}else if(f.automaticAttacks&&s.distance>st[side].range)warnings.push(`${side}: ataques fora do alcance inicial; nenhum ataque automático gerado.`);}
 queue.sort((a,b)=>a.a.at-b.a.at||a.order-b.order);const events:CombatEvent[]=[];const parents=new Map<string,string>();
 function record(side:'player'|'enemy',a:Action,raw=0,damage=0,absorbed=0,overkill=0,note?:string){events.push({actionId:parents.get(a.id)??a.id,at:a.at,actor:side,source:a.name,kind:a.kind,type:a.type,raw,damage,absorbed,overkill,playerHP:hp.player,enemyHP:hp.enemy,playerResource:resource.player,enemyResource:resource.enemy,note});}
 for(let cursor=0;cursor<queue.length;cursor++){const entry=queue[cursor],{side,a}=entry;const other=side==='player'?'enemy':'player';if(a.at>=s.duration)continue;
  shields.player=shields.player.filter(x=>x.expires>a.at);shields.enemy=shields.enemy.filter(x=>x.expires>a.at);
  if(hp[side]<=0){record(side,a,0,0,0,0,'Ação cancelada: morto');continue;}if(!entry.proc&&(a.at<cc[side]||a.at<stasis[side]||a.at<locks[side])){record(side,a,0,0,0,0,'Ação cancelada: CC, estase ou cast em andamento');continue;}
  if(a.kitEffect&&(a.custom||!exactEffect(a.kitEffect)||exactEffect(a.kitEffect)?.champion!==s[side].champion||data.version!==EXACT_PATCH)){record(side,a,0,0,0,0,'Ação cancelada: efeito/snapshot incompatível');continue;}
  const def=exactEffect(a.kitEffect),skipCooldown=entry.proc||!!def&&['passive','tick','secondary'].includes(def.mode??'');
  const key=`${side}:${a.key}`;if(!skipCooldown&&a.at<(cooldowns[key]??0)){record(side,a,0,0,0,0,'Ação cancelada: cooldown');continue;}if(resource[side]<a.cost){record(side,a,0,0,0,0,'Ação cancelada: recurso insuficiente');continue;}
  const shredBefore=kits[side].armorShredExpires>a.at;
  if((a.kitEffect||kits[side].active&&a.kind==='attack')&&hp[other]<=0&&a.kind!=='shield'){record(side,a,0,0,0,0,'Alvo morto');continue;}
  if((a.kitEffect||kits[side].active&&a.kind==='attack')&&a.at<stasis[other]&&!['buff','passive','shield'].includes(def?.mode??'')&&a.kind!=='shield'){record(side,a,0,0,0,0,'Alvo em estase');continue;}
  const actor=kitActorStats(s[side],st[side],bases[side],kits[side],a.at);
  const ki=!entry.proc?kitImpact(a,s[side],data,actor,bases[side],st[other],hp[other],kits[side]):null;
  if(ki?.cancel){record(side,a,0,0,0,0,`Ação cancelada: ${ki.cancel}`);continue;}
  const actualCooldown=hasteCooldown(a.cooldown,actor.haste+(a.key==='R'?(actor.ultimateHaste??0):['Q','W','E'].includes(a.key)?(actor.basicHaste??0):0));
  resource[side]-=a.cost;if(!skipCooldown&&!ki?.deferCooldown)cooldowns[key]=a.at+actualCooldown;if(!entry.proc)locks[side]=a.at+a.cast;
  if(ki?.deferCooldown)cooldowns[key]=a.at+3+actualCooldown;
  if(ki?.consumedQCooldown!==undefined)cooldowns[`${side}:Q`]=a.at+hasteCooldown(ki.consumedQCooldown,actor.haste+(actor.basicHaste??0));
  if(ki?.passive){record(side,a,0,0,0,0,'Efeito ativado; não é impacto independente de dano');continue;}
  if((ki?.resetAttack||def?.id==='jinx-rocket'||ki?.rescheduleAttack&&entry.automatic)&&s[side].automaticAttacks&&s[side].uptime>0&&s.distance<=actor.range){
   const future=queue.slice(cursor+1).filter(q=>!(q.side===side&&q.automatic));queue.splice(cursor+1,queue.length-cursor-1,...future);
   const nextActor=kitActorStats(s[side],st[side],bases[side],kits[side],a.at),interval=1/(nextActor.as*Math.max(.001,s[side].uptime));
   for(let t=a.at+interval;t<s.duration;t+=interval)queue.push({side,a:attackAction(t),order:order++,automatic:true});
  }
  if(ki?.extra.length)for(const [index,part] of ki.extra.entries()){
   const id=`${a.id}:${part.name}`;parents.set(id,a.id);
   queue.push({side,order:entry.order+.001*(index+1),proc:true,parentAction:a.id,a:{...attackAction(a.at),id,key:`proc:${part.name}`,kind:'spell',name:part.name,type:part.type,formula:{...EMPTY_FORMULA,base:part.raw*a.hit}}});
  }
  if(ki?.healMissing){const healing=(st[side].hp-hp[side])*ki.healMissing*(1-s.conditions.grievous);hp[side]+=healing;results[side].healing+=healing;}
  if(ki?.extra.length||ki?.resetAttack||def?.id==='jinx-rocket'||ki?.rescheduleAttack){const future=queue.slice(cursor+1).sort((x,y)=>x.a.at-y.a.at||x.order-y.order);queue.splice(cursor+1,future.length,...future);}

  const beneficial=a.kind==='heal'||a.kind==='shield';const target=beneficial?side:other;
  const base=bases[side].ad;let raw=ki?ki.raw:a.native?nativeDamage(a,s[side],data,actor,st[target]):formulaDamage(a.formula,actor,base,st[target],hp[target]);const damageType=ki?.type??a.type;
  if(a.kind==='stasis'){stasis[side]=a.at+a.duration;record(side,a);continue;}
  if(a.kind==='heal'){const amount=Math.min(st[side].hp-hp[side],raw*a.hit*(1-s.conditions.grievous));hp[side]+=amount;results[side].healing+=amount;record(side,a,raw,0,0,0,`Cura útil ${amount.toFixed(1)}`);continue;}
  if(a.kind==='shield'){shields[side].push({amount:raw*a.hit*(1-s.conditions.shieldReduction),expires:a.at+a.duration});record(side,a,raw);continue;}
  if(hp[other]<=0){record(side,a,0,0,0,0,'Alvo morto');continue;}if(a.at<stasis[other]){record(side,a,0,0,0,0,'Alvo em estase');continue;}
  if(a.kind==='cc'){const end=Math.min(s.duration,a.at+a.duration*a.hit);results[side].ccSeconds+=Math.max(0,end-Math.max(a.at,cc[other]));cc[other]=Math.max(cc[other],end);record(side,a,0,0,0,0,a.hit<1?'CC com duração esperada pela chance configurada':undefined);continue;}
  if(a.kind==='attack'&&!ki)raw*=1+actor.crit*(actor.critMultiplier-1);raw*=a.hit;
  const shred=shredBefore?exactValue('Garen','GarenE','ShredAmount',skillRank(s[side],'E')):0;
  const carve=cleaver[side].expires>a.at?.06*cleaver[side].stacks:0,combinedShred=1-(1-shred)*(1-carve);
  const resistance=damageType==='physical'?combatResistance(st[other].armor,actor.armorPenPercent,actor.armorPen,combinedShred):combatResistance(st[other].mr,actor.magicPenPercent,actor.magicPen);
  const damageReduction=kits[other].garenDRExpires>a.at?kits[other].garenDR:0;
  const post=damageType==='true'?raw:mitigate(raw,resistance)*(1-damageReduction);let remaining=post,absorbed=0;
  for(const sh of shields[other]){const take=Math.min(sh.amount,remaining);sh.amount-=take;remaining-=take;absorbed+=take;}results[other].shielding+=absorbed;
  const actual=Math.min(hp[other],remaining),overkill=Math.max(0,remaining-hp[other]);hp[other]=Math.max(0,hp[other]-actual);results[side].damage+=actual;results[side].raw+=raw;results[side].composition[damageType]+=actual;
  const carveKey=`${side}:${entry.parentAction??a.id}`;
  if(data.version===EXACT_PATCH&&s[side].items.includes('3071')&&damageType==='physical'&&a.hit===1&&actual+absorbed>0&&!cleaverHits.has(carveKey)){cleaverHits.add(carveKey);cleaver[side].stacks=cleaver[side].expires>a.at?Math.min(5,cleaver[side].stacks+1):1;cleaver[side].expires=a.at+6;}
  if(hp[other]===0&&results[other].death===null)results[other].death=a.at;
  if((a.kind==='attack'||def?.mode==='attack')&&damageType==='physical'&&st[side].lifesteal>0){const h=Math.min(st[side].hp-hp[side],actual*st[side].lifesteal*(1-s.conditions.grievous));hp[side]+=h;results[side].healing+=h;}
  if(a.cooldownReduction&&a.hit>0)for(const k of Object.keys(cooldowns).filter(k=>k.startsWith(`${side}:`)))cooldowns[k]=Math.max(a.at,cooldowns[k]-a.cooldownReduction);
  record(side,{...a,type:damageType},raw,actual,absorbed,overkill,a.hit<1?'Dano em valor esperado; chance configurada':undefined);
 }
 for(const side of sides){results[side].hp=hp[side];results[side].dps=results[side].damage/s.duration;}
 return {events,player:results.player,enemy:results.enemy,warnings:[...new Set(warnings)],coverage:'testing',custom:s.player.actions.some(a=>a.custom)||s.enemy.actions.some(a=>a.custom)||Object.keys(s.player.overrides).length>0||Object.keys(s.enemy.overrides).length>0||s.player.runes.shards.length>0||s.enemy.runes.shards.length>0};
}
