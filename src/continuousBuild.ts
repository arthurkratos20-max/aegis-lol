import {withSkillPlans} from './skillOrders.ts';
import {preferenceWeights} from './preferenceWeights.ts';
import type {Dataset,Scenario} from './contracts.ts';
import {itemEligible,isBoot} from './model.ts';
import {itemCompatible,kitFor} from './compatibility.ts';
import {recommend,affinityCandidates,type TacticalMode} from './recommendation.ts';
import {evaluateBuild,exclusiveGroupsValid,normalizeMetric,offensiveMetric,type BuildMetrics} from './buildEvaluation.ts';
import {championForCounter,counterItemCandidates} from './counterAdapters.ts';
import {calculateMatchupCounter,calculateDraftCounter,rankCounterCandidates} from './counterEvaluation.ts';

export function recipeContains(final:string,component:string,data:Dataset,seen=new Set<string>()):boolean {
 if(final===component)return true;if(seen.has(final))return false;
 return (data.items[final]?.from??[]).some(id=>recipeContains(id,component,data,new Set(seen).add(final)));
}
export interface ItemScore {id:string;normalizedOffense:number;normalizedEHP:number;normalizedUtility:number;counterBonus:number;score:number;coverage:'modeled'|'estimated'}
export function continuousWeights(sliderValue:number){
 return preferenceWeights(Math.max(0,Math.min(100,sliderValue)));
}
export function scoreItems(rows:{id:string;metrics:BuildMetrics;counter?:number}[],sliderValue:number|Scenario['weights']):ItemScore[]{
 const {weightDamage,weightDefense,weightUtility}=preferenceWeights(sliderValue);
 const bounds=(key:'dps'|'ehp'|'utility')=>rows.reduce((b,r)=>({min:Math.min(b.min,r.metrics[key]),max:Math.max(b.max,r.metrics[key])}),{min:Infinity,max:-Infinity});
 const values=rows.map(row=>offensiveMetric(row.metrics)),d={min:Math.min(...values),max:Math.max(...values)},h=bounds('ehp'),u=bounds('utility');
 return rows.map(row=>{
  const normalizedOffense=normalizeMetric(offensiveMetric(row.metrics),d.min,d.max),normalizedEHP=normalizeMetric(row.metrics.ehp,h.min,h.max),normalizedUtility=normalizeMetric(row.metrics.utility,u.min,u.max);
  // Counter is a bounded contextual preference, with zero influence at both pure endpoints.
  const counterBonus=.05*4*weightDamage*weightDefense*Math.max(0,Math.min(1,row.counter??0));
  return {id:row.id,normalizedOffense,normalizedEHP,normalizedUtility,counterBonus,score:weightDamage*normalizedOffense+weightDefense*normalizedEHP+weightUtility*normalizedUtility+counterBonus,coverage:'estimated' as const};
 }).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
}
export function greedyContinuousBuild(s:Scenario,data:Dataset,mode:TacticalMode='balanced'){
 s=withSkillPlans(s,data);
 const neutral={...s,player:{...s.player,locked:[],owned:[]},weights:{offense:50,defense:50,utility:0}},base=recommend(neutral,data,mode);
  const compatible=(id:string)=>itemEligible(id,data,s.player.champion)&&itemCompatible(id,s.player,data).allowed;
 const completed=(id:string)=>compatible(id)&&!isBoot(id,data)&&(data.items[id].gold.total>=2000||id==='3041')&&Number(id)<10000;
 const pool=Object.keys(data.items).filter(completed);
 const mine=championForCounter(s.player.champion,data,s.player),enemy=championForCounter(s.enemy.champion,data,s.enemy);
 const draft=(s.counterPreset?.mode==='draft'||s.counterPreset?.source.includes('Draft'))?s.draft?.enemy:undefined;
 const evaluation=s.matchupUnknown?{enemyCount:0,priorities:{},reasons:[]}:draft?calculateDraftCounter(mine,draft.filter(id=>data.champions[id]).map(id=>championForCounter(id,data))):calculateMatchupCounter(mine,enemy);
 const ranks=rankCounterCandidates(mine,counterItemCandidates(s.player,data),evaluation),maxCounter=Math.max(1,...ranks.map(r=>r.score));
 const counters=new Map(ranks.map(r=>[r.candidate.id,r.score/maxCounter]));
 const fixed=[...new Set([...s.player.locked,...(!s.allowSell?s.player.owned:[])])];
 const lockedBoot=fixed.find(id=>isBoot(id,data)&&id!=='1001');
 const bootAllowed=kitFor(s.player,data).boots&&s.player.boots!=='none';
 let boot=bootAllowed?(s.player.boots==='fixed'?s.player.fixedBoot:lockedBoot??((evaluation.priorities['magic-resist']??0)>(evaluation.priorities.armor??0)||(!s.matchupUnknown&&enemy.hasHardCC)?'3111':base.boots)):null;
 if(boot==='1001')boot='3158';
 if(boot&&!compatible(boot))throw Error('Bota fixa incompatível com o campeão ou snapshot.');
 if(s.player.boots==='fixed'&&lockedBoot&&lockedBoot!==boot)throw Error('Bota fixada conflita com o inventário travado.');
 if(!bootAllowed&&fixed.some(id=>isBoot(id,data)))throw Error('A regra Sem Botas conflita com uma bota travada ou possuída.');
 const required=fixed.filter(id=>!isBoot(id,data)&&data.items[id]&&(data.items[id].gold.total>=2000||id==='3041'));
 if(!exclusiveGroupsValid(fixed,data))throw Error('Itens travados ou possuídos conflitam em grupos exclusivos.');
 const coreEligible=(id:string)=>completed(id)&&exclusiveGroupsValid([...required,...(required.includes(id)?[]:[id])],data);
 const sliderValue=100*s.weights.offense/Math.max(1,s.weights.offense+s.weights.defense);
 let evaluated=0;const scores:ItemScore[]=[];const decisions:{selected:string;candidates:ItemScore[]}[]=[];
 const rankWith=(ids:string[],prefix:string[])=>scoreItems(ids.map(id=>({id,metrics:evaluateBuild([...prefix,id],s,data),counter:Math.max(counters.get(id)??0,mode==='antiheal'&&['3033','3165','3075'].includes(id)||mode==='antishield'&&id==='6695'?1:0)})),s.weights);
 // Explicit inventory/boot locks stay authoritative. Automatic boots are scored anew.
 if(bootAllowed&&s.player.boots!=='fixed'&&!lockedBoot){
  const candidates=Object.keys(data.items).filter(id=>compatible(id)&&isBoot(id,data)&&data.items[id].from?.includes('1001')&&(id!=='3006'||kitFor(s.player,data).autoAttack)&&Number(id)<10000&&data.items[id].gold.total>=800&&exclusiveGroupsValid([...required,id],data));
  const ranked=rankWith(candidates,required);evaluated+=candidates.length;
  if(ranked[0]){boot=ranked[0].id;decisions.push({selected:boot,candidates:ranked});scores.push(ranked[0]);}
 }
 const prefix=[...(boot?[boot]:[]),...required];
 const requestedResponse=mode==='antiheal'?['3033','3165','3075']:mode==='antishield'&&base.profile==='assassinAD'?['6695']:[];
 const responseNeeded=requestedResponse.length>0&&!required.some(id=>requestedResponse.includes(id));
 const corePool=[...new Set([...base.cores,...affinityCandidates(s,data)])].filter(id=>coreEligible(id)&&!required.includes(id)&&(!responseNeeded||requestedResponse.includes(id)));
 let core=required[0];
 if(prefix.length<6){
  const candidates=corePool.length?corePool:pool.filter(id=>coreEligible(id)&&!required.includes(id));
  const ranked=rankWith(candidates,prefix);evaluated+=candidates.length;
  if(ranked[0]){core=ranked[0].id;decisions.push({selected:core,candidates:ranked});scores.push(ranked[0]);}
 }
 if(!core)throw Error('Nenhum item-chave elegível no catálogo.');
 const chosen=[...(boot?[boot]:[]),core,...required.filter(id=>id!==core)];
 if(chosen.length>6||!exclusiveGroupsValid(chosen,data))throw Error('O core e os itens travados não cabem em seis slots ou conflitam em grupos únicos.');
 const rank=(ids:string[])=>rankWith(ids,chosen);
 const legal=(id:string)=>!chosen.includes(id)&&exclusiveGroupsValid([...chosen,id],data);

 // Keep each owned/locked component represented by a legal final upgrade.
 for(const component of fixed.filter(id=>!isBoot(id,data)&&!required.includes(id))){
  if(chosen.some(id=>!required.includes(id)&&recipeContains(id,component,data)))continue;
  const upgrades=pool.filter(id=>legal(id)&&recipeContains(id,component,data));evaluated+=upgrades.length;
  const ranked=rank(upgrades),best=ranked[0];if(!best||chosen.length===6)throw Error('Não há espaço para um upgrade compatível do componente travado.');
  decisions.push({selected:best.id,candidates:ranked});chosen.push(best.id);scores.push(best);
 }
 while(chosen.length<6){
  const candidates=pool.filter(legal);evaluated+=candidates.length;
  const ranked=rank(candidates),best=ranked[0];if(!best)throw Error('Grupos únicos impedem completar os seis slots.');
  decisions.push({selected:best.id,candidates:ranked});chosen.push(best.id);scores.push(best);
 }
 return {base,boot,core,target:chosen,scores,decisions,evaluated,metrics:evaluateBuild(chosen,s,data),sliderValue};
}
