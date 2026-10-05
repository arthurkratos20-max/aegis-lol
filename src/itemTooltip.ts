import type {Dataset,Fighter,Stats} from './contracts.ts';
import {statsFor,plain} from './model.ts';
export interface ItemText {text:string;tone:string;bold:boolean;break?:boolean}
const tones:Record<string,string>={physicaldamage:'physical',magicdamage:'magic',truedamage:'true',scalead:'physical',scaleap:'magic',scalehealth:'health',healing:'health',scalemana:'speed',speed:'speed',scaleattackspeed:'speed',passive:'named',active:'active',rules:'rules',status:'unique',attention:'value'};
const decode=(s:string)=>s.replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n)));
export function parseItemHTML(html:string):ItemText[]{
 const result:ItemText[]=[],stack:{tag:string;tone:string;bold:boolean}[]=[];
 // Data is never injected as HTML: tags are mapped to text spans; executable content is discarded.
 const clean=html.replace(/<(script|style|iframe)[^>]*>[\s\S]*?<\/\1>/gi,'');
 for(const token of clean.match(/<[^>]*>|[^<]+/g)??[]){if(token.startsWith('<')){const m=token.match(/^<\s*(\/)?\s*([\w-]+)/);if(!m)continue;const tag=m[2].toLowerCase();if(tag==='br'){result.push({text:'',tone:'',bold:false,break:true});continue;}if(m[1]){const i=stack.map(x=>x.tag).lastIndexOf(tag);if(i>=0)stack.splice(i);}else stack.push({tag,tone:tones[tag]??'',bold:['passive','active','attention','b','strong'].includes(tag)});}else{const styled=[...stack].reverse().find(x=>x.tone);result.push({text:decode(token),tone:styled?.tone??'',bold:stack.some(x=>x.bold)});}}
 return result;
}
export function itemModel(id:string,f:Fighter,data:Dataset){
 const item=data.items[id];if(!item)throw Error('Item ausente');const statsHTML=item.description.match(/<stats>([\s\S]*?)<\/stats>/i)?.[1]??'';
 const body=item.description.replace(/<stats>[\s\S]*?<\/stats>/i,'').replace(/^<mainText>(?:<br>)+/i,'<mainText>');
 const x=statsFor(f,data),equipped=f.items.includes(id),dynamic:{label:string;value:number;unit:string;formula:string}[]=[];
 const supported=data.version==='16.19.1';
 // Formula adapters require both the pinned version and the expected official description.
 if(supported&&id==='3084'&&/70 mais 6%/.test(plain(body))){const damage=70+.06*x.hp;dynamic.push({label:'Consumo Colossal · dano bruto',value:damage,unit:'físico',formula:'70 + 6% da Vida máxima atual'});}
 const warning=id==='3084'&&/\(0s\)/.test(body)?'A API informa 0s por alvo neste snapshot; cooldown interno não verificado.':null;
 const uncovered=/<(?:passive|active|status)\b/i.test(body);
 const current=x;
 const candidate=equipped?null:f.items.length<6?statsFor({...f,items:[...f.items,id]},data):null;
 const marginal=candidate?(['hp','ad','ap','armor','mr','mana','haste','move','as'] as (keyof Stats)[]).map(key=>({key,delta:(candidate[key]??0)-(current[key]??0)})).filter(v=>Math.abs(v.delta)>.001):[];
 return {item,stats:statsHTML.split(/<br\s*\/?\s*>/i).filter(v=>plain(v)),body:parseItemHTML(body),plaintext:item.plaintext??'',dynamic,uncovered,warning,equipped,marginal,hp:x.hp};
}
export interface RecipeNode {id:string;children:RecipeNode[]}
export function recipeTree(id:string,data:Dataset,seen:string[]=[],depth=0):RecipeNode[]{
 if(depth>=6||seen.includes(id))return [];return (data.items[id]?.from??[]).filter(x=>!!data.items[x]).map(child=>({id:child,children:recipeTree(child,data,[...seen,id],depth+1)}));
}
