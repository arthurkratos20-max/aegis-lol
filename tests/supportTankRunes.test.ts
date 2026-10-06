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
test('enchanter healing and shielding, engage and protection use distinct compatible keystones',()=>{
 for(const [id,expected] of [['Lulu',8214],['Janna',8214],['Soraka',8214],['Milio',8214],['Leona',8439],['Nautilus',8439],['Rell',8439],['Alistar',8439],['Braum',8465],['Taric',8465],['Shen',8465]] as const){
  const s=initialScenario(data);s.player={...fighter(data,id),lane:'Support'};
  for(const slider of [0,50,100]){const page=calculateOptimalRunes(s,data,slider);assert.equal(key(page.selected),expected,`${id}/${slider}`);assert.ok(page.selected.every(id=>runeCompatible(id,s.player,data).allowed));}
 }
});
test('lane tanks prefer durable trade keystones, never AS keystones across slider range',()=>{
 for(const id of ['Shen','Ornn','Sion','Malphite','Rammus','DrMundo','Zac','Sejuani']){const s=initialScenario(data);s.player={...fighter(data,id),lane:'Top'};for(let value=0;value<=100;value++){const page=calculateOptimalRunes(s,data,value);assert.ok([8437,8439].includes(key(page.selected)),`${id}/${value}`);assert.ok(!page.selected.includes(8008));}if(id==='DrMundo')assert.equal(runeCompatible(8439,s.player,data).allowed,false);}
});
test('damage supports and offensive support kits preserve their identity',()=>{
 for(const [id,expected] of [['Lux',8229],['Brand',8229],['Senna',8021],['Pyke',9923]] as const){const s=initialScenario(data);s.player={...fighter(data,id),lane:'Support'};assert.equal(key(calculateOptimalRunes(s,data,100).selected),expected,id);}
 const s=initialScenario(data);s.player={...fighter(data,'Lulu'),lane:'Support',supportMode:'damage'};assert.equal(runeAffinity(s.player,data),'poke');
 for(const id of ['Aatrox','Darius'])assert.equal(runeAffinity(fighter(data,id),data),'other');
});
test('support/tank rune locks survive recalculation and resource constraints remain legal',()=>{
 const s=initialScenario(data);s.player={...fighter(data,'Shen'),lane:'Support'};const page=calculateOptimalRunes(s,data,50);assert.ok(!page.selected.includes(8226));s.player.runes={...page,locks:{runes:[8465],shards:[1]}};const next=calculateOptimalRunes(s,data,100);assert.ok(next.selected.includes(8465));assert.equal(next.shards[1],page.shards[1]);
});
