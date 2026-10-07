import type {Dataset,Scenario} from './contracts.ts';
import type {QuickRecommendation} from './recommendation.ts';
import {evaluateBuild} from './buildEvaluation.ts';
import {statsFor,isBoot} from './model.ts';
import {sequentialPurchases} from './fullBuild.ts';
export function buildStages(s:Scenario,data:Dataset,r:QuickRecommendation){const core=r.target.filter(id=>!isBoot(id,data));return [1,2,core.length].filter((n,i,a)=>a.indexOf(n)===i).map(count=>{const items=r.target.filter(id=>isBoot(id,data)||core.slice(0,count).includes(id)),metrics=evaluateBuild(items,s,data),stats=statsFor({...s.player,items},data),purchases=sequentialPurchases(items,s,data);return {count,items,metrics,stats,purchases,total:items.reduce((n,id)=>n+data.items[id].gold.total,0)};});}
