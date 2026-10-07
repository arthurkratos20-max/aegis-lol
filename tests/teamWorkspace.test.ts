import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import type {Dataset} from '../src/contracts.ts';import {initialScenario} from '../src/model.ts';import {teamWorkspace,updateTeamWorkspace,editTeamSlot} from '../src/teamWorkspace.ts';
const data:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));
test('shared composition keeps actual lane and unknown slots without inventing champions',()=>{const s=initialScenario(data);s.player.lane='Bot';s.matchupUnknown=true;const d=teamWorkspace(s,data);assert.equal(d.active,3);assert.equal(d.own[3],'Jinx');assert.deepEqual(d.enemy,['','','','','']);assert.equal(d.own.filter(Boolean).length,1);});
test('migration keeps the populated legacy draft instead of discarding four enemies',()=>{const s=initialScenario(data);s.player.lane='Bot';s.enemy.champion='Aatrox';s.draft={active:3,own:['Shen','MasterYi','Ahri','Jinx','Lulu'],enemy:['Malphite','LeeSin','Syndra','Aatrox','Leona']};s.enemyTeam=['Aatrox','','','',''];const d=teamWorkspace(s,data);assert.deepEqual(d.enemy,s.draft.enemy);const next=updateTeamWorkspace(s,d);assert.deepEqual(next.enemyTeam,next.draft!.enemy);assert.deepEqual(next.allies,['Shen','MasterYi','Ahri','Lulu']);assert.deepEqual(next.weights,s.weights);assert.deepEqual(teamWorkspace(next,data),d);});
test('clearing shared slots remains cleared for both analysis and draft',()=>{const s=initialScenario(data),d=teamWorkspace(s,data);let next=editTeamSlot(s,data,'enemy',0,'Lux');next=editTeamSlot(next,data,'enemy',0,'');assert.deepEqual(teamWorkspace(next,data).enemy,['','','','','']);});

import {reconcilePatch} from '../src/patchService.ts';
test('shared empty slots survive patch reconciliation and reload',()=>{const s=initialScenario(data);s.matchupUnknown=true;const next=editTeamSlot(s,data,'enemy',0,'Lux'),loaded=reconcilePatch(next,data).scenario;assert.deepEqual(loaded.draft!.enemy,['Lux','','','','']);assert.equal(loaded.draft!.own.filter(Boolean).length,1);});

test('changing lane moves the player and direct opponent, swaps occupants and preserves other roles',()=>{
 const s=initialScenario(data);s.player.lane='Bot';s.enemy.champion='Caitlyn';s.matchupUnknown=false;
 s.draft={active:3,own:['Shen','MasterYi','Ahri','Jinx','Lulu'],enemy:['Malphite','LeeSin','Syndra','Caitlyn','Leona']};s.enemyTeam=[...s.draft.enemy];
 const next={...s,player:{...s.player,lane:'Mid'}},d=teamWorkspace(next,data);
 assert.equal(d.active,2);assert.deepEqual(d.own,['Shen','MasterYi','Jinx','Ahri','Lulu']);assert.deepEqual(d.enemy,['Malphite','LeeSin','Caitlyn','Syndra','Leona']);
 const synced=updateTeamWorkspace(next,d);assert.deepEqual(teamWorkspace(synced,data),d);assert.equal(new Set(d.own).size,5);
});
test('editing own position and opponent updates the laboratory; teammates do not change the player',()=>{
 let s=initialScenario(data);s.player.lane='Bot';s.matchupUnknown=true;
 s=editTeamSlot(s,data,'own',3,'Ashe');assert.equal(s.player.champion,'Ashe');assert.equal(s.player.lane,'Bot');assert.equal(teamWorkspace(s,data).own[3],'Ashe');
 s=editTeamSlot(s,data,'enemy',3,'Caitlyn');assert.equal(s.enemy.champion,'Caitlyn');assert.equal(s.matchupUnknown,false);
 s=editTeamSlot(s,data,'own',2,'Ahri');assert.equal(s.player.champion,'Ashe');assert.deepEqual(s.allies,['','','Ahri','']);
 assert.equal(editTeamSlot(s,data,'own',3,''),s);assert.equal(editTeamSlot(s,data,'own',0,'Ahri'),s);
 s=editTeamSlot(s,data,'enemy',3,'');assert.equal(s.matchupUnknown,true);assert.equal(teamWorkspace(s,data).enemy[3],'');
});
test('top champion changes are reflected without leaving a stale player in the composition',()=>{
 let s=initialScenario(data);s.player.lane='Bot';s.matchupUnknown=true;s=updateTeamWorkspace(s,teamWorkspace(s,data));
 s={...s,player:{...s.player,champion:'Ashe'}};const d=teamWorkspace(s,data);assert.equal(d.own[3],'Ashe');assert.equal(d.own.includes('Jinx'),false);
});
