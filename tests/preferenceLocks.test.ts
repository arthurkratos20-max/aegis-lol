import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {Dataset,Scenario} from '../src/contracts.ts';
import {fighter,initialScenario} from '../src/model.ts';
import {fullBuild} from '../src/fullBuild.ts';
import {compareMatchup} from '../src/matchupComparison.ts';
const data:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));
test('objective and preference recalculation preserves exact locked components and their slots',()=>{
 const s=initialScenario(data);s.player=fighter(data,'Jinx');s.enemy=fighter(data,'Lux');s.matchupUnknown=false;
 s.player.items=['1036','1001'];s.player.locked=[...s.player.items];
 const base=fullBuild(s,data);s.player.runes=base.runes;s.player.runes.locked=true;
 const before=JSON.stringify(s.player);const builds=[];
 for(const weights of [{offense:100,defense:0,utility:0},{offense:0,defense:100,utility:0},{offense:0,defense:0,utility:100}])for(const objective of ['burst','dps','single'] as const){
  const next:Scenario={...s,weights,objective,defensiveObjective:weights.defense?'sustain':'combo',subweights:{HP:weights.defense}};
  const rec=fullBuild(next,data);assert.equal(rec.target[0],'1036');assert.equal(rec.target[1],'1001');assert.equal(new Set(rec.target).size,6);assert.deepEqual(rec.runes,s.player.runes);
  const duel=compareMatchup({...next,player:{...s.player,items:rec.target,runes:rec.runes}},data);
  assert.ok(Number.isFinite(duel.player.ehp)&&Number.isFinite(duel.player.dps)&&Number.isFinite(duel.player.ttk));builds.push(rec.target.join(','));
 }
 assert.ok(new Set(builds).size>1,'Free slots must respond to preferences');assert.equal(JSON.stringify(s.player),before);
});
test('partially locked runes and shards survive preference changes while free choices recalculate',()=>{
 const s=initialScenario(data);s.player=fighter(data,'Jinx');s.enemy=fighter(data,'Lux');s.matchupUnknown=false;
 s.player.runes=fullBuild(s,data).runes;const keystone=s.player.runes.selected[0],shard=s.player.runes.shards[0];s.player.runes.locks={runes:[keystone],shards:[0]};
 for(const offense of [0,25,50,75,100]){const rec=fullBuild({...s,weights:{offense,defense:100-offense,utility:0}},data);assert.equal(rec.runes.selected[0],keystone);assert.equal(rec.runes.shards[0],shard);}
});
