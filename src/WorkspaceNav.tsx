'use client';
import {useEffect,useState} from 'react';
export interface WorkspaceSection {id:string;label:string}
export default function WorkspaceNav({mode,onQuick,onManual,sections}:{mode:'quick'|'manual';onQuick:()=>void;onManual:()=>void;sections:WorkspaceSection[]}){
 const [active,setActive]=useState('');
 const signature=sections.map(s=>s.id).join('|');
 useEffect(()=>{
  let frame=0;const update=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const found=sections.map(s=>({id:s.id,top:document.getElementById(s.id)?.getBoundingClientRect().top})).filter((s):s is {id:string;top:number}=>s.top!==undefined);const passed=found.filter(s=>s.top<=150);const nearest=(passed.length?passed:found).sort((a,b)=>passed.length?b.top-a.top:a.top-b.top);setActive(previous=>{const first=nearest[0];if(!first)return '';return nearest.some(s=>s.id===previous&&Math.abs(s.top-first.top)<2)?previous:first.id;});});};
  update();window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',update);window.removeEventListener('resize',update);};
 },[signature,mode]);
 return <nav className="workspace-nav" aria-label="Navegação do Aegis"><div className="workspace-modes"><button aria-current={mode==='quick'?'page':undefined} onClick={onQuick}>Cartão rápido</button><button aria-current={mode==='manual'?'page':undefined} onClick={onManual}>Laboratório manual</button></div><div className="workspace-sections" aria-label="Seções desta página">{sections.map(s=><a key={s.id} href={`#${s.id}`} aria-current={active===s.id?'location':undefined} onClick={()=>{setActive(s.id);const node=document.getElementById(s.id);const details=node instanceof HTMLDetailsElement?node:node?.querySelector('details');if(details instanceof HTMLDetailsElement)details.open=true;}}>{s.label}</a>)}</div></nav>;
}
