import type {Dataset,DraftState,Scenario} from './contracts.ts';
import {DRAFT_LANES} from './draft.ts';
export function teamWorkspace(s:Scenario,data:Dataset):DraftState {
 const valid=(id:string)=>id&&Object.hasOwn(data.champions,id)?id:'';
 if(s.draft){const active=Math.max(0,Math.min(4,s.draft.active)),enemies=s.enemyTeam&&s.enemyTeam.filter(Boolean).length>=s.draft.enemy.filter(Boolean).length?s.enemyTeam:s.draft.enemy;return {active,own:Array.from({length:5},(_,i)=>valid(s.draft!.own[i]??'')),enemy:Array.from({length:5},(_,i)=>valid(enemies[i]??''))};}
 const active=Math.max(0,DRAFT_LANES.findIndex(lane=>lane===s.player.lane)),others=s.allies.map(valid),own=Array.from({length:5},(_,i)=>i===active?s.player.champion:others.shift()??'');
 return {active,own,enemy:Array.from({length:5},(_,i)=>valid(s.enemyTeam?.[i]??(i===active&&!s.matchupUnknown?s.enemy.champion:'')))};
}
export function updateTeamWorkspace(s:Scenario,draft:DraftState):Scenario {return {...s,draft,allies:draft.own.filter((_,i)=>i!==draft.active),enemyTeam:[...draft.enemy]};}
