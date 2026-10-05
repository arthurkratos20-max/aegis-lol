'use client';
import {createContext,useContext,useEffect,useState,useRef,type ReactNode} from 'react';
import type {Session} from '@supabase/supabase-js';
import {mockLogin,mockRegister,type User,type Registration} from './mockAuth';
import {supabase,signIn,signUp,signOut,getSession,type Entitlement} from '../services/supabase';
interface AuthState {user:User|null;isPro:boolean;loading:boolean;mode:'local'|'supabase';login:(email:string,password:string)=>Promise<void>;register:(values:Registration)=>Promise<boolean>;logout:()=>Promise<void>;refresh:()=>Promise<void>}
const AuthContext=createContext<AuthState|null>(null);
const LOCAL_SESSION='aegis-local-session-v1';
export function AuthProvider({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null),[loading,setLoading]=useState(true);const revision=useRef(0);
 async function apply(session:Session|null){const turn=++revision.current;if(!session){setUser(null);setLoading(false);return;}
  let ent:Entitlement|null=null;try{const {data,error}=await supabase!.rpc('my_entitlement');if(!error)ent=data;}catch{}
  if(turn!==revision.current)return;
  // Never use editable user_metadata to authorize PRO or administration.
  setUser({id:session.user.id,email:session.user.email??'',username:String(session.user.user_metadata.username??session.user.email?.split('@')[0]??'Invocador'),isPro:ent?.pro===true,role:ent?.role==='admin'||ent?.role==='owner'?'admin':'user',source:'supabase'});setLoading(false);
 }
 async function refresh(){if(supabase)await apply(await getSession());}
 useEffect(()=>{
  if(!supabase){try{const stored=JSON.parse(localStorage.getItem(LOCAL_SESSION)??'null');if(stored?.email&&stored?.username)setUser({id:'mock-session',email:String(stored.email),username:String(stored.username),isPro:false,role:'user',source:'mock'});}catch{}setLoading(false);return;}
  let disposed=false;
  const update=()=>{void getSession().then(s=>{if(!disposed)void apply(s);}).catch(()=>{if(!disposed){setUser(null);setLoading(false);}});};
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{queueMicrotask(()=>{if(!disposed)void apply(session);});});update();
  const timer=setInterval(update,60000);window.addEventListener('focus',update);
  return()=>{disposed=true;revision.current++;subscription.unsubscribe();clearInterval(timer);window.removeEventListener('focus',update);};
 },[]);
 function local(u:User){localStorage.setItem(LOCAL_SESSION,JSON.stringify({email:u.email,username:u.username}));setUser(u);}
 return <AuthContext.Provider value={{user,isPro:user?.source==='supabase'&&user.isPro===true,loading,mode:supabase?'supabase':'local',refresh,
  login:async(email,password)=>{if(supabase)await apply(await signIn(email,password));else local(await mockLogin(email,password));},
  register:async values=>{if(supabase){const s=await signUp(values.email,values.password,values.username);await apply(s);return !!s;}local(await mockRegister(values));return true;},
  logout:async()=>{if(supabase)await signOut();else localStorage.removeItem(LOCAL_SESSION);revision.current++;setUser(null);}
 }}>{children}</AuthContext.Provider>;
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw Error('useAuth precisa de AuthProvider.');return value;}
