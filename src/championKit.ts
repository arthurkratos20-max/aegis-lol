import type {Dataset,Fighter,SkillKey,Stats} from './contracts.ts';
import {nativeAction,nativeDamage,nativeOptions} from './native.ts';
import {effectiveResistance,mitigate} from './model.ts';
export interface KitCoverage {champion:string;status:'partial'|'missing';covered:SkillKey[];missing:('P'|SkillKey)[];source:string|null}
/** Availability is not full validation: passives and stateful interactions remain separate. */
export function championKitCoverage(champion:string,data:Dataset):KitCoverage {
 const mechanics=data.mechanics?.[champion];
 const covered=[...new Set((nativeOptions[champion]??[]).filter(o=>mechanics?.spells[o.spell]?.calculations[o.calculation]&&(!o.flatCalculation||mechanics.spells[o.spell].calculations[o.flatCalculation])).map(o=>o.key))];
 return {champion,status:covered.length?'partial':'missing',covered,missing:(['P','Q','W','E','R'] as const).filter(k=>k==='P'||!covered.includes(k)),source:mechanics?.source??null};
}
/** One legal isolated impact per supported skill. This is an index, never combo DPS. */
export function kitImpactPotential(f:Fighter,data:Dataset,actor:Stats,target:Stats,distance=0):{damage:number;shield:number;covered:SkillKey[];omitted:number}|null {
 if(f.actions.length||!data.mechanics?.[f.champion])return null;
 let damage=0,shield=0,resource=actor.mana*f.initialResource,omitted=0;const covered:SkillKey[]=[];
 for(const [index,opt] of (nativeOptions[f.champion]??[]).entries()){
  if(opt.automatic===false||covered.includes(opt.key)||!f.skills.slice(0,f.level).includes(opt.key))continue;
  // Shen Q is one bonus on a landed attack, not an independent ranged spell.
  if(f.champion==='Shen'&&opt.key==='Q'&&(!f.automaticAttacks||distance>actor.range))continue;
  try{
   const a=nativeAction(f,data,index);if(a.cost>resource)continue;
   const raw=nativeDamage(a,f,data,actor,target);if(!Number.isFinite(raw)||raw<0){omitted++;continue;}
   resource-=a.cost;covered.push(opt.key);
   if(a.kind==='shield'){shield+=raw;continue;}
   const r=a.type==='physical'?effectiveResistance(target.armor,actor.armorPenPercent,actor.armorPen):effectiveResistance(target.mr,actor.magicPenPercent,actor.magicPen);
   damage+=a.type==='true'?raw:mitigate(raw,r);
  }catch{omitted++;}
 }
 return covered.length?{damage,shield,covered,omitted}:null;
}
