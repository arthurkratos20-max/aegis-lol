import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import type {Dataset,Scenario,RunePage} from '../src/contracts.ts';
import {fighter,initialScenario} from '../src/model.ts';import {runeCompatible} from '../src/compatibility.ts';
import {calculateOptimalRunes,heuristicRuneScore} from '../src/runeOptimizer.ts';import {fullBuild} from '../src/fullBuild.ts';import {SHARD_ROWS} from '../src/shards.ts';
const data:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));
function legal(page:RunePage,s:Scenario){
 assert.notEqual(page.primary,page.secondary);assert.equal(page.selected.length,6);assert.equal(new Set(page.selected).size,6);
 const primary=data.runes.find(t=>t.id===page.primary)!,secondary=data.runes.find(t=>t.id===page.secondary)!;
 primary.slots.forEach(row=>assert.equal(row.runes.filter(r=>page.selected.includes(r.id)).length,1));
 assert.equal(secondary.slots[0].runes.filter(r=>page.selected.includes(r.id)).length,0);
 assert.equal(secondary.slots.slice(1).filter(row=>row.runes.some(r=>page.selected.includes(r.id))).length,2);
 assert.ok(page.selected.every(id=>runeCompatible(id,s.player,data).allowed));assert.equal(page.shards.length,3);page.shards.forEach((id,i)=>assert.ok(SHARD_ROWS[i].includes(id)));
}
test('every champion gets a legal viable page at offense, defense and balanced weights',()=>{const s=initialScenario(data);for(const id of Object.keys(data.champions)){s.player=fighter(data,id);for(const slider of [0,50,100])legal(calculateOptimalRunes(s,data,slider),s);}});
test('101 slider values recompute rune scores; offense and defense choose different primaries',()=>{const s=initialScenario(data);s.enemy=fighter(data,'Malphite');const sample=data.runes.find(t=>t.id===8000)!.slots[0].runes.find(r=>r.id===8008)!;
 for(let value=0;value<=100;value++){const score=heuristicRuneScore(sample,s,data,value);assert.equal(score.coverage,'heuristic');assert.ok(Math.abs(score.score-(value/100+.03*(100-value)/100))<1e-12);legal(calculateOptimalRunes(s,data,value),s);}
 assert.equal(calculateOptimalRunes(s,data,0).primary,8400);assert.equal(calculateOptimalRunes(s,data,100).primary,8000);
 for(const value of [0,100])for(const r of data.runes.flatMap(t=>t.slots.flatMap(row=>row.runes)))assert.equal(heuristicRuneScore(r,s,data,value).counterBonus,0);
});
test('individual runes, either tree and shard locks survive reoptimization without changing input',()=>{
 const s=initialScenario(data);s.player.runes=calculateOptimalRunes(s,data,100);
 const minor=s.player.runes.selected[2],secondaryRune=s.player.runes.selected[4];s.player.runes.locks={runes:[minor,secondaryRune],shards:[0]};
 const before=JSON.stringify(s),next=calculateOptimalRunes(s,data,0);assert.ok(next.selected.includes(minor));assert.ok(next.selected.includes(secondaryRune));assert.equal(next.primary,s.player.runes.primary);assert.equal(next.secondary,s.player.runes.secondary);assert.equal(next.shards[0],s.player.runes.shards[0]);legal(next,s);assert.equal(JSON.stringify(s),before);
 s.player.runes.locks={primaryTree:true,secondaryTree:true};const trees=calculateOptimalRunes(s,data,0);assert.equal(trees.primary,s.player.runes.primary);assert.equal(trees.secondary,s.player.runes.secondary);
 s.player.runes.locked=true;assert.deepEqual(calculateOptimalRunes(s,data,0),s.player.runes);
});
test('illegal duplicate row locks fail explicitly; fullBuild synchronizes both modules',()=>{const s=initialScenario(data);s.player.runes=calculateOptimalRunes(s,data,100);s.player.runes.selected.push(8005);s.player.runes.locks={runes:[8005,8008]};assert.throws(()=>calculateOptimalRunes(s,data,50),/mesma linha/);
 s.player=fighter(data,'Jinx');s.weights={offense:0,defense:100,utility:0};assert.deepEqual(fullBuild(s,data).runes,calculateOptimalRunes(s,data,s.weights,true));s.weights={offense:100,defense:0,utility:0};assert.equal(fullBuild(s,data).runes.primary,8000);
});
