import type {Dataset,Scenario} from './contracts.ts';
import {profileFor,type QuickRecommendation} from './recommendation.ts';
import {fullBuild} from './fullBuild.ts';
import {scoreItems} from './continuousBuild.ts';
import {evaluateBuild} from './buildEvaluation.ts';
import {itemEligible} from './model.ts';
import {itemCompatible} from './compatibility.ts';
/** Reviewed role needs are constraints; numerical ranking still uses the selected kit and opponent. */
export function quickRecommendation(s:Scenario,data:Dataset):QuickRecommendation {
 const p=profileFor(s.player.champion,s.player.lane,data);
 let candidates:string[]=[],reason='';
 if(s.player.lane==='Jungle'&&['Shen','Warwick','Pantheon','Taric'].includes(s.player.champion)){
  candidates=['3748','3074','6631','6698','3068','6664'];
  reason='Selva: prioriza um item de dano em área para a limpeza. A regra é estratégica; tempo de clear e dano dessas passivas não estão simulados.';
 }else if(s.player.lane==='Support'&&['supportTank','enchanter'].includes(p)){
  candidates=p==='supportTank'?['3190','3109','3107','3222']:['6617','3107','3222','3504','6620'];
  reason='Suporte: prioriza um core de proteção/utilidade e custo adequado à função. Benefícios para aliados são considerados pela regra estratégica, sem quantificar passivas não modeladas.';
 }
 const eligible=candidates.filter(id=>data.items[id]&&itemEligible(id,data,s.player.champion)&&itemCompatible(id,s.player,data).allowed);
 const core=scoreItems(eligible.map(id=>({id,metrics:evaluateBuild([id],s,data)})),s.weights)[0]?.id;
 const projected=core?{...s,player:{...s.player,locked:[core]}}:s;
 const rec=fullBuild(projected,data);
 if(core){rec.target=[core,...rec.target.filter(id=>id!==core)];rec.cores=[core,...rec.cores.filter(id=>id!==core)];rec.reasons[core]=reason;rec.warnings.unshift(reason);}
 return rec;
}
