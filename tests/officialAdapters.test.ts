import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {Dataset,SkillKey} from '../src/contracts.ts';
import {officialDamageAdapters,evaluateOfficialAdapter,officialAdapterFor,validateOfficialDamageAdapters} from '../src/officialAdapters.ts';
import {nativeAction,nativeDamage,nativeOptions} from '../src/native.ts';
import {championKitCoverage,kitImpactPotential} from '../src/championKit.ts';
import {fighter,statsFor} from '../src/model.ts';

const data:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));

test('Gragas Q official patch 26.17 minimum and fully fermented impacts are separate',()=>{
 const q=officialAdapterFor('Gragas','GragasQ','Damage','16.23.1');assert.ok(q);assert.deepEqual(q.baseByRank,[75,125,175,225,275]);assert.equal(evaluateOfficialAdapter(q,5,{ap:100}),365);
 const max=officialAdapterFor('Gragas','GragasQ','MaxFermentedDamage','16.23.1');assert.ok(max);assert.equal(evaluateOfficialAdapter(max,5,{ap:100}),547.5);
 const w=officialAdapterFor('Gragas','GragasW','EmpoweredAttack','16.23.1');assert.ok(w);assert.equal(evaluateOfficialAdapter(w,5,{ap:100,targetMaxHP:2000}),330);\n const e=officialAdapterFor('Gragas','GragasE','Damage','16.23.1');assert.ok(e);assert.equal(evaluateOfficialAdapter(e,5,{ap:100}),320);\n const r=officialAdapterFor('Gragas','GragasR','Damage','16.23.1');assert.ok(r);assert.equal(evaluateOfficialAdapter(r,3,{ap:100}),480);\n const f=fighter(data,'Gragas');f.level=1;f.skills=['Q','W','E','Q','Q','R','Q','W','Q','W','R','W','W','E','E','R','E','E'] as SkillKey[];f.actions=[];f.automaticAttacks=false;
 const actor=statsFor(f,data),target=statsFor(fighter(data,'Azir'),data);const minimum=nativeAction(f,data,0),fermented=nativeAction(f,data,1);
 assert.equal(nativeDamage(minimum,f,data,actor,target),75+0.9*actor.ap);assert.equal(nativeDamage(fermented,f,data,actor,target),112.5+1.35*actor.ap);
 assert.equal(nativeOptions.Gragas[1].automatic,false);assert.equal(nativeOptions.Gragas[2].automatic,false);assert.equal(nativeOptions.Gragas.length,5);const coverage=championKitCoverage('Gragas',data);assert.equal(coverage.status,'partial');assert.deepEqual(coverage.covered,['Q']);assert.equal(coverage.isExactFormula,false);
});

test('Gragas Happy Hour heals on cast and respects its level-scaled static cooldown',()=>{\n const s=initialScenario(data);s.player=fighter(data,'Gragas');s.player.level=1;s.player.overrides={hp:1000,mana:500};s.player.initialHP=.5;s.player.automaticAttacks=false;s.duration=20;s.player.actions=[nativeAction(s.player,data,0),nativeAction({...s.player,skills:['W',...s.player.skills.slice(1)]},data,2)];\n const result=simulate(s,data);assert.equal(result.player.healing,55);assert.equal(result.player.hp,555);\n const mid=initialScenario(data);mid.player=fighter(data,'Gragas');mid.player.level=6;mid.player.overrides={hp:1000,mana:500};mid.player.initialHP=.5;mid.player.automaticAttacks=false;mid.duration=20;const q=nativeAction(mid.player,data,0);const wAction=nativeAction({...mid.player,skills:['W',...mid.player.skills.slice(1)]},data,2);mid.player.actions=[q,{...wAction,at:9}];assert.equal(simulate(mid,data).player.healing,55);\n});\n\ntest('Bard Q official patch adapter matches Riot 26.23 rank table and AP ratio',()=>{
 const adapter=officialAdapterFor('Bard','BardQ','Damage','16.23.1');
 assert.ok(adapter);assert.deepEqual(adapter.baseByRank,[80,125,170,215,260]);assert.deepEqual(adapter.apRatioByRank,[1,1,1,1,1]);
 assert.equal(evaluateOfficialAdapter(adapter,1,{ap:0}),80);
 assert.equal(evaluateOfficialAdapter(adapter,3,{ap:100}),270);
 assert.equal(evaluateOfficialAdapter(adapter,5,{ap:250}),510);
 assert.equal(officialAdapterFor('Bard','BardQ','Damage','16.22.1'),undefined);
 assert.throws(()=>evaluateOfficialAdapter(adapter,6,{ap:100}),/Rank/);
 const yi=officialAdapterFor('MasterYi','MasterYiQ','Damage','16.23.1');assert.ok(yi);assert.equal(evaluateOfficialAdapter(yi,5,{ap:0,ad:200}),220);
 const yiMax=officialAdapterFor('MasterYi','MasterYiQ','MaxSingleTargetDamage','16.23.1');assert.ok(yiMax);assert.equal(evaluateOfficialAdapter(yiMax,5,{ap:0,ad:200}),385);
 const ezW=officialAdapterFor('Ezreal','EzrealW','Damage','16.23.1');assert.ok(ezW);assert.equal(evaluateOfficialAdapter(ezW,5,{ap:100,bonusAD:100}),515);
 const ezR=officialAdapterFor('Ezreal','EzrealR','Damage','16.23.1');assert.ok(ezR);assert.equal(evaluateOfficialAdapter(ezR,3,{ap:100,bonusAD:100}),1080);
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

test('Ezreal exposes only the two patch 26.23 impacts with confirmed damage rows',()=>{
 const coverage=championKitCoverage('Ezreal',data);
 assert.equal(coverage.status,'partial');
 assert.equal(coverage.isExactFormula,false);
 assert.deepEqual([...coverage.covered].sort(),['R','W']);
 assert.deepEqual(coverage.missing,['P','Q','E']);
});
 
test('Bard adapter metadata remains source-scoped and does not certify a full kit',()=>{
 const a=officialDamageAdapters.find(x=>x.champion==='Bard');
 assert.ok(a?.source.includes('leagueoflegends.com'));
 assert.equal(nativeOptions.Bard.length,1);
 assert.equal(nativeOptions.Ezreal.find(o=>o.key==='R')?.note.includes('patch 26.23'),true);
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

test('Master Yi Q exposes two separately scoped official 26.23 damage cases',()=>{
 const f=fighter(data,'MasterYi');f.level=1;f.skills=['Q','W','E','Q','Q','R','Q','W','Q','W','R','W','W','E','E','R','E','E'] as SkillKey[];f.actions=[];f.automaticAttacks=false;
 const actor=statsFor(f,data),target=statsFor(fighter(data,'Azir'),data);
 const standard=nativeAction(f,data,0),maximum=nativeAction(f,data,1);
 assert.equal(standard.native?.calculation,'Damage');assert.equal(maximum.native?.calculation,'MaxSingleTargetDamage');
 assert.equal(nativeDamage(standard,f,data,actor,target),20+0.6*actor.ad);
 assert.equal(nativeDamage(maximum,f,data,actor,target),35+1.05*actor.ad);
 const coverage=championKitCoverage('MasterYi',data);assert.equal(coverage.status,'partial');assert.deepEqual(coverage.covered,['Q']);assert.deepEqual(coverage.missing,['P','W','E','R']);
 assert.equal(nativeOptions.MasterYi[1].automatic,false);
});
