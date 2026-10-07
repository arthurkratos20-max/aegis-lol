import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {Dataset} from '../src/contracts.ts';
import {initialScenario} from '../src/model.ts';
import {quickScenario} from '../src/quickScenario.ts';
import {calculateOptimalRunes,matchupRuneReason} from '../src/runeOptimizer.ts';
import {runeCompatible} from '../src/compatibility.ts';
import {skillPlan} from '../src/skillOrders.ts';
import {quickRecommendation} from '../src/quickRecommendation.ts';
import {fullBuild} from '../src/fullBuild.ts';
import {skillValid} from '../src/skillRules.ts';
const data:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));
test('automatic runes change for melee, ranged pressure and burst without changing tank identity',()=>{
 const s=initialScenario(data);s.player.champion='Shen';s.player.lane='Top';s.matchupUnknown=false;
 const pages=['Garen','Vayne','Lux'].map(id=>{s.enemy.champion=id;const a=quickScenario(s,data);return calculateOptimalRunes(a,data,a.weights,true);});
 assert.notDeepEqual(pages[0],pages[1]);assert.notDeepEqual(pages[1],pages[2]);
 assert.ok(pages[1].selected.includes(8444));assert.ok(pages[2].selected.includes(8473));
});
test('unknown opponent does not influence contextual runes and manual locks remain respected',()=>{
 const s=initialScenario(data);s.matchupUnknown=true;const a=quickScenario(s,data);
 const baseline=calculateOptimalRunes(a,data,a.weights,true);
 a.enemy.champion='Lux';assert.deepEqual(calculateOptimalRunes(a,data,a.weights,true),baseline);
 assert.match(matchupRuneReason(a,data,baseline),/indefinido/);
 a.player.runes={...baseline,locked:true};a.matchupUnknown=false;
 assert.deepEqual(calculateOptimalRunes(a,data,a.weights,true),a.player.runes);
});
test('every champion and lane resolves legal contextual runes and skill paths across distinct threats',()=>{
 let checked=0;
 for(const id of Object.keys(data.champions))for(const lane of ['Top','Jungle','Mid','Bot','Support'])for(const enemy of ['Garen','Vayne','Lux','unknown']){
  const s=initialScenario(data);s.player.champion=id;s.player.lane=lane;s.matchupUnknown=enemy==='unknown';if(enemy!=='unknown')s.enemy.champion=enemy;
  const a=quickScenario(s,data),page=calculateOptimalRunes(a,data,a.weights,true);
  assert.equal(page.selected.length,6);assert.equal(new Set(page.selected).size,6);assert.notEqual(page.primary,page.secondary);
  const primary=data.runes.find(t=>t.id===page.primary)!,secondary=data.runes.find(t=>t.id===page.secondary)!;
  for(const row of primary.slots)assert.equal(row.runes.filter(r=>page.selected.includes(r.id)).length,1);
  assert.equal(secondary.slots[0].runes.filter(r=>page.selected.includes(r.id)).length,0);
  assert.equal(secondary.slots.slice(1).filter(row=>row.runes.some(r=>page.selected.includes(r.id))).length,2);
  for(const rune of page.selected)assert.ok(runeCompatible(rune,a.player,data).allowed,`${id} ${lane} ${enemy} ${rune}`);
  if(id!=='Aphelios')assert.ok(skillValid(skillPlan(a,data).sequence,data,id));
  if(enemy!=='unknown')assert.ok(matchupRuneReason(a,data,page).includes(data.champions[enemy].name));
  checked++;
 }
 assert.equal(checked,3460);
});

test('displayed recommendations adapt Jinx and Ahri secondary runes instead of only testing the scoring helper',()=>{
 for(const champion of ['Jinx','Ahri']){
  const s=initialScenario(data);s.player.champion=champion;s.matchupUnknown=true;
  const base=quickRecommendation(quickScenario(s,data),data).runes;
  s.matchupUnknown=false;s.enemy.champion='Caitlyn';
  const poke=quickRecommendation(quickScenario(s,data),data).runes;
  s.enemy.champion='Zed';
  const burst=quickRecommendation(quickScenario(s,data),data).runes;
  assert.notDeepEqual(poke.selected,base.selected,champion+' ranged pressure');
  assert.notDeepEqual(burst.selected,poke.selected,champion+' burst');
  assert.ok(poke.selected.includes(8444),champion+' recovery');
  assert.ok(burst.selected.includes(8473),champion+' burst protection');
  assert.equal(burst.primary,base.primary,champion+' keeps kit identity');
  s.enemy.champion='Leona';
  const control=quickRecommendation(quickScenario(s,data),data).runes;
  assert.ok(control.selected.includes(8242),champion+' hard control response');
  const manual=quickScenario(s,data);
  assert.deepEqual(fullBuild(manual,data).runes,calculateOptimalRunes(manual,data,manual.weights,true));
  manual.player.runes={...base,locked:true};
  assert.deepEqual(fullBuild(manual,data).runes,manual.player.runes);
 }
});
