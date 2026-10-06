import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import fs from 'node:fs';
import {initialScenario,fighter,isBoot,itemEligible,statsFor,effectiveResistance,mitigate} from '../src/model.ts';
import {greedyContinuousBuild,continuousWeights,scoreItems} from '../src/continuousBuild.ts';
import {exclusiveGroupsValid} from '../src/buildEvaluation.ts';
import {calculateOptimalRunes} from '../src/runeOptimizer.ts';
import {itemCompatible,runeCompatible} from '../src/compatibility.ts';
const root=process.cwd();
const data=JSON.parse(fs.readFileSync(root+'/public/data/pt_BR.json'));
data.mechanics=JSON.parse(fs.readFileSync(root+'/public/data/mechanics.json')).champions;
const ids=Object.keys(data.champions),lanes=['Top','Jungle','Mid','Bot','Support'];
if(isMainThread){
 const started=Date.now();let done=0;const results=[];const counts={};
 const workers=Array.from({length:7},(_,bucket)=>new Worker(new URL(import.meta.url),{workerData:{bucket}}));
 for(const [i,w] of workers.entries()){w.on('message',m=>{if(m.progress){counts[i]=m.progress;fs.writeFileSync('/tmp/aegis-hybrid-audit-progress.json',JSON.stringify({seconds:(Date.now()-started)/1000,completed:Object.values(counts).reduce((a,b)=>a+b,0),total:ids.length*(ids.length+1)*lanes.length*3+ids.length*lanes.length}));}else{results.push(m);done++;console.log(JSON.stringify({worker:i,...m}));if(done===workers.length){const summary={champions:ids.length,matchups:ids.length**2,lanes:lanes.length,weights:[0,50,100],baseScenarios:451530,pureUtilityScenarios:865,seconds:(Date.now()-started)/1000,checked:results.reduce((n,r)=>n+r.checked,0),errors:results.flatMap(r=>r.errors),mathErrors:results.flatMap(r=>r.mathErrors),unchangedExtremes:results.reduce((n,r)=>n+r.unchangedExtremes,0)};fs.writeFileSync('/tmp/aegis-hybrid-audit-summary.json',JSON.stringify(summary,null,2));console.log(JSON.stringify(summary));if(summary.checked!==452395||summary.errors.length||summary.mathErrors.length)process.exitCode=1;}}});w.on('error',e=>{console.error(e);process.exitCode=1;});}
}else{
 let checked=0,unchangedExtremes=0;const errors=[],mathErrors=[];
 for(let pi=workerData.bucket;pi<ids.length;pi+=7){
  const player=ids[pi];
  for(const lane of lanes)for(const enemy of [null,...ids]){
   const s=initialScenario(data);s.player={...fighter(data,player),lane};s.enemy=fighter(data,enemy??'Darius');s.matchupUnknown=enemy===null;let first='';
   for(const value of (enemy===null?[0,50,100,'utility']:[0,50,100])){
    s.weights=value==='utility'?{offense:0,defense:0,utility:100}:{offense:value,defense:100-value,utility:0};
    try{
     const r=greedyContinuousBuild(s,data);const target=[...r.target].sort().join(',');
     if(value===0)first=target;if(value===100&&target===first)unchangedExtremes++;
     if(r.target.length!==6||new Set(r.target).size!==6||!exclusiveGroupsValid(r.target,data)||r.target.some(id=>!itemEligible(id,data,player)||!itemCompatible(id,s.player,data).allowed)||r.target.filter(id=>isBoot(id,data)).length>(player==='Cassiopeia'?0:1))throw Error('illegal build');
     if(!Number.isFinite(r.metrics.dps)||!Number.isFinite(r.metrics.ehp)||!Number.isFinite(r.metrics.utility)||r.metrics.utility<0||r.metrics.dps<0||r.metrics.ehp<=0)throw Error('invalid metrics');
     const actor=statsFor({...s.player,items:r.target},data),targetStats=s.matchupUnknown?{armor:100,mr:100}:statsFor(s.enemy,data),mix=r.metrics.rawDPSByType;
     const independentlyMitigated=mix.physical*mitigate(1,effectiveResistance(targetStats.armor,actor.armorPenPercent,actor.armorPen))+mix.magic*mitigate(1,effectiveResistance(targetStats.mr,actor.magicPenPercent,actor.magicPen))+mix.true;
     if(!Number.isFinite(independentlyMitigated)||Math.abs(independentlyMitigated-r.metrics.dps)>1e-7)throw Error('DPS composition/mitigation mismatch');
     for(const score of r.scores){const w=value==='utility'?{weightDamage:0,weightDefense:0,weightUtility:1}:continuousWeights(value),expected=w.weightDamage*score.normalizedOffense+w.weightDefense*score.normalizedEHP+(w.weightUtility??0)*score.normalizedUtility+score.counterBonus;if(!Number.isFinite(score.score)||!Number.isFinite(expected)||!Number.isFinite(score.normalizedUtility)||score.normalizedUtility<0||score.normalizedUtility>1||Math.abs(expected-score.score)>1e-12||score.normalizedOffense<0||score.normalizedOffense>1||score.normalizedEHP<0||score.normalizedEHP>1||score.counterBonus<0||score.counterBonus>.05+1e-12||value!==50&&score.counterBonus!==0)mathErrors.push({player,enemy,lane,value,score});}
     const runes=calculateOptimalRunes(s,data,s.weights);if(runes.selected.length!==6||new Set(runes.selected).size!==6||runes.selected.some(id=>!runeCompatible(id,s.player,data).allowed))throw Error('illegal runes');
     checked++;
    }catch(e){if(errors.length<100)errors.push({player,enemy,lane,value,error:e.message});}
   }
   if(checked%300===0)parentPort.postMessage({progress:checked});
  }
  parentPort.postMessage({progress:checked});
 }
 parentPort.postMessage({checked,errors,mathErrors:mathErrors.slice(0,100),unchangedExtremes});
}
