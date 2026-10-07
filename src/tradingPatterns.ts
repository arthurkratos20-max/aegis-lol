import type {Dataset,Scenario,Fighter} from './contracts.ts';
import {kitFor} from './compatibility.ts';
import {runeAffinity} from './runeAffinity.ts';
import {championForCounter} from './counterAdapters.ts';

export type TradePattern='short'|'sustained'|'pressure'|'neutral';
const has=(id:string,list:string)=>list.split(' ').includes(id);
/** Reviewed kit traits. Unknown traits are conservative, never inferred from AD alone. */
export function tradingKit(f:Fighter,data:Dataset){
 const c=data.champions[f.champion],k=kitFor(f,data),affinity=runeAffinity(f,data);
 const immediateAttacks=has(f.champion,'Kaisa Vayne Varus Tristana Kalista Twitch Ashe XinZhao MasterYi Jax Renekton Pantheon Vi RekSai Shaco Pyke Belveth Warwick Wukong Volibear Sett');
 const artillery=has(f.champion,'Xerath Velkoz Ziggs Lux');
 const attacks=k.autoAttack&&!artillery;
 const sustainedSpells=affinity==='battle'||has(f.champion,'Akali Katarina Sylas');
 const tank=['tank','engage','warden'].includes(affinity);
 const burstSpells=affinity==='burst'||c.tags.includes('Assassin');
 return {affinity,immediateAttacks:attacks&&immediateAttacks,attacks,artillery,sustainedSpells,tank,burstSpells,hardCC:k.hardCC,melee:k.range<=300,healShield:k.healShield};
}
export function matchupTradeProfile(s:Scenario,data:Dataset):{pattern:TradePattern;reason:string}{
 if(s.matchupUnknown)return {pattern:'neutral',reason:'Adversário indefinido: mantém a afinidade base do kit.'};
 const enemy=championForCounter(s.enemy.champion,data,s.enemy),c=data.champions[enemy.id];
 // Explicit poke traits precede generic class labels; range alone is not sufficient.
 const poke=has(enemy.id,'Caitlyn Varus Ezreal Ashe Senna Xerath Velkoz Ziggs Lux Jayce Nidalee Zoe Karma Heimerdinger Teemo Kennen Brand Zyra');
 if(poke)return {pattern:'pressure',reason:`Pressão de alcance de ${enemy.name}: prioriza sustentação, reposicionamento ou resposta de poke compatível com seu kit.`};
 if(enemy.isBurst||enemy.hasHardCC&&has(enemy.id,'Leona Nautilus Rell Alistar Blitzcrank Thresh Amumu Rakan'))return {pattern:'short',reason:`Janela curta contra ${enemy.name}: a entrada, o burst ou o controle podem limitar o tempo disponível para atacar.`};
 if(enemy.isTank||c.tags.includes('Fighter'))return {pattern:'sustained',reason:`Contra ${enemy.name}, considera uma troca prolongada se houver acesso contínuo ao alvo; acúmulos não são garantidos.`};
 return {pattern:'neutral',reason:`Contra ${enemy.name}, não há padrão dominante revisado: preserva a afinidade base.`};
}
/** Recommendation eligibility, distinct from whether a manually selected rune is legal. */
export function tradingKeystoneAllowed(id:number,s:Scenario,data:Dataset):boolean{
 const k=tradingKit(s.player,data);
 if(id===9923)return k.immediateAttacks;
 if(id===8008)return k.attacks&&!k.tank;
 if(id===8005||id===8021)return k.attacks&&!k.tank;
 if(id===8010)return k.sustainedSpells||k.attacks&&k.melee&&!k.tank;
 if(id===8437)return k.melee&&(k.tank||k.attacks);
 if(id===8439)return k.hardCC&&(k.tank||has(s.player.champion,'Lissandra Galio'));
 if(id===8992)return ['poke','battle','burst'].includes(k.affinity)||k.burstSpells;
 if(id===8128||id===8369)return k.burstSpells||['poke','battle'].includes(k.affinity);
 if(id===8351)return k.hardCC;
 if(id===8112)return k.burstSpells||k.immediateAttacks;
 if(id===8214)return k.healShield||['poke','battle','burst'].includes(k.affinity);
 if(id===8229)return ['poke','battle','burst'].includes(k.affinity);
 return true;
}
export function tradingKeystoneBonus(id:number,s:Scenario,data:Dataset):number{
 if(!tradingKeystoneAllowed(id,s,data))return 0;
 const k=tradingKit(s.player,data),p=matchupTradeProfile(s,data).pattern;
 if(p==='neutral')return 0;
 if(p==='short'){
  if(id===9923&&k.immediateAttacks)return .55;
  if(id===8112&&k.burstSpells)return .3;
  if(id===8439&&k.hardCC&&k.tank)return .4;
  if(id===8008&&k.immediateAttacks||id===8010&&(k.immediateAttacks||k.burstSpells))return -.2;
 }
 if(p==='sustained'){
  if(id===8008&&k.attacks)return .4;
  if(id===8010&&(k.sustainedSpells||k.melee))return .4;
  // Grasp is prepared between trades, unlike in-combat stacking keystones.
  if(id===8437&&k.melee)return .3;
  if(id===9923||id===8112)return -.12;
 }
 if(p==='pressure'){
  if(id===8021&&k.attacks)return .85;
  if(id===8230&&(k.sustainedSpells||k.melee&&!k.tank))return .4;
  if(id===8214&&k.healShield)return .3;
  if(id===8229&&k.affinity==='poke')return .25;
 }
 return 0;
}
export function tradingKeystoneReason(id:number,s:Scenario,data:Dataset):string{
 const profile=matchupTradeProfile(s,data),name=data.runes.flatMap(t=>t.slots[0].runes).find(r=>r.id===id)?.name??'Runa principal';
 const details:Record<number,string>={
  9923:'Ataques iniciais rápidos aproveitam efeitos imediatos/reset de ataque do kit antes de recuar; não equivale a proteção contra burst.',
  8008:'Favorece ataques repetidos com tempo para acumular a runa; perder acesso ao alvo reduz seu valor.',
  8010:'Favorece aplicações repetidas de ataques/habilidades em combate; exige tempo real para acumular.',
  8437:'Favorece preparar a runa e aplicar ataques em trocas corpo a corpo; não exige uma luta longa contínua.',
  8439:'Sua imobilização ativa a janela defensiva para absorver a resposta; falhar o controle impede essa proteção.',
  8112:'O kit tem afinidade com aplicações distintas em uma troca curta antes de recuar.',
  8021:'Ataques energizados oferecem sustentação e reposicionamento sob pressão de rota.',
  8229:'O kit aproveita pressão com habilidades; Cometa não fornece cura nem mobilidade.',
  8214:'O kit aproveita dano de poke ou proteção de aliados; Aery não fornece mobilidade.',
  8230:'Aplicações distintas habilitam reposicionamento; não presume ativação automática.'
 };
 return `${name}: ${profile.reason} ${details[id]??'Preserva a afinidade da runa com as ferramentas do kit.'} Matriz estratégica estimada, sem taxa de vitória ou simulação exata da runa.`;
}
