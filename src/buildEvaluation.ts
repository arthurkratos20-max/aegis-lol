import type {Dataset,Scenario} from './contracts.ts';
import {statsFor,mitigate,effectiveResistance} from './model.ts';
import {enemyAxis} from './recommendation.ts';
import {nativeDamage} from './native.ts';
import {exclusiveGroupsValid} from './itemGroups.ts';
import {getChampionScaling} from './championScaling.ts';
import {kitFor} from './compatibility.ts';
export {exclusiveGroupsValid} from './itemGroups.ts';
export function normalizeMetric(value:number,min:number,max:number):number{return max>min?Math.max(0,Math.min(1,(value-min)/(max-min))):0;}
export interface BuildMetrics {rawDPSByType?:Record<'physical'|'magic'|'true',number>;dps:number;ehp:number;utility:number;ttk:number;omitted:number;magicPotential?:number;magicPotentialBasis?:'spells'|'attacks'}
/** A comparison index, not spell damage: AP contribution × cooldown throughput × target mitigation. */
export function magicalPotential(ap:number,haste:number,resistance:number):number {
 return Math.max(0,ap)*(1+Math.max(0,haste)/100)*mitigate(1,resistance);
}
export function offensiveMetric(metrics:BuildMetrics):number{return metrics.magicPotential??metrics.dps;}
/** Uncapped offensive throughput vs fixed target resistances. No invented combo or proc frequency. */
export function evaluateBuild(items:string[],s:Scenario,data:Dataset):BuildMetrics {
 const f={...s.player,items},x=statsFor(f,data),base=statsFor({...f,items:[]},data),e=s.matchupUnknown?{...statsFor(s.enemy,data),hp:2500,armor:100,mr:100,armorPen:0,armorPenPercent:0,magicPen:0,magicPenPercent:0}:statsFor(s.enemy,data),T=Math.max(.1,s.duration);
 const resistance=(type:string)=>type==='physical'?effectiveResistance(e.armor,x.armorPenPercent,x.armorPen):effectiveResistance(e.mr,x.magicPenPercent,x.magicPen);
 const rawDPSByType={physical:0,magic:0,true:0};
 let damage=0,omitted=0,resource=x.mana*f.initialResource,lockedUntil=0;const cooldown=new Map<string,number>();
 const rawAA=x.ad*(1+Math.min(1,Math.max(0,x.crit))*(x.critMultiplier-1));
 const aa=x.ad*(1+Math.min(1,Math.max(0,x.crit))*(x.critMultiplier-1))*mitigate(1,resistance('physical'));
 const rate=Math.min(2.5,Math.max(.01,x.as))*Math.max(0,Math.min(1,f.uptime));
 const events=f.actions.map(a=>({at:a.at,a}));
 if(f.automaticAttacks&&rate>0&&s.distance<=x.range)for(let at=0;at<T;at+=1/rate)events.push({at,a:null as unknown as typeof f.actions[number]});
 events.sort((a,b)=>a.at-b.at);
 for(const ev of events){if(ev.at<0||ev.at>=T||ev.at<lockedUntil)continue;const a=ev.a;if(!a){damage+=aa;rawDPSByType.physical+=rawAA;continue;}if(!['attack','spell'].includes(a.kind))continue;if(a.kind==='attack'){damage+=aa*a.hit;rawDPSByType.physical+=rawAA*a.hit;continue;}if(ev.at<(cooldown.get(a.key)??0)||a.cost>resource)continue;
  let raw=0;try{if(a.native)raw=nativeDamage(a,f,data,x,e);else{const z=a.formula;raw=z.base+z.ad*x.ad+z.bonusAD*(x.ad-base.ad)+z.ap*x.ap+z.ownMaxHP*x.hp+z.targetMaxHP*e.hp+z.targetCurrentHP*e.hp;if(z.targetMissingHP)omitted++;}}catch{omitted++;continue;}
  resource-=a.cost;cooldown.set(a.key,ev.at+a.cooldown/(1+x.haste/100));lockedUntil=ev.at+a.cast;rawDPSByType[a.type]+=Math.max(0,raw)*Math.max(0,Math.min(1,a.hit));damage+=Math.max(0,raw)*Math.max(0,Math.min(1,a.hit))*(a.type==='true'?1:mitigate(1,resistance(a.type)));
 }
 if(!f.actions.length){damage=f.automaticAttacks&&s.distance<=x.range?aa*rate*T:0;rawDPSByType.physical=f.automaticAttacks&&s.distance<=x.range?rawAA*rate*T:0;}
 for(const type of ['physical','magic','true'] as const)rawDPSByType[type]/=T;
 const axis=enemyAxis(s,data),incoming=s.matchupUnknown?{armorPenPercent:0,armorPen:0,magicPenPercent:0,magicPen:0}:statsFor(s.enemy,data),phys=mitigate(1,effectiveResistance(x.armor,incoming.armorPenPercent,incoming.armorPen)),magic=mitigate(1,effectiveResistance(x.mr,incoming.magicPenPercent,incoming.magicPen));
 const ehp=x.hp/(axis==='physical'?phys:axis==='magic'?magic:.5*phys+.5*magic),dps=damage/T;
 const champion=data.champions[f.champion];
 // Empty spell data must not make all AP items tie with zero offensive value.
 // Keep measured AA DPS/TTK intact and expose this fallback separately.
 const estimateMagic=!f.actions.length&&champion.tags.includes('Mage')&&(!champion.tags.includes('Marksman')||champion.tags[0]==='Mage')&&getChampionScaling(champion,data).hasAPScaling;
 const attackMagic=estimateMagic&&kitFor(f,data).autoAttack;
 const magicPotentialBasis=attackMagic?'attacks' as const:'spells' as const;
 const baseAttackRate=attackMagic?statsFor({...f,items:[],overrides:{}},data).as:1;
 const magicPotential=attackMagic?Math.max(0,x.ap)*Math.min(2.5,Math.max(.01,x.as))/Math.min(2.5,Math.max(.01,baseAttackRate))*mitigate(1,resistance('magic')):magicalPotential(x.ap,x.haste,resistance('magic'));
 return {rawDPSByType,dps,ehp,utility:x.move+x.haste,ttk:dps>0?e.hp/dps:Infinity,omitted,...(estimateMagic?{magicPotential,magicPotentialBasis}:{})};
}
export function calculateOptimalBuild(candidates:string[][],s:Scenario,data:Dataset,previous?:string[]):{items:string[];metrics:BuildMetrics;score:number;count:number} {
 const rows=candidates.filter(items=>exclusiveGroupsValid(items,data)).map(items=>({items,metrics:evaluateBuild(items,s,data)}));if(!rows.length)throw Error('Travas ou grupos exclusivos impedem uma build válida de seis itens.');
 const bounds=(key:'dps'|'ehp'|'utility')=>{let min=Infinity,max=-Infinity;for(const row of rows){min=Math.min(min,row.metrics[key]);max=Math.max(max,row.metrics[key]);}return {min,max};};
 const d=rows.reduce((b,row)=>({min:Math.min(b.min,offensiveMetric(row.metrics)),max:Math.max(b.max,offensiveMetric(row.metrics))}),{min:Infinity,max:-Infinity}),h=bounds('ehp');let best=rows[0],score=-Infinity;
 for(const row of rows){const value=(s.weights.offense*normalizeMetric(offensiveMetric(row.metrics),d.min,d.max)+s.weights.defense*normalizeMetric(row.metrics.ehp,h.min,h.max))/Math.max(1,s.weights.offense+s.weights.defense);const same=previous&&row.items.length===previous.length&&row.items.every(id=>previous.includes(id));if(value>score+1e-9||Math.abs(value-score)<=1e-9&&same){best=row;score=value;}}
 return {...best,score,count:rows.length};
}
