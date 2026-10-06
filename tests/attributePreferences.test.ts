import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {Dataset} from '../src/contracts.ts';
import {fighter,initialScenario,normalizeWeights,statsFor} from '../src/model.ts';
import {preferenceWeights} from '../src/preferenceWeights.ts';
import {scoreItems,greedyContinuousBuild} from '../src/continuousBuild.ts';
import {calculateOptimalBuild,evaluateBuild} from '../src/buildEvaluation.ts';
import {normalizeSpell,classAbilityPower} from '../src/abilityModel.ts';
const data:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));
test('all three normalized weights enter the same item and complete-build objective',()=>{
 const metrics=(dps:number,ehp:number,utility:number)=>({dps,ehp,utility,ttk:1,omitted:0});
 const rows=[{id:'damage',metrics:metrics(100,10,0)},{id:'defense',metrics:metrics(10,100,0)},{id:'utility',metrics:metrics(0,10,100)}];
 for(const weights of [{offense:100,defense:0,utility:0},{offense:0,defense:100,utility:0},{offense:0,defense:0,utility:100},{offense:60,defense:30,utility:10}]){
  const w=preferenceWeights(weights);assert.ok(Math.abs(w.weightDamage+w.weightDefense+w.weightUtility-1)<1e-12);
  const ranked=scoreItems(rows,weights);
  for(const r of ranked)assert.equal(r.score,w.weightDamage*r.normalizedOffense+w.weightDefense*r.normalizedEHP+w.weightUtility*r.normalizedUtility+r.counterBonus);
  if(weights.utility===100)assert.equal(ranked[0].id,'utility');
 }
 assert.equal(preferenceWeights({offense:0,defense:0,utility:100}).weightDefense,0);
});
test('utility uses AH, movement, mana/regeneration and kit capabilities; never defensive fallback',()=>{
 const s={...initialScenario(data),player:fighter(data,'Lux'),matchupUnknown:true,weights:{offense:0,defense:0,utility:100}};
 const baseline=evaluateBuild([],s,data),stat=statsFor(s.player,data);
 for(const overrides of [{haste:100},{move:stat.move+100},{mana:stat.mana+1000},{manaRegen:stat.manaRegen+20}]){
  s.player.overrides=overrides;assert.ok(evaluateBuild([],s,data).utility>baseline.utility);
 }
 s.player.overrides={};assert.deepEqual(calculateOptimalBuild([['3158'],['3083']],s,data).items,['3158']);
 const utility=greedyContinuousBuild(s,data);s.weights={offense:0,defense:100,utility:0};const defense=greedyContinuousBuild(s,data);
 assert.notDeepEqual(utility.target,defense.target);assert.ok(utility.metrics.utility>defense.metrics.utility);
});
test('rotation responds to catalog cooldown, AP, AH and available mana; manual actions supersede it',()=>{
 const s={...initialScenario(data),player:fighter(data,'Lux'),matchupUnknown:true};s.player.automaticAttacks=false;s.player.initialResource=1;
 const base=evaluateBuild([],s,data);assert.ok(base.estimatedRotationDPS!>0);assert.equal(base.isExactFormula,false);
 s.player.overrides={ap:100};const ap=evaluateBuild([],s,data);assert.ok(ap.dps>base.dps);
 s.player.overrides={ap:100,haste:100,mana:1e6};const fast=evaluateBuild([],s,data);s.player.overrides={ap:100,mana:1e6};const slow=evaluateBuild([],s,data);
 assert.ok(Math.abs(fast.dps-2*slow.dps)<1e-9);
 s.player.initialResource=0;s.player.overrides={manaRegen:0};assert.equal(evaluateBuild([],s,data).estimatedRotationDPS,0);
});
test('normalizer rejects unsupported/nonfinite coefficients and unit-scaled proxy is explicit',()=>{
 const c=data.champions.Lux,s=c.spells[0];
 const n=normalizeSpell({...s,vars:[{key:'a1',link:'spelldamage',coeff:[.7]},{key:'bad',link:'unknown',coeff:[5]},{key:'nan',link:'attackdamage',coeff:[NaN]}]},1);
 assert.deepEqual(n.coefficients,[{key:'a1',stat:'ap',value:.7}]);assert.equal(n.isExactFormula,false);
 const f=fighter(data,'Lux'),base=statsFor(f,data);assert.equal(classAbilityPower(c,{...base,ap:100},base,5,5).raw,base.ad+100);
});
test('preset then slider return preserves exact weights across all three axes',()=>{
 let current={offense:20,defense:20,utility:60};
 for(const value of [60,100,60,0,60]){current=normalizeWeights(current,'offense',value);assert.equal(current.offense,value);assert.ok(Math.abs(current.offense+current.defense+current.utility-100)<1e-9);}
});
test('damage objectives distinguish early burst, sustained DPS and largest delivered action',()=>{
 const s={...initialScenario(data),player:fighter(data,'Lux'),matchupUnknown:true,duration:10};s.player.automaticAttacks=false;
 const action=(id:string,at:number,base:number)=>({id,at,kind:'spell' as const,key:id,name:id,type:'magic' as const,formula:{base,ad:0,bonusAD:0,ap:0,ownMaxHP:0,targetMaxHP:0,targetCurrentHP:0,targetMissingHP:0},cooldown:0,cost:0,cast:0,duration:0,hit:1,onHit:false,custom:true,coverage:'testing' as const});
 s.player.actions=[action('Q',0,200),action('E',5,2000)];
 s.objective='dps';assert.equal(evaluateBuild([],s,data).offenseValue,110);
 s.objective='burst';assert.equal(evaluateBuild([],s,data).offenseValue,100);
 s.objective='single';assert.equal(evaluateBuild([],s,data).offenseValue,1000);
});
test('defensive objectives account for recovery only in the selected window or sustain model',()=>{
 const s={...initialScenario(data),player:fighter(data,'Lux'),matchupUnknown:true,duration:10};s.player.overrides={hpRegen:100};
 s.defensiveObjective='combo';const combo=evaluateBuild([],s,data);
 s.defensiveObjective='survive';const survive=evaluateBuild([],s,data);assert.ok(survive.ehp>combo.ehp);
 s.defensiveObjective='sustain';s.player.overrides.lifesteal=.5;const sustain=evaluateBuild([],s,data);assert.ok(sustain.ehp>survive.ehp);
});
