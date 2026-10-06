import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {Dataset} from '../src/contracts.ts';
import {fighter,initialScenario,statsFor} from '../src/model.ts';
import {championKitCoverage,kitImpactPotential} from '../src/championKit.ts';
import {evaluateBuild,offensiveMetric} from '../src/buildEvaluation.ts';
import {nativeAction,nativeDamage,nativeOptions} from '../src/native.ts';
import {simulate} from '../src/engine.ts';
const data:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));
data.mechanics=JSON.parse(readFileSync(new URL('../public/data/mechanics.json',import.meta.url),'utf8')).champions;
test('every champion has explicit coverage and none is misreported as a complete kit',()=>{
 const rows=Object.keys(data.champions).map(id=>championKitCoverage(id,data));
 assert.equal(rows.length,173);assert.equal(rows.filter(r=>r.status==='partial').length,6);
 assert.ok(rows.every(r=>r.missing.includes('P')));assert.deepEqual(championKitCoverage('Lux',data).missing,['P','Q','W','E','R']);
 const absent={...data,mechanics:undefined};assert.equal(championKitCoverage('Shen',absent).status,'missing');
});
test('Shen native index uses the real AP/HP formulas and does not invent magical DPS',()=>{
 const s={...initialScenario(data),player:fighter(data,'Shen'),matchupUnknown:true};
 const base=evaluateBuild([],s,data),ap=evaluateBuild(['3089'],s,data),hp=evaluateBuild(['3083'],s,data);
 assert.ok(ap.kitPotential!>base.kitPotential!);assert.ok(hp.kitPotential!>base.kitPotential!);
 assert.ok(Number.isFinite(ap.dps));assert.equal(ap.isExactFormula,false);
 assert.equal(offensiveMetric(ap),ap.offenseValue);
 s.player.automaticAttacks=false;s.distance=1000;const x=statsFor(s.player,data),e=statsFor(s.enemy,data);
 assert.ok(!kitImpactPotential(s.player,data,x,e,s.distance)?.covered.includes('Q'));
});
test('isolated Ezreal impacts match independent native spell evaluations, once per skill',()=>{
 const f=fighter(data,'Ezreal'),x=statsFor(f,data),e={...statsFor(fighter(data,'Darius'),data),armor:0,mr:0};
 const expected=nativeOptions.Ezreal.map((opt,i)=>opt.automatic===false?0:nativeDamage(nativeAction(f,data,i),f,data,x,e)).reduce((a,b)=>a+b,0);
 const r=kitImpactPotential(f,data,x,e)!;assert.ok(Math.abs(r.damage-expected)<1e-9);assert.deepEqual(r.covered,['Q','E','R']);
 f.initialResource=0;assert.equal(kitImpactPotential(f,data,x,e),null);
});
test('manual actions remain authoritative and simulation discloses unsupported kit effects',()=>{
 const s=initialScenario(data);s.player=fighter(data,'Ezreal');s.player.actions=[nativeAction(s.player,data,0)];
 const m=evaluateBuild([],s,data);assert.equal(m.kitPotential,undefined);assert.equal(offensiveMetric(m),m.dps);
 const before=JSON.stringify(s),r=simulate(s,data);assert.equal(JSON.stringify(s),before);
 assert.ok(r.warnings.some(w=>w.includes('kit parcial')&&w.includes('P')));
});

test('conditional native impacts use current formulas without being assumed in automatic builds',()=>{
 for(const [champion,key,spellName,value,coefficient] of [
  ['Ezreal','W','EzrealW','BaseDamage',1],
  ['Yasuo','R','YasuoR','RBaseDamage',1.5],
  ['Riven','R','RivenFengShuiEngine','MinBase',.550000011920929],
 ] as const){
  const f=fighter(data,champion);f.items=['3072','3089'];
  const actor=statsFor(f,data),base=statsFor({...f,items:[],runes:{...f.runes,shards:[]}},data),target=statsFor(fighter(data,'Lux'),data);
  const index=nativeOptions[champion].findIndex(o=>o.key===key&&o.automatic===false);
  const a=nativeAction(f,data,index),rank=f.skills.slice(0,f.level).filter(k=>k===key).length;
  const spell=data.mechanics![champion].spells[spellName];
  const expected=spell.values[value][rank]+coefficient*(actor.ad-base.ad)+(champion==='Ezreal'?spell.values.APRatio[rank]*actor.ap:0);
  assert.ok(Math.abs(nativeDamage(a,f,data,actor,target)-expected)<1e-8);
  assert.ok(championKitCoverage(champion,data).covered.includes(key));
  assert.ok(!kitImpactPotential(f,data,actor,target)?.covered.includes(key));
 }
});
