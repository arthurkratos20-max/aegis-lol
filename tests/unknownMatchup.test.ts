import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {Dataset} from '../src/contracts.ts';
import {fighter,initialScenario} from '../src/model.ts';
import {fullBuild} from '../src/fullBuild.ts';
import {evaluateBuild} from '../src/buildEvaluation.ts';
import {buildShareLink,readBuildShare} from '../src/buildShare.ts';
const data:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));
test('unknown matchup ignores hidden enemy kit, items, pen and stats for items and runes',()=>{
 for(const champion of ['Jinx','Shen','Kaisa','Ahri']){
  const a={...initialScenario(data),matchupUnknown:true,player:fighter(data,champion),enemy:fighter(data,'Malphite')};
  const b={...a,enemy:{...fighter(data,'Darius'),items:['3036'],overrides:{hp:9999,armor:999,mr:999,armorPen:90}}};
  const first=fullBuild(a,data),second=fullBuild(b,data);
  assert.deepEqual(first.target,second.target);assert.deepEqual(first.runes,second.runes);
  assert.deepEqual(evaluateBuild(first.target,a,data),evaluateBuild(first.target,b,data));
  assert.equal(first.target.length,6);
 }
});
test('shared standard build keeps unknown matchup after round trip',()=>{
 const s={...initialScenario(data),matchupUnknown:true};
 const link=buildShareLink(s,'https://example.com');
 assert.equal(readBuildShare(new URL(link).hash,data)?.matchupUnknown,true);
});
