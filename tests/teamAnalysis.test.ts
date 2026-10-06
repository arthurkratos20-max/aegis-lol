import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {Dataset} from '../src/contracts.ts';
import {analyzeTeam} from '../src/teamAnalysis.ts';
const data:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));
test('unknown team does not fabricate champions or capabilities',()=>{const t=analyzeTeam(['','','missing'],data);assert.equal(t.selected,0);assert.equal(t.healing,0);assert.equal(t.cc,0);});
test('duplicates count once and kit protection differs from frontline',()=>{const t=analyzeTeam(['Soraka','Soraka','Shen'],data);assert.equal(t.selected,2);assert.equal(t.healing,1);assert.equal(t.shields,1);assert.equal(t.tanks,1);assert.ok(t.synergies.length);});
test('every champion has bounded finite team indicators',()=>{for(const id of Object.keys(data.champions)){const t=analyzeTeam([id],data);for(const key of ['healing','shields','cc','tanks','burst','physical','magic','mixed'] as const)assert.ok(t[key]>=0&&t[key]<=1,id);assert.equal(t.physical+t.magic+t.mixed,1);}});
