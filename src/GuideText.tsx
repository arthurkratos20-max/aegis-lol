'use client';
import {useId,useMemo,useState} from 'react';
import {createPortal} from 'react-dom';
import type {Dataset} from './contracts';
import {parseGuideReferences,type GuideReference} from './guideReferences';
function Reference({reference:r}:{reference:GuideReference}){
 const id=useId(),[position,setPosition]=useState<{left:number;top:number}|null>(null);
 function show(el:HTMLElement){const rect=el.getBoundingClientRect(),width=Math.min(320,window.innerWidth-24);setPosition({left:Math.max(12,Math.min(rect.left,window.innerWidth-width-12)),top:Math.max(12,Math.min(rect.bottom+8,window.innerHeight-300))});}
 return <><button type="button" className="guide-reference guide-reference-trigger" aria-label={r.label} aria-describedby={position?id:undefined} onMouseEnter={e=>show(e.currentTarget)} onMouseLeave={()=>setPosition(null)} onFocus={e=>show(e.currentTarget)} onBlur={()=>setPosition(null)} onClick={e=>{e.stopPropagation();show(e.currentTarget);}} onKeyDown={e=>{if(e.key==='Escape')setPosition(null);}}>{r.championIcon&&<img src={r.championIcon} alt=""/>}<img src={r.icon} alt=""/>{r.key&&<kbd>{r.key}</kbd>}</button>{position&&createPortal(<aside id={id} role="tooltip" className="guide-reference-tooltip" style={{left:position.left,top:position.top}}><strong>{r.label}</strong><p>{r.description||'Descrição indisponível no catálogo.'}</p></aside>,document.body)}</>;
}
export default function GuideText({text,data}:{text:string;data:Dataset}){
 const parts=useMemo(()=>parseGuideReferences(text,data),[text,data]);
 return <>{parts.map((part,i)=>part.reference?<Reference key={`${i}:${part.reference.id}`} reference={part.reference}/>:<span key={i}>{part.text}</span>)}</>;
}
