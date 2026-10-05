import {SHARD_ROWS} from './shards.ts';
import type {Dataset,RunePage} from './contracts.ts';
export function selectManualRune(page:RunePage,data:Dataset,id:number):RunePage {
 const tree=data.runes.find(t=>t.slots.some(row=>row.runes.some(r=>r.id===id)));
 if(!tree||![page.primary,page.secondary].includes(tree.id))throw Error('Runa fora das árvores selecionadas.');
 const row=tree.slots.findIndex(row=>row.runes.some(r=>r.id===id));
 if(tree.id===page.secondary&&row===0)throw Error('A secundária não permite runa essencial.');
 const rowIds=tree.slots[row].runes.map(r=>r.id);
 let selected=page.selected.filter(r=>!rowIds.includes(r));
 let locks=(page.locks?.runes??[]).filter(r=>!rowIds.includes(r));
 if(tree.id===page.secondary){
  const secondaryIds=tree.slots.slice(1).flatMap(row=>row.runes.map(r=>r.id));
  const existing=selected.filter(r=>secondaryIds.includes(r));
  if(existing.length>=2){
   // Automatic choices yield first; explicit choices retain their click chronology in locks.runes.
   const oldest=existing.find(r=>!locks.includes(r))??locks.find(r=>existing.includes(r))!;
   selected=selected.filter(r=>r!==oldest);locks=locks.filter(r=>r!==oldest);
  }
 }
 // Clicking an already locked selection does not age it or unlock it.
 if(page.locks?.runes?.includes(id)&&page.selected.includes(id))return {...page,locked:false,locks:{...page.locks,runes:page.locks.runes.filter(r=>r!==id)}};
 return {...page,locked:false,selected:[...selected,id],locks:{...page.locks,runes:[...locks,id]}};
}
export function switchRuneTree(page:RunePage,data:Dataset,id:number,side:'primary'|'secondary'):RunePage {
 if(!data.runes.some(t=>t.id===id))throw Error('Árvore ausente no catálogo.');
 if(page[side]===id)return structuredClone(page);
 if(side==='secondary'&&id===page.primary)throw Error('As árvores devem ser diferentes.');
 const removed=new Set(data.runes.find(t=>t.id===page[side])?.slots.flatMap(row=>row.runes.map(r=>r.id))??[]);
 const collision=side==='primary'&&id===page.secondary;
 if(collision)for(const r of data.runes.find(t=>t.id===page.secondary)!.slots.flatMap(row=>row.runes))removed.add(r.id);
 return {...page,locked:false,[side]:id,secondary:collision?page.primary:(side==='secondary'?id:page.secondary),selected:page.selected.filter(r=>!removed.has(r)),locks:{...page.locks,runes:(page.locks?.runes??[]).filter(r=>!removed.has(r)),[side==='primary'?'primaryTree':'secondaryTree']:true,...(collision?{secondaryTree:false}:{})}};
}
export function selectManualShard(page:RunePage,slot:number,value:string):RunePage {
 if(!SHARD_ROWS[slot]?.includes(value))throw Error('Fragmento inválido para este slot.');
 if(page.shards[slot]===value&&page.locks?.shards?.includes(slot))return {...page,locked:false,locks:{...page.locks,shards:page.locks.shards.filter(i=>i!==slot)}};
 const shards=[...page.shards];shards[slot]=value;
 return {...page,locked:false,shards,locks:{...page.locks,shards:[...new Set([...(page.locks?.shards??[]),slot])]}};
}
export function unlockRunePage(page:RunePage):RunePage{return {...page,locked:false,locks:{}};}
