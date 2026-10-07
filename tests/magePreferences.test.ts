import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {Dataset} from '../src/contracts.ts';
import {EMPTY_FORMULA} from '../src/contracts.ts';
import {initialScenario,fighter} from '../src/model.ts';
import {evaluateBuild,magicalPotential,offensiveMetric,calculateOptimalBuild} from '../src/buildEvaluation.ts';
import {greedyContinuousBuild,scoreItems} from '../src/continuousBuild.ts';
import {fullBuild} from '../src/fullBuild.ts';
const data:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));
test('magic comparison index has independently calculable AP, haste and resistance responses',()=>{
 assert.equal(magicalPotential(100,20,100),60);
 assert.equal(magicalPotential(200,20,100),120);
 assert.equal(magicalPotential(100,100,100),100);
 assert.equal(magicalPotential(100,20,0),120);
 assert.ok(Math.abs(magicalPotential(100,20,-50)-160)<1e-12);
 assert.equal(magicalPotential(0,100,0),0);
});
test('empty mage actions disclose estimated rotation DPS and respond to AP',()=>{
 for(const champion of ['Lux','Ahri','Syndra','Cassiopeia','Annie','Veigar','Karthus','Ryze']){
  const s={...initialScenario(data),matchupUnknown:true,player:fighter(data,champion)};
  const empty=evaluateBuild([],s,data),ap=evaluateBuild(['3089'],s,data);
  assert.ok(ap.dps>empty.dps,champion);assert.ok(ap.ttk<empty.ttk,champion);assert.equal(ap.isExactFormula,false);
  assert.ok(ap.rawDPSByType!.magic>0);
  assert.ok(offensiveMetric(ap)>offensiveMetric(empty),champion);
 }
});
test('configured actions and marksmen retain modeled DPS as the offensive criterion',()=>{
 const s={...initialScenario(data),matchupUnknown:true,player:fighter(data,'Lux')};
 s.player.actions=[{id:'q',at:0,kind:'spell',key:'Q',name:'AP test',type:'magic',formula:{...EMPTY_FORMULA,base:100,ap:1},cooldown:4,cost:0,cast:0,duration:0,hit:1,onHit:false,custom:true,coverage:'testing'}];
 const base=evaluateBuild([],s,data),ap=evaluateBuild(['3089'],s,data);
 assert.equal(ap.magicPotential,undefined);assert.ok(ap.dps>base.dps);assert.equal(offensiveMetric(ap),ap.dps);
 s.player=fighter(data,'Jinx');const adc=evaluateBuild(['3031'],s,data);assert.equal(adc.magicPotential,undefined);assert.equal(offensiveMetric(adc),adc.dps);
});
test('weighted item score uses the magic index and crosses before 100 percent',()=>{
 const rows=[{id:'ap',metrics:{dps:20,magicPotential:200,ehp:100,utility:0,ttk:1,omitted:0}},{id:'tank',metrics:{dps:20,magicPotential:100,ehp:200,utility:0,ttk:1,omitted:0}}];
 for(let value=0;value<=100;value++){
  const ranked=scoreItems(rows,value),ap=ranked.find(row=>row.id==='ap')!;
  assert.ok(Math.abs(ap.score-value/100)<1e-12);
 }
 assert.equal(scoreItems(rows,49)[0].id,'tank');assert.equal(scoreItems(rows,51)[0].id,'ap');
});
test('AP attack mage index responds to AS rather than inventing haste-driven auto attacks',()=>{
 const s={...initialScenario(data),matchupUnknown:true,player:fighter(data,'Azir')};
 const base=evaluateBuild(['3089'],s,data);
 s.player.overrides={as:1};const slow=evaluateBuild(['3089'],s,data);
 s.player.overrides={as:2};const fast=evaluateBuild(['3089'],s,data);
 assert.equal(base.magicPotentialBasis,'attacks');assert.ok(Math.abs(fast.magicPotential!-2*slow.magicPotential!)<1e-9);
 s.player.overrides={as:2,haste:100};assert.equal(evaluateBuild(['3089'],s,data).magicPotential,fast.magicPotential);
 s.player.overrides={as:99};const capped=evaluateBuild(['3089'],s,data);
 s.player.overrides={as:2.5};assert.equal(evaluateBuild(['3089'],s,data).magicPotential,capped.magicPotential);
});
test('mage builds rescore automatic boots/core inside the slider and preserve owned items',()=>{
 for(const champion of ['Lux','Ahri','Syndra','Cassiopeia','Annie','Veigar','Karthus','Ryze']){
  const s={...initialScenario(data),matchupUnknown:true,player:fighter(data,champion)};
  s.weights={offense:20,defense:80,utility:0};const low=greedyContinuousBuild(s,data);
  s.weights={offense:80,defense:20,utility:0};const high=greedyContinuousBuild(s,data);
  assert.notDeepEqual([...low.target].sort(),[...high.target].sort(),champion);
  assert.ok(high.core);assert.ok(champion==='Cassiopeia'?high.boot===null:high.boot);assert.equal(high.target.length,6);
  assert.ok(offensiveMetric(high.metrics)>offensiveMetric(low.metrics),champion);
  s.player.owned=['3157'];s.player.locked=['3157'];assert.ok(greedyContinuousBuild(s,data).target.includes('3157'));
 }
});
test('fallback is disclosed and complete-candidate ranking uses the same criterion',()=>{
 const s={...initialScenario(data),matchupUnknown:true,player:fighter(data,'Lux'),weights:{offense:100,defense:0,utility:0}};
 assert.deepEqual(calculateOptimalBuild([['3089'],['3083']],s,data).items,['3089']);
 assert.ok(fullBuild(s,data).warnings.some(w=>w.includes('Rotação de classe estimada')&&w.includes('isExactFormula=false')));
});
