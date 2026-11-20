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
  Q:{name:'Barrel Roll',role:'barril arremessado, recast/detonação e dano/slow que escalam com fermentação',damageModel:'partial',notes:'Dano mínimo e máximo do patch 26.17 implementados; fermentação temporal, slow, área e redução contra tropas ainda não simulados.'},
  W:{name:'Drunken Rage',role:'canalização defensiva e próximo ataque fortalecido com dano mágico',damageModel:'partial',notes:'Canalização de 0,75s, redução de dano por 2,5s e bônus mágico no próximo ataque com 7% da vida máxima do alvo implementados; área, estruturas e limite contra monstros pendentes.'},
  E:{name:'Body Slam',role:'avanço, colisão em área, dano mágico, controle e redução de recarga ao acertar',damageModel:'partial',notes:'Dano, atordoamento de 1s e redução de 40% do cooldown em acerto confirmado implementados; dash, geometria e dano em área pendentes.'},
  R:{name:'Explosive Cask',role:'projétil em área que causa dano mágico e deslocamento',damageModel:'partial',notes:'Dano-base e escalamento AP implementados; trajetória, área, knockback e colisão com terreno pendentes.'}
 }),
 Graves:declare('Graves','https://wiki.leagueoflegends.com/en-us/Graves',{
  P:{name:'New Destiny',role:'ataques de espingarda com munição, recarga e múltiplos projéteis',damageModel:'pending',notes:'Contagem de projéteis, cone, primeiro alvo por projétil e recarga dependente de velocidade de ataque.'},
  Q:{name:'End of the Line',role:'projétil que detona após atraso ou colisão com parede/estrutura',damageModel:'pending',notes:'Dois momentos de dano; geometria e detonação antecipada.'},
  W:{name:'Smoke Screen',role:'explosão de fumaça com dano e obscurecimento/slow',damageModel:'pending',notes:'Impacto e zona persistente devem ser separados.'},
  E:{name:'Quickdraw',role:'dash que recarrega munição e acumula True Grit',damageModel:'pending',notes:'Stacks de resistências, recarga, redução de cooldown por pellet e reset de ataque.'},
  R:{name:'Collateral Damage',role:'projétil explosivo de dano físico com cone secundário e recuo',damageModel:'pending',notes:'Impacto primário e explosão secundária não podem ser confundidos.'}
 }),
 Gwen:declare('Gwen','https://wiki.leagueoflegends.com/en-us/Gwen',{
  P:{name:'A Thousand Cuts',role:'dano mágico adicional em ataques/habilidades e cura contra campeões',damageModel:'pending',notes:'Escala com vida máxima do alvo/AP e possui limite contra monstros.'},
  Q:{name:'Snip Snip!',role:'cortes repetidos e corte final verdadeiro no centro',damageModel:'pending',notes:'Stacks de Snippy, número de cortes, sweet spot central e conversão de dano.'},
  W:{name:'Hallowed Mist',role:'zona defensiva que concede resistências e impede ataques/habilidades externas',damageModel:'pending',notes:'Estado espacial e duração; não é dano direto.'},
  E:{name:"Skip 'n Slash",role:'dash que fortalece ataques com dano mágico adicional',damageModel:'pending',notes:'Ataques fortalecidos, velocidade de ataque e reembolso de cooldown ao acertar.'},
  R:{name:'Needlework',role:'agulhas em sequência; recasts habilitados por ataques/habilidades',damageModel:'pending',notes:'Até três lançamentos, número de agulhas, dano por agulha e aplicação da passiva.'}
 }),
 Hecarim:declare('Hecarim','https://wiki.leagueoflegends.com/en-us/Hecarim',{
  P:{name:'Warpath',role:'converte velocidade de movimento adicional em dano de ataque',damageModel:'pending',notes:'Conversão dependente do nível e fontes elegíveis de velocidade.'},
  Q:{name:'Rampage',role:'dano físico em área com stacks que amplificam dano e reduzem recarga',damageModel:'pending',notes:'Stacks, expiração gradual, cooldown reduzido e amplificação por AD adicional.'},
  W:{name:'Spirit of Dread',role:'dano mágico periódico em área e cura baseada no dano sofrido pelos inimigos',damageModel:'pending',notes:'Ticks, dano de aliados dentro da área e limite/coeficiente de cura.'},
  E:{name:'Devastating Charge',role:'velocidade crescente e próximo ataque com dano físico e knockback',damageModel:'pending',notes:'Dano escala com distância percorrida; duração e distância alteram resultado.'},
  R:{name:'Onslaught of Shadows',role:'investida com cavaleiros espectrais, dano mágico e medo ao final',damageModel:'pending',notes:'Múltiplos impactos e medo dependem da posição/direção e distância.'}
 }),
 Heimerdinger:declare('Heimerdinger','https://www.leagueoflegends.com/en-us/champions/heimerdinger/',{
  P:{name:'Hextech Affinity',role:'velocidade de movimento perto de torres aliadas e torretas próprias',damageModel:'pending',notes:'Aura de proximidade; não causa dano.'},
  Q:{name:'H-28G Evolution Turret',role:'instala torreta com disparos básicos e raio carregado',damageModel:'pending',notes:'Pet persistente, alvo prioritário, cargas, recarga, tiros e laser em ciclos.'},
  W:{name:'Hextech Micro-Rockets',role:'salva de foguetes com distribuição e convergência',damageModel:'pending',notes:'Cada foguete precisa de colisão individual; dano total varia com quantos atingem o mesmo alvo.'},
  E:{name:'CH-2 Electron Storm Grenade',role:'granada em área com dano, stun no centro e slow na borda',damageModel:'pending',notes:'Separar centro/borda, ricochete e área de explosão.'},
  R:{name:'UPGRADE!!!',role:'fortalece a próxima habilidade básica: torreta, foguetes ou granada',damageModel:'pending',notes:'Três variantes distintas; R não deve ser contado como impacto independente.'}
 }),
 Illaoi:declare('Illaoi','https://wiki.leagueoflegends.com/en-us/Illaoi',{
  P:{name:'Prophet of an Elder God',role:'gera tentáculos que atacam periodicamente e curam Illaoi',damageModel:'pending',notes:'Spawn, cooldown, alvos e redução por múltiplos tentáculos.'},
  Q:{name:'Tentacle Smash',role:'passiva amplifica tentáculos; ativa golpeia em linha/área',damageModel:'pending',notes:'O dano real inclui tentáculo convocado; não duplicar amplificação e impacto.'},
  W:{name:'Harsh Lesson',role:'ataque fortalecido com avanço e comando para tentáculos golpearem',damageModel:'pending',notes:'Dano baseado na vida máxima do alvo e ataques dos tentáculos são impactos separados.'},
  E:{name:'Test of Spirit',role:'projétil que extrai espírito; dano ao espírito é parcialmente replicado no campeão',damageModel:'pending',notes:'Vínculo, duração, transferência de dano, vessel e tentáculos convocados.'},
  R:{name:'Leap of Faith',role:'dano físico em área e invocação de tentáculos por campeão atingido',damageModel:'pending',notes:'Número de campeões atingidos define invocações; acelera W e ataques de tentáculos.'}
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
