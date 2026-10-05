import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {Dataset} from '../src/contracts.ts';
import {attachItemGroups,canAddItemToBuild,exclusiveGroupsValid} from '../src/itemGroups.ts';
import {greedyContinuousBuild} from '../src/continuousBuild.ts';
import {initialScenario,fighter} from '../src/model.ts';
import {legalBuild} from '../src/optimizer.ts';
const data=attachItemGroups(JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8')) as Dataset);
test('all curated exclusive families reject every pair, including Stridebreaker',()=>{
 for(const ids of [['3074','3748','6698','6631'],['3053','3156','6673'],['3036','3033','6694'],['3135','3137'],['3140','3139'],['3100','3078','6632','6662']]){
  for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)assert.equal(exclusiveGroupsValid([ids[i],ids[j]],data),false);
 }
 assert.equal(data.items['6631'].exclusiveGroup,'tiamat');
 assert.equal(canAddItemToBuild(data.items['6631'],[data.items['3748']]),false);
 assert.equal(exclusiveGroupsValid(['3748','3031'],data),true);
 // Mikael does not inherit Quicksilver merely because it cleanses an ally.
 assert.equal(exclusiveGroupsValid(['3222','3139'],data),true);
});
test('explicit catalogue metadata supports new groups without engine changes',()=>{
 const custom={...data,items:{...data.items,a:{...data.items['3031'],exclusiveGroup:'custom'},b:{...data.items['3072'],exclusiveGroup:'custom'}}};
 assert.equal(exclusiveGroupsValid(['a','b'],custom),false);
 assert.equal(canAddItemToBuild(custom.items.a,[custom.items.b]),false);
 assert.equal(canAddItemToBuild({...custom.items.a,exclusiveGroup:undefined},[custom.items.b]),true);
});
test('locked Hydra survives every slider value; conflicts are rejected by both searches',()=>{
 const s=initialScenario(data);s.player=fighter(data,'Volibear');s.player.locked=['3748'];
 for(let value=0;value<=100;value++){
  s.weights={offense:value,defense:100-value,utility:0};
  const build=greedyContinuousBuild(s,data).target;
  assert.ok(build.includes('3748'));assert.ok(!build.includes('6631'));assert.ok(exclusiveGroupsValid(build,data));
 }
 s.player.locked=['3748','6631'];
 assert.throws(()=>greedyContinuousBuild(s,data),/grupos exclusivos/);
 assert.equal(legalBuild(['3748','6631'],s,data),false);
});
