import type {Dataset,Scenario,Rune} from './contracts.ts';
import {kitFor} from './compatibility.ts';
import {championForCounter} from './counterAdapters.ts';
import {heuristicRuneScore} from './runeOptimizer.ts';
import {plain} from './model.ts';
export function runeGuide(r:Rune,s:Scenario,data:Dataset){
 const k=kitFor(s.player,data),name=data.champions[s.player.champion].name;
 const hints:Record<number,[string,string]>={
 8437:[`${name} usa ataques para ativar trocas de sustentação. ${k.healthScaling?'O kit também tem afinidade descritiva com Vida.':'O ganho de Vida compete com opções de dano/utilidade.'}`,'Considere quando consegue alcançar o alvo para ataques curtos após preparar a ativação; contra ranged, acesso ao alvo é a limitação.'],
 8439:[`${name} possui CC duro identificado; imobilizar é o requisito para ativar a defesa desta runa.`,'Considere entradas com exposição ao burst. Contra ranged, só ajuda se você conseguir acertar a imobilização; não resolve poke antes de entrar.'],
 8401:[`${name} tem proteção por escudo identificada no perfil; confirme na habilidade como gerar esse escudo antes de atacar.`,'Útil quando consegue transformar o escudo em ataque durante a troca; não presuma ativação permanente.'],
 8008:[`${name} tem afinidade com ataques repetidos; a runa exige tempo em alcance para acumular o benefício.`,'Favorece trocas prolongadas. Perde valor quando burst ou CC impedem ataques consecutivos.'],
 8010:[`Trocas prolongadas permitem a ${name} acumular a runa por ataques e habilidades; o número real de ativações depende do combo.`,'Considere quando o adversário permite manter combate. Trocas muito curtas podem terminar antes dos acúmulos.'],
 8214:[`${k.healShield?`${name} tem cura/escudo de proteção identificados; verifique quais podem atingir aliados.`:`${name} pode buscar pressão por dano de habilidades/ataques compatíveis com o efeito oficial.`}`,'Considere frequência de aplicação e capacidade de proteger ou pressionar; o efeito não é incluído automaticamente no DPS.'],
 8229:[`O perfil de habilidades de ${name} favorece pressão por acertos repetidos de feitiços.`,'Considere poke com espaço seguro; acertar depende de alcance, trajetória e posicionamento, não só de AP.'],
 8112:[`A proposta é concentrar aplicações distintas de dano de ${name} em uma janela curta; o modelo não valida automaticamente o combo de três aplicações.`,'Considere burst quando é possível completar a sequência e sair. Contra alvos resistentes, compare com alternativas de combate prolongado.'],
 8226:[`${name} usa mana; aumentar disponibilidade de recurso pode sustentar mais rotações.`,'Considere pressão de rota com acertos de habilidades e limitação de mana. Acúmulos não são presumidos no simulador.'],
 8210:[`Aceleração oferece a ${name} acesso mais frequente às habilidades; depende dos cooldowns e do tempo efetivo de combate.`,'Considere janelas com repetição de habilidades; uma troca encerrada antes da segunda rotação reduz o benefício.'],
 8473:[`Defesa contra sequências curtas ajuda ${name} a preservar vida após a primeira aplicação de dano.`,'Considere burst e trocas concentradas; poke prévio pode consumir a proteção antes da entrada principal.'],
 8453:[`O perfil de ${name} identifica cura/escudo; a afinidade considera proteção, sem validar todos os gatilhos específicos.`,'Considere sustentação e proteção frequentes; diferencie efeitos próprios de proteção para aliados.'],
 };
 const hint=hints[r.id]??[`A escolha para ${name} combina afinidade do perfil, requisitos do kit e seus pesos de dano, defesa e utilidade. A descrição oficial abaixo define o gatilho; a compatibilidade não garante uma interação específica validada.`,s.matchupUnknown?'Sem adversário definido: confira o gatilho e a oportunidade de uso antes de travar esta runa.':'Compare o gatilho com a pressão do adversário, o tempo de troca e seus recursos; a pontuação é heurística.'];
 return {synergy:hint[0],condition:hint[1],description:plain(r.longDesc||r.shortDesc),score:heuristicRuneScore(r,s,data,s.weights)};
}
/** Relative trait pressure, deliberately not match win probability or lane statistics. */
export function guideMatchups(s:Scenario,data:Dataset){
 const own=championForCounter(s.player.champion,data,s.player),range=data.champions[s.player.champion].stats.attackrange;
 const rows=Object.keys(data.champions).filter(id=>id!==own.id).map(id=>{
  const other=championForCounter(id,data),reasons:string[]=[];let pressure=0;
  if(data.champions[id].stats.attackrange>range){pressure+=1;reasons.push('Maior alcance básico pode dificultar acesso e trocas.');}
  if(other.isBurst&&!own.isTank){pressure+=2;reasons.push('Burst pressiona um perfil sem frontline de tanque.');}
  if(other.hasHardCC){pressure+=1;reasons.push('CC pode interromper entrada ou tempo de ataque.');}
  if(other.isTank&&own.isBurst){pressure+=2;reasons.push('Durabilidade pode reduzir a eficiência de uma janela curta.');}
  if(own.isTank&&other.isBurst){pressure-=2;reasons.push('Seu perfil de durabilidade pode resistir à janela de burst.');}
  if(own.hasHardCC&&other.isBurst){pressure-=1;reasons.push('Seu controle pode limitar uma entrada ofensiva.');}
  return {id,pressure,reasons:reasons.length?reasons:['Características disponíveis não identificam uma vantagem específica.']};
 });
 return {hard:rows.filter(r=>r.pressure>0).sort((a,b)=>b.pressure-a.pressure||a.id.localeCompare(b.id)).slice(0,5),best:rows.filter(r=>r.pressure<0).sort((a,b)=>a.pressure-b.pressure||a.id.localeCompare(b.id)).slice(0,5)};
}
export function guideAllies(s:Scenario,data:Dataset){
 const own=championForCounter(s.player.champion,data,s.player);
 return Object.keys(data.champions).filter(id=>id!==own.id).map(id=>{const ally=championForCounter(id,data);const reasons:string[]=[];
  if(own.isBurst&&ally.hasHardCC)reasons.push('Controle do aliado pode preparar sua janela de burst.');
  if(own.hasHardCC&&ally.isBurst)reasons.push('Seu controle pode preparar o burst do aliado.');
  if(own.isTank&&(ally.hasHealing||ally.hasShields))reasons.push('Fonte de cura/escudo identificada; confirme se protege aliados antes de contar com sustentação da frontline.');
  if(!own.isTank&&ally.isTank)reasons.push('Frontline pode criar espaço para você executar suas ações.');
  return {id,reasons};}).filter(r=>r.reasons.length).sort((a,b)=>b.reasons.length-a.reasons.length||a.id.localeCompare(b.id)).slice(0,5);
}

