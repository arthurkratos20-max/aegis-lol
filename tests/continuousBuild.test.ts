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
test('101 live weights preserve contextual boots/key item, six unique legal slots, and pure Jinx DPS',()=>{
 const s=initialScenario(data);s.enemy=fighter(data,'Malphite');const targets=new Set<string>();
 for(let value=0;value<=100;value++){
  s.weights={offense:value,defense:100-value,utility:0};const r=greedyContinuousBuild(s,data);
  assert.deepEqual(r.target.slice(0,2),['3111','3031']);assert.equal(r.target.length,6);assert.equal(new Set(r.target).size,6);assert.ok(exclusiveGroupsValid(r.target));
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
