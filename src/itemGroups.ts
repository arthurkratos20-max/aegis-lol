import type {Dataset,Item} from './contracts.ts';

// Curated purchase groups for this catalogue; retired IDs only apply if present.
const GROUPS:Record<string,readonly string[]>={
 tiamat:['3077','3074','3748','6698','6631'],
 lifeline:['3053','3156','6673'],
 'last-whisper':['3036','3033','6694','3071'],
 'void-pen':['3135','3137'],
 quicksilver:['3140','3139'],
 spellblade:['3057','3100','3078','6632','6662'],
 tear:['3070','3003','3040','3004','3042','3119','3121'],
};
const GROUP_BY_ID=new Map(Object.entries(GROUPS).flatMap(([group,ids])=>ids.map(id=>[id,group] as const)));
export function itemExclusiveGroup(id:string,item?:Item):string|undefined {
 return item?.exclusiveGroup??GROUP_BY_ID.get(id);
}
export function attachItemGroups(data:Dataset):Dataset {
 for(const [id,item] of Object.entries(data.items)){
  const group=itemExclusiveGroup(id,item);if(group)item.exclusiveGroup=group;
 }
 return data;
}
/** Stateless slot validation, including the fixed core and manual locks. */
export function canAddItemToBuild(candidate:Item,currentBuild:readonly Item[]):boolean {
 return !candidate.exclusiveGroup||!currentBuild.some(item=>item.exclusiveGroup===candidate.exclusiveGroup);
}
export function exclusiveGroupsValid(ids:readonly string[],data?:Dataset):boolean {
 const occupied=new Set<string>();
 for(const id of ids){
  const group=itemExclusiveGroup(id,data?.items[id]);
  if(group){if(occupied.has(group))return false;occupied.add(group);}
 }
 return true;
}
