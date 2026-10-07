import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import type {Dataset} from '../src/contracts.ts';
import {hasDocumentedNonDamageImpact} from '../src/abilityModel.ts';
import {initialScenario,fighter} from '../src/model.ts';
import {withSkillPlans} from '../src/skillOrders.ts';
import {evaluateBuild} from '../src/buildEvaluation.ts';
const data:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));
test('official vision and shield-only abilities do not receive artificial direct damage',()=>{
 assert.ok(hasDocumentedNonDamageImpact(data.champions.Ashe.spells[2]));
 assert.ok(hasDocumentedNonDamageImpact(data.champions.Lux.spells[1]));
 assert.equal(hasDocumentedNonDamageImpact(data.champions.Ashe.spells[1]),false);
 assert.equal(hasDocumentedNonDamageImpact(data.champions.Lux.spells[0]),false);
});
test('changing cooldown of Hawkshot cannot raise estimated damage throughput',()=>{
 const s=initialScenario(data);s.player=fighter(data,'Ashe');const a=withSkillPlans(s,data),before=evaluateBuild([],a,data);
 const copy=structuredClone(data);copy.champions.Ashe.spells[2].cooldown=[1,1,1,1,1];
 const after=evaluateBuild([],a,copy);assert.equal(after.dps,before.dps);assert.equal(after.isExactFormula,false);
});
