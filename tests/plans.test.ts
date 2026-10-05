import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {hasPro,isSuperUser} from '../src/auth/planAccess.ts';
import {validCachedEntitlement} from '../src/auth/entitlementCache.ts';
const free={role:'user' as const,pro:false,plan:'free' as const,trial_end:null,pro_until:null};
test('owner whitelist requires a confirmed identity; plans accept monthly and annual',()=>{
 assert.equal(isSuperUser('ARTHURKRATOS20@gmail.com',true),true);assert.equal(isSuperUser('arthurkratos20@gmail.com',false),false);assert.equal(isSuperUser('someone@test.com',true),false);
 for(const billing_cycle of ['monthly','annual'] as const)assert.equal(hasPro({...free,pro:true,plan:'pro',billing_cycle}),true);
 assert.equal(hasPro({...free,pro:true,plan:'pro',plan_expires_at:'2020-01-01'}),false);
 assert.equal(hasPro(free),false);
});
test('offline cache cannot cross accounts or survive beyond its maximum age',()=>{
 const c={userId:'a',email:'a@test.com',entitlement:free,syncedAt:1000};
 assert.equal(validCachedEntitlement(c,'a',c.email,2000),true);assert.equal(validCachedEntitlement(c,'b',c.email,2000),false);assert.equal(validCachedEntitlement(c,'a',c.email,1000+86400000),false);
});
test('database plans, verified permanent owner and RLS govern premium access',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;`);
 for(const file of ['202610010001_foundation.sql','202610010002_billing.sql','202610040001_user_builds.sql','202610050001_dynamic_plans.sql'])await db.exec(readFileSync(new URL(`../supabase/migrations/${file}`,import.meta.url),'utf8'));
 const owner='11111111-1111-4111-8111-111111111111',regular='22222222-2222-4222-8222-222222222222';
 await db.exec(`insert into auth.users values('${owner}','arthurkratos20@gmail.com',null),('${regular}','regular@test.com',now());set request.jwt.claim.sub='${owner}';set role authenticated;`);
 const ent=async()=>((await db.query<{ent:any}>('select public.my_entitlement() ent')).rows[0].ent);
 assert.equal((await ent()).plan,'free');await assert.rejects(()=>db.exec("update public.accounts set plan='pro'"),/permission denied/);
 await db.exec(`reset role;update auth.users set email_confirmed_at=now() where id='${owner}';set role authenticated;`);
 assert.equal((await ent()).plan,'pro');assert.equal((await ent()).plan_expires_at,null);await db.exec('select public.admin_overview()');
 for(let i=0;i<4;i++)await db.exec(`insert into public.user_builds(owner_id,name,champion,items,runes,slider,matchup,scenario) values('${owner}','test','Jinx','[]','{}','{}','{}','{}')`);
 await db.exec(`reset role;set request.jwt.claim.sub='${regular}';update public.accounts set plan='pro',billing_cycle='annual',plan_expires_at=now()+interval '1 year' where id='${regular}';set role authenticated;`);assert.equal((await ent()).plan,'pro');assert.equal((await ent()).billing_cycle,'annual');
 await db.exec(`reset role;update public.accounts set plan_expires_at=now()-interval '1 day' where id='${regular}';set role authenticated;`);assert.equal((await ent()).plan,'free');
 await db.exec(`reset role;update public.accounts set plan='free',pro_until=now()+interval '1 month' where id='${regular}';set role authenticated;`);assert.equal((await ent()).plan,'pro');
 }finally{await db.close();}
});
