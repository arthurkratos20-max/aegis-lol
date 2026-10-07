import {latestRiotPatch,fetchPatchCatalog,validatePatchCatalog,comparePatch,newestCatalog} from './patchCatalog.ts';
import {teamWorkspace} from './teamWorkspace.ts';
import {normalizeDraft} from './draft.ts';
import {attachItemGroups} from './itemGroups.ts';
import {attachChampionScaling} from './championScaling.ts';
import type {Dataset,Scenario} from './contracts.ts';
export let CURRENT_PATCH_VERSION='';
export interface PatchState {version:string;checkedAt:string|null;fallback:boolean;warnings?:string[]}
function cacheDB():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const r=indexedDB.open('aegis-patch-cache',1);r.onupgradeneeded=()=>r.result.createObjectStore('catalogs');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function cached(locale:string):Promise<Dataset|null>{try{const db=await cacheDB();return await new Promise((resolve,reject)=>{const r=db.transaction('catalogs').objectStore('catalogs').get(locale);r.onsuccess=()=>{db.close();resolve(r.result??null);};r.onerror=()=>{db.close();reject(r.error);};});}catch{return null;}}
async function saveCache(locale:string,data:Dataset){try{const db=await cacheDB();await new Promise<void>((resolve,reject)=>{const t=db.transaction('catalogs','readwrite');t.objectStore('catalogs').put(data,locale);t.oncomplete=()=>{db.close();resolve();};t.onerror=()=>{db.close();reject(t.error);};});}catch{/* Browser cache is optional; server cache remains authoritative. */}}
function valid(d:Dataset){if(!d.version||!Object.keys(d.items??{}).length||!d.runes?.length||!Object.values(d.champions??{}).every(c=>c.spells?.length===4&&c.skins?.length))throw Error('Catálogo incompleto');return attachItemGroups(attachChampionScaling(d));}
async function json(url:string){const r=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Catálogo indisponível');return r.json();}
async function withMechanics(data:Dataset):Promise<Dataset>{
 try{
  const m=await json('/data/mechanics.json');
  const mechanics=m.version===data.version?Object.fromEntries(Object.entries(m.champions??{}).filter(([id,value])=>{
   const c=value as Record<string,unknown>;
   return data.champions[id]&&Number.isFinite(c.ratio)&&Number.isFinite(c.critMultiplier)&&c.spells&&typeof c.spells==='object'&&!Array.isArray(c.spells);
  })):undefined;
  // Previously inferred flags must be recomputed with the newly loaded formulas.
  const champions=Object.fromEntries(Object.entries(data.champions).map(([id,c])=>[id,c.scaling?.coverage==='estimated'?{...c,scaling:undefined}:c]));
  return {...data,champions,mechanics:mechanics as Dataset['mechanics']};
 }catch{return data;}
}
const pending=new Map<string,Promise<{data:Dataset;state:PatchState}>>();
export async function loadPatch(locale:string):Promise<{data:Dataset;state:PatchState}>{
 const existing=pending.get(locale);if(existing)return existing;
 const work=(async()=>{
  const stored=await cached(locale);let old:Dataset|null=null;
  try{if(stored)old=validatePatchCatalog(stored);}catch{/* reject broken browser cache */}
  try{
   const version=await latestRiotPatch();
   if(old&&comparePatch(version,old.version)<0)throw Error('Resposta Riot anterior ao cache');
   let data=old?.version===version?old:await fetchPatchCatalog(version,locale);
   data=await withMechanics(data);attachItemGroups(attachChampionScaling(data));await saveCache(locale,data);CURRENT_PATCH_VERSION=data.version;
   return {data,state:{version:data.version,checkedAt:new Date().toISOString(),fallback:false,warnings:data.catalogWarnings}};
  }catch{
   let bundled:Dataset|null=null;try{bundled=valid(await json(`/data/${locale}.json`));validatePatchCatalog(bundled);}catch{}
   const fallback=newestCatalog(old,bundled);
   if(!fallback)throw Error('Nenhum catálogo validado disponível');
   const data=await withMechanics(fallback);attachItemGroups(attachChampionScaling(data));await saveCache(locale,data);CURRENT_PATCH_VERSION=data.version;
   return {data,state:{version:data.version,checkedAt:null,fallback:true,warnings:data.catalogWarnings}};
  }
 })();pending.set(locale,work);try{return await work;}finally{pending.delete(locale);}
}
/** Remove extinct IDs only. Preserve champion, level, matchup, skill orders, weights and other user settings. */
export function reconcilePatch(s:Scenario,data:Dataset):{scenario:Scenario;removed:string[]}{const next=structuredClone(s),removed:string[]=[];const knownRunes=new Set(data.runes.flatMap(t=>t.slots.flatMap(slot=>slot.runes.map(r=>r.id)))),trees=new Set(data.runes.map(t=>t.id));for(const side of ['player','enemy'] as const){const f=next[side];for(const key of ['items','owned','locked'] as const)f[key]=f[key].filter(id=>{if(data.items[id])return true;removed.push(`item:${id}`);return false;});if(f.fixedBoot&&!data.items[f.fixedBoot]){removed.push(`item:${f.fixedBoot}`);f.fixedBoot='';}f.runes.selected=f.runes.selected.filter(id=>{if(knownRunes.has(id))return true;removed.push(`rune:${id}`);return false;});if(f.runes.locks){f.runes.locks.runes=f.runes.locks.runes?.filter(id=>knownRunes.has(id)&&f.runes.selected.includes(id));if(!trees.has(f.runes.primary))f.runes.locks.primaryTree=false;if(!trees.has(f.runes.secondary))f.runes.locks.secondaryTree=false;}for(const key of ['primary','secondary'] as const)if(f.runes[key]&&!trees.has(f.runes[key])){removed.push(`tree:${f.runes[key]}`);f.runes[key]=0;}}if(next.counterPreset){next.counterPreset.items=next.counterPreset.items.filter(id=>{if(data.items[id])return true;removed.push(`item:${id}`);return false;});if(next.counterPreset.boot&&!data.items[next.counterPreset.boot]){removed.push(`item:${next.counterPreset.boot}`);next.counterPreset.boot=null;}next.counterPreset.runes.selected=next.counterPreset.runes.selected.filter(id=>knownRunes.has(id));if(!data.champions[next.counterPreset.champion])next.counterPreset=undefined;}if(next.draft)next.draft=next.enemyTeam?teamWorkspace(next,data):normalizeDraft(next,data);next.patch=data.version;return {scenario:next,removed:[...new Set(removed)]};}
