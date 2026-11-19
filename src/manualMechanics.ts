import type {CalcNode,NativeSpell} from './contracts.ts';

export type ManualEffectKey='P'|'Q'|'W'|'E'|'R';
export type ManualValidation='draft'|'reviewed'|'verified';
export interface ManualEffectRecord {
 key:ManualEffectKey;
 label:string;
 damageType:'physical'|'magic'|'true'|'shield'|'heal';
 spell:NativeSpell;
 conditions:string[];
 limitations:string[];
 validation:ManualValidation;
 sourceUrl:string;
}
export interface ManualChampionRecord {
 champion:string;
 patch:string;
 sourceUrl:string;
 effects:ManualEffectRecord[];
 notes:string[];
}
const PATCH=/^\d+\.\d+\.\d+$/;
const isHttps=(value:string)=>{try{return new URL(value).protocol==='https:';}catch{return false;}};

/** Validate hand-entered mechanics before they can be merged into a patch snapshot. */
export function validateManualEffect(effect:ManualEffectRecord):string[]{
 const errors:string[]=[];
 if(!['P','Q','W','E','R'].includes(effect.key))errors.push('Chave de habilidade inválida');
 if(!effect.label.trim())errors.push('Rótulo da mecânica ausente');
 if(!['physical','magic','true','shield','heal'].includes(effect.damageType))errors.push('Tipo de efeito inválido');
 if(!effect.spell.path.trim()||!Object.keys(effect.spell.calculations).length)errors.push('Snapshot nativo sem caminho ou cálculos');
 if(!Array.isArray(effect.conditions)||effect.conditions.some(x=>!x.trim()))errors.push('Condições inválidas');
 if(!Array.isArray(effect.limitations)||effect.limitations.some(x=>!x.trim()))errors.push('Limitações inválidas');
 if(!['draft','reviewed','verified'].includes(effect.validation))errors.push('Status de validação inválido');
 if(!isHttps(effect.sourceUrl))errors.push('Fonte precisa ser HTTPS');
 for(const [name,values] of Object.entries(effect.spell.values))if(!Array.isArray(values)||!values.length||values.some(v=>!Number.isFinite(v)))errors.push(`Valores inválidos: ${name}`);
 for(const [name,calculation] of Object.entries(effect.spell.calculations))if(!validNode(calculation))errors.push(`Cálculo inválido: ${name}`);
 if(!effect.spell.cooldown.length||effect.spell.cooldown.some(v=>!Number.isFinite(v)||v<0))errors.push('Cooldown inválido');
 if(!effect.spell.cost.length||effect.spell.cost.some(v=>!Number.isFinite(v)||v<0))errors.push('Custo inválido');
 return errors;
}
function validNode(value:CalcNode,depth=0):boolean{
 if(!value||typeof value!=='object'||typeof value.__type!=='string'||depth>12)return false;
 for(const [key,child] of Object.entries(value)){
  if(key==='__type')continue;
  if(child&&typeof child==='object'){
   if(Array.isArray(child)){if(child.some(item=>item&&typeof item==='object'&&!validNode(item as CalcNode,depth+1)))return false;}
   else if('__type' in child&&!validNode(child as CalcNode,depth+1))return false;
  }else if(typeof child==='number'&&!Number.isFinite(child))return false;
 }
 return true;
}
export function validateManualChampionRecord(record:ManualChampionRecord):string[]{
 const errors:string[]=[];
 if(!record.champion.trim())errors.push('Campeão ausente');
 if(!PATCH.test(record.patch))errors.push('Patch inválido');
 if(!isHttps(record.sourceUrl))errors.push('Fonte do campeão precisa ser HTTPS');
 if(!Array.isArray(record.effects))errors.push('Lista de efeitos inválida');
 const ids=new Set<string>();
 for(const effect of record.effects??[]){
  if(ids.has(effect.key))errors.push(`Efeito duplicado: ${effect.key}`);
  ids.add(effect.key);
  errors.push(...validateManualEffect(effect).map(message=>`${effect.key}: ${message}`));
 }
 return errors;
}
export const manualMechanicsPilots=['Shen','Ezreal','Yasuo','Yone','Riven','Darius'] as const;
/** Empty pilot slots are intentional: no unverified damage values are fabricated. */
export const manualMechanicsTemplate:ManualChampionRecord[]=manualMechanicsPilots.map(champion=>({
 champion,patch:'16.23.1',sourceUrl:'https://www.leagueoflegends.com/',effects:[],notes:['Preencher P/Q/W/E/R com dados da versão declarada.','Registrar condições, limitações e fonte específica por efeito.','Marcar verified somente após conferência independente e testes.']
}));
