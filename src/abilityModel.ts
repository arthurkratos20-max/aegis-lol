import type {Champion,Spell,Stats} from './contracts.ts';
/** DDragon coefficients are consumed only for understood links; malformed/unknown links stay unavailable. */
export function normalizeSpell(spell:Spell,rank:number){
 const aliases:Record<string,'ap'|'ad'|'bonusAD'|'hp'>={spelldamage:'ap',attackdamage:'ad',bonusattackdamage:'bonusAD',health:'hp'};
 const coefficients=(Array.isArray(spell.vars)?spell.vars:[]).flatMap(v=>{
  if(!v||typeof v.link!=='string'||!Array.isArray(v.coeff))return [];
  const stat=aliases[v.link.toLowerCase()],value=v.coeff?.[Math.min(Math.max(0,rank-1),(v.coeff?.length??0)-1)];
  return stat&&Number.isFinite(value)?[{key:v.key,stat,value}]:[];
 });
 return {coefficients,cooldown:Math.max(1,Number.isFinite(spell.cooldown?.[rank-1])?spell.cooldown[rank-1]:8),cost:Math.max(0,Number.isFinite(spell.cost?.[rank-1])?spell.cost[rank-1]:0),isExactFormula:false as const};
}
export function classModel(champion:Champion){
 if(champion.tags[0]==='Mage')return 'mage';
 if(champion.tags[0]==='Marksman')return 'marksman';
 if(champion.tags[0]==='Tank')return 'tank';
 if(champion.tags[0]==='Assassin')return 'assassin';
 if(champion.tags.includes('Support'))return 'support';
 return 'fighter';
}
/** Unit-scaled stat proxy, not invented spell coefficients: all ratios are relative to the champion's base stats. */
export function classAbilityPower(champion:Champion,actor:Stats,base:Stats,rank:number,maxrank:number){
 const type=classModel(champion),magic=type==='mage'||type==='support';
 const power=magic?base.ad+Math.max(0,actor.ap):actor.ad;
 const health=type==='tank'?Math.max(0,actor.hp-base.hp)/Math.max(1,base.hp)*base.ad:0;
 return {raw:(power+health)*rank/Math.max(1,maxrank),type:magic?'magic' as const:'physical' as const,isExactFormula:false as const,model:type};
}
