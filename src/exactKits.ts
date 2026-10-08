import type {Action,CalcNode,ChampionMechanics,DamageType,Dataset,Fighter,NativeSpell,SkillKey,Stats} from './contracts.ts';
import {EMPTY_FORMULA} from './contracts.ts';
import {calculateNative} from './native.ts';
import {exactSnapshot} from './exactSnapshot.ts';
export const EXACT_PATCH='16.20.1';
export interface ExactEffect {id:string;champion:string;key:SkillKey|'AA'|'P';label:string;spell:string;calculation?:string;type:DamageType;note:string;mode?:string}
const effect=(champion:string,id:string,key:ExactEffect['key'],spell:string,calculation:string|undefined,type:DamageType,label:string,note:string,mode?:string):ExactEffect=>({champion,id,key,spell,calculation,type,label,note,mode});
/** Scoped arithmetic of explicit effects, never complete champion certifications. */
export const exactEffects:ExactEffect[]=[
 effect('Shen','shen-p','P','ShenPassive','{58a09e24}','magic','P · escudo padrão isolado','Valor do escudo sem missão Shen/Zed; ativação e redução de recarga não automatizadas.','shield'),
 effect('Shen','shen-q','Q','ShenQ','BasePercentHealth','magic','Q · ativar 3 ataques','3 bônus em ataques dentro de 8s; geometria e energia reembolsada não simuladas.','buff'),
 effect('Shen','shen-q-drag','Q','ShenQ','EmpPercentHealth','magic','Q · lâmina atravessou o alvo','Condição confirmada: lâmina atravessou o alvo. 3 bônus; velocidade extra não simulada.','buff'),
 effect('Shen','shen-e','E','ShenE','TauntDamage','physical','E · dano de impacto','Dano por vida bônus; deslocamento, provocação e reembolso de energia não simulados.'),
 effect('Jinx','jinx-minigun','Q','JinxQ',undefined,'physical','Q · habilitar metralhadora','Ataques acumulam até 3 níveis de AS por 2,5s; bônus do snapshot. Exceções do limite de AS e passiva por abate não simuladas.','passive'),
 effect('Jinx','jinx-rocket','Q','JinxQ','RocketDamage','physical','Q · um ataque com foguete','Substitui um ataque: dano total e crítico; custo por foguete. Área e velocidade da troca de arma não simuladas.','attack'),
 effect('Jinx','jinx-w','W','JinxW','TotalDamage','physical','W · Zap!','Impacto confirmado; duração real da animação dependente de AS não validada.'),
 effect('Jinx','jinx-e','E','JinxE','TotalDamage','magic','E · explosão confirmada','Um alvo atingido; armamento, prisão e geometria não simulados.'),
 effect('Jinx','jinx-r-min','R','JinxR','DamageFloor','physical','R · distância mínima','Componente inicial mínimo + vida perdida atual; distância declarada.'),
 effect('Jinx','jinx-r-max','R','JinxR','DamageMax','physical','R · distância máxima','Componente inicial máximo + vida perdida atual; distância declarada.'),
 effect('Ashe','ashe-w','W','Volley','TotalDamage','physical','W · uma flecha','Sem múltiplos acertos no mesmo alvo; aplica Gelo por 2s.'),
 effect('Ashe','ashe-q','Q','AsheQ','EmpoweredDamage','physical','Q · ativar Foco','Exige 4 ataques recentes; dano total da rajada, não 5× o coeficiente. AS extra não simulada.','buff'),
 effect('Ashe','ashe-r','R','EnchantedCrystalArrow','RMainDamage','magic','R · impacto primário','Dano de impacto; duração variável do atordoamento não simulada.'),
 effect('Vayne','vayne-q','Q','VayneTumble','ADRatioBonus','physical','Q · preparar ataque','Bônus no próximo ataque em 3s, sem crítico no bônus; recarga começa quando consumido. Deslocamento não simulado.','buff'),
 effect('Vayne','vayne-w','W','VayneSilveredBolts','TotalDamage','true','W · habilitar Dardos de Prata','Passiva: terceiro ataque/E no mesmo alvo em 3,5s; mínimo de dano. Sem custo nem lançamento de W.','passive'),
 effect('Vayne','vayne-e','E','VayneCondemn','TotalDamage','physical','E · impacto sem parede','Aplica um acúmulo de W. Colisão e stun não simulados.'),
 effect('Vayne','vayne-e-wall','E','VayneCondemn','EmpoweredDamageTT','physical','E · dano adicional da parede','Somente dano adicional após impacto inicial; confirme parede e agende após E. Não aplica segundo acúmulo de W.','secondary'),
 effect('Lux','lux-q','Q','LuxLightBinding','TotalDamageTT','magic','Q · Ligação da Luz','Aplica marca por 6s; prisão não simulada.'),
 effect('Lux','lux-e','E','LuxLightStrikeKugel','TotalDamageTT','magic','E · detonação','Aplica marca por 6s; slow, recast e área não simulados.'),
 effect('Lux','lux-r','R','LuxR','TotalDamage','magic','R · Centelha Final','Detona marca existente antes de reaplicar; não inclui reset por abate.'),
 effect('Lux','lux-w','W','LuxPrismaticWave','TotalShieldTT','magic','W · escudo de uma passagem','Um escudo próprio de 2,5s; retorno e escudos de aliados não presumidos.'),
 effect('Garen','garen-w','W','GarenW','TotalShield','physical','W · Coragem','Escudo por vida bônus durante 0,75s; redução de dano físico/mágico por 4s. Dano verdadeiro ignora a redução; tenacidade e resistências por abates omitidas.','shield'),
 effect('Garen','garen-q','Q','GarenQ','TotalDamage','physical','Q · ataque fortalecido','Um ataque sem crítico confirmado; substitui o ataque e reinicia o intervalo. Silêncio e movimento omitidos.','attack'),
 effect('Garen','garen-e','E','GarenE','TotalDamage','physical','E · um tick sem crítico','Um tick explícito; redução de armadura após 6 ticks consecutivos em 3s. Quantidade por AS e alvo mais próximo não presumidos.','tick'),
 effect('Garen','garen-e-crit','E','GarenE','CriticalDamage','physical','E · um tick crítico confirmado','Crítico confirmado; não é crítico médio. Mesmas condições de ticks.','tick'),
 effect('Garen','garen-r','R','GarenR',undefined,'true','R · Justiça Demaciana','Dano verdadeiro usa vida perdida no instante do impacto.'),
 effect('Malphite','malphite-p','P','MalphiteShield','TotalShield','magic','P · escudo de granito isolado','10% da vida máxima; regeneração automática e armadura passiva não simuladas.','shield'),
 effect('Malphite','malphite-q','Q','SeismicShard','QDamageCalc','magic','Q · Fragmento Sísmico','Dano de impacto; roubo de movimento não simulado.'),
 effect('Malphite','malphite-w','W','Obduracy','TotalBonusDamage','magic','W · primeiro ataque','Ataque físico + 2× bônus mágico do primeiro golpe; reset do intervalo. Armadura já configurada, passiva não duplicada.','attack'),
 effect('Malphite','malphite-e','E','Landslide','EDamageCalc','magic','E · Tremor Terreno','Escalamento por armadura total e AP; redução de AS não simulada.'),
 effect('Malphite','malphite-r','R','UFSlash','TotalDamage','magic','R · Força Incontrolável','Dano de impacto; deslocamento e arremesso não simulados.'),
 effect('Darius','darius-q','Q','DariusCleave','BladeDamage','physical','Q · lâmina externa','Aplica Hemorragia; cura 17% da vida perdida contra um campeão.'),
 effect('Darius','darius-q-inner','Q','DariusCleave','HandleDamage','physical','Q · cabo interno','35% da lâmina; sem Hemorragia ou cura.'),
 effect('Darius','darius-w','W','DariusNoxianTacticsONH','EmpoweredAttackDamage','physical','W · ataque fortalecido','Um ataque sem crítico confirmado; substitui ataque e reinicia intervalo; Hemorragia. Slow e reembolso por abate não simulados.','attack'),
 effect('Darius','darius-e','E','DariusAxeGrabCone',undefined,'physical','E · habilitar penetração passiva','Usa rank de E e combina multiplicativamente com outras penetrações; puxão não simulado.','passive'),
 effect('Darius','darius-r','R','DariusExecute','Damage','true','R · Guilhotina','+20% por Hemorragia até 5; Força Noxiana no quinto acúmulo. Sem recast por abate.'),
];
export const exactEffect=(id:string|undefined)=>exactEffects.find(x=>x.id===id);
export const exactEffectsFor=(champion:string)=>exactEffects.filter(x=>x.champion===champion);
export function exactSource(champion:string):ChampionMechanics{return (exactSnapshot as unknown as Record<string,ChampionMechanics>)[champion];}
export const skillRank=(f:Fighter,key:string)=>key==='AA'||key==='P'?1:f.skills.slice(0,f.level).filter(k=>k===key).length;
export function exactValue(champion:string,spell:string,name:string,rank:number):number {const v=exactSource(champion)?.spells[spell]?.values[name]?.[rank];if(!Number.isFinite(v))throw Error(`Valor ausente: ${champion}/${spell}/${name}/${rank}`);return v;}
export function exactCalculation(champion:string,spell:string,name:string,rank:number,level:number,actor:Stats,base:Stats):number {
 const s=exactSource(champion)?.spells[spell],calc=s?.calculations[name];if(!calc)throw Error(`Fórmula ausente: ${champion}/${spell}/${name}`);
 return calculateNative(calc as CalcNode,s as NativeSpell,rank,level,actor,base);
}
export function exactFormulaStatus(id:string,data:Dataset,custom=false){const e=exactEffect(id);return {isExactFormula:!!e&&data.version===EXACT_PATCH&&!custom,patch:EXACT_PATCH,scope:'Fórmula do efeito isolado',source:e?exactSource(e.champion).source:null};}
export function exactAction(f:Fighter,data:Dataset,id:string,at=0):Action {
 const e=exactEffect(id);if(!e||e.champion!==f.champion)throw Error('Efeito incompatível com o campeão');if(data.version!==EXACT_PATCH)throw Error(`Efeito validado apenas no snapshot ${EXACT_PATCH}; catálogo ${data.version}`);
 const rank=skillRank(f,e.key);if(!rank)throw Error('Habilidade não evoluída');const sp=exactSource(f.champion).spells[e.spell],ui=data.champions[f.champion].spells[['Q','W','E','R'].indexOf(e.key)];
 const passive=['passive','tick','secondary'].includes(e.mode??'');
 return {id:crypto.randomUUID(),at,kitEffect:id,key:e.key,name:e.label,kind:id==='lux-w'||e.mode==='shield'?'shield':'spell',type:e.type,formula:{...EMPTY_FORMULA},cooldown:passive||id==='jinx-rocket'?0:sp.cooldown[rank]??ui?.cooldown[rank-1]??0,cost:passive?0:sp.cost[rank]??ui?.cost[rank-1]??0,cast:0,duration:id==='garen-w'?.75:id==='lux-w'||id==='shen-p'?2.5:id==='malphite-p'?999:0,hit:1,onHit:e.mode==='attack',custom:false,coverage:'verified'};
}
/** Mathematical impact only; activation and state are handled separately. */
export function exactRaw(id:string,f:Fighter,actor:Stats,base:Stats,target:Stats,currentHP:number,stacks=0):number {
 const e=exactEffect(id);if(!e||e.champion!==f.champion)throw Error('Efeito incompatível');const rank=skillRank(f,e.key);if(!rank)throw Error('Habilidade não evoluída');
 let raw=e.calculation?exactCalculation(f.champion,e.spell,e.calculation,rank,f.level,actor,base):0;
 if(id.startsWith('shen-q'))raw=raw*target.hp+exactCalculation('Shen','ShenQ','BaseFlatDamage',rank,f.level,actor,base);
 if(id==='jinx-minigun')raw=exactValue('Jinx','JinxQ','MinigunAttackSpeedMax',rank)/100;
 if(id==='vayne-w')raw=Math.max(raw*target.hp,exactValue('Vayne','VayneSilveredBolts','DamageFloor',rank));
 if(id==='jinx-r-min'||id==='jinx-r-max')raw+=exactValue('Jinx','JinxR','PercentDamage',rank)/100*Math.max(0,target.hp-currentHP);
 if(id==='garen-r')raw=exactValue('Garen','GarenR','BaseDamage',rank)+exactValue('Garen','GarenR','ExecuteDamage',rank)*Math.max(0,target.hp-currentHP);
 if(id==='darius-r')raw*=1+exactValue('Darius','DariusExecute','RDamagePercentPerHemoStack',rank)*Math.min(5,Math.max(0,stacks));
 if(id==='malphite-w')raw*=exactValue('Malphite','Obduracy','ThunderclapSlowDamage',rank);
 return Math.max(0,raw);
}
