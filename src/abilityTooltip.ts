import type {Dataset,Fighter,Stats,Spell,CalcNode,NativeSpell} from './contracts.ts';
import {statsFor,hasteCooldown} from './model.ts';
import {calculateNative} from './native.ts';
export interface FormulaOverride {base:number;ad:number;bonusAD:number;ap:number;hp:number;armor:number;mr:number}
export type TooltipOverrides=Record<string,FormulaOverride>;
export interface TooltipPart {text:string;color:'normal'|'physical'|'magic'|'defense'|'unique';status?:'resolved'|'base'|'missing'|'custom';variable?:string}
export interface TooltipModel {name:string;rank:number;cost:number|null;cooldown:number|null;resource:string;parts:TooltipPart[];warnings:string[];rows:{label:string;values:(number|string|null)[]}[];custom:boolean;leveltip:{label:string;value:string}[]}
const number=(v:number)=>v.toLocaleString('pt-BR',{maximumFractionDigits:2});
const normalize=(x:string)=>x.replace(/[^a-z0-9]/gi,'').toLowerCase();
function nativeSpell(spell:Spell,f:Fighter,data:Dataset):NativeSpell|undefined {const all=data.mechanics?.[f.champion]?.spells??{};return all[spell.id]??Object.entries(all).find(([key])=>normalize(key)===normalize(spell.id))?.[1];}
export function tooltipFor(f:Fighter,data:Dataset,key:'P'|'Q'|'W'|'E'|'R',overrides:TooltipOverrides={}):TooltipModel {
 const champion=data.champions[f.champion],stats=statsFor(f,data),base=statsFor({...f,items:[],overrides:{},runes:{...f.runes,shards:[]}},data);
 if(key==='P')return {name:champion.passive.name,rank:0,cost:null,cooldown:null,resource:champion.partype,parts:parse(champion.passive.description,()=>({text:'[Base não fornecida · escala indisponível]',status:'missing'})),warnings:['Descrição estática da passiva; efeitos dinâmicos pendentes de adapter.'],rows:[],custom:false,leveltip:[]};
 const applicableHaste=stats.haste+(key==='R'?(stats.ultimateHaste??0):(stats.basicHaste??0));
 const spell=champion.spells[['Q','W','E','R'].indexOf(key)],rank=f.skills.slice(0,f.level).filter(k=>k===key).length,displayRank=Math.max(1,rank),native=nativeSpell(spell,f,data),warnings=new Set<string>();let custom=false;
 const valueAt=(array:number[],r:number,source:'api'|'native')=>array[source==='native'&&array.length>spell.maxrank?r:r-1];
 const resolve=(expression:string,r=displayRank):{text:string;status:'resolved'|'base'|'missing'|'custom';value?:number}=>{
  const match=expression.trim().match(/^([a-zA-Z][\w]*)(?:\s*([*/])\s*(\d+(?:\.\d+)?))?$/);if(!match)return {text:'[Base não fornecida · expressão sem adapter]',status:'missing'};
  const name=normalize(match[1]);const factor=match[2]==='*'?Number(match[3]):match[2]==='/'&&Number(match[3])>0?1/Number(match[3]):1;
  if(['spellmodifierdescriptionappend','onhitdamage'].includes(name)&&name==='spellmodifierdescriptionappend')return {text:'',status:'base'};
  if(name==='abilityresourcename')return {text:champion.partype,status:'base'};
  const hasNL=name.endsWith('nl'),n=hasNL?name.slice(0,-2):name,usedRank=Math.min(spell.maxrank,r+(hasNL?1:0));
  let value:number|undefined,status:'resolved'|'base'|'custom'='base';
  const override=overrides[`${f.champion}:${key}:${n}`];
  if(override){value=override.base+override.ad*stats.ad+override.bonusAD*(stats.ad-base.ad)+override.ap*stats.ap+override.hp*stats.hp+override.armor*stats.armor+override.mr*stats.mr;status='custom';custom=true;}
  else if(n==='cost')value=spell.cost[usedRank-1];
  else if(n==='cooldown')value=hasteCooldown(spell.cooldown[usedRank-1]??0,applicableHaste);
  else if(/^e\d+$/.test(n)){const array=spell.effect[Number(n.slice(1))];if(array)value=valueAt(array,usedRank,'api');}
  else {
   const v=spell.vars?.find(x=>normalize(x.key)===n);
   if(v){const coeff=v.coeff.length===1?v.coeff[0]:v.coeff[usedRank-1];const amounts:Record<string,number>={spelldamage:stats.ap,attackdamage:stats.ad,bonusattackdamage:stats.ad-base.ad,health:stats.hp,armor:stats.armor,spellblock:stats.mr};if(Number.isFinite(coeff)&&v.link in amounts){value=coeff*amounts[v.link];status='resolved';const names:Record<string,string>={spelldamage:'AP',attackdamage:'AD total',bonusattackdamage:'AD bônus',health:'Vida',armor:'Armadura',spellblock:'RM'};return {text:`${number(value*factor)} (+${number(coeff*factor*100)}% ${names[v.link]})`,status,value:value*factor};}}
   const staticValue=Object.entries(spell.datavalues??{}).find(([k])=>normalize(k)===n)?.[1];if(staticValue!==undefined)value=Array.isArray(staticValue)?valueAt(staticValue,usedRank,'api'):staticValue;
   if(native){const calc=Object.entries(native.calculations).find(([k])=>normalize(k)===n)?.[1];if(calc){try{value=calculateNative(calc,native,usedRank,f.level,stats,base);status='resolved';}catch{warnings.add(`${n}: operação de fórmula sem adapter; escala dinâmica indisponível.`);}}
    if(value===undefined){const array=Object.entries(native.values).find(([k])=>normalize(k)===n)?.[1];if(array)value=valueAt(array,usedRank,'native');}
   }
  }
  if(value!==undefined&&Number.isFinite(value)){let result=value*factor;if(['basepercenthealth','emppercenthealth'].includes(n)&&status==='resolved')return {text:`${number(result*100)}%`,status,value:result*100};if(status==='base'&&!['cost','cooldown'].includes(n))warnings.add(`${n}: valor base do snapshot; escala dinâmica indisponível.`);return {text:status==='base'&&!['cost','cooldown'].includes(n)?`[Valor Base: ${number(result)} · escala dinâmica indisponível]`:number(result),status,value:result};}
  warnings.add(`${n}: base não fornecida pela API e escala dinâmica indisponível.`);return {text:'[Base não fornecida · escala dinâmica indisponível]',status:'missing'};
 };
 const parts=parse(spell.tooltip??spell.description,(token)=>resolve(token));
 const rows:TooltipModel['rows']=[{label:'Recarga base (s)',values:spell.cooldown.slice(0,spell.maxrank)},{label:`Recarga com ${number(applicableHaste)} AH (s)`,values:spell.cooldown.slice(0,spell.maxrank).map(v=>hasteCooldown(v,applicableHaste))},{label:`Custo · ${champion.partype}`,values:spell.cost.slice(0,spell.maxrank)}];
 const effectRefs=[...new Set((spell.tooltip??'').match(/\{\{\s*e\d+\s*\}\}/g)??[])];for(const ref of effectRefs){const n=Number(ref.replace(/\D/g,'')),array=spell.effect[n];if(array)rows.push({label:`Valor base e${n} · API`,values:array.slice(0,spell.maxrank)});}
 const baseDamage=native?.values.BaseDamage;if(baseDamage)rows.push({label:'Dano base · snapshot',values:Array.from({length:spell.maxrank},(_,i)=>valueAt(baseDamage,i+1,'native'))});
 const dynamicTokens=[...new Set(parts.filter(p=>p.status==='resolved'&&p.variable&&!['cost','cooldown'].includes(normalize(p.variable))).map(p=>p.variable!))].slice(0,4);for(const token of dynamicTokens)rows.push({label:`${token} · atributos atuais`,values:Array.from({length:spell.maxrank},(_,i)=>resolve(token,i+1).value??null)});
 const leveltip=spell.leveltip.label.map((label,i)=>({label:label.replace(/@AbilityResourceName@/g,champion.partype),value:spell.leveltip.effect[i]?.replace(/\{\{\s*([^}]+)\s*\}\}/g,(_,v)=>resolve(v).text)??'Não fornecido'}));
 if(rank===0)warnings.add('Habilidade não evoluída: descrição prévia de rank 1, sem participação no combate.');
 if(['Yasuo','Yone'].includes(f.champion)&&key==='Q')warnings.add('Recarga por velocidade de ataque ainda não modelada; mostrado CD base e ajuste por AH.');
 return {name:spell.name,rank,cost:rank?spell.cost[rank-1]??null:null,cooldown:rank?hasteCooldown(spell.cooldown[rank-1]??0,applicableHaste):null,resource:champion.partype,parts,warnings:[...warnings],rows,custom,leveltip};
}
function parse(text:string,resolve:(token:string)=>{text:string;status:'resolved'|'base'|'missing'|'custom'}):TooltipPart[] {
 const parts:TooltipPart[]=[],stack:TooltipPart['color'][]=[];let color:TooltipPart['color']='normal';
 const map:Record<string,TooltipPart['color']>={physicaldamage:'physical',attackdamage:'physical',magicdamage:'magic',abilitypower:'magic',health:'defense',armor:'defense',spellblock:'defense',shield:'defense',truedamage:'unique',status:'unique',keywordmajor:'unique'};
 for(const token of text.split(/(<[^>]*>|\{\{[^}]*\}\})/g)){if(!token)continue;if(token.startsWith('{{')){const variable=token.slice(2,-2).trim(),result=resolve(variable);parts.push({...result,color,variable});}else if(token.startsWith('<')){if(/^<br\s*\/?\s*>$/i.test(token)){parts.push({text:'\n',color});continue;}if(/^<\//.test(token)){color=stack.pop()??'normal';}else{const tag=token.match(/^<([a-z]+)/i)?.[1].toLowerCase()??'';stack.push(color);color=map[tag]??color;}}else{parts.push({text:token.replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>'),color});}}
 return parts;
}
