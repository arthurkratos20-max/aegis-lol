import type {Scenario,Dataset} from './contracts.ts';
import type {QuickRecommendation} from './recommendation.ts';
import {plain} from './model.ts';
export interface RecommendationSnapshot {champion:string;lane:string;context:string;items:string[];runes:number[];shards:string[];skills:string[];weights:Scenario['weights'];enemy:string;unknown:boolean;teamPriority:number;enemyTeam:string[]}
export function recommendationSnapshot(s:Scenario,r:QuickRecommendation):RecommendationSnapshot {
 const context=JSON.stringify({...s,budget:undefined});
 return {champion:s.player.champion,lane:s.player.lane,context,items:[...r.target],runes:[...r.runes.selected],shards:[...r.runes.shards],skills:[...s.player.skills],weights:{...s.weights},enemy:s.enemy.champion,unknown:!!s.matchupUnknown,teamPriority:s.teamPriority??0,enemyTeam:[...(s.enemyTeam??[])]};
}
export function recommendationChanges(a:RecommendationSnapshot,b:RecommendationSnapshot,r:QuickRecommendation,data:Dataset){
 const added=b.items.filter(id=>!a.items.includes(id)),removed=a.items.filter(id=>!b.items.includes(id));
 const runeAdded=b.runes.filter(id=>!a.runes.includes(id)),runeRemoved=a.runes.filter(id=>!b.runes.includes(id));
 const skills=b.skills.flatMap((key,i)=>key!==a.skills[i]?[{level:i+1,from:a.skills[i]??'—',to:key}]:[]);
 const triggers:string[]=[];
 if(a.champion!==b.champion)triggers.push(`Campeão: ${data.champions[a.champion]?.name??a.champion} → ${data.champions[b.champion]?.name??b.champion}`);
 if(a.lane!==b.lane)triggers.push(`Rota: ${a.lane} → ${b.lane}`);
 if(a.enemy!==b.enemy||a.unknown!==b.unknown)triggers.push(`Adversário: ${a.unknown?'Não sei ainda':data.champions[a.enemy]?.name} → ${b.unknown?'Não sei ainda':data.champions[b.enemy]?.name}`);
 if(JSON.stringify(a.weights)!==JSON.stringify(b.weights))triggers.push(`Pesos: dano ${b.weights.offense}% · defesa ${b.weights.defense}% · utilidade ${b.weights.utility}%`);
 if(a.teamPriority!==b.teamPriority||a.enemyTeam.join()!==b.enemyTeam.join())triggers.push(`Foco no time inimigo: ${b.teamPriority}% · ${b.enemyTeam.filter(Boolean).length} selecionados`);
 const itemReasons=added.map(id=>{const decision=r.decisions?.find(d=>d.selected===id),winner=decision?.candidates.find(c=>c.id===id),alternative=decision?.candidates.find(c=>removed.includes(c.id));
 const evidence=winner?`Score atual ${winner.score.toFixed(3)}: dano ${(b.weights.offense/100*winner.normalizedOffense).toFixed(3)}, defesa ${(b.weights.defense/100*winner.normalizedEHP).toFixed(3)}, utilidade ${(b.weights.utility/100*winner.normalizedUtility).toFixed(3)}, contexto ${winner.counterBonus.toFixed(3)}.${alternative?` Neste mesmo pool, ${plain(data.items[alternative.id].name)} teve ${alternative.score.toFixed(3)}.`:''}`:'Escolha preservada por inventário, trava ou regra estrutural; sem ranking livre disponível.';
 return {id,text:`${r.reasons[id]??'Compatibilidade com o perfil atual.'} ${evidence}`};});
 const reordered=!added.length&&!removed.length&&a.items.join()!==b.items.join();
 const shardsChanged=a.shards.join()!==b.shards.join();
 return {added,removed,runeAdded,runeRemoved,skills,triggers,itemReasons,reordered,shardsChanged,unchanged:!added.length&&!removed.length&&!runeAdded.length&&!runeRemoved.length&&!skills.length&&!reordered&&!shardsChanged};
}
