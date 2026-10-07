import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {Dataset} from '../src/contracts.ts';
import {fetchPatchCatalog,latestRiotPatch,comparePatch,patchLabel,validatePatchCatalog,applyOfficialPatchCorrections,newestCatalog} from '../src/patchCatalog.ts';
import {loadPatch} from '../src/patchService.ts';
import {baseSkillPlan} from '../src/skillOrders.ts';
const old:Dataset=JSON.parse(readFileSync(new URL('./fixtures/16.19.1-pt_BR.json',import.meta.url),'utf8'));
const current:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));
function upstream(version:string,wrong=false):typeof fetch{return async(input)=>{
 const url=String(input);if(url.endsWith('versions.json'))return Response.json([version]);
 if(url.endsWith('championFull.json'))return Response.json({version:wrong?'16.19.1':version,data:old.champions});
 if(url.endsWith('item.json'))return Response.json({version,data:old.items});
 return Response.json(old.runes);
};}
test('static deployment loads complete current catalog directly from Riot with one pinned version',async()=>{
 const urls:string[]=[],fetcher:typeof fetch=async(input,options)=>{urls.push(String(input));return upstream('16.20.1')(input,options);};
 const version=await latestRiotPatch(fetcher),d=await fetchPatchCatalog(version,'pt_BR',fetcher);
 assert.equal(d.version,version);assert.equal(Object.keys(d.champions).length,173);assert.equal(urls.length,4);assert.ok(urls.slice(1).every(u=>u.includes('/16.20.1/data/pt_BR/')));
 assert.equal(d.champions.Ashe.stats.attackdamageperlevel,3);assert.equal(d.champions.Lucian.stats.attackdamageperlevel,2.9);
 assert.equal(d.statCorrections?.length,2);assert.ok(d.catalogWarnings?.length);
 assert.equal(old.champions.Ashe.stats.attackdamageperlevel,0);
});
test('mixed patches, incomplete details and invalid locale are rejected before publication',async()=>{
 await assert.rejects(()=>fetchPatchCatalog('16.20.1','pt_BR',upstream('16.20.1',true)),/patches diferentes/);
 await assert.rejects(()=>fetchPatchCatalog('16.20.1','xx',upstream('16.20.1')),/inválido/);
 const broken=structuredClone(old);broken.champions.Ashe.spells.pop();assert.throws(()=>validatePatchCatalog(broken),/incompleto/);
 assert.equal(applyOfficialPatchCorrections({...old,version:'16.21.1'}).champions.Ashe.stats.attackdamageperlevel,0);
 assert.equal(comparePatch('16.20.1','16.19.1')>0,true);assert.equal(patchLabel('16.20.1'),'26.20');
});
test('new patch does not certify previous-patch skill samples',()=>{
 assert.equal(baseSkillPlan({...old,version:'16.20.1'},'Ashe','Bot').coverage,'estimated');
});
test('current shipped catalog matches confirmed 26.20 values and full detail coverage',()=>{
 validatePatchCatalog(current);assert.ok(comparePatch(current.version,'16.20.1')>=0);
 if(current.version==='16.20.1'){
  assert.equal(current.champions.Ashe.stats.attackdamageperlevel,3);assert.equal(current.champions.Lucian.stats.attackdamageperlevel,2.9);
  assert.equal(current.champions.Cassiopeia.stats.hp,610);assert.equal(current.champions.Cassiopeia.stats.mp,450);
  assert.deepEqual(current.champions.Mordekaiser.spells[3].cooldown,[120,110,100]);
 }
});
test('browser falls back to current bundle when Riot unavailable, never to a missing static API',async()=>{
 const original=globalThis.fetch,urls:string[]=[];
 globalThis.fetch=async(input)=>{const url=String(input);urls.push(url);if(url.startsWith('https://'))throw Error('offline');if(url==='/data/mechanics.json')return Response.json({version:'16.19.1',champions:{}});return Response.json(current);};
 try{const r=await loadPatch('pt_BR');assert.equal(r.data.version,current.version);assert.equal(r.state.fallback,true);assert.equal(r.data.mechanics,undefined);assert.ok(!urls.some(u=>u.startsWith('/api/')));}finally{globalThis.fetch=original;}
});

test('newest valid fallback beats stale IndexedDB and refuses rollback',()=>{
 const newer={...old,version:'16.20.1'};
 assert.equal(newestCatalog(old,newer),newer);assert.equal(newestCatalog(newer,old),newer);
 assert.equal(newestCatalog(null,newer),newer);assert.equal(newestCatalog(old,null),old);
});
