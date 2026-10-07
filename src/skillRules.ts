import type {Dataset,SkillKey} from './contracts.ts';
/** Point allocation rules, independent of recommendation and damage formulas. */
export function skillValid(sequence:SkillKey[],data:Dataset,champion:string):boolean{
 const c=data.champions[champion];if(!c||sequence.length>18||champion==='Aphelios')return false;
 const transform=['Jayce','Elise','Nidalee','Karma'].includes(champion),udyr=champion==='Udyr';
 const count={Q:0,W:0,E:0,R:0};
 for(let n=0;n<sequence.length;n++){
  const key=sequence[n];if(!(key in count))return false;const level=n+1;count[key]++;
  const max=transform&&key==='R'?3:c.spells[['Q','W','E','R'].indexOf(key)]?.maxrank??(key==='R'?3:5);
  if(count[key]>max)return false;
  if(transform&&champion==='Jayce'&&key==='R')return false; // Transform ranks are granted automatically.
  if(key==='R'&&!udyr){if(level<[6,11,16][count.R-1])return false;}
  else if(count[key]>Math.ceil(level/2)||(udyr&&count[key]===6&&level<16))return false;
 }
 return true;
}
export function buildSkillPath(data:Dataset,champion:string,priority:SkillKey[],opening:SkillKey[],points:Record<number,SkillKey>={}):SkillKey[]{
 if(champion==='Aphelios')return [];
 const sequence:SkillKey[]=[],udyr=champion==='Udyr',jayce=champion==='Jayce';
 for(let level=1;level<=18;level++){
  const candidates:SkillKey[]=[...(points[level]?[points[level]]:[]),...(level<=opening.length?[opening[level-1]]:[]),...(!udyr&&!jayce&&[6,11,16].includes(level)?['R' as SkillKey]:[]),...priority];
  const key=candidates.find(key=>skillValid([...sequence,key],data,champion));
  if(!key)return [];
  sequence.push(key);
 }
 return sequence;
}
export function conservative(data:Dataset,champion:string,order:SkillKey[]=['Q','E','W']):SkillKey[]{
 return buildSkillPath(data,champion,champion==='Udyr'?['R','W','E','Q']:order,champion==='Udyr'?['Q','R','W','E']:order);
}
