import {test} from 'node:test';import assert from 'node:assert/strict';
import {registrationErrors,validEmail,mockRegister,mockLogin,mockResetPassword} from '../src/auth/mockAuth.ts';import {canAccessPro} from '../src/auth/access.ts';
const valid={username:'Kratos',email:'kratos@example.com',password:'abcdefgh',confirmation:'abcdefgh'};
test('registration validates every required field and exact confirmation',()=>{assert.deepEqual(registrationErrors(valid),[]);for(const patch of [{username:''},{email:'invalid'},{password:'short'},{confirmation:'different'}])assert.ok(registrationErrors({...valid,...patch}).length>0);assert.equal(validEmail(' a@b.com '),true);assert.equal(validEmail('a b@b.com'),false);});
test('register waits one second and exposes only a Free demo user, no password',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});let done=false;const pending=mockRegister(valid).then(user=>{done=true;return user;});t.mock.timers.tick(999);await Promise.resolve();assert.equal(done,false);t.mock.timers.tick(1);const user=await pending;
 assert.equal(user.username,'Kratos');assert.equal(user.isPro,false);assert.equal(user.role,'user');assert.equal(user.source,'mock');assert.ok(!('password' in user));assert.ok(!('confirmation' in user));assert.equal(canAccessPro(user),false);assert.equal(canAccessPro({...user,role:'admin',isPro:true}),false);
});
test('mock login rejects invalid input and reset sends no actual request',async t=>{t.mock.timers.enable({apis:['setTimeout']});const invalid=mockLogin('bad','short');const rejected=assert.rejects(invalid,/Credenciais inválidas/);t.mock.timers.tick(1000);await rejected;
 const login=mockLogin(valid.email,valid.password);t.mock.timers.tick(1000);assert.equal((await login).isPro,false);
 const reset=mockResetPassword(valid.email);t.mock.timers.tick(1000);await reset;assert.equal(canAccessPro(null),false);
});
