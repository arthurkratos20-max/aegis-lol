'use client';
import Link from 'next/link';
import {useState} from 'react';
import {useAuth} from './AuthProvider';
export default function SessionBadge(){const {user,isPro,logout,mode,syncStatus}=useAuth();const [error,setError]=useState('');return <div className="session-badge">{user?<><span>{user.username} · {isPro?'PRO':'FREE'}{mode==='local'?' · demonstração':syncStatus==='offline'?' · offline':syncStatus==='error'?' · sincronização pendente':''}</span><button onClick={()=>void logout().catch(e=>setError(e.message))}>Sair</button></>:<><Link href="/login">Entrar</Link><Link href="/register">Criar conta</Link></>}{error&&<span role="alert">{error}</span>}</div>;}
