import {simulate} from './engine.ts';
import {exactValue} from './exactKits.ts';
import {attributePreferences,preferenceScore} from './advancedPreferences.ts';
import {championForCounter} from './counterAdapters.ts';
import {teamContext} from './teamContext.ts';
import {classAbilityPower,normalizeSpell,hasDocumentedNonDamageImpact} from './abilityModel.ts';
import {preferenceWeights} from './preferenceWeights.ts';
import type {Dataset,Scenario} from './contracts.ts';
import {fighter,statsFor,mitigate,effectiveResistance} from './model.ts';
import {enemyAxis} from './recommendation.ts';
import {nativeDamage,nativeOptions,nativeAction} from './native.ts';
import {exclusiveGroupsValid} from './itemGroups.ts';
import {getChampionScaling} from './championScaling.ts';
import {kitFor} from './compatibility.ts';
import {kitImpactPotential} from './championKit.ts';
export {exclusiveGroupsValid} from './itemGroups.ts';
export function normalizeMetric(value:number,min:number,max:number):number{return max>min?Math.max(0,Math.min(1,(value-min)/(max-min))):0;}
export interface BuildMetrics {attributes?:Record<string,number>;exactDPS?:number|null;offenseBasis?:'attribute-index'|'configured-actions';rawDPSByType?:Record<'physical'|'magic'|'true',number>;isExactFormula?:boolean;estimatedRotationDPS?:number;offenseValue?:number;dps:number;ehp:number;utility:number;ttk:number;omitted:number;magicPotential?:number;magicPotentialBasis?:'spells'|'attacks';kitPotential?:number;kitCovered?:string[]}
/** A comparison index, not spell damage: AP contribution × cooldown throughput × target mitigation. */
export function magicalPotential(ap:number,haste:number,resistance:number):number {
 return Math.max(0,ap)*(1+Math.max(0,haste)/100)*mitigate(1,resistance);
}
export function offensiveMetric(metrics:BuildMetrics):number{return metrics.offenseValue??metrics.kitPotential??metrics.magicPotential??metrics.dps;}
/** Manual actions or explicitly estimated class throughput against fixed target resistances. */
function evaluateSingleBuild(items:string[],s:Scenario,data:Dataset):BuildMetrics {
 const f={...s.player,items},x=statsFor(f,data),base=statsFor({...f,items:[],overrides:{}},data),e=s.matchupUnknown?{...statsFor(s.enemy,data),hp:2500,armor:100,mr:100,armorPen:0,armorPenPercent:0,magicPen:0,magicPenPercent:0}:statsFor(s.enemy,data),T=Math.max(.1,s.duration);
 const resistance=(type:string)=>type==='physical'?effectiveResistance(e.armor,x.armorPenPercent,x.armorPen):effectiveResistance(e.mr,x.magicPenPercent,x.magicPen);
 const rawDPSByType={physical:0,magic:0,true:0};
 let modeledDeath:number|null=null,shieldBudget=0,defenseReduction=0;
 let attackDamage=0,damage=0,burstDamage=0,singleDamage=0,omitted=0,resource=x.mana*f.initialResource,lockedUntil=0;const cooldown=new Map<string,number>();
 const rawAA=x.ad*(1+Math.min(1,Math.max(0,x.crit))*(x.critMultiplier-1));
 const aa=x.ad*(1+Math.min(1,Math.max(0,x.crit))*(x.critMultiplier-1))*mitigate(1,resistance('physical'));
 const rate=Math.min(2.5,Math.max(.01,x.as))*Math.max(0,Math.min(1,f.uptime));
 const events=f.actions.map(a=>({at:a.at,a}));
 if(f.automaticAttacks&&rate>0&&s.distance<=x.range)for(let at=0;at<T;at+=1/rate)events.push({at,a:null as unknown as typeof f.actions[number]});
 events.sort((a,b)=>a.at-b.at);
 for(const ev of events){if(ev.at<0||ev.at>=T||ev.at<lockedUntil)continue;const a=ev.a;if(!a){damage+=aa;attackDamage+=aa;singleDamage=Math.max(singleDamage,aa);if(ev.at<Math.min(T,3))burstDamage+=aa;rawDPSByType.physical+=rawAA;continue;}if(!['attack','spell'].includes(a.kind))continue;if(a.kind==='attack'){damage+=aa*a.hit;attackDamage+=aa*a.hit;singleDamage=Math.max(singleDamage,aa*a.hit);if(ev.at<Math.min(T,3))burstDamage+=aa*a.hit;rawDPSByType.physical+=rawAA*a.hit;continue;}if(ev.at<(cooldown.get(a.key)??0)||a.cost>resource)continue;
  let raw=0;try{if(a.native)raw=nativeDamage(a,f,data,x,e);else{const z=a.formula;raw=z.base+z.ad*x.ad+z.bonusAD*(x.ad-base.ad)+z.ap*x.ap+z.ownMaxHP*x.hp+z.targetMaxHP*e.hp+z.targetCurrentHP*e.hp;if(z.targetMissingHP)omitted++;}}catch{omitted++;continue;}
  resource-=a.cost;cooldown.set(a.key,ev.at+a.cooldown/(1+(x.haste+(a.key==='R'?(x.ultimateHaste??0):['Q','W','E'].includes(a.key)?(x.basicHaste??0):0))/100));lockedUntil=ev.at+a.cast;rawDPSByType[a.type]+=Math.max(0,raw)*Math.max(0,Math.min(1,a.hit));const delivered=Math.max(0,raw)*Math.max(0,Math.min(1,a.hit))*(a.type==='true'?1:mitigate(1,resistance(a.type)));damage+=delivered;singleDamage=Math.max(singleDamage,delivered);if(ev.at<Math.min(T,3))burstDamage+=delivered;
 }
 if(!f.actions.length){damage=f.automaticAttacks&&s.distance<=x.range?aa*rate*T:0;rawDPSByType.physical=f.automaticAttacks&&s.distance<=x.range?rawAA*rate*T:0;attackDamage=damage;}
 if(f.actions.some(a=>a.kitEffect)){
  const duel=simulate({...s,mode:'exploratory',player:f,enemy:s.matchupUnknown?{...s.enemy,initialHP:1,overrides:{hp:2500,armor:100,mr:100},actions:[],automaticAttacks:false}:s.enemy},data);
  const hits=duel.events.filter(ev=>ev.actor==='player'&&ev.damage>0);
  modeledDeath=duel.enemy.death;shieldBudget=duel.events.filter(ev=>ev.actor==='player'&&ev.kind==='shield').reduce((n,ev)=>n+ev.raw,0);
  for(const a of f.actions.filter(a=>a.kitEffect==='garen-w'))if(duel.events.some(ev=>ev.actor==='player'&&ev.actionId===a.id&&ev.kind==='shield'&&ev.raw>0)){
   const rank=f.skills.slice(0,f.level).filter(k=>k==='W').length;defenseReduction+=exactValue('Garen','GarenW','DRPercent',rank)*Math.max(0,Math.min(T,a.at+4)-a.at)/T;
  }
  defenseReduction=Math.min(.99,defenseReduction);
  damage=duel.player.damage;attackDamage=hits.filter(ev=>ev.kind==='attack'||f.actions.some(a=>a.name===ev.source&&a.onHit)).reduce((n,ev)=>n+ev.damage,0);
  burstDamage=hits.filter(ev=>ev.at<Math.min(T,3)).reduce((n,ev)=>n+ev.damage,0);
  const perAction=new Map<string,number>();for(const ev of hits){const id=ev.actionId??`${ev.at}:${ev.source}`;perAction.set(id,(perAction.get(id)??0)+ev.damage);}singleDamage=Math.max(0,...perAction.values());
  for(const type of ['physical','magic','true'] as const)rawDPSByType[type]=duel.events.filter(ev=>ev.actor==='player'&&ev.type===type).reduce((n,ev)=>n+ev.raw,0);
 }
 for(const type of ['physical','magic','true'] as const)rawDPSByType[type]/=T;
 const axis=enemyAxis(s,data),incoming=s.matchupUnknown?{armorPenPercent:0,armorPen:0,magicPenPercent:0,magicPen:0}:statsFor(s.enemy,data),phys=mitigate(1,effectiveResistance(x.armor,incoming.armorPenPercent,incoming.armorPen)),magic=mitigate(1,effectiveResistance(x.mr,incoming.magicPenPercent,incoming.magicPen));
 const recovery=s.defensiveObjective==='sustain'?Math.max(0,x.hpRegen)*T/5+attackDamage*Math.max(0,x.lifesteal):s.defensiveObjective==='survive'?Math.max(0,x.hpRegen)*T/5:0;
 const ehp=(x.hp+recovery+shieldBudget)/(1-defenseReduction)/(axis==='physical'?phys:axis==='magic'?magic:.5*phys+.5*magic);
 let dps=damage/T;
 const champion=data.champions[f.champion];
 // Empty spell data must not make all AP items tie with zero offensive value.
 // Legacy comparison index remains available as metadata; rotation DPS is flagged below.
 const estimateMagic=!f.actions.length&&champion.tags.includes('Mage')&&(!champion.tags.includes('Marksman')||champion.tags[0]==='Mage')&&getChampionScaling(champion,data).hasAPScaling;
 const attackMagic=estimateMagic&&kitFor(f,data).autoAttack;
 const magicPotentialBasis=attackMagic?'attacks' as const:'spells' as const;
 const baseAttackRate=attackMagic?statsFor({...f,items:[],overrides:{}},data).as:1;
 const magicPotential=attackMagic?Math.max(0,x.ap)*Math.min(2.5,Math.max(.01,x.as))/Math.min(2.5,Math.max(.01,baseAttackRate))*mitigate(1,resistance('magic')):magicalPotential(x.ap,x.haste,resistance('magic'));
 const kit=kitImpactPotential(f,data,x,e,s.distance);
 const kitPotential=kit&&kit.damage>0?kit.damage+(f.automaticAttacks&&s.distance<=x.range?aa:0):undefined;
 // Explicit class approximation, not champion coefficients or combat events.
 // Three learned basic abilities form a rotation; their catalog CDs/costs determine throughput.
 let rotationDPS=0,peak=f.automaticAttacks&&s.distance<=x.range?aa:0,burst=0;
 if(!f.actions.length){
 
  let costRate=0;
  for(const [i,key] of (['Q','W','E'] as const).entries()){
   const rank=f.skills.slice(0,f.level).filter(k=>k===key).length;if(!rank)continue;
   const options=(nativeOptions[f.champion]??[]).filter(o=>o.key===key);
   if(options.length&&options.every(o=>o.kind==='shield'||o.automatic===false))continue;
   if(f.champion==='Shen'&&key==='Q'&&(!f.automaticAttacks||s.distance>x.range))continue;
   const spell=champion.spells[i];
   if(hasDocumentedNonDamageImpact(spell))continue;
   const normalized=normalizeSpell(spell,rank),cd=normalized.cooldown/(1+Math.max(0,x.haste)/100);
   const power=classAbilityPower(champion,x,base,rank,spell.maxrank,{...getChampionScaling(champion,data),damageType:championForCounter(f.champion,data,f).damageType});
   const coefficients=normalized.coefficients;
   if(coefficients.length)power.raw=base.ad*rank/Math.max(1,spell.maxrank)+coefficients.reduce((sum,c)=>sum+c.value*(c.stat==='bonusAD'?x.ad-base.ad:x[c.stat]),0);
   const nativeIndex=(nativeOptions[f.champion]??[]).findIndex(o=>o.key===key&&o.automatic!==false&&!o.kind);
   if(nativeIndex>=0&&data.mechanics?.[f.champion])try{
    const action=nativeAction(f,data,nativeIndex);power.raw=nativeDamage(action,f,data,x,e);power.type=action.type==='magic'?'magic':'physical';
   }catch{omitted++;}
   const hit=power.raw*mitigate(1,resistance(power.type));
   rotationDPS+=hit/cd;costRate+=Math.max(0,normalized.cost)/cd;peak=Math.max(peak,hit);burst+=hit*Math.ceil(Math.min(T,3)/cd);
   rawDPSByType[power.type]+=power.raw/cd;

  }
  const mana=kitFor(f,data).mana;
  const availability=mana&&costRate>0?Math.min(1,(x.mana*f.initialResource+Math.max(0,x.manaRegen)*T/5)/(costRate*T)):1;
  rotationDPS*=availability*Math.max(0,Math.min(1,f.uptime));burst*=availability*Math.max(0,Math.min(1,f.uptime));peak=Math.max(f.automaticAttacks&&s.distance<=x.range?aa:0,peak*availability*Math.max(0,Math.min(1,f.uptime)));
  // Scale only the rotation portion; AA remains independently modeled.
  const aaRaw=f.automaticAttacks&&s.distance<=x.range?rawAA*rate:0;
  rawDPSByType.physical=aaRaw+(rawDPSByType.physical-aaRaw)*availability*Math.max(0,Math.min(1,f.uptime));
  rawDPSByType.magic*=availability*Math.max(0,Math.min(1,f.uptime));
  dps+=rotationDPS;
 }
 const k=kitFor(f,data),utility=Math.max(0,x.haste)/100*(1+(k.hardCC?.25:0)+(k.healShield?.5:0))+Math.max(0,x.move-base.move)/100+(k.mana?Math.max(0,x.mana-base.mana)/Math.max(1,base.mana)+Math.max(0,x.manaRegen-base.manaRegen)/Math.max(1,base.manaRegen):0);
 const offenseValue=s.objective==='single'?(f.actions.length?singleDamage:peak):s.objective==='burst'?(f.actions.length?burstDamage:damage/T*Math.min(T,3)+burst):dps;
 const impactIndex=classAbilityPower(champion,x,base,1,1,{...getChampionScaling(champion,data),damageType:championForCounter(f.champion,data,f).damageType}).raw;
 const attackIndex=getChampionScaling(champion,data).hasAttackSpeedScaling?rawAA*rate:0;
 const attributeIndex=s.objective==='single'?Math.max(impactIndex,f.automaticAttacks&&s.distance<=x.range?rawAA:0):s.objective==='burst'?impactIndex*(1+Math.max(0,x.haste)/100*Math.min(T,3)/T)+attackIndex*Math.min(T,3):impactIndex*(1+Math.max(0,x.haste)/100)+attackIndex;
 const attributes={AD:x.ad,AP:x.ap,HP:x.hp,Armadura:x.armor,RM:x.mr,AS:x.as,Haste:x.haste,Movimento:x.move};
 return {attributes,exactDPS:null,offenseBasis:f.actions.length?'configured-actions':'attribute-index',isExactFormula:false,rawDPSByType,dps,ehp,utility,offenseValue:f.actions.length?offenseValue:attributeIndex,ttk:modeledDeath??(dps>0?e.hp/dps:Infinity),omitted:omitted+(kit?.omitted??0),...(!f.actions.length?{estimatedRotationDPS:rotationDPS}:{}),...(kitPotential!==undefined?{kitPotential,kitCovered:kit!.covered}:estimateMagic?{magicPotential,magicPotentialBasis}:{})};
}
/** Weighted target comparison, not simultaneous 5v5 combat. Harmonic EHP mixes damage taken. */
export function evaluateBuild(items:string[],s:Scenario,data:Dataset):BuildMetrics {
 const base=evaluateSingleBuild(items,s,data),context=teamContext(s,data);
 if(!context.weight)return base;
 const rows=context.ids.map(id=>evaluateSingleBuild(items,{...s,teamPriority:0,matchupUnknown:false,enemy:id===s.enemy.champion?s.enemy:{...fighter(data,id),level:s.enemy.level}},data));
 const weighted=[{m:base,w:1-context.weight},...rows.map(m=>({m,w:context.weight/rows.length}))].filter(x=>x.w>0);
 if(weighted.length===1)return weighted[0].m;
 const average=(key:'dps'|'ttk'|'offenseValue'|'magicPotential'|'kitPotential'|'estimatedRotationDPS')=>weighted.reduce((n,x)=>n+x.w*(x.m[key]??0),0);
 return {...base,dps:average('dps'),offenseValue:average('offenseValue'),ttk:average('ttk'),ehp:1/weighted.reduce((n,x)=>n+x.w/Math.max(1e-9,x.m.ehp),0),omitted:Math.max(...weighted.map(x=>x.m.omitted)),rawDPSByType:{physical:weighted.reduce((n,x)=>n+x.w*(x.m.rawDPSByType?.physical??0),0),magic:weighted.reduce((n,x)=>n+x.w*(x.m.rawDPSByType?.magic??0),0),true:weighted.reduce((n,x)=>n+x.w*(x.m.rawDPSByType?.true??0),0)},...(base.magicPotential!==undefined?{magicPotential:average('magicPotential')}:{}),...(base.kitPotential!==undefined?{kitPotential:average('kitPotential')}:{}),...(base.estimatedRotationDPS!==undefined?{estimatedRotationDPS:average('estimatedRotationDPS')}:{})};
}
export function calculateOptimalBuild(candidates:string[][],s:Scenario,data:Dataset,previous?:string[]):{items:string[];metrics:BuildMetrics;score:number;count:number} {
 const rows=candidates.filter(items=>exclusiveGroupsValid(items,data)).map(items=>({items,metrics:evaluateBuild(items,s,data)}));if(!rows.length)throw Error('Travas ou grupos exclusivos impedem uma build válida de seis itens.');
 const bounds=(key:'dps'|'ehp'|'utility')=>{let min=Infinity,max=-Infinity;for(const row of rows){min=Math.min(min,row.metrics[key]);max=Math.max(max,row.metrics[key]);}return {min,max};};
 const d=rows.reduce((b,row)=>({min:Math.min(b.min,offensiveMetric(row.metrics)),max:Math.max(b.max,offensiveMetric(row.metrics))}),{min:Infinity,max:-Infinity}),h=bounds('ehp'),u=bounds('utility'),w=preferenceWeights(s.weights);let best=rows[0],score=-Infinity;
 const preferences=attributePreferences(rows.map(row=>row.metrics),s.subweights);
 for(const [index,row] of rows.entries()){const baseScore=w.weightDamage*normalizeMetric(offensiveMetric(row.metrics),d.min,d.max)+w.weightDefense*normalizeMetric(row.metrics.ehp,h.min,h.max)+w.weightUtility*normalizeMetric(row.metrics.utility,u.min,u.max);const value=preferenceScore(baseScore,preferences.scores[index],preferences.active);const same=previous&&row.items.length===previous.length&&row.items.every(id=>previous.includes(id));if(value>score+1e-9||Math.abs(value-score)<=1e-9&&same){best=row;score=value;}}
 return {...best,score,count:rows.length};
}
