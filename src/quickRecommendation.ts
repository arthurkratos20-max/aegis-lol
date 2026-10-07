import type {Dataset,Scenario} from './contracts.ts';
import {profileFor,type QuickRecommendation} from './recommendation.ts';
import {fullBuild} from './fullBuild.ts';
import {scoreItems} from './continuousBuild.ts';
import {evaluateBuild} from './buildEvaluation.ts';
import {itemEligible} from './model.ts';
import {championForCounter} from './counterAdapters.ts';
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
 let response:string|undefined;
 let responseReason='';
 if(p==='marksman'&&!s.matchupUnknown){
  const enemy=championForCounter(s.enemy.champion,data,s.enemy);
  const options=enemy.isTank?['3036','3033']:enemy.damageType==='magic'?(enemy.isBurst?['3156','3091']:['3091','3156']):enemy.damageType==='physical'?['3026','6673']:['6673','3072'];
  response=options.find(id=>data.items[id]&&itemEligible(id,data,s.player.champion)&&itemCompatible(id,s.player,data).allowed);
  responseReason=enemy.isTank?'Penetração percentual para enfrentar a durabilidade do alvo.':enemy.damageType==='magic'?'AD/velocidade de ataque ou proteção de lutador à distância com resistência mágica contra o alvo mágico.':'Proteção ofensiva para sobreviver à pressão física mantendo atributos de atirador.';
 }
 const required=[core,response].filter((id):id is string=>!!id);
 const projected={...s,player:{...s.player,locked:required}};
 const rec=fullBuild(projected,data,'balanced',undefined,true);
 if(response){rec.target=[...rec.target.filter(id=>id!==response),response];rec.reasons[response]=responseReason;rec.warnings.unshift(`${data.champions[s.enemy.champion].name}: ${responseReason} Resposta situacional, não primeiro item obrigatório.`);} 
 rec.warnings.unshift('Cartão rápido: ranking estratégico estimado combina 80% da pontuação de atributos, 15% de afinidade com kit/função e 5% de resposta contextual. Atiradores com pool suficiente usam itens de carry; um slot de proteção contra o adversário é reservado quando conhecido. Não quantifica passivas sem fórmula.');
 if(core){rec.target=[core,...rec.target.filter(id=>id!==core)];rec.cores=[core,...rec.cores.filter(id=>id!==core)];rec.reasons[core]=reason;rec.warnings.unshift(reason);}
 return rec;
}
