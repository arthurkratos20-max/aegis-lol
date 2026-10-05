import type {Champion,Dataset,Fighter} from './contracts.ts';
export type ChampionClass='Mage'|'Marksman'|'Fighter'|'Tank'|'Assassin'|'Support';
export interface ChampionScaling {
 hasADScaling:boolean;hasAPScaling:boolean;hasCritScaling:boolean;hasAttackSpeedScaling:boolean;
 hasHealthScaling:boolean;hasArmorResistScaling:boolean;primaryClass:ChampionClass;secondaryClass?:ChampionClass;
 coverage:'explicit'|'estimated';evidence:string[];
}
const classes:ChampionClass[]=['Mage','Marksman','Fighter','Tank','Assassin','Support'];
const members=(id:string,list:string)=>list.split(' ').includes(id);
const cache=new WeakMap<Dataset,Map<string,ChampionScaling>>();
export function getChampionScaling(champion:Champion,data:Dataset):ChampionScaling {
 if(champion.scaling)return champion.scaling;
 let map=cache.get(data);if(!map){map=new Map();cache.set(data,map);}const old=map.get(champion.id);if(old)return old;
 const tags=champion.tags.filter((tag):tag is ChampionClass=>classes.includes(tag as ChampionClass)),primaryClass=tags[0]??'Fighter';
 const hasClass=(tag:ChampionClass)=>tags.includes(tag),evidence:string[]=[];
 const result:ChampionScaling={hasADScaling:hasClass('Marksman')||hasClass('Fighter')||hasClass('Assassin')&&!hasClass('Mage'),hasAPScaling:hasClass('Mage'),hasCritScaling:hasClass('Marksman')||members(champion.id,'Yasuo Yone Tryndamere'),hasAttackSpeedScaling:hasClass('Marksman')||hasClass('Fighter'),hasHealthScaling:hasClass('Tank'),hasArmorResistScaling:false,primaryClass,secondaryClass:tags[1],coverage:'estimated',evidence};
 // Per-champion kit adapters, never pair/draft tables. Presence unlocks pools, not damage formulas.
 if(members(champion.id,'Volibear Kaisa Varus Shyvana Twitch Katarina Ezreal Akali Jax Kayle KogMaw Corki Udyr Warwick')){result.hasADScaling=true;result.hasAPScaling=true;evidence.push('curated-hybrid-kit');}
 if(members(champion.id,'Ekko Ahri Syndra Lux Lulu Janna Karma Milio Azir Mordekaiser Rumble Amumu Zac Malphite Rammus Shen')){result.hasAPScaling=true;result.hasADScaling=false;}
 if(champion.id==='Azir')result.hasCritScaling=false;
 if(members(champion.id,'Shen Azir Kayle Kaisa Varus Twitch Volibear Shyvana Katarina Ezreal Jax Udyr Warwick KogMaw Teemo MasterYi Belveth'))result.hasAttackSpeedScaling=true;
 if(members(champion.id,'Shen ChoGath Sion Zac DrMundo Vladimir TahmKench Sejuani Ornn Skarner Sett Volibear'))result.hasHealthScaling=true;
 if(members(champion.id,'Malphite Rammus Galio KSante'))result.hasArmorResistScaling=true;
 for(const spell of champion.spells)for(const variable of spell.vars??[]){if(!variable.coeff.some(value=>value!==0))continue;const link=variable.link.toLowerCase();if(link==='spelldamage'){result.hasAPScaling=true;evidence.push(`vars:${spell.id}:${variable.key}:AP`);}if(['attackdamage','bonusattackdamage'].includes(link)){result.hasADScaling=true;evidence.push(`vars:${spell.id}:${variable.key}:AD`);}}
 const walk=(value:unknown,depth=0)=>{if(depth>16||!value||typeof value!=='object')return;const node=value as Record<string,unknown>;
  if(typeof node.__type==='string'&&node.__type.startsWith('StatBy')&&(node.mCoefficient!==0)){const code=Number(node.mStat??0);if(code===0)result.hasAPScaling=true;if(code===2)result.hasADScaling=true;if(code===12)result.hasHealthScaling=true;if([0,2,12].includes(code))evidence.push(`native-stat:${code}`);}
  for(const child of Object.values(node))if(Array.isArray(child))child.forEach(v=>walk(v,depth+1));else walk(child,depth+1);
 };
 for(const spell of Object.values(data.mechanics?.[champion.id]?.spells??{}))walk(spell.calculations);
 if(!evidence.length)evidence.push('class-fallback:coefficients-unavailable');
 map.set(champion.id,result);return result;
}
export function attachChampionScaling(data:Dataset):Dataset {for(const champion of Object.values(data.champions))champion.scaling=getChampionScaling(champion,data);return data;}
export function supportIntent(f:Fighter,data:Dataset):'utility'|'damage'{const c=data.champions[f.champion];return f.supportMode==='utility'||f.supportMode!=='damage'&&f.lane==='Support'&&c.tags.includes('Support')&&!c.tags.includes('Marksman')?'utility':'damage';}
