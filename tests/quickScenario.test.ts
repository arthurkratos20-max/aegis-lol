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

import {quickRecommendation} from '../src/quickRecommendation.ts';import {skillPlan} from '../src/skillOrders.ts';import {skillValid} from '../src/skillRules.ts';
test('Shen Top, Jungle and Support use different role cores; known magic versus physical opponents changes item evaluation',()=>{
 const s=initialScenario(data);s.player.champion='Shen';s.enemy.champion='Darius';s.matchupUnknown=false;
 const top=quickRecommendation(quickScenario(s,data),data);
 s.player.lane='Jungle';const jungle=quickRecommendation(quickScenario(s,data),data);assert.ok(jungle.target.some(id=>['3748','3074','6631','6698','3068','6664'].includes(id)));assert.notDeepEqual(top.target,jungle.target);
 s.player.lane='Support';const support=quickRecommendation(quickScenario(s,data),data);assert.ok(support.target.some(id=>['3190','3109','3107','3222'].includes(id)));assert.notDeepEqual(top.target,support.target);
 s.player.lane='Top';s.enemy.champion='Lux';const magic=quickRecommendation(quickScenario(s,data),data);assert.notDeepEqual(magic.target,top.target);assert.ok(magic.target.some(id=>(data.items[id].stats.FlatSpellBlockMod??0)>0));
});
test('role and reviewed matchup skill variants reach the automatic card as legal level-up paths',()=>{
 const s=initialScenario(data);s.matchupUnknown=false;s.player.champion='Shen';s.player.lane='Jungle';let a=quickScenario(s,data);assert.deepEqual(skillPlan(a,data).opening,['Q','W','E']);assert.ok(skillValid(a.player.skills,data,'Shen'));
 s.player.champion='Darius';s.player.lane='Top';s.enemy.champion='Garen';a=quickScenario(s,data);const melee=skillPlan(a,data);
 s.enemy.champion='Vayne';a=quickScenario(s,data);const ranged=skillPlan(a,data);assert.notDeepEqual(melee.opening,ranged.opening);assert.ok(skillValid(a.player.skills,data,'Darius'));assert.match(ranged.reason,/Vayne/);
});

test('all automatic champion/lane recommendations are complete, compatible and legal against physical, magical and unknown contexts',()=>{
 let checked=0;
 for(const id of Object.keys(data.champions))for(const lane of ['Top','Jungle','Mid','Bot','Support'])for(const enemy of ['Darius','Lux','unknown']){
  const s=initialScenario(data);s.player.champion=id;s.player.lane=lane;s.matchupUnknown=enemy==='unknown';if(enemy!=='unknown')s.enemy.champion=enemy;
  const a=quickScenario(s,data),r=quickRecommendation(a,data);assert.equal(r.target.length,6,`${id} ${lane} ${enemy}`);assert.equal(new Set(r.target).size,6);assert.ok(Number.isFinite(r.total));assert.ok(r.total>0);
  for(const item of r.target)assert.ok(itemEligible(item,data,id)&&itemCompatible(item,a.player,data).allowed,`${id} ${item}`);
  assert.ok(exclusiveGroupsValid(r.target,data));if(id==='Cassiopeia')assert.equal(r.boots,null);if(id!=='Aphelios')assert.ok(skillValid(a.player.skills,data,id),`${id} ${lane}: skill path`);
  checked++;
 }
 console.log(`Automatic context audit: ${checked} champion/lane/enemy scenarios validated.`);
});
import {itemEligible} from '../src/model.ts';import {itemCompatible} from '../src/compatibility.ts';import {exclusiveGroupsValid} from '../src/buildEvaluation.ts';

 test('Ashe automatic card responds to Cassiopeia versus Caitlyn/Jhin without assassin utility items',()=>{
 const s=initialScenario(data);s.player.champion='Ashe';s.player.lane='Bot';s.matchupUnknown=false;
 const builds=['Cassiopeia','Caitlyn','Jhin'].map(enemy=>{s.enemy.champion=enemy;return quickRecommendation(quickScenario(s,data),data);});
 assert.ok(builds[0].target.includes('3091'));assert.ok(builds[1].target.includes('3026'));assert.ok(builds[2].target.includes('3026'));
 assert.notDeepEqual(builds[0].target,builds[1].target);
 for(const r of builds){assert.ok(!r.target.some(id=>['6694','6696','6697'].includes(id)));assert.ok(r.target.includes('3031'));}
 s.matchupUnknown=true;const unknown=quickRecommendation(quickScenario(s,data),data);s.enemy.champion='Lux';assert.deepEqual(unknown.target,quickRecommendation(quickScenario(s,data),data).target);
 });
