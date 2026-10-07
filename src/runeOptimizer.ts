import {tradingKeystoneAllowed,tradingKeystoneBonus,tradingKeystoneReason} from './tradingPatterns.ts';
import {teamContext} from './teamContext.ts';
import {preferenceWeights} from './preferenceWeights.ts';
import type {Dataset,Scenario,RunePage,RuneTree,Rune} from './contracts.ts';
import {kitFor,runeCompatible} from './compatibility.ts';
import {continuousWeights} from './continuousBuild.ts';
import {SHARD_ROWS} from './shards.ts';
import {kitRuneEstimate,runeAffinity} from './runeAffinity.ts';
import {championForCounter} from './counterAdapters.ts';
export interface HeuristicRuneScore {
 id:number; normalizedDPS:number; normalizedEHP:number;normalizedUtility:number; counterBonus:number; score:number;
 coverage:'heuristic'; // Relative affinity, NOT measured DPS, EHP or a simulated rune effect.
}
const estimates:Record<number,[number,number]>={
 8112:[.9,.05],8128:[.85,.05],9923:[.88,.03],8126:[.75,.03],8139:[.1,.7],8143:[.8,.03],8137:[.05,.3],8140:[.12,.2],8141:[.05,.35],8135:[.4,.1],8105:[.25,.3],8106:[.65,.05],
 8351:[.08,.85],8360:[.3,.65],8369:[.8,.05],8306:[.1,.2],8304:[.25,.35],8321:[.35,.2],8313:[.3,.3],8352:[.1,.65],8345:[.08,.7],8347:[.35,.35],8410:[.3,.3],8316:[.35,.3],
 8005:[.92,.05],8008:[1,.03],8021:[.25,.75],8010:[.85,.3],9101:[.08,.75],9111:[.12,.8],8009:[.5,.02],9104:[.85,.03],9105:[.65,.05],9103:[.25,.65],8014:[.7,.02],8017:[.8,.01],8299:[.72,.05],
 8437:[.3,1],8439:[.2,.96],8465:[.02,.98],8446:[.3,.08],8463:[.03,.65],8401:[.5,.4],8429:[.03,.95],8444:[.02,.8],8473:[.02,.85],8451:[.08,.95],8453:[.03,.85],8242:[.02,.75],
 8214:[.65,.4],8229:[.9,.02],8230:[.15,.6],8992:[.95,.02],8224:[.65,.05],8226:[.5,.02],8275:[.15,.4],8210:[.65,.05],8234:[.15,.35],8233:[.8,.02],8237:[.7,.02],8232:[.25,.25],8236:[.85,.04],
};
function runeThreats(s:Scenario,data:Dataset){
 const ids=s.counterPreset?.mode==='draft'||s.counterPreset?.source.includes('Draft')?s.draft?.enemy:undefined;
 return (ids?[...new Set(ids)].filter(id=>data.champions[id]).slice(0,5):[s.enemy.champion]).map(id=>championForCounter(id,data,id===s.enemy.champion?s.enemy:undefined));
}
function threatWeight(s:Scenario,data:Dataset,predicate:(enemy:ReturnType<typeof championForCounter>)=>boolean){
 const team=teamContext(s,data),lane=!s.matchupUnknown&&runeThreats(s,data).some(predicate)?1:0;
 const teamValue=team.ids.length?team.ids.filter(id=>predicate(championForCounter(id,data,id===s.enemy.champion?s.enemy:undefined))).length/team.ids.length:0;
 return (1-team.weight)*lane+team.weight*teamValue;
}
export function heuristicRuneScore(rune:Rune,s:Scenario,data:Dataset,sliderValue:number|Scenario['weights']):HeuristicRuneScore {
 const k=kitFor(s.player,data),enemies=runeThreats(s,data),w=preferenceWeights(sliderValue);
 let [normalizedDPS,normalizedEHP]=kitRuneEstimate(rune.id,s.player,data)??estimates[rune.id]??[.1,.1];
 if([8008,9923,9104].includes(rune.id)&&!k.autoAttack)normalizedDPS*=.15;
 if(rune.id===8437&&k.healthScaling)normalizedDPS+=.1;
 if([8214,8465,8453].includes(rune.id)&&!k.healShield&&!(rune.id===8465&&['engage','warden'].includes(runeAffinity(s.player,data))))normalizedEHP*=.2;
 const counter=threatWeight(s,data,enemy=>!!(rune.id===8473&&enemy.isBurst||rune.id===8242&&enemy.hasHardCC||rune.id===8017&&enemy.isTank||rune.id===8444&&enemy.hasHealing));
 const counterBonus=.05*4*w.weightDamage*w.weightDefense*counter;
 const normalizedUtility=({8210:1,8106:1,8347:1,8234:1,8232:1,8275:1,8230:1,8226:k.mana?1:0,8009:k.mana||k.energy?1:0,8214:k.healShield?1:.2,8453:k.healShield?1:0,8465:k.healShield?1:.5} as Record<number,number>)[rune.id]??0;
 return {id:rune.id,normalizedUtility,normalizedDPS,normalizedEHP,counterBonus,score:w.weightDamage*normalizedDPS+w.weightDefense*normalizedEHP+w.weightUtility*normalizedUtility+counterBonus,coverage:'heuristic'};
}
export function calculateOptimalRunes(s:Scenario,data:Dataset,sliderValue:number|Scenario['weights']=s.weights,contextual=false):RunePage {
 const page=s.player.runes;if(page.locked)return structuredClone(page);
 const locks=page.locks??{},locked=new Set(locks.runes??[]),k=kitFor(s.player,data);
 const viable=(r:Rune)=>(!contextual||tradingKeystoneAllowed(r.id,s,data))&&runeCompatible(r.id,s.player,data).allowed&&(r.id!==8465||k.healShield||['engage','warden'].includes(runeAffinity(s.player,data)))&&(r.id!==8401||k.healShield);
 const locate=(id:number)=>{for(const tree of data.runes)for(let row=0;row<tree.slots.length;row++)if(tree.slots[row].runes.some(r=>r.id===id))return {tree,row};return undefined;};
 for(const id of locked){const slot=locate(id);if(!slot||!page.selected.includes(id)||![page.primary,page.secondary].includes(slot.tree.id)||slot.tree.id===page.secondary&&slot.row===0)throw Error('Trava de runa ausente ou incompatível com as árvores atuais.');}
 const primaryLocked=locks.primaryTree||[...locked].some(id=>locate(id)?.tree.id===page.primary);
 const secondaryLocked=locks.secondaryTree||[...locked].some(id=>locate(id)?.tree.id===page.secondary);
 const score=(r:Rune)=>heuristicRuneScore(r,s,data,sliderValue).score+(contextual?matchupRuneAdjustment(r.id,s,data).bonus+tradingKeystoneBonus(r.id,s,data):0);
 const ranked=(runes:Rune[])=>runes.filter(r=>viable(r)||locked.has(r.id)).map(r=>({r,score:score(r)})).sort((a,b)=>b.score-a.score||a.r.id-b.r.id);
 const choose=(tree:RuneTree,row:number)=>{
  const fixed=tree.slots[row].runes.filter(r=>locked.has(r.id));if(fixed.length>1)throw Error('Duas runas travadas na mesma linha.');
  return fixed[0]??ranked(tree.slots[row].runes)[0]?.r;
 };
 const keystones=data.runes.filter(tree=>(!primaryLocked||tree.id===page.primary)&&(!secondaryLocked||tree.id!==page.secondary)).flatMap(tree=>{const key=choose(tree,0);return key?[{tree,key,score:score(key)}]:[];}).sort((a,b)=>b.score-a.score||a.key.id-b.key.id);
 const primary=keystones[0];if(!primary)throw Error('Nenhuma árvore primária compatível com as travas.');
 const main=primary.tree.slots.map((_,row)=>choose(primary.tree,row));if(main.length!==4||main.some(r=>!r))throw Error('Árvore primária incompleta no snapshot.');
 const alternatives=data.runes.filter(t=>t.id!==primary.tree.id&&(!secondaryLocked||t.id===page.secondary)).flatMap(tree=>{
  const rows=tree.slots.slice(1).map((_,i)=>({r:choose(tree,i+1),row:i+1})).filter((v):v is {r:Rune;row:number}=>!!v.r);
  const fixed=rows.filter(v=>locked.has(v.r.id));if(fixed.length>2)return [];
  const free=rows.filter(v=>!fixed.includes(v)).sort((a,b)=>score(b.r)-score(a.r)||a.row-b.row);
  const selected=[...fixed,...free.slice(0,2-fixed.length)].sort((a,b)=>a.row-b.row);if(selected.length!==2)return [];
  return [{tree,selected,score:selected.reduce((sum,v)=>sum+score(v.r),0)}];
 }).sort((a,b)=>b.score-a.score||a.tree.id-b.tree.id);
 const secondary=alternatives[0];if(!secondary)throw Error('Nenhuma árvore secundária legal com as travas atuais.');
 const w=preferenceWeights(sliderValue);
 const shardScore=(id:string)=>{
  const values:Record<string,[number,number]>={adaptive:[.9,0],as:[k.autoAttack?1:.1,0],haste:[k.autoAttack?.65:1,.1],move:[.05,.35],scalingHP:[k.healthScaling?.25:0,s.player.level>=7?1:.4],hp:[k.healthScaling?.1:0,.65],tenacity:[0,.2+.8*threatWeight(s,data,enemy=>!!enemy.hasHardCC)]};
  const [d,h]=values[id]??[0,0];return w.weightDamage*d+w.weightDefense*h+w.weightUtility*(id==='haste'||id==='move'?1:0);
 };
 const shards=SHARD_ROWS.map((row,i)=>{
  if(locks.shards?.includes(i)){if(!row.includes(page.shards[i]))throw Error('Fragmento travado inválido para este slot.');return page.shards[i];}
  return [...row].sort((a,b)=>shardScore(b)-shardScore(a)||a.localeCompare(b))[0];
 });
 return {...page,primary:primary.tree.id,secondary:secondary.tree.id,selected:[...main.map(r=>r!.id),...secondary.selected.map(v=>v.r.id)],shards};
}

