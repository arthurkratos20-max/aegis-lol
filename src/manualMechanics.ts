import type {CalcNode,Dataset,NativeSpell} from './contracts.ts';

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
function validNested(value:unknown,depth:number):boolean{
 if(depth>12)return false;
 if(value===null||value===undefined)return true;
 if(typeof value==='number')return Number.isFinite(value);
 if(typeof value==='string'||typeof value==='boolean')return true;
 if(Array.isArray(value))return value.every(item=>validNested(item,depth+1));
 if(typeof value==='object')return Object.values(value).every(item=>validNested(item,depth+1));
 return false;
}
function validNode(value:CalcNode,depth=0):boolean{
 return !!value&&typeof value==='object'&&typeof value.__type==='string'&&depth<=12&&validNested(Object.fromEntries(Object.entries(value).filter(([key])=>key!=='__type')),depth+1);
}
/** Validate a complete champion entry; empty effects are allowed for an explicitly unfinished template. */
export function validateManualChampionRecord(record:ManualChampionRecord):string[]{
 const errors:string[]=[];
 if(!record.champion.trim())errors.push('Campeão ausente');
 if(!PATCH.test(record.patch))errors.push('Patch inválido');
 if(!isHttps(record.sourceUrl))errors.push('Fonte do campeão precisa ser HTTPS');
 if(!Array.isArray(record.effects))return [...errors,'Lista de efeitos inválida'];
 const seen=new Set<string>();
 for(const effect of record.effects){
  if(seen.has(effect.key))errors.push(`Efeito duplicado: ${effect.key}`);
  seen.add(effect.key);
  errors.push(...validateManualEffect(effect).map(error=>`${effect.key}: ${error}`));
 }
 if(!Array.isArray(record.notes)||record.notes.some(note=>typeof note!=='string'||!note.trim()))errors.push('Notas inválidas');
 return errors;
}
export const manualMechanicsPilots=['Shen','Ezreal','Yasuo','Yone','Riven','Darius'] as const;
/** Empty pilot slots are intentional: no unverified damage values are fabricated. */
export const manualMechanicsTemplate:ManualChampionRecord[]=manualMechanicsPilots.map(champion=>({
 champion,patch:'16.23.1',sourceUrl:'https://www.leagueoflegends.com/',effects:[],notes:['Preencher P/Q/W/E/R com dados da versão declarada.','Registrar condições, limitações e fonte específica por efeito.','Marcar verified somente após conferência independente e testes.']
}));


/**
 * Merge only independently verified, same-patch manual snapshots.
 * Existing champion attack-speed ratios and crit multipliers are never inferred here.
 */
export function mergeVerifiedManualMechanics(data:Dataset,records:ManualChampionRecord[]):Dataset{
 const mechanics={...(data.mechanics??{})};
 const warnings=[...(data.catalogWarnings??[])];
 for(const record of records){
  if(record.patch!==data.version){if(record.effects.some(effect=>effect.validation==='verified'))warnings.push(`Mecânicas manuais de ${record.champion} ignoradas: patch ${record.patch} difere de ${data.version}.`);continue;}
  if(!data.champions[record.champion]){warnings.push(`Mecânicas manuais ignoradas: campeão ${record.champion} não existe no catálogo.`);continue;}
  const validationErrors=validateManualChampionRecord(record);
  if(validationErrors.length){warnings.push(`Mecânicas manuais de ${record.champion} ignoradas: registro inválido.`);continue;}
  const verified=record.effects.filter(effect=>effect.validation==='verified');
  if(!verified.length)continue;
  const current=mechanics[record.champion];
  if(!current){warnings.push(`Mecânicas manuais de ${record.champion} não aplicadas: faltam atributos-base certificados (ratio/critMultiplier).`);continue;}
  const spells={...current.spells};
  for(const effect of verified){
   const spellId=effect.spell.path.split('/').filter(Boolean).at(-1);
   if(!spellId){warnings.push(`Mecânica manual ${record.champion} ${effect.key} ignorada: caminho nativo inválido.`);continue;}
   spells[spellId]=effect.spell;
  }
  mechanics[record.champion]={...current,spells,source:`${current.source}; manual verificado: ${record.sourceUrl}`};
 }
 return {...data,mechanics,catalogWarnings:warnings};
}
