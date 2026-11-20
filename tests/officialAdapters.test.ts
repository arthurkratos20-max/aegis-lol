import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {Dataset,SkillKey} from '../src/contracts.ts';
import {officialDamageAdapters,evaluateOfficialAdapter,officialAdapterFor,validateOfficialDamageAdapters} from '../src/officialAdapters.ts';
import {nativeAction,nativeDamage,nativeOptions} from '../src/native.ts';
import {championKitCoverage,kitImpactPotential} from '../src/championKit.ts';
import {fighter,statsFor,initialScenario,attackAction} from '../src/model.ts';
import {simulate} from '../src/engine.ts';
import {kitImpact,kitState} from '../src/kitCombat.ts';
import {kitDeclarations} from '../src/kitDeclarations.ts';
function gravesDeclarationHasPartialDamage(){return ['Q','W','R'].every(slot=>kitDeclarations.Graves.abilities[slot as keyof typeof kitDeclarations.Graves.abilities].damageModel==='partial');}


const data:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));

test('Gragas Q standard Summoner\'s Rift minimum and fully fermented impacts are separate',()=>{
 const q=officialAdapterFor('Gragas','GragasQ','Damage','16.23.1');assert.ok(q);assert.deepEqual(q.baseByRank,[80,120,160,200,240]);assert.equal(evaluateOfficialAdapter(q,5,{ap:100}),320);
 const max=officialAdapterFor('Gragas','GragasQ','MaxFermentedDamage','16.23.1');assert.ok(max);assert.deepEqual(max.baseByRank,[120,180,240,300,360]);assert.equal(evaluateOfficialAdapter(max,5,{ap:100}),480);
 const w=officialAdapterFor('Gragas','GragasW','EmpoweredAttack','16.23.1');assert.ok(w);assert.equal(evaluateOfficialAdapter(w,5,{ap:100,targetMaxHP:2000}),350);
 const e=officialAdapterFor('Gragas','GragasE','Damage','16.23.1');assert.ok(e);assert.equal(evaluateOfficialAdapter(e,5,{ap:100}),320);
 const r=officialAdapterFor('Gragas','GragasR','Damage','16.23.1');assert.ok(r);assert.equal(evaluateOfficialAdapter(r,3,{ap:100}),480);
 const f=fighter(data,'Gragas');f.level=1;f.skills=['Q','W','E','Q','Q','R','Q','W','Q','W','R','W','W','E','E','R','E','E'] as SkillKey[];f.actions=[];f.automaticAttacks=false;
 const actor=statsFor(f,data),target=statsFor(fighter(data,'Azir'),data);const minimum=nativeAction(f,data,0),fermented=nativeAction(f,data,1);
 assert.equal(nativeDamage(minimum,f,data,actor,target),80+0.8*actor.ap);assert.equal(nativeDamage(fermented,f,data,actor,target),120+1.2*actor.ap);
 const fW={...f,level:18,skills:['Q','W','E','W','W','R','W','Q','Q','W','R','E','E','E','E','R','Q','Q'] as SkillKey[]};const wAction=nativeAction(fW,data,2);assert.equal(nativeDamage(wAction,fW,data,actor,{...target,hp:2000}),140+0.7*actor.ap+140);
 assert.equal(nativeOptions.Gragas[1].automatic,false);assert.equal(nativeOptions.Gragas[2].automatic,false);assert.equal(nativeOptions.Gragas.length,5);const coverage=championKitCoverage('Gragas',data);assert.equal(coverage.status,'partial');assert.deepEqual(coverage.covered,['Q','W','E','R']);assert.deepEqual(coverage.missing,['P']);assert.equal(coverage.isExactFormula,false);
});

