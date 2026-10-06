import type {Dataset,DraftState,Scenario} from './contracts.ts';
export const DRAFT_LANES=['Top','Jungle','Mid','Bot','Support'] as const;
/** Preserve valid slots, replacing duplicates and missing IDs with distinct catalog entries. */
export function normalizeDraft(s:Scenario,data:Dataset):DraftState {
 const ids=Object.keys(data.champions);if(ids.length<5)throw Error('O draft requer pelo menos cinco campeões.');
 const lane=DRAFT_LANES.indexOf(s.player.lane as typeof DRAFT_LANES[number]);
 const active=Number.isInteger(s.draft?.active)&&s.draft!.active>=0&&s.draft!.active<5?s.draft!.active:Math.max(0,lane);
 const defaults={own:['Shen','MasterYi','Ahri','Jinx','Lulu'],enemy:['Malphite','LeeSin','Syndra','Jinx','Leona']};
 if(!s.draft){defaults.own[active]=s.player.champion;defaults.enemy[Math.max(0,lane)]=s.enemy.champion;}
 const normalize=(side:'own'|'enemy')=>{
  const input=Array.isArray(s.draft?.[side])?s.draft![side]:defaults[side];
  const result=Array.from({length:5},(_,i)=>typeof input[i]==='string'&&data.champions[input[i]]?input[i]:'');
  const used=new Set<string>();const order=side==='own'?[active,...[0,1,2,3,4].filter(i=>i!==active)]:[0,1,2,3,4];
  for(const i of order){if(!result[i]||used.has(result[i]))result[i]='';else used.add(result[i]);}
  for(let i=0;i<5;i++)if(!result[i]){result[i]=[defaults[side][i],...ids].find(id=>data.champions[id]&&!used.has(id))!;used.add(result[i]);}
  return result;
 };
 return {own:normalize('own'),enemy:normalize('enemy'),active};
}
