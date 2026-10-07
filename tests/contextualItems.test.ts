import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {Dataset} from '../src/contracts.ts';
import {fighter,initialScenario,itemEligible} from '../src/model.ts';
import {contextualResponse} from '../src/contextualItems.ts';
import {itemCompatible} from '../src/compatibility.ts';
import {exclusiveGroupsValid,evaluateBuild} from '../src/buildEvaluation.ts';
import {enemyAxis} from '../src/recommendation.ts';
import {quickScenario} from '../src/quickScenario.ts';
import {quickRecommendation} from '../src/quickRecommendation.ts';
import {skillPlan} from '../src/skillOrders.ts';
import {skillValid} from '../src/skillRules.ts';
import {greedyContinuousBuild} from '../src/continuousBuild.ts';
const data:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));
test('all champion/lane/opponent policies stay compatible and every skill path stays legal',()=>{
 let checked=0;const ids=Object.keys(data.champions),s=initialScenario(data);
 for(const id of ids)for(const lane of ['Top','Jungle','Mid','Bot','Support']){
  s.player={...fighter(data,id),lane};
  for(const enemy of [null,...ids]){
   s.enemy={...fighter(data,enemy??'Darius'),lane};s.matchupUnknown=enemy===null;
   const p=contextualResponse(s,data);
   if(p.id){assert.ok(itemEligible(p.id,data,id)&&itemCompatible(p.id,s.player,data).allowed,`${id} ${lane} ${enemy}: ${p.id}`);assert.ok(exclusiveGroupsValid([p.id],data));}
   if(enemy===null)assert.equal(p.id,undefined);
   if(id!=='Aphelios')assert.ok(skillValid(skillPlan(s,data,'player',false).sequence,data,id),`${id} ${lane} ${enemy}`);
   checked++;
  }
 }
 console.log(`Exhaustive contextual policy/skill audit: ${checked} scenarios; no claim of individually reviewed matchups.`);
});
test('each class gets a compatible physical versus magical response',()=>{
 for(const [id,lane] of [['Ahri','Mid'],['Darius','Top'],['Shen','Top'],['Zed','Mid'],['Lulu','Support'],['Mordekaiser','Top'],['Ashe','Bot']]){
  const s=initialScenario(data);s.player={...fighter(data,id),lane};s.matchupUnknown=false;
  s.enemy=fighter(data,'Caitlyn');const physical=quickRecommendation(quickScenario(s,data),data);
  s.enemy=fighter(data,'Lux');const magic=quickRecommendation(quickScenario(s,data),data);
  if(id==='Lulu'){assert.ok(physical.target.includes('3222'));assert.ok(magic.target.includes('3222'));}else assert.notDeepEqual(physical.target,magic.target,id);
 }
});
test('damage classification is shared by matchup responses and EHP',()=>{
 const s=initialScenario(data);s.matchupUnknown=false;
 for(const id of ['Zac','Amumu','Rammus','Malphite']){s.enemy=fighter(data,id);assert.equal(enemyAxis(s,data),'magic');}
 s.matchupUnknown=true;assert.equal(enemyAxis(s,data),'mixed');
});
test('AP fighters and tanks respond monotonically to AP in the estimated rotation',()=>{
 const s=initialScenario(data);
 for(const id of ['Mordekaiser','Rumble','Zac','Amumu']){
  s.player=fighter(data,id);const base=evaluateBuild([],s,data),ap=evaluateBuild(['1052'],s,data);
  assert.ok(ap.dps>base.dps,id);assert.equal(ap.isExactFormula,false);
 }
});
test('contextual item scores are bounded and their strategic sum excludes duplicate counter bonuses',()=>{
 const s=quickScenario(initialScenario(data),data),w=s.weights,total=w.offense+w.defense+w.utility;
 const r=greedyContinuousBuild(s,data,'balanced',true);
 for(const d of r.decisions)for(const row of d.candidates){assert.ok(Number.isFinite(row.score)&&row.score>=0&&row.score<=1+1e-12);const expected=.8*(w.offense/total*row.normalizedOffense+w.defense/total*row.normalizedEHP+w.utility/total*row.normalizedUtility)+(row.affinityBonus??0)+(row.contextualBonus??0);assert.ok(Math.abs(row.score-expected)<1e-12);}
 assert.equal(total,100);
});

test('support utility responds to removable CC rather than forcing armor/MR on every ally protection build',()=>{
 const s=initialScenario(data);s.player={...fighter(data,'Lulu'),lane:'Support'};s.matchupUnknown=false;
 s.enemy=fighter(data,'Lux');const cc=contextualResponse(s,data);assert.equal(cc.id,'3222');
 s.enemy=fighter(data,'Zed');const burst=contextualResponse(s,data);assert.equal(burst.id,'3190');assert.notEqual(cc.trait,burst.trait);
});