test('Gragas Happy Hour heals on cast and respects its level-scaled static cooldown',()=>{
 const s=initialScenario(data);s.player=fighter(data,'Gragas');s.player.level=1;s.player.overrides={hp:1000,mana:500};s.player.initialHP=.5;s.player.automaticAttacks=false;s.duration=20;s.player.actions=[nativeAction(s.player,data,0)];s.enemy.automaticAttacks=false;
 const result=simulate(s,data);assert.equal(result.player.healing,55);assert.equal(result.player.hp,555);
 const defense=initialScenario(data);defense.player=fighter(data,'Gragas');defense.player.level=2;defense.player.skills=['Q','W',...defense.player.skills.slice(2)] as SkillKey[];defense.player.overrides={hp:1000,mr:100,mana:500};defense.player.automaticAttacks=false;defense.duration=4;defense.player.actions=[nativeAction(defense.player,data,2)];defense.enemy=fighter(data,'Azir');defense.enemy.level=1;defense.enemy.overrides={hp:1000,ap:0,mr:0};defense.enemy.automaticAttacks=false;defense.enemy.actions=[{id:'incoming',at:1,kind:'spell',key:'Q',name:'Incoming',type:'magic',formula:{base:100,ad:0,bonusAD:0,ap:0,ownMaxHP:0,targetMaxHP:0,targetCurrentHP:0,targetMissingHP:0},cooldown:0,cost:0,cast:0,duration:0,hit:1,onHit:false,custom:true,coverage:'testing'}];assert.equal(simulate(defense,data).player.hp,955);
 const empowered=initialScenario(data);empowered.player=fighter(data,'Gragas');empowered.player.level=2;empowered.player.skills=['Q','W',...empowered.player.skills.slice(2)] as SkillKey[];empowered.player.overrides={hp:1000,mana:500};empowered.player.automaticAttacks=false;empowered.duration=3;empowered.player.actions=[nativeAction(empowered.player,data,2),attackAction(1)];empowered.enemy=fighter(data,'Azir');empowered.enemy.overrides={hp:1000,armor:0,mr:0};empowered.enemy.automaticAttacks=false;const combo=simulate(empowered,data);assert.equal(combo.player.composition.magic,90);
 const mid=initialScenario(data);mid.player=fighter(data,'Gragas');mid.player.level=6;mid.player.skills=['Q','W','E','Q','Q','R','Q','W','Q','W','R','W','W','E','E','R','E','E'] as SkillKey[];mid.player.overrides={hp:1000,mana:500};mid.player.initialHP=.5;mid.player.automaticAttacks=false;mid.duration=20;const q=nativeAction(mid.player,data,0);const wAction=nativeAction(mid.player,data,2);mid.player.actions=[q,{...wAction,at:9}];mid.enemy.automaticAttacks=false;assert.equal(simulate(mid,data).player.healing,55);
});

