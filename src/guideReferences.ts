import type {Dataset,SkillKey} from './contracts.ts';
import {plain} from './model.ts';
export type GuideReference={kind:'item'|'rune'|'champion'|'skill';id:string;label:string;icon:string;championIcon?:string;key?:SkillKey};
export type GuidePart={text:string;reference?:GuideReference};
const cache=new WeakMap<Dataset,Map<string,GuideReference>>();
export function guideReferenceIndex(data:Dataset){
 const cached=cache.get(data);if(cached)return cached;
 const entries=new Map<string,GuideReference>();
 for(const c of Object.values(data.champions)){const icon=`/assets/riot/icons/champion/${c.image.full}`;entries.set(c.name,{kind:'champion',id:c.id,label:c.name,icon});for(const [i,sp]of c.spells.entries()){const key=(['Q','W','E','R'] as const)[i];const ref:GuideReference={kind:'skill',id:`${c.id}:${key}`,label:`${c.name} · ${key} · ${sp.name}`,icon:`/assets/riot/icons/spell/${sp.image.full}`,championIcon:icon,key};entries.set(`${c.name} ${key}`,ref);entries.set(`${c.name} · ${key}`,ref);if(!entries.has(sp.name))entries.set(sp.name,ref);}}
 for(const tree of data.runes)for(const row of tree.slots)for(const r of row.runes)entries.set(r.name,{kind:'rune',id:String(r.id),label:r.name,icon:`/assets/riot/icons/${r.icon}`});
 for(const [id,item]of Object.entries(data.items)){const name=plain(item.name);if(!entries.has(name))entries.set(name,{kind:'item',id,label:name,icon:`/assets/riot/icons/item/${item.image.full}`});}
 cache.set(data,entries);return entries;
}
export function parseGuideReferences(text:string,data:Dataset):GuidePart[]{
 const index=guideReferenceIndex(data),names=[...index.keys()].filter(n=>n.length>2).sort((a,b)=>b.length-a.length);
 const escaped=names.map(n=>n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
 const pattern=new RegExp(`\\[\\[(item|rune|champion|skill):([^\\]]+)\\]\\]|(?<![\\p{L}\\p{N}])(${escaped})(?![\\p{L}\\p{N}])`,'gu');
 const parts:GuidePart[]=[];let offset=0;
 for(const m of text.matchAll(pattern)){if(m.index!>offset)parts.push({text:text.slice(offset,m.index)});let ref=m[3]?index.get(m[3]):undefined;
  if(m[1]){const token=m[2];ref=[...index.values()].find(r=>r.kind===m[1]&&r.id===token);}
  parts.push({text:ref?.label??m[0],reference:ref});offset=m.index!+m[0].length;
 }
 if(offset<text.length)parts.push({text:text.slice(offset)});return parts;
}
