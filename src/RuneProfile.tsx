'use client';
import {useState} from 'react';
import {Swords,Zap,Shield,X} from 'lucide-react';
import type {Dataset,Fighter,Rune,RunePage} from './contracts';
import {parseItemHTML} from './itemTooltip';
import {SHARD_LABELS,defaultShards} from './shards';
import {statsFor,plain} from './model';
const cdn='/assets/riot/icons/';
export function RuneCard({r,f,data,keystone=false,onSelect,disabled=false,chosen=false}:{r:Rune;f?:Fighter;data:Dataset;keystone?:boolean;onSelect?:()=>void;disabled?:boolean;chosen?:boolean}){
 const [open,setOpen]=useState(false),[pinned,setPinned]=useState(false);
 const covered=data.version==='16.19.1'&&[9104,9105,9103,8106].includes(r.id);
 let metrics:{label:string;value:number}[]=[];
 if(covered&&f){const a=statsFor({...f,items:[],runes:{...f.runes,selected:[r.id]}},data),b=statsFor({...f,items:[],runes:{...f.runes,selected:[]}},data);metrics=[{label:'Velocidade de ataque adicional (%)',value:(a.bonusAS-b.bonusAS)*100},{label:'AH de habilidades básicas',value:(a.basicHaste??0)-(b.basicHaste??0)},{label:'AH da ultimate',value:(a.ultimateHaste??0)-(b.ultimateHaste??0)},{label:'Roubo de vida (%)',value:(a.lifesteal-b.lifesteal)*100},{label:'Vida adicional',value:a.hp-b.hp}].filter(v=>v.value!==0);}
 return <div className={`rune-profile-row ${keystone?'rune-keystone':''}`} onPointerEnter={e=>{if(e.pointerType!=='touch')setOpen(true);}} onPointerLeave={()=>{if(!pinned)setOpen(false);}}><button type="button" disabled={disabled} className={chosen?'chosen-rune':''} aria-label={onSelect?r.name:`Descrição da runa ${r.name}`} aria-expanded={open} onFocus={e=>{if(window.innerWidth>600&&e.currentTarget.matches(':focus-visible'))setOpen(true);}} onBlur={()=>{if(!pinned)setOpen(false);}} onClick={()=>{onSelect?.();setPinned(!pinned);setOpen(!pinned);}}><img src={cdn+r.icon} alt=""/><span>{keystone&&<small>Runachave</small>}<b>{r.name}</b></span></button>{open&&<aside className="rune-rich-tooltip" role="region" aria-label={`Runa: ${r.name}`}><button aria-label="Fechar descrição da runa" className="rune-close" onClick={()=>{setOpen(false);setPinned(false);}}><X size={16}/></button><strong>{r.name}</strong><p>{parseItemHTML(r.longDesc||r.shortDesc).map((p,i)=>p.break?<br key={i}/>:<span key={i} className={`it-${p.tone} ${p.bold?'it-bold':''}`}>{p.text}</span>)}</p>{covered&&f?<section>{metrics.length?metrics.map(m=><p key={m.label}>{m.label} <b>{m.value.toLocaleString('pt-BR',{maximumFractionDigits:2})}</b></p>):<p>Sem bônus ativo para os acúmulos atuais.</p>}<small>Atributos com acúmulos informados; demais condições não presumidas.</small></section>:<p className="it-unavailable">[Cálculo indisponível] Descrição oficial preservada.</p>}</aside>}</div>;
}
export default function RuneProfile({page,f,data}:{page:RunePage;f?:Fighter;data:Dataset}){
 const primary=data.runes.find(t=>t.id===page.primary),secondary=data.runes.find(t=>t.id===page.secondary);
 const selected=(tree:typeof primary)=>tree?.slots.flatMap(slot=>slot.runes.filter(r=>page.selected.includes(r.id)))??[];
 const main=selected(primary),extra=selected(secondary),keystone=primary?.slots[0].runes.find(r=>page.selected.includes(r.id));
 const shards=page.shards.length===3?page.shards:f?defaultShards(f,data):['haste','adaptive','hp'];
 return <div className="rune-profile-grid"><section><header>{primary&&<img src={cdn+primary.icon} alt=""/>}<span><small>Principal</small><b>{primary?.name??'Não definida'}</b></span></header>{keystone?<RuneCard r={keystone} f={f} data={data} keystone/>:<p className="hint">Runachave não selecionada.</p>}{main.filter(r=>r.id!==keystone?.id).map(r=><RuneCard key={r.id} r={r} f={f} data={data}/>)}</section><section><header>{secondary&&<img src={cdn+secondary.icon} alt=""/>}<span><small>Secundária</small><b>{secondary?.name??'Não definida'}</b></span></header>{extra.map(r=><RuneCard key={r.id} r={r} f={f} data={data}/>)}<div className="rune-shards"><h4>Fragmentos de atributo</h4>{[Swords,Zap,Shield].map((Icon,i)=><div key={i}><Icon size={17}/><span><small>{['Ofensivo','Flexível','Defensivo'][i]}</small><b>{SHARD_LABELS[shards[i]]??SHARD_LABELS.hp}</b></span></div>)}<p>Tabela de fragmentos · 16.19.1{data.version!=='16.19.1'?' · revisão do novo patch pendente':''}</p></div></section></div>;
}
