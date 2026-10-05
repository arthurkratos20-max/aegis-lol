import type {Dataset,Scenario} from './contracts.ts';
import {SHARD_LABELS} from './shards.ts';
import {plain} from './model.ts';
export function formattedBuild(s:Scenario,data:Dataset):string {
 const page=s.player.runes,tree=(id:number)=>data.runes.find(t=>t.id===id);
 const names=(id:number)=>tree(id)?.slots.flatMap(row=>row.runes).filter(r=>page.selected.includes(r.id)).map(r=>r.name).join(' · ')??'';
 return [`AEGIS LAB · ${data.champions[s.player.champion].name} vs ${data.champions[s.enemy.champion].name} · Patch ${data.version}`,`Itens (ordem):`,...s.player.items.map((id,i)=>`${i+1}. ${plain(data.items[id]?.name??id)}`),`Primária: ${tree(page.primary)?.name??page.primary} — ${names(page.primary)}`,`Secundária: ${tree(page.secondary)?.name??page.secondary} — ${names(page.secondary)}`,`Fragmentos: ${page.shards.map(k=>SHARD_LABELS[k]??k).join(' · ')}`,`Preferência: ${s.weights.offense}% dano / ${s.weights.defense}% defesa`].join('\n');
}
