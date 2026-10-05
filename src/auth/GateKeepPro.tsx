'use client';
import {useState,type ReactNode} from 'react';
import ProModal from './ProModal';
import {useAuth} from './AuthProvider';
/** Visual gate only. Real entitlements must be confirmed by a backend. */
export default function GateKeepPro({children}:{children:ReactNode;verifiedAccess?:boolean}){
 const {isPro}=useAuth();const [upgrade,setUpgrade]=useState(false);
 if(isPro)return <>{children}</>;
 return <><div className="notice" role="status"><p>Recurso Exclusivo para Assinantes PRO</p><button onClick={()=>setUpgrade(true)}>Conhecer o PRO</button></div>{upgrade&&<ProModal close={()=>setUpgrade(false)}/>}</>;
}
