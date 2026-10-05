import {exclusiveGroupsValid} from './itemGroups.ts';
import type {Dataset,Scenario,CombatResult} from './contracts.ts';
import {itemEligible,isBoot,statsFor,validateScenario} from './model.ts';
import {simulate} from './engine.ts';
export interface Alternative {items:string[];cost:number;score:number;damage:number;hp:number;result:CombatResult}
export interface PurchasePlan {purchase:number;sale:number;net:number;remaining:number;total:number;unusedOwned:string[]}
/** Allocate each owned component once. Recipe order is deterministic. */
export function purchasePlan(items:string[],s:Scenario,data:Dataset):PurchasePlan {
 const owned=[...s.player.owned];
 function consume(id:string,path=new Set<string>()):number {
  const item=data.items[id];if(!item)throw Error(`Item ausente: ${id}`);
  const index=owned.indexOf(id);if(index>=0){owned.splice(index,1);return item.gold.total;}
  if(path.has(id))throw Error('Receita circular');const next=new Set(path).add(id);
  return Math.min(item.gold.total,(item.from??[]).reduce((sum,component)=>sum+consume(component,next),0));
 }
 const purchase=items.reduce((sum,id)=>sum+data.items[id].gold.total-consume(id),0);
 const sale=s.allowSell?owned.reduce((sum,id)=>sum+data.items[id].gold.sell,0):0;
 const net=purchase-sale;
 return {purchase,sale,net,remaining:s.budget-net,total:items.reduce((sum,id)=>sum+data.items[id].gold.total,0),unusedOwned:owned};
}
export function purchaseCost(items:string[],s:Scenario,data:Dataset):number{return Math.max(0,purchasePlan(items,s,data).net);}
export function legalBuild(items:string[],s:Scenario,data:Dataset):boolean {
 if(!exclusiveGroupsValid(items,data))return false;
 if(items.length>s.slots||new Set(items).size!==items.length||items.some(id=>!itemEligible(id,data,s.player.champion)))return false;
 if(items.filter(id=>isBoot(id,data)).length>1)return false;
 if(s.player.boots==='none'&&items.some(id=>isBoot(id,data)))return false;
 if(s.player.boots==='fixed'&&(!s.player.fixedBoot||!items.includes(s.player.fixedBoot)))return false;
 if(s.player.locked.some(id=>!items.includes(id)))return false;
 const plan=purchasePlan(items,s,data);
 return (s.allowSell||plan.unusedOwned.length===0)&&plan.net<=s.budget;
}
export function score(r:CombatResult,s:Scenario,data:Dataset):number {
 const base=statsFor({...s.player,items:[]},data);
 const offense=s.objective==='single'?Math.max(0,...r.events.filter(e=>e.actor==='player').map(e=>e.damage)):s.objective==='burst'?r.events.filter(e=>e.actor==='player'&&e.at<=Math.min(3,s.duration)).reduce((a,e)=>a+e.damage,0):r.player.damage;
 const survivability=s.defensiveObjective==='combo'?r.player.hp/base.hp:s.defensiveObjective==='sustain'?(r.player.hp+r.player.healing+r.player.shielding)/base.hp:r.player.death===null?1+r.player.hp/base.hp:r.player.death/s.duration;
 const actual=statsFor(s.player,data);const utility=(actual.move/base.move+actual.haste/100)/2;
 return s.weights.offense/100*offense/Math.max(1,base.ad*base.as*s.duration)+s.weights.defense/100*survivability+s.weights.utility/100*utility;
}
export interface SearchOptions {limit?:number;timeoutMs?:number;onProgress?:(n:number)=>void;cancelled?:()=>boolean;exact?:boolean;candidates?:string[]}
export function optimize(s:Scenario,data:Dataset,options:SearchOptions={}):{alternatives:Alternative[];evaluated:number;method:string;complete:boolean;warnings:string[]} {
 const errors=validateScenario(s,data);if(errors.length)throw Error(errors.join('; '));
 if(s.mode==='strict')throw Error('Otimização estrita indisponível até validação de todas as dependências.');
 const start=Date.now(),limit=options.limit??2500,timeout=options.timeoutMs??8000;
 if(!Number.isInteger(limit)||limit<1||!Number.isFinite(timeout)||timeout<=0)throw Error('Limites de busca inválidos');
 let evaluated=0,complete=true;
 const required=[...new Set([...s.player.locked,...(s.player.boots==='fixed'&&s.player.fixedBoot?[s.player.fixedBoot]:[])])];
 const owned=[...s.player.owned];
 if([...required,...owned].some(id=>!itemEligible(id,data,s.player.champion)))throw Error('Item obrigatório não elegível');
 const choices=[...new Set(options.candidates??Object.keys(data.items).filter(id=>itemEligible(id,data,s.player.champion)&&data.items[id].gold.total>0&&(!data.items[id].into?.length||isBoot(id,data))))].filter(id=>itemEligible(id,data,s.player.champion));
 const alternatives:Alternative[]=[],seen=new Map<string,Alternative|null>();
 function stopped():boolean {if(options.cancelled?.())throw Error('Cancelado');if(evaluated>=limit||Date.now()-start>=timeout){complete=false;return true;}return false;}
 function evaluate(items:string[]):Alternative|null {
  if(stopped())return null;const key=[...items].sort().join(',');if(seen.has(key))return seen.get(key)!;
  if(!legalBuild(items,s,data)){seen.set(key,null);return null;}
  const scenario={...s,player:{...s.player,items:[...items]}};const result=simulate(scenario,data);evaluated++;
  const a={items:[...items],cost:purchaseCost(items,s,data),score:score(result,scenario,data),damage:result.player.damage,hp:result.player.hp,result};seen.set(key,a);alternatives.push(a);
  if(evaluated%25===0)options.onProgress?.(evaluated);return a;
 }
 // Always evaluate the current legal build first, so a new search cannot regress it.
 evaluate(s.player.items);
 if(options.exact){
  const pool=[...new Set([...choices,...owned])].filter(id=>!required.includes(id));
  function visit(items:string[],index:number):void {if(stopped())return;evaluate(items);if(items.length>=s.slots)return;for(let i=index;i<pool.length;i++){if(stopped())return;visit([...items,pool[i]],i+1);}}
  visit(required,0);
 }else{
  const initial=[...new Set([...required,...owned])];
  let beam=[evaluate(initial)].filter((a):a is Alternative=>!!a);
  if(s.allowSell){const a=evaluate(required);if(a&&!beam.includes(a))beam.push(a);}
  if(!beam.length)throw Error('Itens possuídos/travados incompatíveis com slots, orçamento ou botas.');
  for(let depth=0;depth<s.slots+1&&!stopped();depth++){
   const next:Alternative[]=[];
   for(const b of beam){for(const id of choices){if(stopped())break;if(b.items.includes(id))continue;
    const additions=b.items.length<s.slots?[[...b.items,id]]:[];
    for(let n=0;n<b.items.length;n++)if(!required.includes(b.items[n]))additions.push([...b.items.slice(0,n),...b.items.slice(n+1),id]);
    for(const build of additions){const key=[...build].sort().join(',');if(seen.has(key))continue;const a=evaluate(build);if(a)next.push(a);}
   }if(stopped())break;}
   if(!next.length)break;beam=next.sort((a,b)=>b.score-a.score||a.cost-b.cost).slice(0,12);
  }
 }
 options.onProgress?.(evaluated);
 if(!alternatives.length)throw Error('Nenhuma build legal entre os candidatos');
 return {alternatives:alternatives.sort((a,b)=>b.score-a.score||a.cost-b.cost).slice(0,20),evaluated,complete,method:options.exact?(complete?'Enumeração completa dos candidatos':'Enumeração interrompida'):'Beam search (12 alternativas por etapa)',warnings:['Melhor entre candidatos avaliados; não é ótimo global do catálogo.','Passivas, grupos únicos e efeitos não cobertos exigem revisão manual.',...(complete?[]:['Busca interrompida pelo limite de avaliações ou tempo.'])]};
}
export function pareto(items:Alternative[]):Alternative[]{return items.filter(a=>!items.some(b=>b!==a&&b.damage>=a.damage&&b.hp>=a.hp&&b.cost<=a.cost&&(b.damage>a.damage||b.hp>a.hp||b.cost<a.cost)));}
