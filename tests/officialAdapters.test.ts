import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {Dataset,SkillKey} from '../src/contracts.ts';
import {officialDamageAdapters,evaluateOfficialAdapter,officialAdapterFor,validateOfficialDamageAdapters} from '../src/officialAdapters.ts';
import {nativeAction,nativeDamage,nativeOptions} from '../src/native.ts';
import {championKitCoverage,kitImpactPotential} from '../src/championKit.ts';
import {fighter,statsFor} from '../src/model.ts';

const data:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));

test('Bard Q official patch adapter matches Riot 26.23 rank table and AP ratio',()=>{
 const adapter=officialAdapterFor('Bard','BardQ','Damage','16.23.1');
 assert.ok(adapter);assert.deepEqual(adapter.baseByRank,[80,125,170,215,260]);assert.deepEqual(adapter.apRatioByRank,[1,1,1,1,1]);
 assert.equal(evaluateOfficialAdapter(adapter,1,{ap:0}),80);
 assert.equal(evaluateOfficialAdapter(adapter,3,{ap:100}),270);
 assert.equal(evaluateOfficialAdapter(adapter,5,{ap:250}),510);
 assert.equal(officialAdapterFor('Bard','BardQ','Damage','16.22.1'),undefined);
 assert.throws(()=>evaluateOfficialAdapter(adapter,6,{ap:100}),/Rank/);\n const ezW=officialAdapterFor('Ezreal','EzrealW','Damage','16.23.1');assert.ok(ezW);assert.equal(evaluateOfficialAdapter(ezW,5,{ap:100,bonusAD:100}),525);\n const ezR=officialAdapterFor('Ezreal','EzrealR','Damage','16.23.1');assert.ok(ezR);assert.equal(evaluateOfficialAdapter(ezR,3,{ap:100,bonusAD:100}),1080);
});

test('Bard Q is executable as a patch-matched isolated magic impact without stale mechanics',()=>{
 assert.equal(data.version,'16.23.1');
 const f=fighter(data,'Bard');f.level=1;f.skills=['Q','W','E','Q','Q','R','Q','W','Q','W','R','W','W','E','E','R','E','E'] as SkillKey[];f.actions=[];f.automaticAttacks=false;f.initialResource=1;
 const actor=statsFor(f,data),target=statsFor(fighter(data,'Azir'),data);
 const action=nativeAction(f,data,0);
 assert.equal(action.native?.spell,'BardQ');assert.equal(action.type,'magic');
 assert.equal(nativeDamage(action,f,data,actor,target),80+actor.ap);
 const result=kitImpactPotential(f,data,actor,target);
 assert.ok(result);assert.deepEqual(result.covered,['Q']);assert.equal(result.shield,0);
 assert.equal(championKitCoverage('Bard',data).status,'partial');
 assert.deepEqual(championKitCoverage('Bard',data).covered,['Q']);
 assert.deepEqual(championKitCoverage('Bard',data).missing,['P','W','E','R']);
 assert.equal(championKitCoverage('Bard',data).isExactFormula,false);
});

test('Bard adapter metadata remains source-scoped and does not certify a full kit',()=>{
 const a=officialDamageAdapters.find(x=>x.champion==='Bard');
 assert.ok(a?.source.includes('leagueoflegends.com'));
 assert.equal(nativeOptions.Bard.length,1);\n assert.equal(nativeOptions.Ezreal.find(o=>o.key==='R')?.note.includes('patch 26.23'),true);
 assert.match(nativeOptions.Bard[0].note,/colisão, segundo alvo, atordoamento e passiva não simulados/);
});

test('official adapter registry rejects stale, malformed, duplicate or untraceable rows',()=>{
 assert.deepEqual(validateOfficialDamageAdapters(),[]);
 const valid=officialDamageAdapters[0];
 assert.ok(valid);
 assert.ok(validateOfficialDamageAdapters([{...valid,source:'https://example.com/fake'}]).some(e=>e.includes('official Riot')));
 assert.ok(validateOfficialDamageAdapters([{...valid,baseByRank:[80]}]).some(e=>e.includes('five finite')));
 assert.ok(validateOfficialDamageAdapters([valid,valid]).some(e=>e.includes('duplicate')));
 assert.ok(validateOfficialDamageAdapters([{...valid,patch:'current'}]).some(e=>e.includes('patch version')));
});
