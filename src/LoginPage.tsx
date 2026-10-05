'use client';
import {useState,type FormEvent} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {LoaderCircle} from 'lucide-react';
import {useAuth} from './auth/AuthProvider';
import AuthShell from './auth/AuthShell';
import {validEmail} from './auth/mockAuth';
export default function LoginPage(){
 const {login,mode}=useAuth(),router=useRouter();const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const valid=validEmail(email)&&password.length>=8;
 async function submit(event:FormEvent){event.preventDefault();if(loading||!valid)return;setLoading(true);setError('');try{await login(email,password);setPassword('');router.push('/');}catch(e){setError(e instanceof Error?e.message:'Não foi possível entrar. Tente novamente.');}finally{setLoading(false);}}
 return <AuthShell title="Entrar"><form onSubmit={submit} aria-busy={loading}><fieldset disabled={loading}><label>E-mail<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Senha<input type="password" autoComplete="current-password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)}/></label><p className="hint">{mode==='local'?'Modo local de demonstração: a senha não é verificada nem armazenada.':'Entre com sua conta Aegis.'}</p>{error&&<p role="alert" className="auth-error">{error}</p>}<button className="primary auth-submit" disabled={!valid||loading} type="submit">{loading?<><LoaderCircle className="auth-spinner" size={18} aria-hidden="true"/>Entrando…</>:'Entrar'}</button></fieldset></form><Link href="/forgot-password">Esqueceu sua senha?</Link><p>Não tem uma conta? <Link href="/register">Cadastre-se</Link></p></AuthShell>;
}
