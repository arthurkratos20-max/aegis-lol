import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {Dataset} from '../src/contracts.ts';
import {fighter,initialScenario} from '../src/model.ts';
import {KIT_BUILD_PROFILES} from '../src/kitBuildProfiles.ts';
import {runeAffinity} from '../src/runeAffinity.ts';
import {recommend} from '../src/recommendation.ts';
import {getChampionScaling} from '../src/championScaling.ts';

const data:Dataset=JSON.parse(readFileSync(new URL('./fixtures/16.19.1-pt_BR.json',import.meta.url),'utf8'));
test('first six uncovered champions have explicit, non-certified build-facing kit profiles',()=>{
 const expected=['Aatrox','Ahri','Akali','Alistar','Amumu','Annie'];
 assert.deepEqual(Object.keys(KIT_BUILD_PROFILES).sort(),expected.sort());
 for(const id of expected){
  const p=KIT_BUILD_PROFILES[id];assert.equal(p.status,'strategic-curation');assert.ok(p.damageScaling.length);assert.ok(p.durabilityScaling.length);assert.ok(p.coreItems.length>=4);assert.ok(p.runeNotes.length);assert.ok(p.caveats.length);
  assert.equal(runeAffinity(fighter(data,id),data),p.runeAffinity);
 }
});
test('kit profile core items enter the shared item recommendation pool',()=>{
 for(const id of Object.keys(KIT_BUILD_PROFILES)){
  const s={...initialScenario(data),player:fighter(data,id),matchupUnknown:true};
  const result=recommend(s,data);
  const eligible=KIT_BUILD_PROFILES[id].coreItems.filter(item=>!!data.items[item]&&data.items[item].maps['11']&&data.items[item].gold.purchasable);
  assert.ok(eligible.length>0, id+' has no catalog-backed core item');
  assert.ok(result.cores.some(item=>eligible.includes(item)),id+' did not surface a kit-profile core item');
 }
});

test('kit scaling profiles feed champion stat scaling used by build evaluation',()=>{
 const expected:Record<string,{ad:boolean;ap:boolean}>={Aatrox:{ad:true,ap:false},Ahri:{ad:false,ap:true},Akali:{ad:true,ap:true},Alistar:{ad:false,ap:true},Amumu:{ad:false,ap:true},Annie:{ad:false,ap:true}};
 for(const [id,want] of Object.entries(expected)){
  const scaling=getChampionScaling(data.champions[id],data);
  assert.equal(scaling.hasADScaling,want.ad,id+' AD scaling');
  assert.equal(scaling.hasAPScaling,want.ap,id+' AP scaling');
  assert.ok(scaling.evidence.some(x=>x.startsWith('kit-profile:')),id+' missing kit profile evidence');
  assert.equal(scaling.coverage,'estimated',id+' must not be promoted to exact formula coverage');
 }
});
