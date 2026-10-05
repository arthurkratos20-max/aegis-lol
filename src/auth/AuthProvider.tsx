'use client';
import {createContext,useContext,useEffect,useState,useRef,type ReactNode} from 'react';
import type {Session} from '@supabase/supabase-js';
import {mockLogin,mockRegister,type User,type Registration} from './mockAuth';
import {supabase,signIn,signUp,signOut,getSession,getEntitlement,type Entitlement} from '../services/supabase';
import {hasPro,isSuperUser} from './planAccess';
import {readEntitlement,cacheEntitlement,clearEntitlement,validCachedEntitlement} from './entitlementCache';
type SyncStatus='live'|'offline'|'error'|'demo';
interface AuthState {user:User|null;isPro:boolean;loading:boolean;syncStatus:SyncStatus;mode:'local'|'supabase';login:(email:string,password:string)=>Promise<void>;register:(values:Registration)=>Promise<boolean>;logout:()=>Promise<void>;refresh:()=>Promise<void>}
const AuthContext=createContext<AuthState|null>(null);
export function AuthProvider({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null),[loading,setLoading]=useState(true),[syncStatus,setSyncStatus]=useState<SyncStatus>(supabase?'error':'demo');const revision=useRef(0);
 async function apply(session:Session|null){
  const turn=++revision.current;
  if(!session){setUser(null);setLoading(false);return;}
  // Clear another account's privileges immediately, including during slow requests.
  setUser(current=>current?.id===session.user.id?current:null);
  let identity=session.user;let ent:Entitlement={role:'user',trial_end:null,pro_until:null,pro:false,plan:'free'};let status:SyncStatus='error';
  if(!navigator.onLine){
   const cached=await readEntitlement(identity.id);
   if(session.expires_at && session.expires_at*1000>Date.now() && validCachedEntitlement(cached,identity.id,identity.email??''))ent=cached.entitlement;
   status='offline';
  }else{
   try{
    // Server-verified identity; never authorize with editable user_metadata or a mock email.
    const verified=await supabase!.auth.getUser();
    if(verified.error||!verified.data.user||verified.data.user.id!==session.user.id)throw Error('Sessão inválida');
    identity=verified.data.user;
    try{ent=await getEntitlement();status='live';}catch{status='error';}
    if(isSuperUser(identity.email??'',!!identity.email_confirmed_at))ent={role:'owner',trial_end:null,pro_until:null,pro:true,plan:'pro',plan_expires_at:null,billing_cycle:null};
    if(turn!==revision.current)return;
    // Only persist a successful backend synchronization, not an error fallback.
    if(status==='live')await cacheEntitlement({userId:identity.id,email:identity.email??'',entitlement:ent,syncedAt:Date.now()});
   }catch{status='error';}
  }
  if(turn!==revision.current)return;
  const pro=hasPro(ent);
  setUser({id:identity.id,email:identity.email??'',username:String(identity.user_metadata.username??identity.email?.split('@')[0]??'Invocador'),isPro:pro,plan:pro?'pro':'free',billingCycle:ent.billing_cycle??null,role:ent.role==='admin'||ent.role==='owner'?'admin':'user',source:'supabase'});
  setSyncStatus(status);setLoading(false);
 }
 async function refresh(){if(supabase)await apply(await getSession());}
 useEffect(()=>{
  // Remove the obsolete demo session. Supabase SDK alone persists its session token.
  try{localStorage.removeItem('aegis-local-session-v1');}catch{}
  if(!supabase){setLoading(false);return;}
  let disposed=false;
  const update=()=>{void getSession().then(s=>{if(!disposed)void apply(s);}).catch(()=>{if(!disposed){revision.current++;setUser(null);setLoading(false);}});};
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{queueMicrotask(()=>{if(!disposed)void apply(session);});});update();
  const timer=setInterval(update,60000);window.addEventListener('focus',update);window.addEventListener('online',update);window.addEventListener('offline',update);
  return()=>{disposed=true;revision.current++;subscription.unsubscribe();clearInterval(timer);window.removeEventListener('focus',update);window.removeEventListener('online',update);window.removeEventListener('offline',update);};
 },[]);
 useEffect(()=>{
  if(!supabase||user?.source!=='supabase')return;
  const channel=supabase.channel(`plan:${user.id}`).on('postgres_changes',{event:'UPDATE',schema:'public',table:'accounts',filter:`id=eq.${user.id}`},()=>{void refresh().catch(()=>setSyncStatus('error'));}).subscribe();
  return()=>{void supabase?.removeChannel(channel);};
 },[user?.id,user?.source]);
 function local(u:User){setUser(u);setSyncStatus('demo');}
 return <AuthContext.Provider value={{user,isPro:user?.source==='supabase'&&user.isPro===true,loading,syncStatus,mode:supabase?'supabase':'local',refresh,
  login:async(email,password)=>{if(supabase)await apply(await signIn(email,password));else local(await mockLogin(email,password));},
  register:async values=>{if(supabase){const s=await signUp(values.email,values.password,values.username);await apply(s);return !!s;}local(await mockRegister(values));return true;},
  logout:async()=>{if(supabase)await signOut();revision.current++;if(user?.source==='supabase')await clearEntitlement(user.id);setUser(null);}
 }}>{children}</AuthContext.Provider>;
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw Error('useAuth precisa de AuthProvider.');return value;}
