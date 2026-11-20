import {test} from 'node:test';
import assert from 'node:assert/strict';
import {kitDeclarations,validateKitDeclarations} from '../src/kitDeclarations.ts';

test('second batch declares all five slots for all six champions without false implementation claims',()=>{
 assert.deepEqual(Object.keys(kitDeclarations).sort(),['Gragas','Graves','Gwen','Hecarim','Heimerdinger','Illaoi']);
 assert.deepEqual(validateKitDeclarations(),[]);
 for(const kit of Object.values(kitDeclarations)){
  assert.deepEqual(Object.keys(kit.abilities).sort(),['E','P','Q','R','W']);
  for(const ability of Object.values(kit.abilities))assert.equal(ability.damageModel,'pending');
 }
});

test('kit declaration validator rejects missing slots and untraceable sources',()=>{
 const base=kitDeclarations.Gragas;
 assert.ok(validateKitDeclarations({Gragas:{...base,source:'not-a-url'}}).some(e=>e.includes('source URL')));
 const broken={...base,abilities:{...base.abilities,Q:undefined as never}};
 assert.ok(validateKitDeclarations({Gragas:broken}).some(e=>e.includes('Q: name/role missing')));
});
