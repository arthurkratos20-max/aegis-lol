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
  Q:{name:'Barrel Roll',role:'barril arremessado, recast/detonação e dano/slow que escalam com fermentação',damageModel:'partial',notes:'Dano mínimo e máximo do Summoner’s Rift no patch 26.23 implementados; fermentação temporal, slow, área e redução contra tropas ainda não simulados.'},
  W:{name:'Drunken Rage',role:'canalização defensiva e próximo ataque fortalecido com dano mágico',damageModel:'partial',notes:'Canalização de 0,75s, redução de dano por 2,5s e bônus mágico no próximo ataque com 7% da vida máxima do alvo implementados; área, estruturas e limite contra monstros pendentes.'},
  E:{name:'Body Slam',role:'avanço, colisão em área, dano mágico, controle e redução de recarga ao acertar',damageModel:'partial',notes:'Dano, atordoamento de 1s e redução de 40% do cooldown em acerto confirmado implementados; dash, geometria e dano em área pendentes.'},
  R:{name:'Explosive Cask',role:'projétil em área que causa dano mágico e deslocamento',damageModel:'partial',notes:'Dano-base e escalamento AP implementados; trajetória, área, knockback e colisão com terreno pendentes.'}
 }),
 Graves:declare('Graves','https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-19-notes/',{
  P:{name:'New Destiny',role:'ataques de espingarda com múltiplos projéteis, munição e recarga',damageModel:'pending',notes:'A passiva afeta o modelo de ataques básicos: projéteis, recarga, crítico e colisão. Ainda não integrada ao ciclo de DPS.'},
  Q:{name:'End of the Line',role:'projétil explosivo com impacto inicial e detonação após 1s ou colisão com terreno',damageModel:'partial',notes:'Impacto inicial e detonação com tabelas separadas do Summoner’s Rift implementados. Trajetória, colisão com terreno, área e combinação temporal dos impactos pendentes.'},
  W:{name:'Smoke Screen',role:'nuvem que reduz visão; impacto inicial causa dano mágico e slow',damageModel:'partial',notes:'Dano mágico do impacto inicial implementado. Nuvem de 4s, slow e bloqueio de visão pendentes.'},
  E:{name:'Quickdraw',role:'dash que recarrega um cartucho e concede stacks de armadura e resistência mágica',damageModel:'pending',notes:'Falta integrar recarga de munição, stacks defensivos, duração e redução de cooldown por projéteis de ataques básicos.'},
  R:{name:'Collateral Damage',role:'projétil que causa dano ao primeiro alvo e explode em cone, recuando Graves',damageModel:'partial',notes:'Impacto direto e explosão em cone implementados como impactos separados com valores do Summoner’s Rift. Recuo, trajetória, área e seleção de alvos pendentes.'}
 }),
 Gwen:declare('Gwen','https://wiki.leagueoflegends.com/en-us/Gwen',{
  P:{name:'A Thousand Cuts',role:'dano mágico adicional em ataques/habilidades e cura contra campeões',damageModel:'pending',notes:'Escala com vida máxima do alvo/AP e possui limite contra monstros.'},
  Q:{name:'Snip Snip!',role:'cortes repetidos e corte final verdadeiro no centro',damageModel:'partial',notes:'Dano mínimo e máximo agregado dos cortes externos implementado. Conversão do centro em dano verdadeiro, passiva por vida máxima, stacks dinâmicos e geometria ainda pendentes.'},
  W:{name:'Hallowed Mist',role:'zona defensiva que concede resistências e impede ataques/habilidades externas',damageModel:'pending',notes:'Estado espacial e duração; não é dano direto.'},
  E:{name:"Skip 'n Slash",role:'dash que fortalece ataques com dano mágico adicional',damageModel:'pending',notes:'Ataques fortalecidos, velocidade de ataque e reembolso de cooldown ao acertar.'},
  R:{name:'Needlework',role:'agulhas em sequência; recasts habilitados por ataques/habilidades',damageModel:'partial',notes:'Primeira agulha isolada implementada; recasts, número crescente de agulhas, passiva e slow pendentes.'}
 }),
 Hecarim:declare('Hecarim','https://wiki.leagueoflegends.com/en-us/Hecarim',{
  P:{name:'Warpath',role:'converte velocidade de movimento adicional em dano de ataque',damageModel:'pending',notes:'Conversão dependente do nível e fontes elegíveis de velocidade.'},
  Q:{name:'Rampage',role:'dano físico em área com stacks que amplificam dano e reduzem recarga',damageModel:'partial',notes:'Impacto-base por rank e razão de DdA adicional implementados. Stacks, expiração, redução de recarga, área e dano contra tropas pendentes.'},
  W:{name:'Spirit of Dread',role:'dano mágico periódico em área e cura baseada no dano sofrido pelos inimigos',damageModel:'partial',notes:'Dano total dos quatro ticks por rank implementado. Ticks, área, resistências bônus e cura por dano de aliados/inimigos pendentes.'},
  E:{name:'Devastating Charge',role:'velocidade crescente e próximo ataque com dano físico e knockback',damageModel:'pending',notes:'Dano escala com distância percorrida; duração e distância alteram resultado.'},
  R:{name:'Onslaught of Shadows',role:'investida com cavaleiros espectrais, dano mágico e medo ao final',damageModel:'pending',notes:'Múltiplos impactos e medo dependem da posição/direção e distância.'}
 }),
 Heimerdinger:declare('Heimerdinger','https://www.leagueoflegends.com/en-us/champions/heimerdinger/',{
  P:{name:'Hextech Affinity',role:'velocidade de movimento perto de torres aliadas e torretas próprias',damageModel:'pending',notes:'Aura de proximidade; não causa dano.'},
  Q:{name:'H-28G Evolution Turret',role:'instala torreta com disparos básicos e raio carregado',damageModel:'partial',notes:'Dano de um disparo básico isolado implementado. Pet persistente, alvo prioritário, cargas, recarga, cadência e laser em ciclos pendentes.'},
  W:{name:'Hextech Micro-Rockets',role:'salva de foguetes com distribuição e convergência',damageModel:'partial',notes:'Dano de um foguete inicial isolado implementado. Distribuição, convergência, foguetes subsequentes e redução por acertos repetidos pendentes.'},
  E:{name:'CH-2 Electron Storm Grenade',role:'granada em área com dano, stun no centro e slow na borda',damageModel:'pending',notes:'Separar centro/borda, ricochete e área de explosão.'},
  R:{name:'UPGRADE!!!',role:'fortalece a próxima habilidade básica: torreta, foguetes ou granada',damageModel:'pending',notes:'Três variantes distintas; R não deve ser contado como impacto independente.'}
 }),
 Illaoi:declare('Illaoi','https://wiki.leagueoflegends.com/en-us/Illaoi',{
  P:{name:'Prophet of an Elder God',role:'gera tentáculos que atacam periodicamente e curam Illaoi',damageModel:'pending',notes:'Spawn, cooldown, alvos e redução por múltiplos tentáculos.'},
  Q:{name:'Tentacle Smash',role:'passiva amplifica tentáculos; ativa golpeia em linha/área',damageModel:'pending',notes:'O dano real inclui tentáculo convocado; não duplicar amplificação e impacto.'},
  W:{name:'Harsh Lesson',role:'ataque fortalecido com avanço e comando para tentáculos golpearem',damageModel:'partial',notes:'Bônus físico baseado na vida máxima do alvo, com escala por rank e AD total, implementado. Dano mínimo, limite contra não campeões, ataque básico e golpes de tentáculo pendentes.'},
  E:{name:'Test of Spirit',role:'projétil que extrai espírito; dano ao espírito é parcialmente replicado no campeão',damageModel:'pending',notes:'Vínculo, duração, transferência de dano, vessel e tentáculos convocados.'},
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
