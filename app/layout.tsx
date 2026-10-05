import {AuthProvider} from '../src/auth/AuthProvider';
import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Aegis Lab · Laboratório de builds',description:'Configure builds e explore cenários de combate de League of Legends com cálculos e cobertura transparentes.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body><AuthProvider>{children}</AuthProvider></body></html>;}
