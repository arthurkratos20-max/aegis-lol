import type {Scenario} from './contracts.ts';
export function preferenceWeights(input:number|Scenario['weights']){
 const w=typeof input==='number'?{offense:input,defense:100-input,utility:0}:input;
 const clean=(n:number)=>Number.isFinite(n)?Math.max(0,n):0;
 const d=clean(w.offense),h=clean(w.defense),u=clean(w.utility),total=d+h+u;
 return total?{weightDamage:d/total,weightDefense:h/total,weightUtility:u/total}:{weightDamage:1/3,weightDefense:1/3,weightUtility:1/3};
}
