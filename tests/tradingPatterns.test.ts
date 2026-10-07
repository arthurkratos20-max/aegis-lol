import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {Dataset} from '../src/contracts.ts';
import {initialScenario} from '../src/model.ts';
import {quickScenario} from '../src/quickScenario.ts';
import {calculateOptimalRunes,matchupRuneReason} from '../src/runeOptimizer.ts';
import {matchupTradeProfile,tradingKeystoneAllowed} from '../src/tradingPatterns.ts';
import {quickRecommendation} from '../src/quickRecommendation.ts';
const data:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));
function scenario(champion:string,enemy:string){const s=initialScenario(data);s.player.champion=champion;s.player.lane=champion==='Leona'?'Support':champion==='Shen'?'Top':'Bot';s.matchupUnknown=enemy==='unknown';if(enemy!=='unknown')s.enemy.champion=enemy;return quickScenario(s,data);}
const page=(champion:string,enemy:string)=>{const s=scenario(champion,enemy);return calculateOptimalRunes(s,data,s.weights,true);};
test('ADC trade windows switch keystones only when immediate attack synergy is reviewed',()=>{
 assert.equal(page('Kaisa','Zed').selected[0],9923);
 assert.equal(page('Kaisa','Garen').selected[0],8008);
 assert.equal(page('Jinx','Caitlyn').selected[0],8021);
 assert.equal(page('Jinx','Zed').selected[0],8008);
 assert.equal(tradingKeystoneAllowed(9923,scenario('Jinx','Zed'),data),false);
});
test('mages, assassins, tanks and fighters use compatible short or sustained alternatives',()=>{
 assert.equal(page('Ahri','Zed').selected[0],8112);
 assert.equal(page('Cassiopeia','Garen').selected[0],8010);
 assert.equal(page('Zed','Zed').selected[0],8112);
 assert.equal(page('Shen','Zed').selected[0],8439);
 assert.equal(page('Shen','Garen').selected[0],8437);
 assert.equal(page('Renekton','Zed').selected[0],9923);
 assert.equal(page('Renekton','Garen').selected[0],8010);
 for(const id of ['Xerath','Velkoz','Ziggs','Lux'])for(const key of [8008,9923,8010])assert.equal(tradingKeystoneAllowed(key,scenario(id,'Zed'),data),false);
});
test('profiles distinguish reviewed poke from generic range, and unknown opponent has no trade bonus',()=>{
 assert.equal(matchupTradeProfile(scenario('Kaisa','unknown'),data).pattern,'neutral');
 assert.equal(matchupTradeProfile(scenario('Kaisa','Caitlyn'),data).pattern,'pressure');
 assert.equal(matchupTradeProfile(scenario('Kaisa','Zed'),data).pattern,'short');
 assert.equal(matchupTradeProfile(scenario('Kaisa','Garen'),data).pattern,'sustained');
 const s=scenario('Kaisa','unknown'),base=calculateOptimalRunes(s,data,s.weights,true);s.enemy.champion='Zed';
 assert.deepEqual(calculateOptimalRunes(s,data,s.weights,true),base);
});
test('full recommendation explains a keystone migration and preserves full, rune and tree locks',()=>{
 const s=scenario('Kaisa','Zed'),rec=quickRecommendation(s,data),reason=matchupRuneReason(s,data,rec.runes);
 assert.match(reason,/Mudança de Ritmo Fatal para Chuva de Lâminas/);assert.match(reason,/Zed/);assert.match(reason,/reset de ataque/);
 const baseline=page('Kaisa','unknown');s.player.runes={...baseline,locked:true};
 assert.deepEqual(calculateOptimalRunes(s,data,s.weights,true),s.player.runes);
 s.player.runes={...baseline,locked:false,locks:{runes:[8008]}};
 assert.ok(calculateOptimalRunes(s,data,s.weights,true).selected.includes(8008));
 s.player.runes={...baseline,locked:false,locks:{primaryTree:true}};
 assert.equal(calculateOptimalRunes(s,data,s.weights,true).primary,8000);
});
test('all champions in five lanes recommend only synergistic available keystones',()=>{
 for(const champion of Object.keys(data.champions))for(const lane of ['Top','Jungle','Mid','Bot','Support'])for(const enemy of ['unknown','Zed','Garen','Caitlyn']){
  const s=scenario(champion,enemy);s.player.lane=lane;
  const result=calculateOptimalRunes(s,data,s.weights,true),key=result.selected[0];
  assert.ok(tradingKeystoneAllowed(key,s,data),`${champion}/${lane}/${enemy}: ${key}`);
  assert.ok(data.runes.find(t=>t.id===result.primary)?.slots[0].runes.some(r=>r.id===key));
 }
});
