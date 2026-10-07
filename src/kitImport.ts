import type {Dataset} from './contracts.ts';
export type ScalingStat='flat'|'ad'|'bonusAD'|'ap'|'hp'|'armor'|'mr'|'haste';
export interface ImportedTerm {stat:ScalingStat;values:number[]}
export interface ImportedImpact {key:string;condition:'enemy'|'ally'|'always';kind:'damage'|'shield'|'heal'|'utility';damageType?:'physical'|'magic'|'true';terms:ImportedTerm[];missing:string[];reviewed:boolean;sourceText?:string}
export interface ImportedKit {source:string;impacts:ImportedImpact[];missing:string[];isExactFormula:false}
export interface KitImport {version:string;source:string;champions:Record<string,ImportedKit>}
const units:Record<string,ScalingStat>={'':'flat','% AD':'ad','% bonus AD':'bonusAD','% AP':'ap','% maximum health':'hp','% armor':'armor','% magic resistance':'mr','% ability haste':'haste'};
/** No expressions are executed. Only recognized structured modifiers become candidate terms. */
export function parseKitSource(raw:unknown,data:Dataset,source:string):KitImport {
 if(!raw||typeof raw!=='object')throw Error('Dataset inválido');
 const envelope=raw as {version?:string;data?:Record<string,unknown>;champions?:Record<string,unknown>};
 if(envelope.version!==data.version)throw Error(`Patch incompatível ou ausente: ${envelope.version??'ausente'}; esperado ${data.version}`);
 const rows=envelope.champions??envelope.data;if(!rows||typeof rows!=='object')throw Error('Campeões estruturados ausentes');
 const champions:KitImport['champions']={};
 for(const id of Object.keys(data.champions)){
  const row=rows[id] as {abilities?:Record<string,unknown>}|undefined,impacts:ImportedImpact[]=[],missing:string[]=[];
  for(const key of ['P','Q','W','E','R']){
   const ability=row?.abilities?.[key];const variants=Array.isArray(ability)?ability:ability?[ability]:[];
   if(!variants.length){missing.push(`${key}: fonte/fórmula ausente`);continue;}
   for(const [variantIndex,variant] of variants.entries()){
    const a=variant as {effects?:unknown[];condition?:string};const effects=Array.isArray(a.effects)?a.effects:[];
    if(!effects.length){missing.push(`${key}[${variantIndex}]: efeitos ausentes`);continue;}
    for(const effect of effects){
     const e=effect as {leveling?:unknown[];description?:string};
     for(const entry of e.leveling??[]){
      const v=entry as {attribute?:string;modifiers?:{values?:number[];units?:string[]}[];condition?:string};
      const name=v.attribute??'',kind=/damage/i.test(name)?'damage':/shield/i.test(name)?'shield':/heal/i.test(name)?'heal':'utility';
      const damageType=/magic/i.test(name)?'magic':/physical/i.test(name)?'physical':/true/i.test(name)?'true':undefined;
      const terms:ImportedTerm[]=[],gaps:string[]=[];
      for(const m of v.modifiers??[]){const values=m.values,unit=m.units?.[0],stat=unit===undefined?undefined:units[unit];
       if(!stat||!values?.length||values.some(n=>!Number.isFinite(n))||m.units?.some(u=>u!==unit)){gaps.push(`modificador não suportado: ${JSON.stringify(m)}`);continue;}
       terms.push({stat,values:values.map(n=>stat==='flat'?n:n/100)});
      }
      const condition=v.condition??a.condition;
      // Lulu E cannot be flattened: damage targets enemies; shields target allies.
      const conditional=id==='Lulu'&&key==='E';
      const target=condition==='ally'||condition==='enemy'||condition==='always'?condition:conditional?(kind==='damage'?'enemy':kind==='shield'?'ally':'always'):'always';
      if(condition&& !['ally','enemy','always'].includes(condition))gaps.push(`condição não suportada: ${condition}`);
      if(kind==='damage'&&!damageType)gaps.push('tipo de dano ausente');
      if(kind!=='utility'&&!terms.length)gaps.push('coeficientes ausentes');
      impacts.push({key,condition:target,kind,sourceText:e.description,...(damageType?{damageType}:{}),terms,missing:gaps,reviewed:false});
     }
    }
   }
   if(!impacts.some(i=>i.key===key))missing.push(`${key}: nenhum impacto interpretável`);
  }
  champions[id]={source,impacts,missing:[...missing,'Passivas, condições, recasts, marcas e stacks requerem revisão e testes; importação não é validação.'],isExactFormula:false};
 }
 return {version:data.version,source,champions};
}
export function evaluateImportedImpact(impact:ImportedImpact,rank:number,stats:Record<ScalingStat,number>,condition:'enemy'|'ally'|'always'):number {
 if(!impact.reviewed||impact.missing.length)throw Error('Fórmula importada ainda não validada');
 if(impact.condition!=='always'&&impact.condition!==condition)return 0;
 if(!Number.isInteger(rank)||rank<1)throw Error('Rank inválido');
 const result=impact.terms.reduce((sum,t)=>{const value=t.values.length===1?t.values[0]:t.values[rank-1];if(value===undefined)throw Error('Rank fora da tabela');return sum+value*(t.stat==='flat'?1:stats[t.stat]);},0);
 if(!Number.isFinite(result)||result<0)throw Error('Resultado inválido');return result;
}
