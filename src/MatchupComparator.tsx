'use client';
import {useMemo,useState} from 'react';
import AttributeLabel from './AttributeLabel';
import {useAuth} from './auth/AuthProvider';
import ProModal from './auth/ProModal';
import {formattedBuild} from './buildExport';
import type {Dataset,Scenario,Stats} from './contracts';
import {attributeDifference,compareMatchup,type DuelSide} from './matchupComparison';
export interface MatchupComparatorProps {scenario:Scenario;data:Dataset}
const format=(n:number,digits=1)=>Number.isFinite(n)?n.toLocaleString('pt-BR',{maximumFractionDigits:digits}):'∞';
const attributes:{key:keyof Stats;label:string;percent?:boolean}[]=[
 {key:'hp',label:'Vida'},{key:'ad',label:'AD'},{key:'ap',label:'AP'},
 {key:'armor',label:'Armadura'},{key:'mr',label:'RM'},{key:'haste',label:'Aceleração'},
 {key:'as',label:'Vel. de ataque'},{key:'crit',label:'Crítico',percent:true},
 {key:'move',label:'Movimento'},{key:'lifesteal',label:'Roubo de vida',percent:true},
 {key:'armorPen',label:'Pen. física plana'},{key:'magicPen',label:'Pen. mágica plana'},
 {key:'armorPenPercent',label:'Pen. física %',percent:true},{key:'magicPenPercent',label:'Pen. mágica %',percent:true},
];
function Metrics({side,name,advantage}:{side:DuelSide;name:string;advantage:boolean}){
 return <article className="duel-metrics"><h4>{name}</h4><dl>
 <div><dt><AttributeLabel attribute="armor">Redução física</AttributeLabel></dt><dd>{format(side.physicalReduction*100)}%</dd></div>
 <div><dt><AttributeLabel attribute="mr">Redução mágica</AttributeLabel></dt><dd>{format(side.magicReduction*100)}%</dd></div>
 <div><dt><AttributeLabel attribute="hp">EHP vs matchup</AttributeLabel></dt><dd>{format(side.ehp,0)}</dd></div>
 <div><dt><AttributeLabel attribute="damage">DPS estimado</AttributeLabel></dt><dd>{format(side.dps)}</dd></div>
 <div className={advantage?'duel-advantage':''}><dt><AttributeLabel attribute="window">TTK estimado</AttributeLabel></dt><dd>{side.dps>0?`${format(side.ttk)} s`:'Sem dano na janela'}</dd></div>
 </dl><p className="duel-basis" title={side.basis==='combo'?'Dano médio da sequência configurada dividido pela duração do cenário. Extrapolação a DPS constante; não é um tempo de execução garantido.':'Ataques mais rotação de classe por cooldowns, AH e recurso. Fórmulas do kit não integralmente validadas.'}>{side.basis==='combo'?'Estimativa pela sequência configurada':'Modelo de classe + ataques · fórmula aproximada'}</p>
 {side.omitted>0&&<p className="duel-basis">{side.omitted} efeito(s) de dano sem cálculo completo.</p>}</article>;
}
export default function MatchupComparator({scenario,data}:MatchupComparatorProps){
 const {isPro}=useAuth();const [upgrade,setUpgrade]=useState(false),[copyStatus,setCopyStatus]=useState('');
 async function copy(){if(!isPro){setUpgrade(true);return;}try{await navigator.clipboard.writeText(formattedBuild(scenario,data));setCopyStatus('Build e runas copiadas em texto. Configure as runas manualmente no cliente.');}catch{setCopyStatus('Não foi possível copiar. Permita acesso à área de transferência.');}}
 const duel=useMemo(()=>compareMatchup(scenario,data),[scenario,data]);
 const mine=data.champions[scenario.player.champion].name,enemy=data.champions[scenario.enemy.champion].name;
 return <section className="panel matchup-comparator" aria-label="Aegis Lab versus build inimiga">
 <div className="panel-head"><h3>Aegis Lab vs Build Inimiga</h3><span className="testing-tag">Sugestão ao vivo</span></div>
 <div className="duel-fighters"><strong>{mine}<small>Sua build sugerida</small></strong><span>VS</span><strong>{enemy}<small>Build inimiga equipada</small></strong></div>
 <h4 className="duel-analysis-title">Atributos e modificadores</h4><div className="table-scroll"><table className="tactical-table duel-attribute-table"><thead><tr><th scope="col">Atributo</th><th scope="col">{mine}</th><th scope="col">{enemy}</th><th scope="col">Diferença</th></tr></thead><tbody>{attributes.map(({key,label,percent})=>{
  const a=(duel.player.stats[key]??0)*(percent?100:1),b=(duel.enemy.stats[key]??0)*(percent?100:1),diff=attributeDifference(a,b);
  const signed=(n:number)=>`${n>0?'+':''}${format(n)}`;
  return <tr key={key}><th scope="row"><AttributeLabel attribute={key}>{label}</AttributeLabel></th><td className={a>b?'duel-advantage':''}>{format(a)}{percent?'%':''}</td><td className={b>a?'duel-advantage':''}>{format(b)}{percent?'%':''}</td><td title={diff.percent===null?'Base inimiga zero':`${signed(diff.percent)}%`}>{signed(diff.absolute)}{percent?' p.p.':''}</td></tr>;
 })}</tbody></table></div>
 {isPro?<>{/* Detailed metrics require backend-confirmed access. */}<h4 className="duel-analysis-title">Análise de Duelo Direto</h4><div className="duel-analysis"><Metrics side={duel.player} name={mine} advantage={duel.player.ttk<duel.enemy.ttk}/><Metrics side={duel.enemy} name={enemy} advantage={duel.enemy.ttk<duel.player.ttk}/></div>
 <p className="duel-basis">EHP contra a composição de dano calculada do oponente. TTK considera vida máxima e DPS médio; cura, escudos e proteções condicionais não entram nesta estimativa.</p>
 </>:<div className="duel-pro-overlay"><h4>Análise de Duelo Direto · PRO</h4><p>Vida efetiva contra o matchup, mitigação após penetração e tempo estimado para abater ou ser abatido.</p><button onClick={()=>setUpgrade(true)}>Desbloquear análise PRO</button></div>}
 {duel.badges.length>0&&<div className="duel-badges">{duel.badges.map(b=><span key={b.id} tabIndex={0} className="duel-response">{b.icon} {b.label}<span role="tooltip">{b.tooltip}</span></span>)}</div>}
 <div className="duel-export"><button onClick={()=>void copy()}>Copiar Build / Runas {isPro?'':'· PRO'}</button><small>Texto para consulta; não importa runas automaticamente no cliente.</small></div>{copyStatus&&<p role="status">{copyStatus}</p>}{upgrade&&<ProModal close={()=>setUpgrade(false)}/>}
 </section>;
}
