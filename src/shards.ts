import type {Dataset,Fighter,RunePage,Scenario} from './contracts.ts';
import {runeCompatible,kitFor} from './compatibility.ts';
/** Internal SR shard table scoped to the frozen 16.19.1 data release; independent of DDragon runesReforged. */
export const SHARD_PATCH='16.19.1';
export const SHARD_ROWS=[['adaptive','as','haste'],['adaptive','move','scalingHP'],['hp','tenacity','scalingHP']];
export const SHARD_LABELS:Record<string,string>={adaptive:'+9 de Força Adaptativa',as:'+10% de Velocidade de Ataque',haste:'+8 de Aceleração de Habilidade',move:'+2% de Velocidade de Movimento',scalingHP:'+10–180 de Vida (nível)',hp:'+65 de Vida',tenacity:'+10% Tenacidade / Resistência a Lentidão',ad:'+5,4 AD (personalizado)',ap:'+9 AP (personalizado)'};
export function defaultShards(f:Fighter,data:Dataset,defensive=false):string[]{const kit=kitFor(f,data);return [kit.autoAttack?'as':'haste',kit.healthScaling||defensive?'scalingHP':'adaptive','hp'];}
export function completeRunePage(page:RunePage,s:Scenario,data:Dataset):RunePage{
 const primary=data.runes.find(t=>t.id===page.primary),secondary=data.runes.find(t=>t.id===page.secondary);
 const main=primary?.slots.map(slot=>slot.runes.find(r=>page.selected.includes(r.id)&&runeCompatible(r.id,s.player,data).allowed)?.id??slot.runes.find(r=>runeCompatible(r.id,s.player,data).allowed)?.id).filter((id):id is number=>id!==undefined)??[];
 const extra:number[]=[];for(const slot of secondary?.slots.slice(1)??[]){const r=slot.runes.find(r=>page.selected.includes(r.id)&&runeCompatible(r.id,s.player,data).allowed);if(r)extra.push(r.id);}for(const slot of secondary?.slots.slice(1)??[]){if(extra.length>=2)break;if(extra.some(id=>slot.runes.some(r=>r.id===id)))continue;const r=slot.runes.find(r=>runeCompatible(r.id,s.player,data).allowed);if(r)extra.push(r.id);}
 const defaults=defaultShards(s.player,data,s.weights.defense>s.weights.offense);return {...page,selected:[...main,...extra.slice(0,2)],shards:defaults.map((d,i)=>SHARD_ROWS[i].includes(page.shards[i])?page.shards[i]:d)};
}
