import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {Dataset} from '../src/contracts.ts';
import {initialScenario,fighter} from '../src/model.ts';
import {runeCompatible} from '../src/compatibility.ts';
import {calculateOptimalRunes} from '../src/runeOptimizer.ts';
import {runeAffinity} from '../src/runeAffinity.ts';
const data:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));
const key=(ids:number[])=>data.runes.flatMap(t=>t.slots[0].runes).find(r=>ids.includes(r.id))!.id;
test('spell-based mages never receive attack-speed keystones at any slider value',()=>{
 for(const id of ['Ahri','Lux','Brand','Syndra','Vladimir','Swain','Ryze','Cassiopeia','Rumble','Gragas','Sylas','Hwei','Xerath','Velkoz','Karthus']){
  const s=initialScenario(data);s.player=fighter(data,id);
  assert.equal(runeCompatible(8008,s.player,data).allowed,false,id);
  for(let value=0;value<=100;value++){const page=calculateOptimalRunes(s,data,value);assert.ok(!page.selected.includes(8008)&&!page.selected.includes(9923),`${id}/${value}`);assert.ok(page.selected.every(r=>runeCompatible(r,s.player,data).allowed));}
 }
});
test('offensive keystones follow burst, ranged poke, sustained spells and support kit affinities',()=>{
 const expectations:Record<string,number>={Ahri:8112,Syndra:8112,Lux:8229,Xerath:8229,Cassiopeia:8010,Swain:8010,Ryze:8010};
 for(const [id,expected] of Object.entries(expectations)){const s=initialScenario(data);s.player=fighter(data,id);assert.equal(key(calculateOptimalRunes(s,data,100).selected),expected,id);}
 const s=initialScenario(data);s.player={...fighter(data,'Lulu'),lane:'Support'};assert.equal(runeAffinity(s.player,data),'enchanter');assert.equal(key(calculateOptimalRunes(s,data,100).selected),8214);
});
test('attack-based AP kits retain lethal tempo while mage defenses favor mobility over tank keystones',()=>{
 for(const id of ['Azir','Kayle','Teemo']){const s=initialScenario(data);s.player=fighter(data,id);assert.equal(runeCompatible(8008,s.player,data).allowed,true,id);assert.equal(key(calculateOptimalRunes(s,data,100).selected),8008,id);}
 for(const id of ['Lux','Syndra','Vladimir']){const s=initialScenario(data);s.player=fighter(data,id);assert.equal(key(calculateOptimalRunes(s,data,0).selected),8230,id);}
});
test('mage rune locks and manaless resource constraints survive kit scoring',()=>{
 const s=initialScenario(data);s.player=fighter(data,'Vladimir');let page=calculateOptimalRunes(s,data,100);assert.ok(!page.selected.includes(8009)&&!page.selected.includes(8226));
 s.player=fighter(data,'Ahri');page=calculateOptimalRunes(s,data,100);s.player.runes={...page,locks:{runes:[8112],shards:[0]}};const next=calculateOptimalRunes(s,data,0);assert.ok(next.selected.includes(8112));assert.equal(next.shards[0],page.shards[0]);
});
