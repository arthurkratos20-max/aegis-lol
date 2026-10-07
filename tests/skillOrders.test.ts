import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {Dataset} from '../src/contracts.ts';
import {fighter,initialScenario,skillValid} from '../src/model.ts';
import {baseSkillPlan,skillPlan,withSkillPlans} from '../src/skillOrders.ts';
import {skillOrderSnapshot} from '../src/skillOrderSnapshot.ts';
const data:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));
test('all 173 champions have sourced priorities and every route has a legal complete path or explicit Aphelios attribute exception',()=>{
 assert.equal(Object.keys(skillOrderSnapshot.champions).length,173);
 for(const id of Object.keys(data.champions))for(const lane of ['Top','Jungle','Mid','Bot','Support']){
  const p=baseSkillPlan(data,id,lane);assert.ok(p.source);assert.ok(p.games>0);
  if(id==='Aphelios'){assert.equal(p.coverage,'special');assert.deepEqual(p.sequence,[]);continue;}
  assert.equal(p.sequence.length,18,`${id} ${lane}`);assert.ok(skillValid(p.sequence,data,id),`${id} ${lane}`);
  if(p.coverage==='observed'){assert.equal(p.sourceLane,lane);assert.ok(p.games>=100);}
 }
});
test('openings differ from max order for Ashe, Sett, Urgot, Tryndamere and Ekko',()=>{
 const expected:[string,string,string,string][]=[['Ashe','Bot','WQE','WQE'],['Sett','Top','EQW','QWE'],['Urgot','Top','EWQ','WEQ'],['Tryndamere','Top','EQW','QEW'],['Ekko','Mid','QEW','QEW'],['Garen','Top','EQW','EQW']];
 for(const [id,lane,opening,priority]of expected){const p=baseSkillPlan(data,id,lane);assert.equal(p.opening.join(''),opening,id);assert.equal(p.priority.join(''),priority,id);}
});
test('context variants stay legal against every enemy and never delay Urgot rank-five W beyond level nine',()=>{
 for(const id of ['Urgot','Darius','Sett'])for(const enemy of Object.keys(data.champions)){
  const s=initialScenario(data);s.player=fighter(data,id);s.enemy=fighter(data,enemy);const p=skillPlan(s,data);
  assert.ok(skillValid(p.sequence,data,id));for(const a of p.alternatives)assert.ok(skillValid(a.sequence,data,id));
  if(id==='Urgot')for(const a of p.alternatives.filter(a=>a.label==='Pressão com segundo Q')){assert.equal(a.sequence[3],'Q');assert.equal(a.sequence.slice(0,9).filter(k=>k==='W').length,5);}
 }
 const s=initialScenario(data);s.player=fighter(data,'Sett');s.enemy=fighter(data,'Vayne');assert.equal(skillPlan(s,data).priority[0],'W');s.matchupUnknown=true;assert.equal(skillPlan(s,data).priority[0],'Q');
});
test('automatic path updates on lane/matchup while manual choices and imported custom paths remain intact',()=>{
 const s=initialScenario(data);s.player=fighter(data,'Urgot');s.enemy=fighter(data,'Vayne');const before=JSON.stringify(s),auto=withSkillPlans(s,data);assert.equal(JSON.stringify(s),before);assert.equal(auto.player.skills[3],'Q');
 const manual={...auto,player:{...auto.player,skillMode:'manual' as const}};manual.enemy=fighter(data,'Darius');assert.deepEqual(withSkillPlans(manual,data).player.skills,auto.player.skills);
 const legacy={...manual,player:{...manual.player,skillMode:undefined}};assert.equal(withSkillPlans(legacy,data).player.skillMode,'manual');
});
test('skill legality handles Jayce auto-R, transformation champions, Zilean and Udyr sixth-rank gate',()=>{
 for(const id of ['Jayce','Elise','Nidalee','Karma','Zilean','Udyr'])assert.ok(skillValid(baseSkillPlan(data,id,'Jungle').sequence,data,id));
 assert.equal(skillValid(['R'],data,'Jayce'),false);
 const u=baseSkillPlan(data,'Udyr','Jungle').sequence;for(const key of ['Q','W','E','R'])assert.ok(u.slice(0,15).filter(k=>k===key).length<=5);
});
test('every displayed alternative is legal and manual application survives a different matchup',()=>{
 let alternatives=0;
 for(const id of Object.keys(data.champions))for(const lane of ['Top','Jungle','Mid','Bot','Support']){
  const s=initialScenario(data);s.player={...fighter(data,id),lane};s.matchupUnknown=true;
  for(const a of skillPlan(s,data).alternatives){
   alternatives++;assert.equal(a.sequence.length,18);assert.ok(skillValid(a.sequence,data,id));
   const manual={...s,matchupUnknown:false,enemy:fighter(data,'Vayne'),player:{...s.player,skills:a.sequence,skillMode:'manual' as const}};
   assert.deepEqual(withSkillPlans(manual,data).player.skills,a.sequence);
  }
 }
 assert.ok(alternatives>100);
});
