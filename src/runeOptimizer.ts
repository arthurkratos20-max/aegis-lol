import type {Dataset,Scenario,RunePage,RuneTree,Rune} from './contracts.ts';
import {kitFor,runeCompatible} from './compatibility.ts';
import {continuousWeights} from './continuousBuild.ts';
import {SHARD_ROWS} from './shards.ts';
import {kitRuneEstimate,runeAffinity} from './runeAffinity.ts';
import {championForCounter} from './counterAdapters.ts';
export interface HeuristicRuneScore {
 id:number; normalizedDPS:number; normalizedEHP:number; counterBonus:number; score:number;
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
export function heuristicRuneScore(rune:Rune,s:Scenario,data:Dataset,sliderValue:number):HeuristicRuneScore {
 const k=kitFor(s.player,data),enemies=runeThreats(s,data),w=continuousWeights(sliderValue);
 let [normalizedDPS,normalizedEHP]=kitRuneEstimate(rune.id,s.player,data)??estimates[rune.id]??[.1,.1];
 if([8008,9923,9104].includes(rune.id)&&!k.autoAttack)normalizedDPS*=.15;
 if(rune.id===8437&&k.healthScaling)normalizedDPS+=.1;
 if([8214,8465,8453].includes(rune.id)&&!k.healShield&&!(rune.id===8465&&['engage','warden'].includes(runeAffinity(s.player,data))))normalizedEHP*=.2;
 const counter=!s.matchupUnknown&&enemies.some(enemy=>rune.id===8473&&enemy.isBurst||rune.id===8242&&enemy.hasHardCC||rune.id===8017&&enemy.isTank||rune.id===8444&&enemy.hasHealing)?1:0;
 const counterBonus=.05*4*w.weightDamage*w.weightDefense*counter;
 return {id:rune.id,normalizedDPS,normalizedEHP,counterBonus,score:w.weightDamage*normalizedDPS+w.weightDefense*normalizedEHP+counterBonus,coverage:'heuristic'};
}
export function calculateOptimalRunes(s:Scenario,data:Dataset,sliderValue=100*s.weights.offense/Math.max(1,s.weights.offense+s.weights.defense)):RunePage {
 const page=s.player.runes;if(page.locked)return structuredClone(page);
 const locks=page.locks??{},locked=new Set(locks.runes??[]),k=kitFor(s.player,data);
 const viable=(r:Rune)=>runeCompatible(r.id,s.player,data).allowed&&(r.id!==8465||k.healShield||['engage','warden'].includes(runeAffinity(s.player,data)))&&(r.id!==8401||k.healShield);
 const locate=(id:number)=>{for(const tree of data.runes)for(let row=0;row<tree.slots.length;row++)if(tree.slots[row].runes.some(r=>r.id===id))return {tree,row};return undefined;};
 for(const id of locked){const slot=locate(id);if(!slot||!page.selected.includes(id)||![page.primary,page.secondary].includes(slot.tree.id)||slot.tree.id===page.secondary&&slot.row===0)throw Error('Trava de runa ausente ou incompatível com as árvores atuais.');}
 const primaryLocked=locks.primaryTree||[...locked].some(id=>locate(id)?.tree.id===page.primary);
 const secondaryLocked=locks.secondaryTree||[...locked].some(id=>locate(id)?.tree.id===page.secondary);
 const ranked=(runes:Rune[])=>runes.filter(r=>viable(r)||locked.has(r.id)).map(r=>({r,...heuristicRuneScore(r,s,data,sliderValue)})).sort((a,b)=>b.score-a.score||a.id-b.id);
 const choose=(tree:RuneTree,row:number)=>{
  const fixed=tree.slots[row].runes.filter(r=>locked.has(r.id));if(fixed.length>1)throw Error('Duas runas travadas na mesma linha.');
  return fixed[0]??ranked(tree.slots[row].runes)[0]?.r;
 };
 const keystones=data.runes.filter(tree=>(!primaryLocked||tree.id===page.primary)&&(!secondaryLocked||tree.id!==page.secondary)).flatMap(tree=>{const key=choose(tree,0);return key?[{tree,key,score:heuristicRuneScore(key,s,data,sliderValue).score}]:[];}).sort((a,b)=>b.score-a.score||a.key.id-b.key.id);
 const primary=keystones[0];if(!primary)throw Error('Nenhuma árvore primária compatível com as travas.');
 const main=primary.tree.slots.map((_,row)=>choose(primary.tree,row));if(main.length!==4||main.some(r=>!r))throw Error('Árvore primária incompleta no snapshot.');
 const alternatives=data.runes.filter(t=>t.id!==primary.tree.id&&(!secondaryLocked||t.id===page.secondary)).flatMap(tree=>{
  const rows=tree.slots.slice(1).map((_,i)=>({r:choose(tree,i+1),row:i+1})).filter((v):v is {r:Rune;row:number}=>!!v.r);
  const fixed=rows.filter(v=>locked.has(v.r.id));if(fixed.length>2)return [];
  const free=rows.filter(v=>!fixed.includes(v)).sort((a,b)=>heuristicRuneScore(b.r,s,data,sliderValue).score-heuristicRuneScore(a.r,s,data,sliderValue).score||a.row-b.row);
  const selected=[...fixed,...free.slice(0,2-fixed.length)].sort((a,b)=>a.row-b.row);if(selected.length!==2)return [];
  return [{tree,selected,score:selected.reduce((sum,v)=>sum+heuristicRuneScore(v.r,s,data,sliderValue).score,0)}];
 }).sort((a,b)=>b.score-a.score||a.tree.id-b.tree.id);
 const secondary=alternatives[0];if(!secondary)throw Error('Nenhuma árvore secundária legal com as travas atuais.');
 const w=continuousWeights(sliderValue);
 const shardScore=(id:string)=>{
  const values:Record<string,[number,number]>={adaptive:[.9,0],as:[k.autoAttack?1:.1,0],haste:[k.autoAttack?.65:1,.1],move:[.05,.35],scalingHP:[k.healthScaling?.25:0,s.player.level>=7?1:.4],hp:[k.healthScaling?.1:0,.65],tenacity:[0,!s.matchupUnknown&&runeThreats(s,data).some(enemy=>enemy.hasHardCC)?1:.2]};
  const [d,h]=values[id]??[0,0];return w.weightDamage*d+w.weightDefense*h;
 };
 const shards=SHARD_ROWS.map((row,i)=>{
  if(locks.shards?.includes(i)){if(!row.includes(page.shards[i]))throw Error('Fragmento travado inválido para este slot.');return page.shards[i];}
  return [...row].sort((a,b)=>shardScore(b)-shardScore(a)||a.localeCompare(b))[0];
 });
 return {...page,primary:primary.tree.id,secondary:secondary.tree.id,selected:[...main.map(r=>r!.id),...secondary.selected.map(v=>v.r.id)],shards};
}
