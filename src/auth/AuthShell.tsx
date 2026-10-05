import Link from 'next/link';
import type {ReactNode} from 'react';
import {Shield} from 'lucide-react';
export default function AuthShell({title,children}:{title:string;children:ReactNode}){
 return <main className="auth-screen"><section className="auth-panel"><Link className="auth-brand" href="/"><Shield aria-hidden="true" size={28}/>AEGIS LAB</Link><h1>{title}</h1><p className="auth-demo">Sua conta Aegis</p>{children}<Link className="auth-back" href="/">Voltar ao laboratório</Link></section></main>;
}
