import type {Action,CombatEvent,CombatResult,CombatSummary,Dataset,Scenario,Stats,Formula} from './contracts.ts';
import {statsFor,attackAction,hasteCooldown,mitigate,validateScenario,effectiveResistance} from './model.ts';
import {nativeDamage} from './native.ts';
import {championKitCoverage} from './championKit.ts';
export function formulaDamage(f:Formula,actor:Stats,baseAD:number,target:Stats,hp:number):number{return Math.max(0,f.base+f.ad*actor.ad+f.bonusAD*(actor.ad-baseAD)+f.ap*actor.ap+f.ownMaxHP*actor.hp+f.targetMaxHP*target.hp+f.targetCurrentHP*hp+f.targetMissingHP*(target.hp-hp));}
export function coverageWarnings(s:Scenario,data:Dataset):string[]{
 const w=['Modelo exploratório: attack speed ratio usa a velocidade base do Data Dragon; exceções, regeneração e passivas nativas ainda não estão validadas.','Tempos, distância e acertos representam condições configuradas, sem simulação geométrica.'];
 for(const [name,f]of [['Você',s.player],['Adversário',s.enemy]] as const){if(f.items.length)w.push(`${name}: atributos numéricos do snapshot, AH/penetrações da seção de atributos e acúmulos cobertos são aplicados. Outras passivas, grupos únicos e procs continuam omitidos.`);if(f.runes.selected.length)w.push(`${name}: apenas atributos da linha Lenda e Caça Suprema cobertos pelo painel de acúmulos; demais efeitos de runas omitidos.`);if(Object.values(f.dragons).some(Boolean)||f.soul)w.push(`${name}: dragões/alma configurados, mas seus efeitos foram omitidos por falta de validação.`);if(Object.values(f.stacks).some(Boolean))w.push(`${name}: acúmulos são valores iniciais estáticos; geração/consumo durante combate não automatizados.`);if(!f.actions.length)w.push(`${name}: sequência contém somente ataques básicos; habilidades nativas não incluídas.`);}
 if(Object.values(s.enabledConditions).some(Boolean))w.push('Condições de itens/runa selecionadas não implementadas.');
 for(const [name,f] of [['Você',s.player],['Adversário',s.enemy]] as const){const kit=championKitCoverage(f.champion,data);w.push(`${name}: kit ${kit.status==='partial'?'parcial':'sem fórmulas nativas disponíveis'}; cobertura pendente: ${kit.missing.join(', ')}. A simulação usa apenas as ações configuradas; não inclui automaticamente o kit completo.`);}
 return w;
}
export function simulate(s:Scenario,data:Dataset):CombatResult{
 const invalid=validateScenario(s,data);if(invalid.length)throw Error(invalid.join('; '));
 if(s.mode==='strict')throw Error('Modo Estrito indisponível: ainda faltam fixtures de validação do patch para atributos, ataques e interações usadas.');
 const warnings=coverageWarnings(s,data);const sides=['player','enemy'] as const;
 const st={player:statsFor(s.player,data),enemy:statsFor(s.enemy,data)};
 const hp={player:st.player.hp*s.player.initialHP,enemy:st.enemy.hp*s.enemy.initialHP};const resource={player:st.player.mana*s.player.initialResource,enemy:st.enemy.mana*s.enemy.initialResource};
 const summary=():CombatSummary=>({damage:0,raw:0,dps:0,hp:0,death:null,healing:0,shielding:0,ccSeconds:0,composition:{physical:0,magic:0,true:0}});
 const results={player:summary(),enemy:summary()};const cooldowns:Record<string,number>={};const locks={player:0,enemy:0};const cc={player:0,enemy:0};const stasis={player:0,enemy:0};const shields:{player:{amount:number;expires:number}[];enemy:{amount:number;expires:number}[]}={player:[],enemy:[]};
 const queue:{side:'player'|'enemy';a:Action;order:number}[]=[];let order=0;
 for(const side of sides){const f=s[side];for(const a of f.actions)queue.push({side,a,order:order++});if(f.automaticAttacks&&f.uptime>0&&s.distance<=st[side].range){const interval=1/(st[side].as*Math.max(.001,f.uptime));for(let t=0;t<s.duration;t+=interval)queue.push({side,a:attackAction(t),order:order++});}else if(f.automaticAttacks&&s.distance>st[side].range)warnings.push(`${side}: ataques fora do alcance inicial; nenhum ataque automático gerado.`);}
 queue.sort((a,b)=>a.a.at-b.a.at||a.order-b.order);const events:CombatEvent[]=[];
 function record(side:'player'|'enemy',a:Action,raw=0,damage=0,absorbed=0,overkill=0,note?:string){events.push({at:a.at,actor:side,source:a.name,kind:a.kind,type:a.type,raw,damage,absorbed,overkill,playerHP:hp.player,enemyHP:hp.enemy,playerResource:resource.player,enemyResource:resource.enemy,note});}
 for(const {side,a}of queue){const other=side==='player'?'enemy':'player';if(a.at>=s.duration)continue;
  shields.player=shields.player.filter(x=>x.expires>a.at);shields.enemy=shields.enemy.filter(x=>x.expires>a.at);
  if(hp[side]<=0){record(side,a,0,0,0,0,'Ação cancelada: morto');continue;}if(a.at<cc[side]||a.at<stasis[side]||a.at<locks[side]){record(side,a,0,0,0,0,'Ação cancelada: CC, estase ou cast em andamento');continue;}
  const key=`${side}:${a.key}`;if(a.at<(cooldowns[key]??0)){record(side,a,0,0,0,0,'Ação cancelada: cooldown');continue;}if(resource[side]<a.cost){record(side,a,0,0,0,0,'Ação cancelada: recurso insuficiente');continue;}
  resource[side]-=a.cost;cooldowns[key]=a.at+hasteCooldown(a.cooldown,st[side].haste+(a.key==='R'?(st[side].ultimateHaste??0):['Q','W','E'].includes(a.key)?(st[side].basicHaste??0):0));locks[side]=a.at+a.cast;
  const beneficial=a.kind==='heal'||a.kind==='shield';const target=beneficial?side:other;
  const base=statsFor({...s[side],items:[],overrides:{},runes:{...s[side].runes,shards:[]}},data).ad;let raw=a.native?nativeDamage(a,s[side],data,st[side],st[target]):formulaDamage(a.formula,st[side],base,st[target],hp[target]);
  if(a.kind==='stasis'){stasis[side]=a.at+a.duration;record(side,a);continue;}
  if(a.kind==='heal'){const amount=Math.min(st[side].hp-hp[side],raw*a.hit*(1-s.conditions.grievous));hp[side]+=amount;results[side].healing+=amount;record(side,a,raw,0,0,0,`Cura útil ${amount.toFixed(1)}`);continue;}
  if(a.kind==='shield'){shields[side].push({amount:raw*a.hit*(1-s.conditions.shieldReduction),expires:a.at+a.duration});record(side,a,raw);continue;}
  if(hp[other]<=0){record(side,a,0,0,0,0,'Alvo morto');continue;}if(a.at<stasis[other]){record(side,a,0,0,0,0,'Alvo em estase');continue;}
  if(a.kind==='cc'){const end=Math.min(s.duration,a.at+a.duration*a.hit);results[side].ccSeconds+=Math.max(0,end-Math.max(a.at,cc[other]));cc[other]=Math.max(cc[other],end);record(side,a,0,0,0,0,a.hit<1?'CC com duração esperada pela chance configurada':undefined);continue;}
  if(a.kind==='attack')raw*=1+st[side].crit*(st[side].critMultiplier-1);raw*=a.hit;
  const resistance=a.type==='physical'?effectiveResistance(st[other].armor,st[side].armorPenPercent,st[side].armorPen):effectiveResistance(st[other].mr,st[side].magicPenPercent,st[side].magicPen);
  const post=a.type==='true'?raw:mitigate(raw,resistance);let remaining=post,absorbed=0;
  for(const sh of shields[other]){const take=Math.min(sh.amount,remaining);sh.amount-=take;remaining-=take;absorbed+=take;}results[other].shielding+=absorbed;
  const actual=Math.min(hp[other],remaining),overkill=Math.max(0,remaining-hp[other]);hp[other]=Math.max(0,hp[other]-actual);results[side].damage+=actual;results[side].raw+=raw;results[side].composition[a.type]+=actual;
  if(hp[other]===0&&results[other].death===null)results[other].death=a.at;
  if(a.kind==='attack'&&st[side].lifesteal>0){const h=Math.min(st[side].hp-hp[side],actual*st[side].lifesteal*(1-s.conditions.grievous));hp[side]+=h;results[side].healing+=h;}
  if(a.cooldownReduction&&a.hit>0)for(const k of Object.keys(cooldowns).filter(k=>k.startsWith(`${side}:`)))cooldowns[k]=Math.max(a.at,cooldowns[k]-a.cooldownReduction);
  record(side,a,raw,actual,absorbed,overkill,a.hit<1?'Dano em valor esperado; chance configurada':undefined);
 }
 for(const side of sides){results[side].hp=hp[side];results[side].dps=results[side].damage/s.duration;}
 return {events,player:results.player,enemy:results.enemy,warnings:[...new Set(warnings)],coverage:'testing',custom:s.player.actions.some(a=>a.custom)||s.enemy.actions.some(a=>a.custom)||Object.keys(s.player.overrides).length>0||Object.keys(s.enemy.overrides).length>0||s.player.runes.shards.length>0||s.enemy.runes.shards.length>0};
}
