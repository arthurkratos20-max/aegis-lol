import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import type {Dataset} from '../src/contracts.ts';
import {initialScenario} from '../src/model.ts';
import {createPreset,addLocalPreset,PresetLimitError,presetStorageKey} from '../src/services/presets.ts';
import {formattedBuild} from '../src/buildExport.ts';
import {selectManualShard,selectManualRune} from '../src/runeSelection.ts';
const data:Dataset=JSON.parse(readFileSync(new URL('../public/data/pt_BR.json',import.meta.url),'utf8'));
test('local storage caps three presets and exports ordered item/rune names without credentials',()=>{
 const s=initialScenario(data);s.player.items=['3111','3031','3072'];const preset=createPreset(s,'Test');let rows=addLocalPreset([],preset);rows=addLocalPreset(rows,{...preset,id:'2'});rows=addLocalPreset(rows,{...preset,id:'3'});assert.throws(()=>addLocalPreset(rows,{...preset,id:'4'}),PresetLimitError);
 s.player.items=[];assert.equal(preset.items.length,3);const text=formattedBuild(preset.scenario,data);assert.ok(text.indexOf('1. ' )<text.indexOf('2. '));assert.ok(text.includes('Primária:'));assert.ok(!text.includes('password'));
 assert.notEqual(presetStorageKey(null),presetStorageKey({id:'mock-session',username:'A',email:'a@test.com',isPro:true,role:'admin',source:'mock'}));
});
test('individual rune/shard unlocking leaves other slots locked',()=>{
 const page=initialScenario(data).player.runes;const chosen={...page,primary:8400,secondary:8000,selected:[8437,8446,8429,8451,9101,9104],locks:{runes:[8446,8429],shards:[0,1]},shards:['as','adaptive','hp']};
 const unlocked=selectManualRune(chosen,data,8446);assert.deepEqual(unlocked.locks?.runes,[8429]);assert.deepEqual(unlocked.locks?.shards,[0,1]);const shard=selectManualShard(unlocked,0,'as');assert.deepEqual(shard.locks?.shards,[1]);
});
test('user_builds enforces FREE quota and owner isolation in SQL; premium saves beyond three',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;`);
 for(const file of ['202610010001_foundation.sql','202610010002_billing.sql','202610040001_user_builds.sql'])await db.exec(readFileSync(new URL(`../supabase/migrations/${file}`,import.meta.url),'utf8'));
 const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';await db.exec(`insert into auth.users values('${a}','a@test.invalid'),('${b}','b@test.invalid');set request.jwt.claim.sub='${a}';set role authenticated;`);
 const insert=(owner=a)=>db.exec(`insert into public.user_builds(owner_id,name,champion,items,runes,slider,matchup,scenario) values('${owner}','test','Shen','[]','{}','{}','{}','{}')`);
 for(let i=0;i<3;i++)await insert();await assert.rejects(()=>insert(),/FREE_PRESET_LIMIT/);
 await assert.rejects(()=>db.exec("update public.accounts set role='admin'"),/permission denied/);
 await db.exec(`reset role;set request.jwt.claim.sub='${b}';set role authenticated;`);assert.equal((await db.query('select * from public.user_builds')).rows.length,0);await assert.rejects(()=>insert(a),/Forbidden/);
 await db.exec(`reset role;set request.jwt.claim.sub='${a}';set role authenticated;delete from public.user_builds where id=(select id from public.user_builds limit 1);`);await insert();
 await db.exec(`reset role;update public.accounts set pro_until=now()+interval '1 day' where id='${a}';set role authenticated;`);for(let i=0;i<4;i++)await insert();assert.equal((await db.query('select * from public.user_builds')).rows.length,7);
 await db.exec(`reset role;update public.accounts set pro_until=null where id='${a}';set role authenticated;`);await assert.rejects(()=>insert(),/FREE_PRESET_LIMIT/);
 }finally{await db.close();}
});
