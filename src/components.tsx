'use client';
import RuneSelector from './RuneSelector';
import {useEffect,useRef} from 'react';
import {X} from 'lucide-react';
import type {Dataset,Fighter,RunePage,SkillKey,Scenario} from './contracts';
import {conservative,plain,skillValid} from './model';
export function Modal({title,close,children}:{title:string;close:()=>void;children:React.ReactNode}){
 const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{const dialog=ref.current;dialog?.showModal();return()=>dialog?.close();},[]);
 return <dialog ref={ref} onCancel={close} onClick={e=>{if(e.target===ref.current)close();}}><div className="dialog-head"><h2>{title}</h2><button className="icon-button" aria-label="Fechar" onClick={close}><X size={20}/></button></div>{children}</dialog>;
}
export function NumberInput({label,value,onChange,min=0,max=99999,step=1}:{label:string;value:number;onChange:(n:number)=>void;min?:number;max?:number;step?:number}){return <label className="field"><span>{label}</span><input type="number" value={value} min={min} max={max} step={step} onChange={e=>onChange(Math.max(min,Math.min(max,Number(e.target.value))))}/></label>;}
export function ChampionSelect({data,value,onChange,label,empty=false}:{data:Dataset;value:string;onChange:(id:string)=>void;label:string;empty?:boolean}){return <label className="field"><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}>{empty&&<option value="">Não selecionado</option>}{Object.values(data.champions).sort((a,b)=>a.name.localeCompare(b.name)).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>;}
export function SkillMatrix({f,data,update,pro}:{f:Fighter;data:Dataset;update:(patch:Partial<Fighter>)=>void;pro:()=>void}){
 const c=data.champions[f.champion];const keys:SkillKey[]=['Q','W','E','R'];
 return <section className="panel"><div className="panel-head"><h3>Ordem de habilidades</h3><span className="muted">Nível 1–18</span></div><div className="skill-scroll"><table className="skill-table"><thead><tr><th>Skill</th>{Array.from({length:18},(_,n)=><th key={n}>{n+1}</th>)}</tr></thead><tbody>{keys.map((key,k)=><tr key={key}><th><img src={`/assets/riot/icons/spell/${c.spells[k].image.full}`} alt=""/><span>{key}</span></th>{Array.from({length:18},(_,n)=>{const seq=[...f.skills];seq[n]=key;const valid=skillValid(seq,data,f.champion);return <td key={n}><button aria-label={`${key} no nível ${n+1}`} title={c.spells[k].name} disabled={!valid||!f.skills.length} className={`${f.skills[n]===key?'selected':''} ${n>=f.level?'future':''}`} onClick={()=>update({skills:seq})}>{f.skills[n]===key?key:'·'}</button></td>;})}</tr>)}</tbody></table></div><div className="button-row"><button onClick={()=>update({skills:conservative(data,f.champion)})}>Conservadora</button><button onClick={pro}>Experimental <span className="pro-small">PRO</span></button><button onClick={()=>update({skills:conservative(data,f.champion)})}>Restaurar</button></div><p className="hint">{f.skills.length?'Preset conservador, sem estatística de meta. Ranks até o nível atual.':'Regras especiais deste campeão ainda precisam de um adapter. Matriz desativada.'}</p></section>;
}
export function RuneEditor({page,data,update,scenario}:{page:RunePage;data:Dataset;update:(p:RunePage)=>void;f?:Fighter;scenario:Scenario}){
 return <RuneSelector page={page} data={data} scenario={scenario} onChange={update}/>;
}
