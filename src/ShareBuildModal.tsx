'use client';
import {useEffect,useRef,useState} from 'react';
import {Share2,Download,Copy,LoaderCircle} from 'lucide-react';
import type {Dataset,Scenario,Fighter} from './contracts';
import {Modal} from './components';
import {buildShareLink} from './buildShare';
import {plain} from './model';
import {SHARD_LABELS} from './shards';
import {ShardIcon} from './AttributeLabel';
import {useAuth} from './auth/AuthProvider';
import ProModal from './auth/ProModal';
const CDN='/assets/riot';
export default function ShareBuildButton({scenario,data}:{scenario:Scenario;data:Dataset}) {
 const [snapshot,setSnapshot]=useState<Scenario|null>(null);
 return <><button onClick={()=>setSnapshot(structuredClone(scenario))}><Share2 size={16}/>Compartilhar Build</button>{snapshot&&<ShareBuildModal scenario={snapshot} data={data} close={()=>setSnapshot(null)}/>}</>;
}
export function ShareBuildModal({scenario:s,data,close}:{scenario:Scenario;data:Dataset;close:()=>void}) {
 const {isPro}=useAuth(),card=useRef<HTMLDivElement>(null);
 const [link,setLink]=useState(''),[qr,setQr]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(''),[upgrade,setUpgrade]=useState(false);
 useEffect(()=>{let cancelled=false;async function prepare(){try{const url=buildShareLink(s,window.location.origin);const QRCode=await import('qrcode');const image=await QRCode.toDataURL(url,{width:240,margin:4,errorCorrectionLevel:'L',color:{dark:'#080f1e',light:'#ffffff'}});if(!cancelled){setLink(url);setQr(image);}}catch(e){if(!cancelled)setError(e instanceof Error?e.message:'Não foi possível gerar o card.');}}void prepare();return()=>{cancelled=true;};},[s]);
 async function copyLink(){if(!isPro){setUpgrade(true);return;}try{await navigator.clipboard.writeText(link);setMessage('Link copiado.');}catch{setError('Não foi possível copiar. Selecione e copie o link abaixo.');}}
 async function download(){if(!isPro){setUpgrade(true);return;}if(!card.current||!qr)return;setBusy(true);setError('');try{
  await Promise.all([...card.current.querySelectorAll('img')].map(img=>img.decode()));
  const {toPng}=await import('html-to-image');const image=await toPng(card.current,{pixelRatio:2,backgroundColor:'#080f1e',skipFonts:true});
  const a=document.createElement('a');a.href=image;a.download=`aegis-${s.player.champion}-vs-${s.enemy.champion}.png`;a.click();setMessage('Card baixado.');
 }catch{setError('Não foi possível baixar a imagem. Confira a conexão com os ícones da Riot e tente novamente.');}finally{setBusy(false);}}
 const runeTree=(id:number)=>data.runes.find(t=>t.id===id);
 function items(f:Fighter){return <div className="share-items">{Array.from({length:6},(_,i)=>{const id=f.items[i],item=data.items[id];return <div key={i}><div className="share-item-image">{item?<img crossOrigin="anonymous" src={`${CDN}/icons/item/${item.image.full}`} alt={plain(item.name)}/>:<span>—</span>}</div><small>{i+1}. {item?plain(item.name):'Slot livre'}</small></div>;})}</div>;}
 function runes(id:number){const tree=runeTree(id);return <div className="share-rune-tree"><strong>{tree?.name??'Árvore'}</strong><div>{tree?.slots.flatMap(row=>row.runes).filter(r=>s.player.runes.selected.includes(r.id)).map(r=><span key={r.id}><img crossOrigin="anonymous" src={`${CDN}/icons/${r.icon}`} alt=""/><small>{r.name}</small></span>)}</div></div>;}
 return <Modal title="Compartilhar Build" close={close}><div className="share-scroll"><div className="share-card" ref={card}>
 <header><span>AEGIS <b>LAB</b></span><small>BUILD / MATCHUP · {data.version}</small></header>
 <div className="share-matchup">{(s.matchupUnknown?[s.player]:[s.player,s.enemy]).map((f,i)=><div key={i}><img crossOrigin="anonymous" src={`${CDN}/icons/champion/${data.champions[f.champion].image.full}`} alt=""/><span><small>{i===0?'SEU CAMPEÃO':'ADVERSÁRIO'}</small><h2>{data.champions[f.champion].name}</h2><p>Nível {f.level} · {f.lane}</p></span></div>)}</div>
 <h3>Sua build · ordem dos itens</h3>{items(s.player)}{!s.matchupUnknown&&<><h3>Build adversária</h3>{items(s.enemy)}</>}{s.matchupUnknown&&<p>Build padrão · sem adversário definido</p>}
 <section className="share-runes">{runes(s.player.runes.primary)}{runes(s.player.runes.secondary)}</section>
 <div className="share-shards">{s.player.runes.shards.map((k,i)=><span key={i}><ShardIcon shard={k}/>{SHARD_LABELS[k]??k}</span>)}</div>
 <footer><div><strong>{Math.round(s.weights.offense)}% Dano · {Math.round(s.weights.defense)}% Defesa</strong><p>Leia o QR Code para abrir esta build.</p><small>Estimativa exploratória · Não endossado pela Riot Games</small></div>{qr?<img className="share-qr" src={qr} alt="QR Code para abrir a build e o matchup"/>:<span>Gerando QR Code…</span>}</footer>
 </div></div><div className="share-actions"><button disabled={busy||!qr} onClick={()=>void download()}>{busy?<LoaderCircle size={16} className="auth-spinner"/>:<Download size={16}/>}Baixar Card como Imagem</button><button disabled={!link||busy} onClick={()=>void copyLink()}><Copy size={16}/>Copiar Link</button></div>
 {link&&<input className="share-link" aria-label="Link desta build" readOnly value={link} onFocus={e=>e.currentTarget.select()}/>}
 {message&&<p role="status">{message}</p>}{error&&<p className="auth-error" role="alert">{error}</p>}{!isPro&&<p className="hint">Exportação do card e do link disponível no plano PRO. Abrir uma build compartilhada é gratuito.</p>}{upgrade&&<ProModal close={()=>setUpgrade(false)}/>}</Modal>;
}
