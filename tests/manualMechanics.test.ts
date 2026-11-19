import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {ManualChampionRecord,ManualEffectRecord} from '../src/manualMechanics.ts';
import type {Dataset} from '../src/contracts.ts';
import {manualMechanicsTemplate,mergeVerifiedManualMechanics,validateManualChampionRecord,validateManualEffect} from '../src/manualMechanics.ts';

const effect:ManualEffectRecord={
 key:'Q',label:'Habilidade Q',damageType:'magic',
 spell:{
  path:'Characters/Test/Spells/TestQ',
  values:{Base:[0,20,40]},
  calculations:{Damage:{__type:'GameCalculation',mFormulaParts:[
   {__type:'NumberCalculationPart',mNumber:100},
   {__type:'ByCharLevelBreakpointsCalculationPart',mLevel1Value:0,mInitialBonusPerLevel:1,mBreakpoints:[{mLevel:6,mAdditionalBonusAtThisLevel:10}]}
  ]}},
  cooldown:[8,7,6],cost:[50,50,50]
 },
 conditions:['Alvo atingido'],limitations:['Sem colisão com múltiplos alvos'],validation:'draft',sourceUrl:'https://example.org/official-data'
};
const record:ManualChampionRecord={champion:'Test',patch:'16.23.1',sourceUrl:'https://example.org/official-data',effects:[effect],notes:[]};

test('manual pilot registry includes six existing partial kits without fabricated formulas',()=>{
 assert.deepEqual(manualMechanicsTemplate.map(x=>x.champion),['Shen','Ezreal','Yasuo','Yone','Riven','Darius']);
 assert.ok(manualMechanicsTemplate.every(x=>x.effects.length===0&&x.patch==='16.23.1'));
});
test('manual champion record accepts sourced finite mechanics and explicit conditions',()=>{
 assert.deepEqual(validateManualChampionRecord(record),[]);
 assert.deepEqual(validateManualEffect(effect),[]);
});
test('manual mechanics rejects missing sources, patch, formulas and invalid values',()=>{
 const broken=structuredClone(record);broken.patch='latest';broken.sourceUrl='http://insecure.example';
 broken.effects[0].spell.values.Base=[0,Number.NaN];
 broken.effects[0].sourceUrl='http://insecure.example';
 assert.ok(validateManualChampionRecord(broken).some(x=>x.includes('Patch inválido')));
 assert.ok(validateManualChampionRecord(broken).some(x=>x.includes('HTTPS')));
 assert.ok(validateManualChampionRecord(broken).some(x=>x.includes('Valores inválidos')));
});
test('manual mechanics rejects duplicate ability keys and empty condition metadata',()=>{
 const duplicate=structuredClone(record);duplicate.effects.push({...effect,label:'Outra Q',conditions:['']});
 const errors=validateManualChampionRecord(duplicate);
 assert.ok(errors.some(x=>x.includes('Efeito duplicado')));
 assert.ok(errors.some(x=>x.includes('Condições inválidas')));
});
test('manual mechanics rejects malformed calculation trees and negative cooldowns',()=>{
 const broken=structuredClone(effect);broken.spell.calculations.Damage={__type:'GameCalculation',mFormulaParts:[{__type:'NumberCalculationPart',mNumber:Infinity}]};
 broken.spell.cooldown=[-1];
 const errors=validateManualEffect(broken);
 assert.ok(errors.some(x=>x.includes('Cálculo inválido')));
 assert.ok(errors.includes('Cooldown inválido'));
});

test('only verified same-patch manual snapshots are merged into existing champion mechanics',()=>{
 const source:Dataset={version:'16.23.1',champions:{Test:{}},mechanics:{Test:{ratio:.7,critMultiplier:1.75,spells:{},source:'fixture'}},catalogWarnings:[]} as unknown as Dataset;
 const draft=structuredClone(record);
 assert.equal(mergeVerifiedManualMechanics(source,[draft]).mechanics?.Test.spells.TestQ,undefined);
 const verified=structuredClone(record);verified.effects[0].validation='verified';
 const merged=mergeVerifiedManualMechanics(source,[verified]);
 assert.deepEqual(merged.mechanics?.Test.spells.TestQ,verified.effects[0].spell);
 assert.equal(merged.mechanics?.Test.ratio,.7);
 const wrongPatch=structuredClone(verified);wrongPatch.patch='16.22.1';
 const ignored=mergeVerifiedManualMechanics(source,[wrongPatch]);
 assert.equal(ignored.mechanics?.Test.spells.TestQ,undefined);
 assert.ok(ignored.catalogWarnings?.some(w=>w.includes('difere')));
});
test('manual mechanics do not invent champion base stats when mechanics are absent',()=>{
 const source={version:'16.23.1',champions:{Test:{}},catalogWarnings:[]} as unknown as Dataset;
 const verified=structuredClone(record);verified.effects[0].validation='verified';
 const merged=mergeVerifiedManualMechanics(source,[verified]);
 assert.equal(merged.mechanics?.Test,undefined);
 assert.ok(merged.catalogWarnings?.some(w=>w.includes('ratio/critMultiplier')));
});
