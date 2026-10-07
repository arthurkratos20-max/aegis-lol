import type {Dataset,Scenario} from './contracts.ts';
import {profileFor,affinityCandidates} from './recommendation.ts';
import {championForCounter} from './counterAdapters.ts';
import {itemEligible} from './model.ts';
import {itemCompatible} from './compatibility.ts';
import {exclusiveGroupsValid} from './itemGroups.ts';
export interface ContextualResponse {id?:string;reason:string;trait:string;coverage:'estimated'}
/** Ordered strategic rules, not measured win rates or simulated item passives. */
export function contextualResponse(s:Scenario,data:Dataset,required:string[]=[]):ContextualResponse {
 const none={reason:'Sem resposta específica disponível; preserva atributos e afinidade de kit.',trait:'none',coverage:'estimated' as const};
 if(s.matchupUnknown)return {...none,reason:'Adversário desconhecido: nenhuma resposta específica é presumida.'};
 const p=profileFor(s.player.champion,s.player.lane,data),enemy=championForCounter(s.enemy.champion,data,s.enemy);
 const tank=['tank','supportTank'].includes(p),ap=['mageBurst','mageBurn','mageControl','supportDamage','fighterAP','assassinAP'].includes(p);
 let ids:string[],trait:string,reason:string;
 if(p==='enchanter'){
  ids=enemy.hasHardCC?['3222','3107']:enemy.isBurst?['3190','3107']:['3107','6617'];trait=enemy.hasHardCC?'ally-cleanse':'ally-protection';
  reason='Utilidade de suporte: proteção de aliados'+(enemy.hasHardCC?' e opção de remoção de controle removível. Não remove supressão nem efeitos não purificáveis.':'.')+' A efetividade de cura/escudo e execução da ativa não está simulada.';
 }else if(enemy.isTank&&!tank){
  ids=ap?['3135','3137']:p==='marksman'?['3036','3033']:['3071','3036'];trait='penetration';
  reason='Penetração percentual contra um perfil durável; o dano é recalculado com as resistências do alvo. Não presume que todo tanque comprou armadura/RM.';
 }else if(enemy.hasHealing){
  ids=ap?['3165']:tank?['3075']:['3033','6609'];trait='anti-heal';
  reason='Resposta situacional à cura identificada no kit. Feridas Dolorosas e sua aplicação não estão quantificadas; Espinhos exige receber ataques para aplicar o efeito.';
 }else if(enemy.damageType==='magic'){
  ids=tank?['3065','6664','4401']:ap?['3102']:p==='marksman'?(enemy.isBurst?['3156','3091']:['3091','3156']):['3156','3814'];trait='magic-resist';
  reason='Resistência mágica ou proteção compatível com o kit contra pressão mágica. Escudos e bloqueio de habilidade são benefícios estratégicos não quantificados.';
 }else if(enemy.damageType==='physical'){
  ids=tank?['2502','3143','3075']:ap?['3157']:p==='marksman'?['3026','6673']:['6333','3026'];trait='armor';
  reason='Armadura/proteção ofensiva contra pressão física, preservando a função do campeão. Estase, ressurreição e adiamento de dano não são simulados.';
 }else{
  ids=tank?['3084','6665']:ap?['3157','3102']:['6673','3072','3053'];trait='mixed';
  reason='Durabilidade para um kit de dano misto; a mistura real depende das ações e da build inimiga, ainda desconhecidas.';
 }
 const affinity=new Set(affinityCandidates(s,data));
 const legal=(id:string)=>!!data.items[id]&&itemEligible(id,data,s.player.champion)&&itemCompatible(id,s.player,data).allowed&&exclusiveGroupsValid([...new Set([...required,id])],data);
 const id=ids.find(legal)??[...affinity].find(id=>legal(id)&&!required.includes(id)&&((trait==='magic-resist'&&(data.items[id].stats.FlatSpellBlockMod??0)>0)||(trait==='armor'&&(data.items[id].stats.FlatArmorMod??0)>0)));
 return id?{id,reason,trait,coverage:'estimated'}:none;
}
