import {exclusiveGroupsValid} from './itemGroups.ts';
import type {Dataset,Scenario} from './contracts.ts';
import {statsFor,mitigate,effectiveResistance,isBoot} from './model.ts';
import {affinityCandidates,enemyAxis,profileFor,type QuickRecommendation} from './recommendation.ts';
/** Explicit attribute objective, NOT modeled champion DPS or passive activation. */
export function attributeScore(items:string[],s:Scenario,data:Dataset):number{
 const f=s.player,x=statsFor({...f,items},data),base=statsFor({...f,items:[]},data),e=statsFor(s.enemy,data),p=profileFor(f.champion,f.lane,data),ap=['enchanter','supportDamage','fighterAP','assassinAP','mageControl','mageBurn','mageBurst'].includes(p);
 const resist=effectiveResistance(ap?e.mr:e.armor,ap?x.magicPenPercent:x.armorPenPercent,ap?x.magicPen:x.armorPen),baseRes=ap?e.mr:e.armor;
 const offense=ap?(1+x.ap/100)*mitigate(1,resist)/mitigate(1,baseRes):(x.ad*x.as*(1+x.crit*(x.critMultiplier-1)))*mitigate(1,resist)/Math.max(1,base.ad*base.as*mitigate(1,baseRes));
 const axis=enemyAxis(s,data),ehp=(hp:number,armor:number,mr:number)=>axis==='physical'?hp/mitigate(1,armor):axis==='magic'?hp/mitigate(1,mr):hp/(.5*mitigate(1,armor)+.5*mitigate(1,mr));
 const defense=ehp(x.hp,x.armor,x.mr)/ehp(base.hp,base.armor,base.mr),utility=x.move/base.move+x.haste/100;
 return (s.weights.offense*Math.log(Math.max(1,offense))+s.weights.defense*Math.log(Math.max(1,defense))+s.weights.utility*Math.log(Math.max(1,utility)))/100;
}
export function optimizeQuick(rec:QuickRecommendation,s:Scenario,data:Dataset,incumbent?:QuickRecommendation):QuickRecommendation{
 const count=rec.cores.length,locked=[...new Set([...s.player.locked.filter(id=>!isBoot(id,data)),...rec.cores.filter(id=>rec.reasons[id]?.startsWith('Resposta estratégica à cura')||id==='6695')])],pool=affinityCandidates(s,data).filter(id=>!isBoot(id,data)),boot=rec.boots&&rec.target.includes(rec.boots)?rec.boots:null;
 if(!exclusiveGroupsValid(locked,data))throw Error('Itens travados conflitam em grupos exclusivos.');
 if(locked.length>count)return rec;
 const extras=pool.filter(id=>!locked.includes(id));let cores=[...rec.cores],best=exclusiveGroupsValid(cores,data)?attributeScore([...cores,...(boot?[boot]:[])],s,data):-Infinity;
 if(incumbent&&exclusiveGroupsValid(incumbent.target,data)&&incumbent.cores.length===count&&incumbent.cores.every(id=>pool.includes(id)||locked.includes(id))&&locked.every(id=>incumbent.cores.includes(id))){const score=attributeScore([...incumbent.cores,...(boot?[boot]:[])],s,data);if(score>=best-1e-9){cores=[...incumbent.cores];best=score;}}
 function visit(add:string[],start:number){if(!exclusiveGroupsValid([...locked,...add,...(boot?[boot]:[])],data))return;if(add.length===count-locked.length){const candidate=[...locked,...add],value=attributeScore([...candidate,...(boot?[boot]:[])],s,data);if(value>best+1e-9){cores=candidate;best=value;}return;}for(let i=start;i<extras.length;i++)visit([...add,extras[i]],i+1);}
 visit([],0);
 if(!Number.isFinite(best))throw Error('Grupos exclusivos impedem uma recomendação válida.');
 const same=incumbent&&cores.length===incumbent.cores.length&&cores.every(id=>incumbent.cores.includes(id));if(same)cores=[...incumbent.cores];else cores.sort((a,b)=>attributeScore([b],s,data)-attributeScore([a],s,data));
 const target=[...cores,...(boot?[boot]:[])];return {...rec,cores,boots:boot,target,total:target.reduce((n,id)=>n+data.items[id].gold.total,0),reasons:Object.fromEntries(cores.map(id=>[id,rec.reasons[id]??'Atributos compatíveis com a classe e resistências do cenário.'])),warnings:[...rec.warnings,'Slider: enumeração do conjunto de afinidade por score de atributos (AP/100 ou ataques, EHP e movimento/AH), não dano completo do kit. Passivas sem fórmula excluídas.']};
}
