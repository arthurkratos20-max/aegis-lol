import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {Dataset} from '../src/contracts.ts';
import {initialScenario,fighter} from '../src/model.ts';
import {normalizeDraft,DRAFT_LANES} from '../src/draft.ts';
import {applyCounter,contextualRecommendation} from '../src/contextRecommendations.ts';
import {reconcilePatch} from '../src/patchService.ts';
const data:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));
test('all champions initialize distinct five-slot teams and active champion in selected lane',()=>{
 for(const id of Object.keys(data.champions))for(const lane of DRAFT_LANES){const s=initialScenario(data);s.player={...fighter(data,id),lane};s.enemy=fighter(data,id);const d=normalizeDraft(s,data);assert.equal(d.own[d.active],id);assert.equal(DRAFT_LANES[d.active],lane);for(const team of [d.own,d.enemy]){assert.equal(team.length,5);assert.equal(new Set(team).size,5);assert.ok(team.every(id=>data.champions[id]));}}
});
test('legacy duplicate or extinct draft slots repaired preserving active champion and valid selections',()=>{
 const s=initialScenario(data);s.draft={own:['Shen','Shen','missing','Shen','Lulu'],enemy:['Jinx','Jinx','missing'],active:3};const before=JSON.stringify(s);const d=normalizeDraft(s,data);assert.equal(d.own[3],'Shen');assert.equal(d.own[4],'Lulu');assert.equal(new Set(d.own).size,5);assert.equal(new Set(d.enemy).size,5);assert.equal(JSON.stringify(s),before);assert.deepEqual(reconcilePatch(s,data).scenario.draft,d);
 s.draft.active=NaN;assert.ok(Number.isInteger(normalizeDraft(s,data).active));
});
test('applying a default draft persists all enemies and slot lane, preserving current inventory and weights',()=>{
 const s=initialScenario(data);s.player={...fighter(data,'Shen'),lane:'Top',owned:['1001'],locked:['1001']};const d=normalizeDraft(s,data);const rec=contextualRecommendation(s,data,'Shen',d.enemy,'Draft 5v5','draft',DRAFT_LANES[d.active]);const next=applyCounter(s,data,rec.preset);assert.deepEqual(next.draft,d);assert.equal(next.counterPreset?.mode,'draft');assert.equal(next.player.lane,'Top');assert.deepEqual(next.player.owned,s.player.owned);assert.deepEqual(next.weights,s.weights);
});
test('different active draft champion uses slot lane and leaves current scenario untouched until applied',()=>{
 const s=initialScenario(data);s.draft=normalizeDraft(s,data);s.draft.own[4]='Lux';s.draft.active=4;const before=JSON.stringify(s);const r=contextualRecommendation(s,data,'Lux',s.draft.enemy,'Draft 5v5','draft','Support');assert.equal(r.preset.lane,'Support');assert.equal(JSON.stringify(s),before);const next=applyCounter(s,data,r.preset);assert.equal(next.player.champion,'Lux');assert.equal(next.player.lane,'Support');assert.equal(next.player.level,s.player.level);
});
