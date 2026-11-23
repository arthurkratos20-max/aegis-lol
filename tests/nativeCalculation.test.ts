import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {CalcNode,NativeSpell,Stats} from '../src/contracts.ts';
import {calculateNative} from '../src/native.ts';

const stats:Stats={hp:1200,ad:150,ap:200,armor:80,mr:60,mana:500,as:1,baseAS:.7,ratio:.7,bonusAS:.3,crit:0,critMultiplier:1.75,haste:0,move:350,range:550,hpRegen:5,manaRegen:8,lifesteal:0,armorPen:0,magicPen:0,armorPenPercent:0,magicPenPercent:0};
const base:Stats={...stats,ad:60,ap:0,hp:1000,armor:30};
const node=(__type:string,fields:Record<string,unknown>={}):CalcNode=>({__type,...fields});
const spell=(calculations:Record<string,CalcNode>={},values:Record<string,number[]>={}):NativeSpell=>({path:'fixture',cooldown:[1,1,1,1,1,1,1],cost:[0,0,0,0,0,0,0],values,calculations});

test('native calculation evaluates data values, stats, sums and multipliers',()=>{
 const calculation=node('GameCalculation',{mFormulaParts:[
  node('NumberCalculationPart',{mNumber:10}),
  node('NamedDataValueCalculationPart',{mDataValue:'base'}),
  node('StatByCoefficientCalculationPart',{mStat:2,mStatFormula:2,mCoefficient:.5})
 ],mMultiplier:node('NumberCalculationPart',{mNumber:2})});
 const s=spell({damage:calculation},{base:[0,20,30]});
 assert.equal(calculateNative(s.calculations.damage,s,1,1,stats,base),150);
});
test('native calculation supports modified references and products',()=>{
 const s=spell({base:node('GameCalculation',{mFormulaParts:[node('NumberCalculationPart',{mNumber:12})]}),scaled:node('GameCalculationModified',{mModifiedGameCalculation:'base',mMultiplier:node('NumberCalculationPart',{mNumber:3})}),product:node('ProductOfSubPartsCalculationPart',{mPart1:node('NumberCalculationPart',{mNumber:4}),mPart2:node('NumberCalculationPart',{mNumber:5})})});
 assert.equal(calculateNative(s.calculations.scaled,s,1,1,stats,base),36);
 assert.equal(calculateNative(s.calculations.product,s,1,1,stats,base),20);
});
test('native level interpolation and breakpoints are evaluated at requested level',()=>{
 const interpolation=node('ByCharLevelInterpolationCalculationPart',{mStartValue:10,mEndValue:180});
 assert.equal(calculateNative(interpolation,spell(),1,10,stats,base),100);
 const breakpoints=node('ByCharLevelBreakpointsCalculationPart',{mLevel1Value:10,mInitialBonusPerLevel:2,mBreakpoints:[{mLevel:5,mAdditionalBonusAtThisLevel:8,mBonusPerLevelAtAndAfter:3}]});
 assert.equal(calculateNative(breakpoints,spell(),1,6,stats,base),30);
});
test('native calculation rejects missing, malformed and unsupported source data',()=>{
 assert.throws(()=>calculateNative(node('NamedDataValueCalculationPart',{mDataValue:'missing'}),spell(),1,1,stats,base),/DataValue/);
 assert.throws(()=>calculateNative(node('NumberCalculationPart'),spell(),1,1,stats,base),/Invalid numeric/);
 assert.throws(()=>calculateNative(node('UnknownCalculationPart'),spell(),1,1,stats,base),/not implemented/);
 assert.throws(()=>calculateNative(node('NumberCalculationPart',{mNumber:1}),spell(),0,1,stats,base),/Rank\/level/);
 assert.throws(()=>calculateNative(node('GameCalculation',{mFormulaParts:[]}),spell(),1,1,stats,base),/no formula parts/);
});
test('native calculation rejects duplicate or invalid level breakpoints',()=>{
 const duplicate=node('ByCharLevelBreakpointsCalculationPart',{mLevel1Value:1,mBreakpoints:[{mLevel:3},{mLevel:3}]});
 assert.throws(()=>calculateNative(duplicate,spell(),1,5,stats,base),/Duplicate level breakpoint/);
 const invalid=node('ByCharLevelBreakpointsCalculationPart',{mLevel1Value:1,mBreakpoints:[{mLevel:99}]});
 assert.throws(()=>calculateNative(invalid,spell(),1,5,stats,base),/Invalid level breakpoints/);
});
