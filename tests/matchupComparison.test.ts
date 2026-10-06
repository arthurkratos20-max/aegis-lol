import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {Dataset,Action} from '../src/contracts.ts';
import {EMPTY_FORMULA} from '../src/contracts.ts';
import {initialScenario,statsFor} from '../src/model.ts';
import {attributeDifference,compareMatchup,matchupMitigation} from '../src/matchupComparison.ts';
const data:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));
function scenario(){const s=initialScenario(data);s.duration=10;s.distance=0;for(const f of [s.player,s.enemy]){f.items=[];f.actions=[];f.uptime=1;f.overrides={hp:1000,ad:100,as:1,crit:0,armor:100,mr:100,armorPen:0,magicPen:0,armorPenPercent:0,magicPenPercent:0};}return s;}
const spell=(type:Action['type']):Action=>({id:'q',key:'Q',at:0,kind:'spell',name:'Q',type,formula:{...EMPTY_FORMULA,base:1000},cooldown:0,cost:0,cast:0,duration:0,hit:1,onHit:false,custom:true,coverage:'testing'});
test('class fallback computes estimated DPS, reciprocal TTK and matchup EHP',()=>{
 const s=scenario();s.player.automaticAttacks=false;s.enemy.automaticAttacks=false;
 const r=compareMatchup(s,data);assert.equal(r.player.basis,'class');assert.ok(r.player.dps>50);assert.equal(r.player.ttk,1000/r.player.dps);assert.equal(r.enemy.ehp,2000);
 s.player.overrides.armorPenPercent=.5;s.player.overrides.armorPen=20;
 const penetrated=compareMatchup(s,data);assert.ok(Math.abs(penetrated.enemy.physicalReduction-30/130)<1e-12);assert.ok(Math.abs(penetrated.enemy.ehp-1300)<1e-9);assert.equal(penetrated.player.ttk,1000/penetrated.player.dps);
});
test('configured magic and true combos define EHP composition; no assumed repeated cast',()=>{
 const s=scenario();s.player.actions=[spell('magic')];s.player.automaticAttacks=false;
 s.enemy.overrides.mr=300;
 let r=compareMatchup(s,data);assert.equal(r.player.basis,'combo');assert.equal(r.player.dps,25);assert.equal(r.player.ttk,40);assert.equal(r.enemy.ehp,4000);
 s.player.actions=[spell('true')];r=compareMatchup(s,data);assert.equal(r.player.dps,100);assert.equal(r.enemy.ehp,1000);
});
test('zero DPS and zero attribute baselines never produce NaN; negative resistance amplifies',()=>{
 const s=scenario();s.player.uptime=0;assert.equal(compareMatchup(s,data).player.ttk,Infinity);
 assert.deepEqual(attributeDifference(0,0),{absolute:0,percent:0});assert.equal(attributeDifference(10,0).percent,null);
 const x=statsFor(s.enemy,data);x.armor=-100;assert.equal(matchupMitigation(x,statsFor(s.player,data)).physicalReduction,-.5);
});
test('build edits immediately change metrics and conditional availability badges',()=>{
 const s=scenario();s.enemy.overrides.lifesteal=.1;s.enemy.overrides.hp=4000;s.player.items=['3033','3156'];
 const before=compareMatchup(s,data);assert.deepEqual(before.badges.map(b=>b.id),['healing','defense','tank']);
 s.player.items=[];assert.equal(compareMatchup(s,data).badges.length,0);
 delete s.player.overrides.ad;s.player.items=['3031'];const after=compareMatchup(s,data);s.player.items=[];assert.ok(after.player.dps>compareMatchup(s,data).player.dps);
});
