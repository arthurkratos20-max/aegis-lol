import type {Dataset,Scenario} from './contracts.ts';
import {skillPlan} from './skillOrders.ts';
import {championForCounter} from './counterAdapters.ts';
import {plain} from './model.ts';
export function lanePlan(s:Scenario,data:Dataset){
 const plan=skillPlan(s,data),mine=data.champions[s.player.champion],enemy=data.champions[s.enemy.champion];
 const known=!s.matchupUnknown,traits=known?championForCounter(enemy.id,data,s.enemy):null,ranged=known&&enemy.stats.attackrange>mine.stats.attackrange;
 const levels=plan.opening.map((key,i)=>({level:i+1,key,name:mine.spells[['Q','W','E','R'].indexOf(key)].name}));
 const pressure=s.player.lane==='Jungle'?'Na selva, adapte a rota ao alcance da sua limpeza e à informação disponível; não presumimos tempo de clear nem vantagem de invasão.':s.player.lane==='Support'?'Combine sua entrada com o alcance do aliado e preserve uma saída; não force trocas sem acompanhamento.':ranged?`Contra ${enemy.name}, a diferença de alcance favorece pressão à distância. Use a onda e o terreno para reduzir exposição antes de entrar.`:'Dispute espaço quando sua abertura estiver disponível; confira a posição da onda e evite lutar dentro de uma onda inimiga maior.';
 const trade=traits?.isBurst?'Prefira uma troca depois que o adversário gastar a principal ferramenta de burst. O catálogo não confirma uma janela exata em segundos.':traits?.hasHealing?'Evite trocas que permitam recuperação gratuita. Avalie sustentação e resposta à cura sem presumir que anti-cura já compensa no primeiro item.':'Troque quando suas ferramentas estiverem disponíveis e recue durante as recargas; manter a saída faz parte da janela.';
 const retreat=traits?.hasHardCC?'Espere o controle inimigo ser usado ou mantenha uma rota para desviar antes de comprometer mobilidade. Tenacidade não resolve todas as formas de controle.':'Preserve sua ferramenta de saída quando o inimigo puder responder; não use alcance de ataque como medida do alcance de todas as habilidades.';
 return {levels,reason:plan.reason,source:plan.source,skillCoverage:plan.coverage,pressure,trade,retreat,enemySkills:known?enemy.spells.map((spell,i)=>({key:['Q','W','E','R'][i],name:spell.name,description:plain(spell.description),icon:spell.image.full})):[],known};
}
