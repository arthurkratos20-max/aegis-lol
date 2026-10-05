'use client';
import type {Dataset,Fighter} from './contracts';
import {stackDefinitions} from './stacks';
export default function StackPanel({f,data,onChange}:{f:Fighter;data:Dataset;onChange:(stacks:Fighter['stacks'])=>void}){
 const definitions=stackDefinitions(f,data);return <section className="stack-panel"><h3>Acúmulos ativos</h3>{definitions.length?definitions.map(d=><label key={d.key} className="stack-control"><span>{d.label}<small>{d.unit}</small></span><input type="number" min="0" max={d.max} step={d.step} value={f.stacks[d.key]??0} onChange={e=>onChange({...f.stacks,[d.key]:Math.max(0,Math.min(d.max,Math.floor(Number(e.target.value)/d.step)*d.step))})}/><input type="range" min="0" max={d.max} step={d.step} aria-label={`${d.label} · ${d.unit}`} value={f.stacks[d.key]??0} onChange={e=>onChange({...f.stacks,[d.key]:Number(e.target.value)})}/></label>):<p className="hint">Nenhum efeito acumulável coberto nos itens/runas desta build.</p>}<p className="hint">Valores atuais estáticos; não gerados novamente durante o combate. Efeitos ausentes do patch não aparecem. Imolar de Brasa de Bami não é uma passiva de acúmulos.</p></section>;
}
