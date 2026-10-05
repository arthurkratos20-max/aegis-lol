import {createClient} from '@supabase/supabase-js';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabase=url&&key?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
export interface Entitlement {role:'user'|'admin'|'owner';trial_end:string|null;pro_until:string|null;pro:boolean;plan?:'free'|'pro';plan_expires_at?:string|null;billing_cycle?:'monthly'|'annual'|null}
export async function signIn(email:string,password:string){if(!supabase)throw Error('Autenticação na nuvem indisponível.');const {data,error}=await supabase.auth.signInWithPassword({email,password});if(error)throw Error('Não foi possível entrar. Confira suas credenciais e a confirmação do e-mail.');return data.session;}
export async function signUp(email:string,password:string,username:string){if(!supabase)throw Error('Autenticação na nuvem indisponível.');const {data,error}=await supabase.auth.signUp({email,password,options:{data:{username},emailRedirectTo:typeof window!=='undefined'?window.location.origin:undefined}});if(error)throw Error('Não foi possível cadastrar. Confira os dados e tente novamente.');return data.session;}
export async function signOut(){if(supabase){const {error}=await supabase.auth.signOut();if(error)throw Error('Não foi possível sair. Tente novamente.');}}
export async function getSession(){if(!supabase)return null;const {data,error}=await supabase.auth.getSession();if(error)throw error;return data.session;}

// RPC reads the account/profile, not the user_builds preset table.
export async function getEntitlement():Promise<Entitlement>{
 if(!supabase)throw Error('Supabase não configurado.');
 const {data,error}=await supabase.rpc('my_entitlement');
 if(error||!data||!['user','admin','owner'].includes(data.role)||typeof data.pro!=='boolean')throw Error('Não foi possível sincronizar o plano.');
 return data as Entitlement;
}