export function skillUsage(description:string){
 const text=plain(description).toLowerCase();
 if(/escudo|cura|curar|protege|bloqueia/.test(text))return {moment:'Use na janela de dano que pretende mitigar ou após perder vida, conforme o efeito descrito; diferencie proteção própria de proteção em aliados.',position:'Confirme o alcance do aliado ou da zona protegida e mantenha acesso ao alvo durante a janela de proteção.',mistake:'Ativar proteção cedo demais e deixá-la expirar antes da ameaça, ou contar como cura útil um valor que excede a vida perdida.'};
 if(/atordoa|enraíza|provoca|imobiliza|encanta|arremessa|derruba/.test(text))return {moment:'Prepare uma janela em que o controle possa atingir o adversário e sua equipe consiga acompanhar. Preserve o recurso se precisar interromper uma entrada.',position:'Confira a trajetória e o alcance descritos; procure alinhamento com o aliado que vai aproveitar o controle.',mistake:'Gastar o controle sem acompanhamento ou sobrepor toda a duração a outro controle, perdendo tempo útil.'};
 if(/avança|salta|teleporta|desloca|dispara em direção/.test(text))return {moment:'Considere entrada ou reposicionamento quando conhece a ameaça disponível do adversário; preserve uma saída quando o deslocamento for seu único recurso de mobilidade.',position:'Avalie o ponto de chegada e a exposição depois do deslocamento, não apenas a distância percorrida.',mistake:'Entrar além do alcance dos aliados ou gastar mobilidade ofensivamente antes de uma ameaça que exigiria escapar.'};
 return {moment:'Procure uma janela em que o alvo esteja acessível e confira custo, cooldown e requisito de ativação no catálogo; maximize aplicações sem comprometer sua saída.',position:'Use alcance e trajetória da descrição para alinhar o alvo; alcance de ataque básico não determina o alcance deste feitiço.',mistake:'Presumir que toda habilidade acerta, gastar recurso sem alvo acessível ou esperar uma segunda rotação antes do cooldown.'};
}

export function runeDraftAdvice(s:Scenario,data:Dataset):string {
 const own=championForCounter(s.player.champion,data,s.player),enemy=s.matchupUnknown?null:championForCounter(s.enemy.champion,data,s.enemy);
 if(s.player.lane==='Support')return 'Se os dois suportes forem corpo a corpo e tiverem ferramentas de engage, espere janelas de entrada mais comprometidas. Preserve proteção para a resposta inimiga e coordene o controle com seu ADC; uma página de runas não garante vencer o all-in.';
 if(enemy&&enemy.isBurst)return `${enemy.name} tem perfil de burst identificado: prepare uma troca curta ou sua proteção antes da entrada. Se outras lanes também tiverem confrontos com alta exposição — por exemplo, Ekko contra Jax ou Katarina contra Talon — compare opções de acesso às lutas e segurança ao sair. Esses pares são exemplos editoriais de cenário, não estatísticas de volatilidade.`;
 if(own.isTank||own.hasHardCC)return 'Se outras lanes tiverem janelas frequentes de entrada, seu controle pode preparar acompanhamento. Confira prioridade da sua onda, recurso e caminho seguro antes de abandonar a rota; utilidade fora da lane tem custo de oportunidade.';
 return 'Em drafts com trocas frequentes, diferencie poke seguro de entrar para finalizar. Compare as runas pelo acesso ao alvo, duração da troca e possibilidade de sair; sem composição completa, não presumimos quais lanes estão voláteis.';
}
