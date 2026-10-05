import LZString from 'lz-string';
import type {Dataset,Fighter,Scenario,Stats} from './contracts.ts';
import {fighter,initialScenario,isBoot,validateScenario} from './model.ts';
import {SHARD_ROWS} from './shards.ts';
const MAX_LINK=2400,MAX_JSON=14000;
type SharedFighter=[string,number,string,string[],[number,number,number[],string[]],Partial<Stats>,Record<string,number>];
interface SharedBuild {v:1;patch:string;p:SharedFighter;e:SharedFighter;w:Scenario['weights'];duration:number}
const pack=(f:Fighter):SharedFighter=>[f.champion,f.level,f.lane,[...f.items],[f.runes.primary,f.runes.secondary,[...f.runes.selected],[...f.runes.shards]],{...f.overrides},{...f.stacks}];
export function buildShareLink(s:Scenario,origin:string):string {
 const url=new URL('/',origin);if(!['http:','https:'].includes(url.protocol))throw Error('Endereço do site inválido.');
 const payload:SharedBuild={v:1,patch:s.patch,p:pack(s.player),e:pack(s.enemy),w:{...s.weights},duration:s.duration};
 const json=JSON.stringify(payload);if(json.length>MAX_JSON)throw Error('Build muito extensa para compartilhar por QR Code.');
 url.hash=`build=${LZString.compressToEncodedURIComponent(json)}`;
 if(url.href.length>MAX_LINK)throw Error('Build muito extensa para compartilhar por QR Code. Reduza os atributos personalizados.');
 return url.href;
}
function record(value:unknown):value is Record<string,unknown>{return !!value&&typeof value==='object'&&!Array.isArray(value);}
function numbers(value:unknown):Record<string,number>{
 if(!record(value)||Object.keys(value).length>40)throw Error('Atributos inválidos.');
 const result:Record<string,number>={};for(const [key,n] of Object.entries(value)){if(['__proto__','constructor','prototype'].includes(key)||typeof n!=='number'||!Number.isFinite(n)||n<0||n>1000000)throw Error('Atributos inválidos.');result[key]=n;}return result;
}
const statKeys=new Set(['hp','ad','ap','armor','mr','mana','as','baseAS','ratio','bonusAS','crit','critMultiplier','haste','move','range','hpRegen','manaRegen','lifesteal','armorPen','magicPen','armorPenPercent','magicPenPercent','basicHaste','ultimateHaste']);
function unpack(value:unknown,data:Dataset):Fighter {
 if(!Array.isArray(value)||value.length!==7)throw Error('Campeão compartilhado inválido.');
 const [champion,level,lane,items,runes,attributes,stacks]=value;
 if(typeof champion!=='string'||!Object.hasOwn(data.champions,champion)||!Number.isInteger(level)||level<1||level>18||!['Top','Jungle','Mid','Bot','Support'].includes(lane))throw Error('Campeão, nível ou rota inválidos.');
 if(!Array.isArray(items)||items.length>6||items.some(id=>typeof id!=='string'||!Object.hasOwn(data.items,id)))throw Error('Itens inválidos.');
 if(!Array.isArray(runes)||runes.length!==4)throw Error('Runas inválidas.');
 const [primary,secondary,selected,shards]=runes,primaryTree=data.runes.find(t=>t.id===primary),secondaryTree=data.runes.find(t=>t.id===secondary);
 if(!primaryTree||!secondaryTree||primary===secondary||!Array.isArray(selected)||selected.length>6||new Set(selected).size!==selected.length||!Array.isArray(shards)||shards.length>3||shards.some((id,i)=>!SHARD_ROWS[i].includes(id)))throw Error('Árvore de runas inválida.');
 const allowed=[...primaryTree.slots.flatMap(row=>row.runes),...secondaryTree.slots.slice(1).flatMap(row=>row.runes)].map(r=>r.id);
 if(selected.some(id=>!allowed.includes(id))||primaryTree.slots.some(row=>row.runes.filter(r=>selected.includes(r.id)).length>1)||secondaryTree.slots.slice(1).some(row=>row.runes.filter(r=>selected.includes(r.id)).length>1)||secondaryTree.slots.slice(1).flatMap(row=>row.runes).filter(r=>selected.includes(r.id)).length>2)throw Error('Seleção de runas inválida.');
 const overrides=numbers(attributes);if(Object.keys(overrides).some(k=>!statKeys.has(k)))throw Error('Atributo desconhecido.');
 const f=fighter(data,champion);const boot=items.find(id=>isBoot(id,data));
 return {...f,level,lane,items:[...items],locked:[...items],boots:boot?'fixed':'none',fixedBoot:boot??'',overrides,stacks:numbers(stacks),runes:{primary,secondary,selected:[...selected],shards:[...shards],locked:true}};
}
export function readBuildShare(hash:string,data:Dataset):Scenario|null {
 const encoded=new URLSearchParams(hash.replace(/^#/, '')).get('build');if(!encoded)return null;
 if(encoded.length>MAX_LINK)throw Error('Link de build muito extenso.');
 const json=LZString.decompressFromEncodedURIComponent(encoded);if(!json||json.length>MAX_JSON)throw Error('Link de build inválido.');
 const raw:unknown=JSON.parse(json);if(!record(raw)||raw.v!==1||raw.patch!==data.version)throw Error('Build de outro patch. Atualize o catálogo ou gere um novo card.');
 if(!record(raw.w)||Object.keys(raw.w).sort().join(',')!=='defense,offense,utility')throw Error('Preferência inválida.');
 const weights=numbers(raw.w);if(Object.keys(weights).length!==3||Math.abs(Object.values(weights).reduce((a,b)=>a+b,0)-100)>1e-6)throw Error('Preferência inválida.');
 if(typeof raw.duration!=='number')throw Error('Janela inválida.');
 const s:Scenario={...initialScenario(data),player:unpack(raw.p,data),enemy:unpack(raw.e,data),weights:weights as Scenario['weights'],duration:raw.duration};
 const errors=validateScenario(s,data);if(errors.length)throw Error(errors.join('; '));
 for(const f of [s.player,s.enemy]){const groups=new Set<string>();for(const id of f.items){const group=data.items[id].exclusiveGroup;if(group&&groups.has(group))throw Error('Itens de grupos exclusivos em conflito.');if(group)groups.add(group);}}
 return s;
}
