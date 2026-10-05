import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveSupabaseConfiguration} from '../src/services/supabaseConfig.ts';
test('missing production configuration reports variable names, never the key value',()=>{
 const result=resolveSupabaseConfiguration(undefined,'public-test-key');assert.equal(result.configured,false);assert.match(result.problem,/NEXT_PUBLIC_SUPABASE_URL/);assert.ok(!result.problem.includes('public-test-key'));
 assert.equal(resolveSupabaseConfiguration('https://example.supabase.co','').configured,false);
});
test('legacy anon and current publishable keys are both accepted; blank legacy key falls back',()=>{
 assert.equal(resolveSupabaseConfiguration(' https://example.supabase.co ','anon').configured,true);
 const config=resolveSupabaseConfiguration('https://example.supabase.co',' ','publishable');assert.equal(config.configured,true);assert.equal(config.key,'publishable');assert.equal(config.problem,'');
});
test('invalid URL does not crash the app or instantiate a cloud client',()=>{
 assert.equal(resolveSupabaseConfiguration('not-a-url','key').configured,false);
 assert.equal(resolveSupabaseConfiguration('javascript:alert(1)','key').configured,false);
 assert.equal(resolveSupabaseConfiguration('http://localhost:54321','key').configured,true);
});
