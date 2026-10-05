import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculateMatchupCounter,calculateDraftCounter,rankCounterCandidates,type Champion} from '../src/counterEvaluation.ts';
import {contextualRecommendation} from '../src/contextRecommendations.ts';
import {initialScenario} from '../src/model.ts';
import type {Dataset} from '../src/contracts.ts';
const mine:Champion={id:'self',name:'Self',damageType:'physical',tags:[]};
const enemy:Champion={id:'enemy',name:'Enemy',damageType:'magic',tags:['tank','hard-cc','burst','healing','shields']};
test('selected attributes and tags change the evaluation immediately without changing inputs',()=>{
 const before=JSON.stringify(enemy),a=calculateMatchupCounter(mine,enemy);
 assert.equal(a.enemyCount,1);assert.equal(a.priorities['magic-resist'],3);assert.equal(a.priorities['armor-penetration'],3);assert.equal(a.priorities['magic-penetration'],undefined);assert.equal(a.priorities['anti-shield'],2);
 const b=calculateMatchupCounter(mine,{...enemy,damageType:'physical',tags:[]});assert.equal(b.priorities.armor,3);assert.equal(b.priorities['anti-tank'],undefined);assert.equal(JSON.stringify(enemy),before);
});
test('draft ignores duplicate champions, caps five selections, and handles an empty selection',()=>{
 const a=calculateDraftCounter(mine,[enemy,enemy]);assert.deepEqual(a,calculateMatchupCounter(mine,enemy));
 const b=calculateDraftCounter(mine,Array.from({length:100},(_,i)=>({...enemy,id:String(i)})));assert.equal(b.enemyCount,5);assert.equal(b.priorities['magic-resist'],15);
 assert.deepEqual(calculateDraftCounter(mine,[]),{enemyCount:0,priorities:{},reasons:[]});
});
test('mixed and true damage priorities; ineligible candidates excluded and duplicate tags counted once',()=>{
 const a=calculateMatchupCounter(mine,{...enemy,damageType:'mixed',tags:[]});assert.equal(a.priorities.armor,1.5);assert.equal(a.priorities['magic-resist'],1.5);
 assert.equal(calculateMatchupCounter(mine,{...enemy,damageType:'true',tags:[]}).priorities.health,3);
 const candidates=[{id:'b',name:'B',tags:['armor','armor']},{id:'a',name:'A',tags:['armor']},{id:'blocked',name:'Blocked',tags:['armor'],isEligible:()=>false}];
 assert.deepEqual(rankCounterCandidates(mine,candidates,a).map(r=>[r.candidate.id,r.score]),[['a',1.5],['b',1.5]]);
});
test('live snapshot metadata controls contextual ranking; locked runes stay intact',()=>{
 const original:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));
 const data={...original,champions:{...original.champions,Jinx:{...original.champions.Jinx,counterTraits:{damageType:'physical' as const,hasShields:true,hasHealing:true}}}};
 const s=initialScenario(data);s.player.runes={primary:8000,secondary:8400,selected:[8008,8009,9104,8017,8473,8451],shards:['adaptive','adaptive','hp'],locked:true};
 const rec=contextualRecommendation(s,data,'Jinx',['Jinx','Jinx'],'Draft','draft');assert.equal(rec.evaluation.enemyCount,1);assert.equal(rec.evaluation.priorities['anti-shield'],2);assert.equal(rec.evaluation.priorities['anti-healing'],2);assert.deepEqual(rec.preset.runes,s.player.runes);
 const matchup=contextualRecommendation(s,data,'Jinx',['Jinx','Malphite'],'Matchup','matchup');assert.equal(matchup.evaluation.enemyCount,1);
});
