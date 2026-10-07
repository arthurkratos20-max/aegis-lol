'use client';
import BuildStages from './BuildStages';
import LanePlan from './LanePlan';
import GuideMatchups from './GuideMatchups';
import GuideSkills from './GuideSkills';
import GuideText from './GuideText';
import type {Dataset,Scenario} from './contracts';
import type {QuickRecommendation} from './recommendation';
import {plain} from './model';
import {championKitCoverage} from './championKit';
import {itemReason} from './fullBuild';
import GateKeepPro from './auth/GateKeepPro';
const num=(n:number)=>n.toLocaleString('pt-BR',{maximumFractionDigits:3});
export default function ContextGuide({scenario:s,data,recommendation:rec,onChange}:{onChange?:(s:Scenario)=>void;scenario:Scenario;data:Dataset;recommendation:QuickRecommendation}){
 const c=data.champions[s.player.champion],coverage=championKitCoverage(c.id,data);
 const round=rec.decisions?.find(d=>!rec.boots||d.selected!==rec.boots);
 const excluded=round?.candidates.filter(row=>!rec.target.includes(row.id)&&row.score<round.candidates[0].score-1e-9).slice(0,3)??[];
 return <section className="panel contextual-guide" aria-label="Guia contextual do campeão"><div className="panel-head"><div><span className="quick-eyebrow">GUIA CONTEXTUAL · {s.player.lane}</span><h2>Entenda {c.name}</h2></div><span className="testing-tag">{coverage.isExactFormula?'Guia Refinado & Validado':'Estimativa de Kit'}</span></div><p className="hint">Análise de Sinergia de Kit (Calculador Aegis). {coverage.status==='partial'?'Há fórmulas parciais disponíveis; isso não valida o kit completo nem este guia.':'Textos dinâmicos por perfil e catálogo; interações específicas ainda exigem revisão.'} Estatísticas de builds/matchups: não integradas; a ordem de habilidades indica sua fonte separadamente.</p>
 <nav className="guide-nav" aria-label="Seções do guia">{[['skills','Habilidades'],['items','Itens'],['matchups','Matchups'],['synergies','Sinergias']].map(([id,label])=><a key={id} href={`#guide-${id}`}>{label}</a>)}</nav>
 <LanePlan scenario={s} data={data}/>
 <GuideSkills key={`skills:${c.id}`} scenario={s} data={data} onChange={onChange}/>
 <BuildStages scenario={s} data={data} recommendation={rec}/>
 <section id="guide-items"><h3>Por que estes itens?</h3><p className="hint">Dano {s.weights.offense}% · Defesa {s.weights.defense}% · Utilidade {s.weights.utility}%. Bota e core automáticos também usam comparação contextual; inventário e travas são preservados.</p><div className="guide-item-grid">{rec.target.map((id,i)=>{const decision=rec.decisions?.find(d=>d.selected===id),row=decision?.candidates.find(r=>r.id===id);return <article className="guide-card" key={id}><h4><img src={`/assets/riot/icons/item/${data.items[id].image.full}`} alt=""/>{plain(data.items[id].name)}</h4><small>{id===rec.boots?'Bota contextual':row?'Slot livre / situacional':'Core ou inventário preservado'} · {num(data.items[id].gold.total)} G</small><p><GuideText text={itemReason(id,data)} data={data}/></p>{row?<details className="guide-score"><summary>Score {num(row.score)} · ver cálculo</summary><p className="hint">Score no slot {i+1}: {num(row.score)} = {num(s.weights.offense/100)} × {num(row.normalizedOffense)} (ofensiva) + {num(s.weights.defense/100)} × {num(row.normalizedEHP)} (EHP) + {num(s.weights.utility/100)} × {num(row.normalizedUtility)} (utilidade) + {num(row.counterBonus)} (contexto).</p></details>:<p className="hint">Preservado por regra estrutural ou inventário; não foi o vencedor de um ranking livre neste slot.</p>}</article>;})}</div><p className="hint">Motivos estratégicos podem citar efeitos de itens ainda não simulados. Scores usam apenas atributos/efeitos modelados, normalizados no pool de cada slot; não compare scores de slots diferentes.</p>
 <details className="guide-card"><summary>Itens que Parecem Bons, mas Não São <span className="pro-small">PRO</span></summary><GateKeepPro><p>“Armadilha” aqui significa menor prioridade neste cenário, não um item sempre ruim. Todos continuam sujeitos às mesmas regras de elegibilidade do montador.</p>{excluded.map(row=>{const best=round!.candidates[0];return <article key={row.id}><h4>{plain(data.items[row.id].name)}</h4><p>{itemReason(row.id,data)}</p><p>No primeiro slot livre avaliado: score {num(row.score)} contra {num(best.score)} de {plain(data.items[best.id].name)}. Diferença: {num(best.score-row.score)}.</p><p className="hint">Decomposição: ofensiva {num(row.normalizedOffense)}; EHP {num(row.normalizedEHP)}; utilidade {num(row.normalizedUtility)}; contra-bônus {num(row.counterBonus)}. Menor pontuação ponderada significa abrir mão de atributos mais valorizados pelos seus pesos neste pool.</p></article>;})}{!excluded.length&&<p>Não há alternativa com score inferior disponível na primeira decisão livre deste cenário.</p>}<p className="hint">Stacking futuro, waveclear real e valor de primeiro item não são integralmente simulados. Por isso, não atribuímos a Coração de Aço uma penalidade matemática de waveclear inexistente no modelo. Mudar o slider, a rota ou o matchup pode mudar este ranking.</p></GateKeepPro></details></section>
 <GuideMatchups key={`matchups:${c.id}`} scenario={s} data={data}/></section>;
}
