export interface User {id:string;username:string;email:string;isPro:boolean;role:'user'|'admin';source:'mock'|'supabase';plan?:'free'|'pro';billingCycle?:'monthly'|'annual'|null}
export interface Registration {username:string;email:string;password:string;confirmation:string}
export const validEmail=(email:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
export function registrationErrors(values:Registration):string[]{
 const errors:string[]=[];
 if(!values.username.trim()||values.username.trim().length>40)errors.push('Informe um nome de invocador com até 40 caracteres.');
 if(!validEmail(values.email))errors.push('Informe um e-mail válido.');
 if(values.password.length<8)errors.push('A senha deve ter pelo menos 8 caracteres.');
 if(values.confirmation!==values.password)errors.push('As senhas não coincidem.');
 return errors;
}
const pause=()=>new Promise<void>(resolve=>setTimeout(resolve,1000));
const makeUser=(email:string,username:string):User=>({id:'mock-session',username,email:email.trim().toLowerCase(),isPro:false,role:'user',source:'mock'});
// No credential registry, hashes, browser storage, network request or real entitlement.
export async function mockRegister(values:Registration):Promise<User>{await pause();const errors=registrationErrors(values);if(errors.length)throw Error(errors[0]);return makeUser(values.email,values.username.trim());}
export async function mockLogin(email:string,password:string):Promise<User>{await pause();if(!validEmail(email)||password.length<8)throw Error('Credenciais inválidas. Confira o e-mail e a senha.');return makeUser(email,email.trim().split('@')[0]);}
export async function mockResetPassword(email:string):Promise<void>{await pause();if(!validEmail(email))throw Error('Informe um e-mail válido.');}
