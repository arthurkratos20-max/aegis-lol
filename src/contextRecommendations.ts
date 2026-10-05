import type {Dataset,Scenario,CounterPreset,RunePage} from './contracts.ts';
import {fighter,itemEligible,isBoot} from './model.ts';
import {kitFor,runeCompatible} from './compatibility.ts';
import {profileFor,runeSuggestion} from './recommendation.ts';
import {completeRunePage} from './shards.ts';
import {exclusiveGroupsValid} from './buildEvaluation.ts';
import {calculateMatchupCounter,calculateDraftCounter,rankCounterCandidates,type CounterEvaluation} from './counterEvaluation.ts';
import {championForCounter,counterItemCandidates,counterRuneCandidates} from './counterAdapters.ts';
export interface ThreatAnalysis {physical:number;magic:number;hardCC:number;tanks:number;burst:number;airborne:number;healing:number;count:number}
export function analyzeComposition(ids:readonly string[],data:Dataset):ThreatAnalysis {
 const result:ThreatAnalysis={physical:0,magic:0,hardCC:0,tanks:0,burst:0,airborne:0,healing:0,count:0};
 for(const id of [...new Set(ids)].filter(id=>data.champions[id]).slice(0,5)){
  const c=championForCounter(id,data);result.count++;
  result.magic+=c.damageType==='mixed'?.5:c.damageType==='magic'?1:0;
  result.physical+=c.damageType==='mixed'?.5:c.damageType==='physical'?1:0;
  result.hardCC+=Number(c.hasHardCC);result.tanks+=Number(c.isTank);result.burst+=Number(c.isBurst);result.healing+=Number(c.hasHealing);
  result.airborne+=Number('Malphite Alistar Ornn Yasuo Yone Zac Janna Rakan Nautilus'.split(' ').includes(id));
 }
 if(result.count){result.physical/=result.count;result.magic/=result.count;}return result;
}
export interface ContextRecommendation {preset:CounterPreset;items:string[];runes:number[];analysis:ThreatAnalysis;evaluation:CounterEvaluation;explanation:string;warnings:string[]}
export function contextualRecommendation(s:Scenario,data:Dataset,champion:string,enemies:readonly string[],source:string,mode:'matchup'|'draft'='draft'):ContextRecommendation {
 const active=champion===s.player.champion?s.player:{...fighter(data,champion),level:s.player.level};
 const selected=[...new Set(enemies)].filter(id=>data.champions[id]).slice(0,mode==='matchup'?1:5);
 const mine=championForCounter(champion,data,active),opponents=selected.map(id=>championForCounter(id,data,id===s.enemy.champion?s.enemy:undefined));
 const evaluation=mode==='matchup'&&opponents[0]?calculateMatchupCounter(mine,opponents[0]):calculateDraftCounter(mine,opponents);
 const p=profileFor(champion,active.lane,data),t=analyzeComposition(selected,data),ap=['enchanter','supportDamage','fighterAP','assassinAP','mageControl','mageBurn','mageBurst'].includes(p);
 const rankedItems=rankCounterCandidates(mine,counterItemCandidates(active,data),evaluation);
 const items:string[]=[];
 for(const {candidate} of rankedItems){const id=candidate.id;if(items.length===2)break;if(isBoot(id,data)||data.items[id].gold.total<2000||!exclusiveGroupsValid([...items,id],data))continue;items.push(id);}
 const scenario={...s,player:active,weights:{offense:50,defense:50,utility:0}};
 const page:RunePage=active.runes.locked?structuredClone(active.runes):runeSuggestion(p,scenario,data,'balanced');
 const rankedRunes=rankCounterCandidates(mine,counterRuneCandidates(active,data),evaluation).filter(r=>r.score>0);
 // Change only a currently occupied legal row. Keep both trees and six slots intact.
 if(!page.locked){const replaced=new Set<string>();for(const {candidate} of rankedRunes){const id=Number(candidate.id);for(const tree of data.runes){if(tree.id!==page.primary&&tree.id!==page.secondary)continue;for(const [rowIndex,row]of tree.slots.entries()){if(tree.id===page.secondary&&rowIndex===0)continue;const key=`${tree.id}:${rowIndex}`;if(replaced.has(key)||!row.runes.some(r=>r.id===id)||!runeCompatible(id,active,data).allowed)continue;const index=page.selected.findIndex(old=>row.runes.some(r=>r.id===old));if(index>=0){page.selected[index]=id;replaced.add(key);}}}}}
 const completed=page.locked?page:completeRunePage(page,scenario,data);
 const highlights=[...rankedRunes.map(r=>Number(r.candidate.id)).filter(id=>completed.selected.includes(id)),...completed.selected].filter((id,i,arr)=>arr.indexOf(id)===i).slice(0,2);
 const magic=(evaluation.priorities['magic-resist']??0)>(evaluation.priorities.armor??0);
 const boot=kitFor(active,data).boots&&active.boots!=='none'?(t.hardCC>=2||magic?'3111':t.physical>.65?'3047':p==='marksman'?'3006':ap?'3020':'3158'):null;
 const preset:CounterPreset={champion,items,boot:boot&&itemEligible(boot,data,champion)?boot:null,runes:completed,source};
 return {preset,items,runes:highlights,analysis:t,evaluation,explanation:evaluation.reasons.join(' ')||'Compre proteção para o tipo de pressão predominante.',warnings:[...(t.airborne?['Tenacidade e purificação não removem nem encurtam arremessos ao ar.']:[]),'Prioridades heurísticas por atributos e tags dos inimigos selecionados; não representam win rate nem DPS medido. Metadados curados quando o snapshot não fornece counterTraits. Passivas sem fórmula: [Cálculo indisponível].']};
}
export function applyCounter(s:Scenario,data:Dataset,preset:CounterPreset):Scenario {const player=preset.champion===s.player.champion?s.player:{...fighter(data,preset.champion),level:s.player.level};return {...s,player,counterPreset:preset};}
