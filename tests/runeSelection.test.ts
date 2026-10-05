import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {Dataset,RunePage} from '../src/contracts.ts';
import {initialScenario} from '../src/model.ts';
import {calculateOptimalRunes} from '../src/runeOptimizer.ts';
import {runeCompatible} from '../src/compatibility.ts';
import {selectManualRune,switchRuneTree,selectManualShard,unlockRunePage} from '../src/runeSelection.ts';
const data:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));
const page=():RunePage=>({primary:8400,secondary:8000,selected:[8437,8446,8429,8451,9101,9104],shards:['as','adaptive','hp'],locked:false});
test('primary click replaces its row and implicitly locks just the new choice without mutating input',()=>{
 const before=page(),after=selectManualRune(before,data,8463);
 assert.ok(after.selected.includes(8463));assert.ok(!after.selected.includes(8446));assert.deepEqual(after.locks?.runes,[8463]);assert.ok(before.selected.includes(8446));
 const changed=selectManualRune(after,data,8446);assert.deepEqual(changed.locks?.runes,[8446]);
});
test('secondary FIFO uses manual chronology, regardless of optimizer row order',()=>{
 let p=selectManualRune(page(),data,9104);p=selectManualRune(p,data,9101);
 p.selected=[8437,8446,8429,8451,9101,9104];
 const next=selectManualRune(p,data,8014);
 assert.ok(next.selected.includes(9101));assert.ok(next.selected.includes(8014));assert.ok(!next.selected.includes(9104));assert.deepEqual(next.locks?.runes,[9101,8014]);
 const again=selectManualRune(next,data,8014);assert.ok(!again.locks?.runes?.includes(8014));assert.ok(again.locks?.runes?.includes(9101));
});
test('secondary automatic choice yields before a manual lock; same-row replacement stays legal',()=>{
 const p=selectManualRune(page(),data,9101),third=selectManualRune(p,data,8014);
 assert.ok(third.selected.includes(9101));assert.ok(!third.selected.includes(9104));
 const sameRow=selectManualRune(third,data,8017);assert.ok(!sameRow.selected.includes(8014));assert.equal(sameRow.selected.length,6);
});
test('primary switch clears old primary locks, preserves secondary/shards and handles tree collisions',()=>{
 let p=selectManualRune(page(),data,8446);p=selectManualRune(p,data,9104);p=selectManualShard(p,1,'move');
 const next=switchRuneTree(p,data,8200,'primary');assert.equal(next.primary,8200);assert.deepEqual(next.locks?.runes,[9104]);assert.deepEqual(next.locks?.shards,[1]);assert.equal(next.locks?.primaryTree,true);
 const collision=switchRuneTree(p,data,8000,'primary');assert.equal(collision.primary,8000);assert.equal(collision.secondary,8400);assert.deepEqual(collision.locks?.runes,[]);
});
test('manual rune and shard survive all 101 weights, while switched tree fills automatically',()=>{
 const s=initialScenario(data);let p=calculateOptimalRunes(s,data);
 const tree=data.runes.find(t=>t.id===p.primary)!;
 const chosen=tree.slots[1].runes.find(r=>runeCompatible(r.id,s.player,data).allowed)!;
 p=selectManualRune(p,data,chosen.id);p=selectManualShard(p,0,'haste');
 for(let w=0;w<=100;w++){s.player.runes=p;const result=calculateOptimalRunes(s,data,w);assert.ok(result.selected.includes(chosen.id));assert.equal(result.shards[0],'haste');assert.equal(result.selected.length,6);assert.deepEqual(result.locks?.runes,p.locks?.runes);}
 const newTree=data.runes.find(t=>t.id!==p.primary&&t.id!==p.secondary&&t.id===8000)??data.runes.find(t=>t.id!==p.primary&&t.id!==p.secondary)!;
 s.player.runes=switchRuneTree(p,data,newTree.id,'primary');const resolved=calculateOptimalRunes(s,data,50);assert.equal(resolved.primary,newTree.id);assert.equal(resolved.selected.length,6);assert.ok(resolved.selected.slice(0,4).every(id=>newTree.slots.some(row=>row.runes.some(r=>r.id===id))));assert.deepEqual(resolved.locks?.runes,[]);
 s.player.runes=unlockRunePage(resolved);assert.equal(calculateOptimalRunes(s,data,0).selected.length,6);assert.deepEqual(s.player.runes.locks,{});
});
