'use client';
import Link from 'next/link';
import {useState} from 'react';
import {supabaseConfiguration} from '../services/supabase';
import {useAuth} from './AuthProvider';
export default function SessionBadge(){const {user,isPro,logout,mode,syncStatus}=useAuth();const [error,setError]=useState('');return <div className="session-badge">{user?<><span>{user.username} · {mode==='local'?'Demonstração · sem conta Supabase':isPro?'PRO':syncStatus==='error'?'Plano pendente':'FREE'}{mode!=='local'&&syncStatus==='offline'?' · offline':''}</span><button onClick={()=>void logout().catch(e=>setError(e.message))}>Sair</button></>:<><Link href="/login">Entrar</Link><Link href="/register">Criar conta</Link></>}{mode==='local'&&<small className="auth-config-status" title={supabaseConfiguration.problem}>Supabase não configurado neste deploy</small>}{error&&<span role="alert">{error}</span>}</div>;}
