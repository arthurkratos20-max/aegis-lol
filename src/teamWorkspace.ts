import type {Dataset,DraftState,Scenario} from './contracts.ts';
import {fighter} from './model.ts';
import {DRAFT_LANES} from './draft.ts';
export function teamWorkspace(s:Scenario,data:Dataset):DraftState {
 const valid=(id:string)=>id&&Object.hasOwn(data.champions,id)?id:'';
 if(s.draft){
  const active=Math.max(0,DRAFT_LANES.findIndex(lane=>lane===s.player.lane)),old=Math.max(0,Math.min(4,s.draft.active));
  const enemies=s.enemyTeam&&s.enemyTeam.filter(Boolean).length>=s.draft.enemy.filter(Boolean).length?s.enemyTeam:s.draft.enemy;
  const own=Array.from({length:5},(_,i)=>valid(s.draft!.own[i]??'')),enemy=Array.from({length:5},(_,i)=>valid(enemies[i]??''));
  if(old!==active){[own[old],own[active]]=[own[active],own[old]];if(!s.matchupUnknown&&enemy[old]===s.enemy.champion)[enemy[old],enemy[active]]=[enemy[active],enemy[old]];}
  own.forEach((id,i)=>{if(i!==active&&id===s.player.champion)own[i]='';});
  own[active]=s.player.champion;
  enemy[active]=s.matchupUnknown?'':s.enemy.champion;
  return {active,own,enemy};
 }
 const active=Math.max(0,DRAFT_LANES.findIndex(lane=>lane===s.player.lane)),others=s.allies.map(valid),own=Array.from({length:5},(_,i)=>i===active?s.player.champion:others.shift()??'');
 return {active,own,enemy:Array.from({length:5},(_,i)=>valid(s.enemyTeam?.[i]??(i===active&&!s.matchupUnknown?s.enemy.champion:'')))};
}
export function updateTeamWorkspace(s:Scenario,draft:DraftState):Scenario {return {...s,draft,allies:draft.own.filter((_,i)=>i!==draft.active),enemyTeam:[...draft.enemy]};}

/** Editing the player's row or direct opponent also edits the laboratory context. */
export function editTeamSlot(s:Scenario,data:Dataset,side:'own'|'enemy',index:number,id:string):Scenario {
 const draft=teamWorkspace(s,data);
 if(id&&draft[side].some((old,i)=>i!==index&&old===id))return s;
 if(side==='own'&&index===draft.active&&!id)return s;
 draft[side][index]=id;
 let next=updateTeamWorkspace(s,draft);
 if(index===draft.active){
  if(side==='own')next={...next,player:id===s.player.champion?s.player:{...fighter(data,id),lane:s.player.lane,level:s.player.level},counterPreset:undefined};
  else next={...next,matchupUnknown:!id,enemy:id&&id!==s.enemy.champion?{...fighter(data,id),lane:s.player.lane,level:s.enemy.level}:s.enemy,counterPreset:undefined};
 }
 return next;
}