/** Editorial lane-response scores on the same affinity scale as kit scores.
 * Survival responses must compete with offensive secondary trees, even for ADCs/mages.
 * These are strategic priorities, never measured damage, win rates or guaranteed counters. */
export function matchupRuneAdjustment(id:number,s:Scenario,data:Dataset):{bonus:number;reason:string}{
 if(s.matchupUnknown)return {bonus:0,reason:'Adversário indefinido: afinidade com kit e rota, sem resposta de confronto.'};
 const enemy=championForCounter(s.enemy.champion,data,s.enemy),ranged=data.champions[enemy.id].stats.attackrange>300;
 const close=data.champions[s.player.champion].stats.attackrange<=300,k=kitFor(s.player,data);
 const response=(bonus:number,reason:string)=>({bonus,reason:`Contra ${enemy.name}: ${reason} Orientação estimada de kit, sem vantagem estatística comprovada.`});
 if(id===8473&&enemy.isBurst)return response(.8,'Osso Revestido favorece resistência a uma sequência de impactos; pode ser retirado antes do combo.');
 if(id===8473&&enemy.hasHardCC&&!ranged)return response(.65,'Osso Revestido considera impactos sucessivos após uma iniciação corpo a corpo; sua recarga e a possibilidade de removê-lo antes da troca limitam a proteção.');
 if(id===8444&&ranged&&!enemy.isBurst)return response(.8,'Ventos Revigorantes favorece recuperação após pressão de alcance; alcance sozinho não comprova poke constante.');
 if(id===8242&&enemy.hasHardCC)return response(.8,'Inabalável considera a presença de controle; não presume proteção contra todo tipo de controle.');
 if(id===8451&&(enemy.isBurst||ranged||enemy.hasHardCC))return response(.45,'Crescimento Excessivo oferece vida ao longo da partida; não substitui resistência imediata e depende da acumulação.');
 if(id===8017&&enemy.isTank)return response(.16,'Dilacerar favorece pressão contra alvos resistentes; a condição real da runa ainda precisa ser atendida.');
 if(id===8437&&close&&!ranged)return response(.12,'Aperto ganha afinidade com trocas corpo a corpo quando é possível aplicar o ataque carregado.');
 if(id===8439&&k.hardCC&&enemy.isBurst)return response(.16,'Pós-Choque depende de acertar sua imobilização antes de receber a resposta de burst.');
 if(id===8021&&k.autoAttack&&ranged&&!enemy.isTank)return response(.12,'Agilidade nos Pés oferece uma alternativa de sustentação e reposicionamento sob pressão de alcance.');
 return {bonus:0,reason:`Contra ${enemy.name}: preserva a afinidade da runa com o kit; sem resposta específica modelada para este gatilho.`};
}
export function matchupRuneReason(s:Scenario,data:Dataset,page:RunePage):string{
 const responses=page.selected.map(id=>matchupRuneAdjustment(id,s,data)).filter(x=>x.bonus>0);
 const key=data.runes.find(t=>t.id===page.primary)?.slots[0].runes.find(r=>page.selected.includes(r.id));
 const baseline=calculateOptimalRunes({...s,matchupUnknown:true},data,s.weights,true);
 const previous=data.runes.find(t=>t.id===baseline.primary)?.slots[0].runes.find(r=>baseline.selected.includes(r.id));
 const changed=key&&previous&&key.id!==previous.id?`Mudança de ${previous.name} para ${key.name}: `:'';
 const locked=page.locked||key&&page.locks?.runes?.includes(key.id)?'Runa principal travada: escolha manual preservada. ':'';
 return locked+changed+(key?tradingKeystoneReason(key.id,s,data)+' ':'')+(responses.length?responses.map(x=>x.reason).join(' '):matchupRuneAdjustment(0,s,data).reason);
}