test('Bard Q official patch adapter matches Riot 26.23 rank table and AP ratio',()=>{
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
 const valid=officialDamageAdapters.find(a=>a.sourceType==='riot');
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


test('Gwen, Hecarim, Heimerdinger and Illaoi expose only scoped, source-traceable impacts',()=>{
 const get=(champion:string,spell:string,calculation:string)=>{const a=officialAdapterFor(champion,spell,calculation,'16.23.1');assert.ok(a,champion+' '+spell);return a;};
 assert.equal(evaluateOfficialAdapter(get('Gwen','GwenQ','MinimumSnips'),5,{ap:100}),226);
 assert.equal(evaluateOfficialAdapter(get('Gwen','GwenQ','MaximumSnips'),5,{ap:100}),350);
 assert.equal(evaluateOfficialAdapter(get('Gwen','GwenR','FirstNeedle'),3,{ap:100}),105);
 assert.equal(evaluateOfficialAdapter(get('Hecarim','HecarimQ','Damage'),5,{ap:0,bonusAD:100}),270);
 assert.equal(evaluateOfficialAdapter(get('Hecarim','HecarimW','TotalDamage'),5,{ap:100}),320);
 assert.equal(evaluateOfficialAdapter(get('Heimerdinger','HeimerdingerQ','TurretShot'),5,{ap:100}),58);
 assert.equal(evaluateOfficialAdapter(get('Heimerdinger','HeimerdingerW','FirstRocket'),5,{ap:100}),205);
 assert.equal(Math.abs(evaluateOfficialAdapter(get('Illaoi','IllaoiW','BonusMaxHealthDamage'),5,{ap:0,ad:200,targetMaxHP:2000})-240)<1e-9,true);
 assert.equal(evaluateOfficialAdapter(get('Illaoi','IllaoiR','Damage'),3,{ap:0,bonusAD:100}),400);
 for(const champion of ['Gwen','Hecarim','Heimerdinger','Illaoi']){
  const coverage=championKitCoverage(champion,data);assert.equal(coverage.status,'partial');assert.equal(coverage.isExactFormula,false);
  assert.ok(nativeOptions[champion].length>0);
 }
 assert.deepEqual(validateOfficialDamageAdapters(),[]);
});



test('Gwen E empowered hit and R recasts are separate modern Summoner’s Rift variants',()=>{
 const get=(calculation:string)=>{const a=officialAdapterFor('Gwen',calculation==='EmpoweredAttack'?'GwenE':'GwenR',calculation,'16.23.1');assert.ok(a);return a;};
 assert.equal(evaluateOfficialAdapter(get('EmpoweredAttack'),5,{ap:100}),35);
 assert.equal(evaluateOfficialAdapter(get('SecondCast'),3,{ap:100,targetMaxHP:2000}),285+30+0.048*2000);
 assert.equal(evaluateOfficialAdapter(get('ThirdCast'),3,{ap:100,targetMaxHP:2000}),475+50+0.08*2000);
 assert.equal(nativeOptions.Gwen.filter(x=>x.calculation==='SecondCast')[0].automatic,false);
 assert.ok(nativeOptions.Gwen.some(x=>x.key==='W'&&x.calculation==='Activate'));
 assert.equal(nativeOptions.Gwen.filter(x=>x.calculation==='ThirdCast')[0].automatic,false);
 assert.deepEqual(validateOfficialDamageAdapters(),[]);
});

test('Hecarim E charge bounds, R riders and Heimerdinger E/R upgraded grenade use base SR values',()=>{
 const get=(champion:string,spell:string,calculation:string)=>{const a=officialAdapterFor(champion,spell,calculation,'16.23.1');assert.ok(a,champion+' '+spell+'/'+calculation);return a;};
 assert.equal(evaluateOfficialAdapter(get('Hecarim','HecarimQ','Damage'),5,{ap:0,bonusAD:100}),270);
 assert.equal(evaluateOfficialAdapter(get('Hecarim','HecarimE','MinimumDamage'),5,{ap:0,bonusAD:100}),140);
 assert.equal(evaluateOfficialAdapter(get('Hecarim','HecarimE','MaximumDamage'),5,{ap:0,bonusAD:100}),280);
 assert.equal(evaluateOfficialAdapter(get('Hecarim','HecarimR','SpectralRiders'),3,{ap:100}),450);
 assert.equal(evaluateOfficialAdapter(get('Heimerdinger','HeimerdingerW','FirstRocket'),5,{ap:100}),205);
 assert.equal(evaluateOfficialAdapter(get('Heimerdinger','HeimerdingerE','Impact'),5,{ap:100}),280);
 assert.equal(evaluateOfficialAdapter(get('Heimerdinger','HeimerdingerR','UpgradedGrenade'),3,{ap:100}),360);
 assert.equal(evaluateOfficialAdapter(get('Illaoi','IllaoiQ','TentacleStrike'),5,{ap:100,ad:200,level:18}),(200.12+220+40)*1.3);
 const illaoi=nativeOptions.Illaoi.find(x=>x.calculation==='TentacleStrike');assert.ok(illaoi);
 assert.ok(nativeOptions.Illaoi.some(x=>x.key==='E'&&x.calculation==='Activate'));
 assert.deepEqual(validateOfficialDamageAdapters(),[]);
});



test('Hecarim Rampage consumes active stacks for damage amplification and cooldown refund',()=>{
 const f=fighter(data,'Hecarim');f.level=1;f.skills=['Q','W','E','Q','Q','R','Q','W','Q','W','R','W','W','E','E','R','E','E'] as SkillKey[];
 const actor=statsFor(f,data),base=statsFor({...f,items:[],overrides:{},runes:{...f.runes,shards:[]}},data),target=statsFor(fighter(data,'Azir'),data),state=kitState(f);
 const first=nativeAction(f,data,0),second=nativeAction(f,data,0);const a=kitImpact(first,f,data,actor,base,target,target.hp,state);const b=kitImpact({...second,at:1},f,data,actor,base,target,target.hp,state);
 assert.ok(a);assert.ok(b);assert.equal(a.damageMultiplier,1);assert.equal(b.damageMultiplier,1.03);assert.equal(b.cooldownReduction,0.75);
});

test('Illaoi Test of Spirit echoes pre-mitigation damage during its seven-second tether',()=>{
 const f=fighter(data,'Illaoi');f.level=1;f.skills=['E','Q','W','Q','Q','R','Q','W','Q','W','R','W','W','E','E','R','E','E'] as SkillKey[];f.actions=[];f.automaticAttacks=false;
 const s=initialScenario(data);s.player=f;s.player.overrides={hp:1000,mana:500,ad:100};s.player.automaticAttacks=false;s.player.actions=[nativeAction(s.player,data,0),attackAction(1)];s.enemy=fighter(data,'Azir');s.enemy.overrides={hp:1000,armor:0,mr:0};s.enemy.automaticAttacks=false;s.duration=3;
 const result=simulate(s,data);const attack=result.events.find(e=>e.source==='Ataque básico');assert.ok(attack);assert.ok(attack.raw>100);assert.ok(result.player.damage>100);
});

test('Graves Summoner’s Rift Q, W and R use current modern kit formulas',()=>{
 const initial=officialAdapterFor('Graves','GravesQ','InitialHit','16.23.1');assert.ok(initial);
 assert.deepEqual(initial.baseByRank,[50,75,100,125,150]);assert.equal(evaluateOfficialAdapter(initial,5,{ap:0,bonusAD:100}),215);
 const det=officialAdapterFor('Graves','GravesQ','Detonation','16.23.1');assert.ok(det);
 assert.deepEqual(det.bonusADRatioByRank,[0.55,0.7,0.85,1,1.15]);assert.equal(evaluateOfficialAdapter(det,5,{ap:0,bonusAD:100}),375);
 const smoke=officialAdapterFor('Graves','GravesW','Impact','16.23.1');assert.ok(smoke);assert.equal(evaluateOfficialAdapter(smoke,5,{ap:100}),320);
 const direct=officialAdapterFor('Graves','GravesR','DirectHit','16.23.1');assert.ok(direct);assert.equal(evaluateOfficialAdapter(direct,3,{ap:0,bonusAD:100}),725);
 const cone=officialAdapterFor('Graves','GravesR','ConeExplosion','16.23.1');assert.ok(cone);assert.equal(evaluateOfficialAdapter(cone,3,{ap:0,bonusAD:100}),560);
 const coverage=championKitCoverage('Graves',data);assert.equal(coverage.status,'partial');assert.deepEqual(coverage.covered,['Q','W','R','E']);assert.deepEqual(coverage.missing,['P']);
 assert.equal(nativeOptions.Graves.length,6);assert.equal(nativeOptions.Graves[1].automatic,false);assert.equal(nativeOptions.Graves[4].automatic,false);
 assert.equal(kitDeclarations.Graves.abilities.Q.name,'End of the Line');assert.deepEqual(validateOfficialDamageAdapters(),[]);
});
