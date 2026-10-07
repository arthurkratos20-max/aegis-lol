import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import type {Dataset} from '../src/contracts.ts';import {initialScenario} from '../src/model.ts';import {quickScenario} from '../src/quickScenario.ts';import {fullBuild} from '../src/fullBuild.ts';
const data:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));
test('automatic card ignores manual weights, actions, inventory, enemy overrides and presets without mutating them',()=>{
 const s=initialScenario(data);s.player.lane='Bot';const clean=quickScenario(s,data);
 s.weights={offense:0,defense:0,utility:100};s.player.owned=['3083'];s.player.locked=['3083'];s.player.items=['3083'];s.player.skillMode='manual';s.player.skills=['E'];s.enemy.overrides={armor:9999};s.teamPriority=100;s.budget=0;
 const snapshot=JSON.stringify(s),auto=quickScenario(s,data);assert.deepEqual(auto,clean);assert.equal(JSON.stringify(s),snapshot);assert.deepEqual(fullBuild(auto,data).target,fullBuild(clean,data).target);
});
test('automatic profiles cover every champion and lane with normalized finite weights and no manual constraints',()=>{
 for(const id of Object.keys(data.champions))for(const lane of ['Top','Jungle','Mid','Bot','Support']){const s=initialScenario(data);s.player.champion=id;s.player.lane=lane;s.matchupUnknown=true;const a=quickScenario(s,data);assert.equal(a.player.champion,id);assert.equal(a.player.lane,lane);assert.equal(a.matchupUnknown,true);assert.equal(Object.values(a.weights).reduce((x,y)=>x+y,0),100);assert.deepEqual(a.player.locked,[]);assert.equal(a.counterPreset,undefined);}
});
test('automatic recommendation retains the selected matchup and chooses class-appropriate objectives',()=>{
 const s=initialScenario(data);s.player.champion='Shen';const tank=quickScenario(s,data);assert.ok(tank.weights.defense>tank.weights.offense);
 s.player.champion='Lulu';s.player.lane='Support';const support=quickScenario(s,data);assert.ok(support.weights.utility>support.weights.offense);assert.equal(support.enemy.champion,s.enemy.champion);
 s.player.champion='Ashe';s.player.lane='Bot';const adc=quickScenario(s,data);assert.ok(adc.weights.offense>adc.weights.defense);assert.equal(adc.player.skillMode,'auto');
});
