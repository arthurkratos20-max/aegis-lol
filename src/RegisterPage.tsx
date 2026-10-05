'use client';
import {useState,type FormEvent} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {LoaderCircle} from 'lucide-react';
import {useAuth} from './auth/AuthProvider';
import AuthShell from './auth/AuthShell';
import {registrationErrors,type Registration} from './auth/mockAuth';
export default function RegisterPage(){
 const {register}=useAuth(),router=useRouter();const [values,setValues]=useState<Registration>({username:'',email:'',password:'',confirmation:''}),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const errors=registrationErrors(values),valid=errors.length===0;
 const field=(key:keyof Registration,value:string)=>setValues(previous=>({...previous,[key]:value}));
 async function submit(event:FormEvent){event.preventDefault();if(loading||!valid)return;setLoading(true);setError('');try{const signedIn=await register(values);setValues(previous=>({...previous,password:'',confirmation:''}));if(signedIn)router.push('/');else setError('Cadastro enviado. Confirme seu e-mail antes de entrar.');}catch(e){setError(e instanceof Error?e.message:'Não foi possível criar a sessão. Tente novamente.');}finally{setLoading(false);}}
 return <AuthShell title="Criar conta"><form onSubmit={submit} aria-busy={loading}><fieldset disabled={loading}><label>Nome de invocador<input required maxLength={40} autoComplete="nickname" value={values.username} onChange={e=>field('username',e.target.value)}/></label><label>E-mail<input type="email" required autoComplete="email" value={values.email} onChange={e=>field('email',e.target.value)}/></label><label>Senha<input type="password" required minLength={8} autoComplete="new-password" value={values.password} onChange={e=>field('password',e.target.value)}/></label><label>Confirmação de senha<input type="password" required minLength={8} autoComplete="new-password" value={values.confirmation} onChange={e=>field('confirmation',e.target.value)} aria-describedby="password-match"/></label><p className="hint" id="password-match">{values.confirmation&&values.confirmation!==values.password?'As senhas não coincidem.':'Use pelo menos 8 caracteres e repita a mesma senha.'}</p>{error&&<p role="alert" className="auth-error">{error}</p>}<button className="primary auth-submit" type="submit" disabled={!valid||loading}>{loading?<><LoaderCircle className="auth-spinner" size={18} aria-hidden="true"/>Criando…</>:'Criar Conta'}</button></fieldset></form><p>Já tem uma conta? <Link href="/login">Faça Login</Link></p></AuthShell>;
}
