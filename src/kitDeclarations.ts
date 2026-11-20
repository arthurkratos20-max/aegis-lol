import type {SkillKey} from './contracts.ts';

export type KitSlot='P'|SkillKey;
export interface KitDeclaration {
 champion:string;
 patchScope:string;
 source:string;
 abilities:Record<KitSlot,{name:string;role:string;damageModel:'pending'|'partial'|'implemented';notes:string}>;
}

/**
 * Catalog declaration only. Names and gameplay summaries do not imply that
 * the damage engine simulates the ability. Every slot starts pending until
 * a patch-matched formula and its state transitions have tests.
 */
const declare=(champion:string,source:string,abilities:KitDeclaration['abilities']):KitDeclaration=>({
 champion,patchScope:'16.23.1 — declaration; mechanics must be revalidated against current live patch',
 source,abilities
});

export const kitDeclarations:Record<string,KitDeclaration>={
 Gragas:declare('Gragas','https://www.leagueoflegends.com/en-us/champions/gragas/',{
  P:{name:'Happy Hour',role:'passiva: cura periódica ao conjurar habilidade',damageModel:'partial',notes:'Cura de 5,5% da vida máxima e cooldown estático 12/10/8/6s nos níveis 1/6/11/16 implementados; efeitos de mapa não incluídos.'},
  Q:{name:'Barrel Roll',role:'barril arremessado, recast/detonação e dano/slow que escalam com fermentação',damageModel:'partial',notes:'Dano mínimo e máximo do Summoner’s Rift no patch 26.23 implementados; variante manual de 1s (125%) e máximo (150%) disponíveis; temporizador automático, slow, área e redução contra tropas ainda não simulados.'},
  W:{name:'Drunken Rage',role:'canalização defensiva e próximo ataque fortalecido com dano mágico',damageModel:'partial',notes:'Canalização de 0,75s, redução de dano por 2,5s e bônus mágico no próximo ataque com 7% da vida máxima do alvo implementados; área, estruturas e limite contra monstros pendentes.'},
  E:{name:'Body Slam',role:'avanço, colisão em área, dano mágico, controle e redução de recarga ao acertar',damageModel:'partial',notes:'Dano, atordoamento de 1s e redução de 40% do cooldown em acerto confirmado implementados; dash, geometria e dano em área pendentes.'},
  R:{name:'Explosive Cask',role:'projétil em área que causa dano mágico e deslocamento',damageModel:'partial',notes:'Dano-base e escalamento AP implementados; trajetória, área, knockback e colisão com terreno pendentes.'}
 }),
 Graves:declare('Graves','https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-19-notes/',{
  P:{name:'New Destiny',role:'ataques de espingarda com múltiplos projéteis, munição e recarga',damageModel:'partial',notes:'Ataque básico usa primeiro projétil conservador com escala por nível; pellets adicionais, crítico, distância, munição e recarga ainda não integrados ao DPS.'},
  Q:{name:'End of the Line',role:'projétil explosivo com impacto inicial e detonação após 1s ou colisão com terreno',damageModel:'partial',notes:'Impacto inicial (65% DdA adicional) e detonação (55–115% DdA adicional por rank) com tabelas atuais do Summoner’s Rift implementados. Trajetória, colisão com terreno, área e combinação temporal dos impactos pendentes.'},
  W:{name:'Smoke Screen',role:'nuvem que reduz visão; impacto inicial causa dano mágico e slow',damageModel:'partial',notes:'Dano mágico do impacto inicial implementado. Nuvem de 4s, slow e bloqueio de visão pendentes.'},
  E:{name:'Quickdraw',role:'dash que recarrega um cartucho e concede stacks de armadura e resistência mágica',damageModel:'partial',notes:'Ativação concede stack de True Grit por 4s; armadura por stack 4/7/10/13/16 (patch 25.21+) e MR igual a 50% da armadura bônus aplicadas. Recarga de munição, stacks extras por direção e redução de cooldown por pellets pendentes.'},
  R:{name:'Collateral Damage',role:'projétil que causa dano ao primeiro alvo e explode em cone, recuando Graves',damageModel:'partial',notes:'Impacto direto e explosão em cone implementados como impactos separados com valores do Summoner’s Rift. Recuo, trajetória, área e seleção de alvos pendentes.'}
 }),
 Gwen:declare('Gwen','https://wiki.leagueoflegends.com/en-us/Gwen',{
  P:{name:'A Thousand Cuts',role:'dano mágico adicional em ataques/habilidades e cura contra campeões',damageModel:'partial',notes:'Dano mágico por vida máxima do alvo implementado em ataques básicos e R; centro do Q, limite contra monstros e cura pós-mitigação ainda pendentes.'},
  Q:{name:'Snip Snip!',role:'cortes repetidos e corte final verdadeiro no centro',damageModel:'partial',notes:'Dano mínimo e máximo agregado implementado; variante manual de seis cortes no centro divide o dano em 50% mágico e 50% verdadeiro. Procs da passiva por corte, stacks dinâmicos e geometria ainda pendentes.'},
  W:{name:'Hallowed Mist',role:'zona defensiva que concede resistências e impede ataques/habilidades externas',damageModel:'partial',notes:'Ativação concede 4s de 22/24/26/28/30 + 7% AP de armadura e resistência mágica bônus; proteção contra alvos fora da névoa não simulada.'},
  E:{name:"Skip 'n Slash",role:'dash que fortalece ataques com dano mágico adicional',damageModel:'partial',notes:'Ativação concede 4s de velocidade de ataque adicional e os ataques aplicam 15 + 20% AP de dano mágico, além da passiva; dash e reembolso de cooldown pendentes.'},
  R:{name:'Needlework',role:'agulhas em sequência; recasts habilitados por ataques/habilidades',damageModel:'partial',notes:'Primeira agulha e dano agregado de 3/5 agulhas nos recasts implementados em variantes manuais; desbloqueio por ataques, slow e passiva pendentes.'}
 }),
 Hecarim:declare('Hecarim','https://wiki.leagueoflegends.com/en-us/Hecarim',{
  P:{name:'Warpath',role:'converte velocidade de movimento adicional em dano de ataque',damageModel:'partial',notes:'Conversão de 12–24% da velocidade de movimento bônus em DdA conforme nível implementada; interações com fontes especiais de velocidade não modeladas.'},
  Q:{name:'Rampage',role:'dano físico em área com stacks que amplificam dano e reduzem recarga',damageModel:'partial',notes:'Impacto-base e amplificação por até três stacks (3% + 3% por 100 DdA adicional por stack), com redução de 0,75s de recarga por stack implementados; área e redução de dano contra tropas pendentes. Os stacks agora expiram individualmente, com intervalo de 1s entre eles.'},
  W:{name:'Spirit of Dread',role:'dano mágico periódico em área e cura baseada no dano sofrido pelos inimigos',damageModel:'partial',notes:'Dano agregado ou quatro ticks temporais individuais, resistências bônus e cura de 25% do dano causado pelo próprio Hecarim durante 4s implementados; área e cura do dano de aliados pendentes.'},
  E:{name:'Devastating Charge',role:'velocidade crescente e próximo ataque com dano físico e knockback',damageModel:'partial',notes:'Variantes de dano mínimo e máximo por distância implementadas; velocidade crescente, knockback e escolha automática pela distância percorrida pendentes.'},
  R:{name:'Onslaught of Shadows',role:'investida com cavaleiros espectrais, dano mágico e medo ao final',damageModel:'partial',notes:'Dano dos cavaleiros espectrais implementado; trajetória, múltiplos alvos e fear dependem da geometria e distância.'}
 }),
 Heimerdinger:declare('Heimerdinger','https://www.leagueoflegends.com/en-us/champions/heimerdinger/',{
  P:{name:'Hextech Affinity',role:'velocidade de movimento perto de torres aliadas e torretas próprias',damageModel:'partial',notes:'Bônus de 20% de velocidade de movimento aplicado quando o estado heimer-turret-nearby é explicitamente ativado; detecção automática de proximidade pendente.'},
  Q:{name:'H-28G Evolution Turret',role:'instala torreta com disparos básicos e raio carregado',damageModel:'partial',notes:'Dano de um disparo básico isolado implementado. Pet persistente, alvo prioritário, cargas, recarga, cadência e laser em ciclos pendentes.'},
  W:{name:'Hextech Micro-Rockets',role:'salva de foguetes com distribuição e convergência',damageModel:'partial',notes:'Dano do primeiro foguete e salva completa de cinco foguetes contra um campeão (90/135/180/225/270 + 103% AP) implementados como cenários isolados. Distribuição, convergência, múltiplos alvos e recargas pendentes.'},
  E:{name:'CH-2 Electron Storm Grenade',role:'granada em área com dano, stun no centro e slow na borda',damageModel:'partial',notes:'Dano 60/100/140/180/220 + 60% AP implementado; área central, stun, slow e recarga de raios pendentes.'},
  R:{name:'UPGRADE!!!',role:'fortalece a próxima habilidade básica: torreta, foguetes ou granada',damageModel:'partial',notes:'Variantes R+E e R+W implementadas; R+W modela as quatro ondas (20 foguetes) contra um campeão. R+Q, ricochetes, limites por campeão e geometria pendentes.'}
 }),
 Illaoi:declare('Illaoi','https://wiki.leagueoflegends.com/en-us/Illaoi',{
  P:{name:'Prophet of an Elder God',role:'gera tentáculos que atacam periodicamente e curam Illaoi',damageModel:'partial',notes:'Fórmula de um golpe de tentáculo por nível, AD e AP está disponível via Q; geração periódica, quantidade, alvos e cura por acerto ainda não simulados.'},
  Q:{name:'Tentacle Smash',role:'passiva amplifica tentáculos; ativa golpeia em linha/área',damageModel:'partial',notes:'Um golpe de tentáculo por nível + 110% AD total + 40% AP, amplificado em 10–30% pelo rank de Q. Múltiplos tentáculos e cura passiva não simulados.'},
  W:{name:'Harsh Lesson',role:'ataque fortalecido com avanço e comando para tentáculos golpearem',damageModel:'partial',notes:'Bônus físico baseado na vida máxima do alvo, com escala por rank e AD total, implementado. Dano mínimo, limite contra não campeões, ataque básico e golpes de tentáculo pendentes.'},
  E:{name:'Test of Spirit',role:'projétil que extrai espírito; dano ao espírito é parcialmente replicado no campeão',damageModel:'partial',notes:'Vínculo de 7s e eco de 25–45% (+8% por 100 AD) do dano pré-mitigação, limitado pela vida restante do espírito; a vida do espírito é reduzida pelo dano após mitigação pelas resistências. Implementado; vessel, lentidão e tentáculos autônomos pendentes.'},
  R:{name:'Leap of Faith',role:'dano físico em área e invocação de tentáculos por campeão atingido',damageModel:'partial',notes:'Impacto físico inicial e razão de DdA adicional implementados. Área, número de campeões atingidos, tentáculos invocados e ataques subsequentes pendentes.'}
 })
};

export function validateKitDeclarations(declarations:Record<string,KitDeclaration>=kitDeclarations):string[]{
 const errors:string[]=[];
 const slots:KitSlot[]=['P','Q','W','E','R'];
 for(const [key,kit] of Object.entries(declarations)){
  if(key!==kit.champion)errors.push(`${key}: key/champion mismatch`);
  if(!kit.source.startsWith('https://'))errors.push(`${key}: source URL missing`);
  for(const slot of slots){
   const ability=kit.abilities[slot];
   if(!ability?.name?.trim()||!ability.role?.trim())errors.push(`${key} ${slot}: name/role missing`);
   if(ability&&!['pending','partial','implemented'].includes(ability.damageModel))errors.push(`${key} ${slot}: invalid damage model status`);
  }
 }
 return errors;
}
