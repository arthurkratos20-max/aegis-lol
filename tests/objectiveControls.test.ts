import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {Dataset} from '../src/contracts.ts';
import {initialScenario,fighter} from '../src/model.ts';
import {evaluateBuild,offensiveMetric} from '../src/buildEvaluation.ts';
import {scoreItems} from '../src/continuousBuild.ts';
import {fullBuild} from '../src/fullBuild.ts';
import {attributePreferences} from '../src/advancedPreferences.ts';
const data:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));
test('automatic single-action objective does not reward haste or attack speed as throughput',()=>{
 const s=initialScenario(data);s.player=fighter(data,'Jinx');s.objective='single';
 const base=offensiveMetric(evaluateBuild([],s,data));
 s.player.overrides={as:2.5,haste:100};assert.equal(offensiveMetric(evaluateBuild([],s,data)),base);
 s.objective='dps';const fast=offensiveMetric(evaluateBuild([],s,data));s.player.overrides={};assert.ok(fast>offensiveMetric(evaluateBuild([],s,data)));
});
test('all damage objectives reach automatic evaluation and preserve estimated coverage',()=>{
 for(const id of ['Jinx','Lux','Kaisa','Shen','Renekton']){
  const s=initialScenario(data);s.player=fighter(data,id);const values=[];
  for(const objective of ['burst','dps','single'] as const){s.objective=objective;const m=evaluateBuild(['3158'],s,data);assert.ok(Number.isFinite(offensiveMetric(m)));assert.equal(m.isExactFormula,false);values.push(offensiveMetric(m));}
  assert.ok(new Set(values).size>1,id);
 }
});
test('defensive controls alter modeled recovery while retaining base resistance protection',()=>{
 const s=initialScenario(data);s.player=fighter(data,'Jinx');s.player.overrides={lifesteal:.2,hpRegen:10};
 s.defensiveObjective='combo';const combo=evaluateBuild([],s,data).ehp;
 s.defensiveObjective='survive';const survive=evaluateBuild([],s,data).ehp;
 s.defensiveObjective='sustain';const sustain=evaluateBuild([],s,data).ehp;
 assert.ok(survive>combo);assert.ok(sustain>survive);
});
test('advanced priorities normalize different units and zero priorities preserve baseline scores',()=>{
 const base={dps:100,ehp:100,utility:1,ttk:1,omitted:0};
 const rows=[{id:'attack',metrics:{...base,attributes:{AD:100,HP:1000}}},{id:'health',metrics:{...base,attributes:{AD:10,HP:5000}}}];
 assert.equal(scoreItems(rows,50,{AD:100})[0].id,'attack');assert.equal(scoreItems(rows,50,{HP:100})[0].id,'health');
 assert.deepEqual(scoreItems(rows,50,{HP:0}),scoreItems(rows,50));
 const p=attributePreferences(rows.map(r=>r.metrics),{AD:50,HP:50});assert.deepEqual(p.scores,[.5,.5]);
 assert.equal(attributePreferences(rows.map(r=>r.metrics),{HP:NaN,AD:-1,unknown:100}).active,false);
});
test('advanced subweights change full recommended builds without mutating scenario or violating locks',()=>{
 const s=initialScenario(data);s.player=fighter(data,'Jinx');s.weights={offense:50,defense:50,utility:0};
 const baseline=fullBuild(s,data);s.subweights={HP:100};const before=JSON.stringify(s),advanced=fullBuild(s,data);
 assert.notDeepEqual(advanced.target,baseline.target);assert.equal(JSON.stringify(s),before);
 s.player.locked=[baseline.target[1]];assert.ok(fullBuild(s,data).target.includes(baseline.target[1]));
});
