'use client';
import {useState,type FormEvent} from 'react';
import {LoaderCircle} from 'lucide-react';
import {supabase} from './services/supabase';
import AuthShell from './auth/AuthShell';
import {mockResetPassword,validEmail} from './auth/mockAuth';
export default function ForgotPasswordPage(){
 const [email,setEmail]=useState(''),[loading,setLoading]=useState(false),[message,setMessage]=useState('');
 async function submit(e:FormEvent){e.preventDefault();if(loading||!validEmail(email))return;setLoading(true);try{if(supabase){const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:location.origin});if(error)throw error;setMessage('Se houver uma conta para este e-mail, você receberá instruções de recuperação.');}else{await mockResetPassword(email);setMessage('Modo local: nenhum e-mail foi enviado.');}}catch(error){setMessage(error instanceof Error?error.message:'Não foi possível continuar.');}finally{setLoading(false);}}
 return <AuthShell title="Recuperar acesso"><form onSubmit={submit} aria-busy={loading}><label>E-mail<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} disabled={loading}/></label><button className="primary auth-submit" disabled={loading||!validEmail(email)}>{loading?<><LoaderCircle className="auth-spinner" size={18}/>Aguarde…</>:supabase?'Recuperar acesso':'Simular recuperação'}</button></form>{message&&<p role="status">{message}</p>}</AuthShell>;
}
