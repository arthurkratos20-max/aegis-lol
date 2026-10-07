'use client';
import {useEffect,useRef,useState} from 'react';
import type {Dataset,Scenario} from './contracts';
import type {QuickRecommendation} from './recommendation';
import {plain} from './model';
import {skillPlan} from './skillOrders';
import {recommendationSnapshot,recommendationChanges,type RecommendationSnapshot} from './recommendationChanges';
export default function RecommendationChanges({scenario:s,recommendation:r,data}:{scenario:Scenario;recommendation:QuickRecommendation;data:Dataset}){
 const current=recommendationSnapshot(s,r),signature=JSON.stringify(current),previous=useRef<RecommendationSnapshot|null>(null);
 const [transition,setTransition]=useState<{before:RecommendationSnapshot;after:RecommendationSnapshot}|null>(null);
 useEffect(()=>{const old=previous.current;if(old&&JSON.stringify(old)!==signature)setTransition({before:old,after:current});previous.current=current;},[signature]);
 if(!transition)return <aside className="notice">O que mudou e por quê? Altere o adversário, os pesos ou a rota para comparar com a recomendação anterior.</aside>;
 const delta=recommendationChanges(transition.before,transition.after,r,data),runeName=(id:number)=>data.runes.flatMap(t=>t.slots.flatMap(x=>x.runes)).find(x=>x.id===id)?.name??String(id);
 return <section className="panel recommendation-changes" aria-label="O que mudou e por quê?"><h3>O que mudou e por quê?</h3><p className="hint">{delta.triggers.join(' · ')||'Configuração ou recomendação atualizada.'}</p><p role="status">{delta.unchanged?'A recomendação permaneceu igual após o recálculo. Os mesmos candidatos continuam prioritários; não forçamos trocas apenas para mostrar diferença.':`${delta.added.length} itens entraram · ${delta.removed.length} saíram · ${delta.runeAdded.length} runas alteradas · ${delta.skills.length} níveis de habilidades alterados.`}</p>
 <details><summary>Ver alterações e motivos</summary>{delta.removed.length>0&&<p>Saíram: {delta.removed.map(id=>plain(data.items[id]?.name??id)).join(', ')}.</p>}{delta.itemReasons.map(({id,text})=><article className="guide-card" key={id}><h4><img src={`/assets/riot/icons/item/${data.items[id].image.full}`} alt=""/>{plain(data.items[id].name)} · entrou</h4><p>{text}</p></article>)}{delta.reordered&&<p>Os itens permaneceram, mas a ordem de compra mudou.</p>}{!!delta.runeAdded.length&&<p>Runas: {delta.runeRemoved.map(runeName).join(', ')} → {delta.runeAdded.map(runeName).join(', ')}. A afinidade estimada foi recalculada para o kit, os pesos e o contexto; isso não representa um ganho de dano medido.</p>}{delta.shardsChanged&&<p>Fragmentos: {transition.before.shards.join(', ')} → {transition.after.shards.join(', ')}.</p>}{!!delta.skills.length&&<><p>Habilidades: {delta.skills.map(x=>`nível ${x.level}: ${x.from} → ${x.to}`).join(' · ')}.</p><p>{skillPlan(s,data).reason}</p></>}<p className="hint">Scores normalizados pertencem ao pool atual de cada decisão; não comparamos scores de cálculos ou slots diferentes. Travas e inventário continuam respeitados.</p></details></section>;
}
