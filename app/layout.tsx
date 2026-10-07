import {AuthProvider} from '../src/auth/AuthProvider';
import type {Metadata} from 'next';
import './globals.css';
import './visual.css';
import './laboratory.css';
export const metadata:Metadata={title:'Aegis Lab · Laboratório de builds',icons:{icon:'/aegis-icon.png',apple:'/aegis-icon.png'},description:'Configure builds e explore cenários de combate de League of Legends com cálculos e cobertura transparentes.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body><AuthProvider>{children}</AuthProvider></body></html>;}
