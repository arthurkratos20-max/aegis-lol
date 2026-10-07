import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {Dataset} from '../src/contracts.ts';
import {initialScenario,fighter} from '../src/model.ts';
import {continuousWeights,scoreItems,greedyContinuousBuild} from '../src/continuousBuild.ts';
import {exclusiveGroupsValid} from '../src/buildEvaluation.ts';
const data:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));
const metric=(dps:number,ehp:number)=>({dps,ehp,utility:0,ttk:1,omitted:0});
test('scores interpolate at every percent and cross at the mathematical intersection',()=>{
 const rows=[{id:'damage',metrics:metric(200,100)},{id:'defense',metrics:metric(100,200)}];
 for(let value=0;value<=100;value++){
  const w=continuousWeights(value);assert.ok(Math.abs(w.weightDamage+w.weightDefense-1)<1e-12);
  const ranked=scoreItems(rows,value);const damage=ranked.find(r=>r.id==='damage')!;
  assert.ok(Math.abs(damage.score-value/100)<1e-12);
 }
 assert.equal(scoreItems(rows,49)[0].id,'defense');assert.equal(scoreItems(rows,51)[0].id,'damage');
});
test('counter bonus cannot override pure damage and both endpoints have zero contextual contribution',()=>{
 const rows=[{id:'pureDamage',metrics:metric(200,100)},{id:'counterDefense',metrics:metric(100,200),counter:999}];
 assert.equal(scoreItems(rows,100)[0].id,'pureDamage');assert.equal(scoreItems(rows,0)[0].id,'counterDefense');
 for(const value of [0,100])assert.ok(scoreItems(rows,value).every(r=>r.counterBonus===0));
 assert.ok(scoreItems(rows,50).every(r=>r.counterBonus<=.05));
});
test('101 live weights rescore automatic boots/core, preserve six legal slots and pure Jinx DPS',()=>{
 const s=initialScenario(data);s.enemy=fighter(data,'Malphite');const targets=new Set<string>();
 for(let value=0;value<=100;value++){
  s.weights={offense:value,defense:100-value,utility:0};const r=greedyContinuousBuild(s,data);
  assert.ok(r.decisions.some(d=>d.selected===r.boot));assert.ok(r.decisions.some(d=>d.selected===r.core));assert.equal(r.target.length,6);assert.equal(new Set(r.target).size,6);assert.ok(exclusiveGroupsValid(r.target));
  targets.add([...r.target].sort().join(','));
  if(value===100){assert.ok(!r.target.includes('3156'));assert.ok(!r.target.includes('3026'));assert.ok(r.scores.every(score=>score.counterBonus===0));assert.ok(r.target.slice(2).every(id=>data.items[id].stats.FlatPhysicalDamageMod>0||data.items[id].stats.FlatCritChanceMod>0||data.items[id].stats.PercentAttackSpeedMod>0));}
 }
 assert.ok(targets.size>1);
});
test('bought defensive items stay at pure damage; applying a counter never silently locks its items',()=>{
 const s=initialScenario(data);s.weights={offense:100,defense:0,utility:0};s.player.owned=['3026'];s.player.locked=['3026'];s.player.items=['3026'];
 const before=JSON.stringify(s),r=greedyContinuousBuild(s,data);assert.ok(r.target.includes('3026'));assert.equal(JSON.stringify(s),before);
 s.player.owned=[];s.player.locked=[];s.player.items=[];s.counterPreset={champion:'Jinx',items:['3156','3026'],boot:'3111',runes:s.player.runes,source:'Matchup'};
 const free=greedyContinuousBuild(s,data);assert.ok(!free.target.includes('3156'));assert.ok(!free.target.includes('3026'));
});
test('automatic defensive boots and core respond to physical/magic matchups; explicit boot locks win',()=>{
 const s=initialScenario(data);s.player=fighter(data,'Ashe');s.weights={offense:15,defense:85,utility:0};
 s.enemy=fighter(data,'Darius');const physical=greedyContinuousBuild(s,data);
 s.enemy=fighter(data,'Lux');const magic=greedyContinuousBuild(s,data);
 assert.equal(physical.boot,'3047');assert.equal(magic.boot,'3111');assert.notDeepEqual(physical.target,magic.target);
 s.player.boots='fixed';s.player.fixedBoot='3006';assert.equal(greedyContinuousBuild(s,data).boot,'3006');
 s.player.boots='auto';s.player.locked=['3047'];assert.equal(greedyContinuousBuild(s,data).boot,'3047');
});
test('automatic boot pool excludes conditional tier-three upgrades and score traces reconstruct every free decision',()=>{
 const s=initialScenario(data);s.matchupUnknown=true;s.player=fighter(data,'Lux');
 const r=greedyContinuousBuild(s,data);assert.ok(r.boot);assert.ok(data.items[r.boot!].from?.includes('1001'));assert.notEqual(r.boot,'3006');
 for(const decision of r.decisions){assert.equal(decision.selected,decision.candidates[0].id);for(const row of decision.candidates){const score=s.weights.offense/100*row.normalizedOffense+s.weights.defense/100*row.normalizedEHP+s.weights.utility/100*row.normalizedUtility+row.counterBonus;assert.ok(Math.abs(row.score-score)<1e-12);}}
});
test('explicit anti-heal/anti-shield modes preserve requested response when automatic core changes',()=>{
 for(const id of ['Ashe','Lux','Shen']){const s=initialScenario(data);s.player=fighter(data,id);s.weights={offense:100,defense:0,utility:0};const r=greedyContinuousBuild(s,data,'antiheal');assert.ok(r.target.some(id=>['3033','3165','3075'].includes(id)));}
 const s=initialScenario(data);s.player=fighter(data,'Zed');s.weights={offense:100,defense:0,utility:0};assert.ok(greedyContinuousBuild(s,data,'antishield').target.includes('6695'));
});
