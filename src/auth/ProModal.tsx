'use client';
import Link from 'next/link';
import {Modal} from '../components';
export default function ProModal({close,actionUrl=process.env.NEXT_PUBLIC_PRO_ACTION_URL,actionLabel='Conhecer o PRO'}:{close:()=>void;actionUrl?:string;actionLabel?:string}){
 const safeUrl=actionUrl&&(/^https:\/\//.test(actionUrl)||/^\/(?!\/)/.test(actionUrl))?actionUrl:undefined;
 return <Modal title="Mais possibilidades com Aegis PRO" close={close}><div className="pro-upgrade"><span className="plan-tag">AEGIS PRO</span><p>Desbloqueie as ferramentas avançadas do laboratório.</p><ul><li>Exportação de builds e runas</li><li>Presets e histórico sem limite de plano</li><li>Análise detalhada de EHP e TTK</li></ul>{safeUrl?<a className="primary pro-action" href={safeUrl}>{actionLabel}</a>:<p className="hint">Assinatura ainda não disponível para compra.</p>}<Link href="/login">Entrar em uma conta PRO</Link></div></Modal>;
}
