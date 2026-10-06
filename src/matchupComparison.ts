import type {Dataset,Fighter,Scenario,Stats} from './contracts.ts';
import {statsFor,effectiveResistance,mitigate} from './model.ts';
import {evaluateBuild} from './buildEvaluation.ts';
import {championForCounter} from './counterAdapters.ts';
export interface DuelSide {stats:Stats;physicalReduction:number;magicReduction:number;ehp:number;dps:number;ttk:number;basis:'combo'|'attacks'|'class';omitted:number}
export interface ResponseBadge {id:string;icon:string;label:string;tooltip:string}
/** Negative resistance amplifies damage; penetration alone cannot push positive resistance below zero. */
export function matchupMitigation(defender:Stats,attacker:Stats){
 const physical=mitigate(1,effectiveResistance(defender.armor,attacker.armorPenPercent,attacker.armorPen));
 const magic=mitigate(1,effectiveResistance(defender.mr,attacker.magicPenPercent,attacker.magicPen));
 return {physical,magic,physicalReduction:1-physical,magicReduction:1-magic};
}
function offense(f:Fighter,target:Fighter,s:Scenario,data:Dataset){
 const combo=f.actions.some(a=>a.kind==='spell');
 const attacker=combo?f:{...f,actions:[],automaticAttacks:true};
 const metrics=evaluateBuild(attacker.items,{...s,player:attacker,enemy:target},data);
 return {metrics,basis:combo?'combo' as const:metrics.estimatedRotationDPS!==undefined?'class' as const:'attacks' as const};
}
export function attributeDifference(mine:number,enemy:number){
 const absolute=mine-enemy;
 return {absolute,percent:enemy===0?(mine===0?0:null):absolute/Math.abs(enemy)*100};
}
export function compareMatchup(s:Scenario,data:Dataset){
 const playerStats=statsFor(s.player,data),enemyStats=statsFor(s.enemy,data);
 const playerOffense=offense(s.player,s.enemy,s,data),enemyOffense=offense(s.enemy,s.player,s,data);
 function side(stats:Stats,opponent:Stats,own:ReturnType<typeof offense>,incoming:ReturnType<typeof offense>):DuelSide{
  const m=matchupMitigation(stats,opponent),mix=incoming.metrics.rawDPSByType??{physical:1,magic:0,true:0};
  const total=mix.physical+mix.magic+mix.true;
  // No delivered damage: report physical-AA EHP as a reference, never an infinite survival claim.
  const multiplier=total>0?(mix.physical*m.physical+mix.magic*m.magic+mix.true)/total:m.physical;
  return {stats,physicalReduction:m.physicalReduction,magicReduction:m.magicReduction,ehp:stats.hp/multiplier,dps:own.metrics.dps,ttk:own.metrics.ttk,basis:own.basis,omitted:own.metrics.omitted};
 }
 const badges:ResponseBadge[]=[],items=s.player.items,has=(ids:string[])=>items.some(id=>ids.includes(id));
 const availability='Indica uma resposta disponível na build. A ativação depende das condições e dos tempos de recarga do item; não está aplicada automaticamente nestas métricas.';
 if((enemyStats.lifesteal>0||championForCounter(s.enemy.champion,data,s.enemy).hasHealing)&&has(['3033','3123','3165','3916','3075','3076']))badges.push({id:'healing',icon:'🩸',label:'Corta-Cura Disponível',tooltip:availability});
 if(has(['3026','3156','3157','2420','3053','6673','3102']))badges.push({id:'defense',icon:'🛡️',label:'Defesa Condicional',tooltip:availability});
 if((enemyStats.hp>3000||enemyStats.armor>150||enemyStats.mr>150)&&has(['3036','3033','6694','3071','3135','3137']))badges.push({id:'tank',icon:'🗡️',label:'Penetração/Anti-Tanque',tooltip:'Penetração estática coberta entra na mitigação. Reduções condicionais, como stacks do Cutelo, dependem da aplicação no alvo. '+availability});
 return {player:side(playerStats,enemyStats,playerOffense,enemyOffense),enemy:side(enemyStats,playerStats,enemyOffense,playerOffense),badges};
}
