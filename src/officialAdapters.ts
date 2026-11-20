import type {Stats} from './contracts.ts';

/**
 * Small, patch-scoped adapters transcribed from Riot patch notes.
 * They represent one isolated impact, not the full champion kit/rotation.
 */
export interface OfficialDamageAdapter {
 champion:string;
 patch:string;
 spell:string;
 calculation:string;
 source:string;
 sourceType?:'riot'|'wiki';
 damageType:'physical'|'magic'|'true';
 baseByRank:number[];
 apRatioByRank:number[];
 bonusADRatioByRank?:number[];
 adRatioByRank?:number[];
 targetMaxHPRatio?:number;
 targetMaxHPRatioByRank?:number[];
 targetMaxHPBonusADRatio?:number;
 targetMaxHPADRatio?:number;
 targetMaxHPRatioPer100AP?:number;
 minimumDamageByRank?:number[];
 damageAmpByRank?:number[];
 baseByLevel?:number[];
 note:string;
}
export const officialDamageAdapters:OfficialDamageAdapter[]=[
 {
  champion:'Gragas',patch:'16.23.1',spell:'GragasQ',calculation:'Damage',source:'https://wiki.leagueoflegends.com/en-us/Gragas',sourceType:'wiki',
  damageType:'magic',baseByRank:[80,120,160,200,240],apRatioByRank:[0.8,0.8,0.8,0.8,0.8],
  note:'Q · dano mínimo do Summoner’s Rift no patch 26.23: 80/120/160/200/240 + 80% AP. Não modela fermentação, slow, área ou redução contra tropas.'
 },
 {
  champion:'Gragas',patch:'16.23.1',spell:'GragasQ',calculation:'MaxFermentedDamage',source:'https://wiki.leagueoflegends.com/en-us/Gragas',sourceType:'wiki',
  damageType:'magic',baseByRank:[120,180,240,300,360],apRatioByRank:[1.2,1.2,1.2,1.2,1.2],
  note:'Q · dano máximo após fermentação completa (150% do mínimo) no Summoner’s Rift. Variante manual; não modela temporização, slow, área ou redução contra tropas.'
 },
 {
  champion:'Gragas',patch:'16.23.1',spell:'GragasQ',calculation:'HalfFermentedDamage',source:'https://wiki.leagueoflegends.com/en-us/Gragas',sourceType:'wiki',
  damageType:'magic',baseByRank:[100,150,200,250,300],apRatioByRank:[1,1,1,1,1],
  note:'Q · barril após 1 segundo de fermentação (125% do dano mínimo). A fermentação ocorre durante os primeiros 2s; esta é uma variante temporal manual, sem slow, área ou redução contra tropas.'
 },
 {
  champion:'Gragas',patch:'16.23.1',spell:'GragasW',calculation:'EmpoweredAttack',source:'https://wiki.leagueoflegends.com/en-us/Gragas',sourceType:'wiki',
  damageType:'magic',baseByRank:[20,50,80,110,140],apRatioByRank:[0.7,0.7,0.7,0.7,0.7],targetMaxHPRatio:0.07,
  note:'W · dano mágico adicional do próximo ataque após canalizar: base + 7% da vida máxima individual do alvo + 70% AP. Não inclui ataque físico, crítico, área, redução contra estruturas nem limite de monstros; ação manual.'
 },
 {
  champion:'Gragas',patch:'16.23.1',spell:'GragasE',calculation:'Damage',source:'https://wiki.leagueoflegends.com/en-us/Gragas',sourceType:'wiki',
  damageType:'magic',baseByRank:[80,125,170,215,260],apRatioByRank:[0.6,0.6,0.6,0.6,0.6],
  note:'E · impacto mágico isolado. Não simula dash, stun, colisão/área nem redução de 40% no cooldown ao acertar.'
 },
 {
  champion:'Gragas',patch:'16.23.1',spell:'GragasR',calculation:'Damage',source:'https://wiki.leagueoflegends.com/en-us/Gragas',sourceType:'wiki',
  damageType:'magic',baseByRank:[200,300,400],apRatioByRank:[0.8,0.8,0.8],
  note:'R · impacto mágico isolado. Não simula deslocamento, geometria, terreno, múltiplos alvos nem controle de grupo.'
 },
 {
  champion:'Bard',patch:'16.23.1',spell:'BardQ',calculation:'Damage',source:'https://www.leagueoflegends.com/pt-br/news/game-updates/league-of-legends-patch-26-23-notes/',sourceType:'riot',
  damageType:'magic',baseByRank:[80,125,170,215,260],apRatioByRank:[1,1,1,1,1],
  note:'Q · um impacto confirmado. Fórmula oficial do patch 26.23; colisão, atordoamento, acerto em segundo alvo e passiva não simulados.'
 },
 {
  champion:'MasterYi',patch:'16.23.1',spell:'MasterYiQ',calculation:'Damage',source:'https://www.leagueoflegends.com/pt-br/news/game-updates/league-of-legends-patch-26-23-notes/',sourceType:'riot',
  damageType:'physical',baseByRank:[20,40,60,80,100],apRatioByRank:[0,0,0,0,0],adRatioByRank:[0.6,0.6,0.6,0.6,0.6],
  note:'Q · dano padrão isolado em um alvo. Fórmula do patch 26.23; crítico, acertos adicionais, seleção/teleporte entre alvos e efeitos ao contato não simulados.'
 },
 {
  champion:'MasterYi',patch:'16.23.1',spell:'MasterYiQ',calculation:'MaxSingleTargetDamage',source:'https://www.leagueoflegends.com/pt-br/news/game-updates/league-of-legends-patch-26-23-notes/',
  damageType:'physical',baseByRank:[35,70,105,140,175],apRatioByRank:[0,0,0,0,0],adRatioByRank:[1.05,1.05,1.05,1.05,1.05],
  note:'Q · máximo contra um único alvo, exigindo a distribuição de acertos descrita pela Riot. Crítico adicional, efeitos ao contato e distribuição geométrica dos alvos não simulados; opção manual separada.'
 },
 {
  champion:'Ezreal',patch:'16.23.1',spell:'EzrealW',calculation:'Damage',source:'https://www.leagueoflegends.com/pt-br/news/game-updates/league-of-legends-patch-26-23-notes/',sourceType:'riot',
  damageType:'magic',baseByRank:[80,135,190,245,300],apRatioByRank:[1,1,1,1,1],bonusADRatioByRank:[1.15,1.15,1.15,1.15,1.15],
  note:'W · somente detonação da marca em campeão; requer marca previamente aplicada e detonada. Não simula aplicação, reembolso de mana ou procs.'
 },
 {
  champion:'Ezreal',patch:'16.23.1',spell:'EzrealR',calculation:'Damage',source:'https://www.leagueoflegends.com/pt-br/news/game-updates/league-of-legends-patch-26-23-notes/',
  damageType:'magic',baseByRank:[350,600,850],apRatioByRank:[1.2,1.2,1.2],bonusADRatioByRank:[1.1,1.1,1.1],
  note:'R · dano contra campeão após a redução por alvos não campeões; colisões, redução por unidades atravessadas e trajetória não simuladas.'
 },

 {
  champion:'Graves',patch:'16.23.1',spell:'GravesQ',calculation:'InitialHit',source:'https://wiki.leagueoflegends.com/en-us/Graves',sourceType:'wiki',
  damageType:'physical',baseByRank:[50,75,100,125,150],apRatioByRank:[0,0,0,0,0],bonusADRatioByRank:[0.65,0.65,0.65,0.65,0.65],
  note:'Summoner’s Rift · Q End of the Line: impacto inicial 50/75/100/125/150 + 65% DdA adicional (patch 25.20+). Separado da detonação; trajetória/terreno não simulados.'
 },
 {
  champion:'Graves',patch:'16.23.1',spell:'GravesQ',calculation:'Detonation',source:'https://wiki.leagueoflegends.com/en-us/Graves',sourceType:'wiki',
  damageType:'physical',baseByRank:[80,125,170,215,260],apRatioByRank:[0,0,0,0,0],bonusADRatioByRank:[0.55,0.7,0.85,1,1.15],
  note:'Summoner’s Rift · Q End of the Line: detonação 80/125/170/215/260 + 55/70/85/100/115% DdA adicional (patch 25.20+). Não soma automaticamente impacto inicial; geometria e colisão com terreno pendentes.'
 },
 {
  champion:'Graves',patch:'16.23.1',spell:'GravesW',calculation:'Impact',source:'https://wiki.leagueoflegends.com/en-us/Graves',sourceType:'wiki',
  damageType:'magic',baseByRank:[60,110,160,210,260],apRatioByRank:[0.6,0.6,0.6,0.6,0.6],
  note:'Summoner’s Rift · W Smoke Screen: dano mágico do impacto inicial 60/110/160/210/260 + 60% AP. Nuvem, slow e bloqueio de visão não simulados.'
 },
 {
  champion:'Graves',patch:'16.23.1',spell:'GravesR',calculation:'DirectHit',source:'https://wiki.leagueoflegends.com/en-us/Graves',sourceType:'wiki',
  damageType:'physical',baseByRank:[275,425,575],apRatioByRank:[0,0,0],bonusADRatioByRank:[1.5,1.5,1.5],
  note:'Summoner’s Rift · R Collateral Damage: impacto direto 275/425/575 + 150% DdA adicional. Recuo, trajetória e área não simulados.'
 },
 {
  champion:'Graves',patch:'16.23.1',spell:'GravesR',calculation:'ConeExplosion',source:'https://wiki.leagueoflegends.com/en-us/Graves',sourceType:'wiki',
  damageType:'physical',baseByRank:[200,320,440],apRatioByRank:[0,0,0],bonusADRatioByRank:[1.2,1.2,1.2],
  note:'Summoner’s Rift · R Collateral Damage: explosão em cone 200/320/440 + 120% DdA adicional. Separada do impacto direto; geometria/alvos secundários pendentes.'
 },
 {
  champion:'Gwen',patch:'16.23.1',spell:'GwenQ',calculation:'MinimumSnips',source:'https://wiki.leagueoflegends.com/en-us/Gwen',sourceType:'wiki',
  damageType:'magic',baseByRank:[70,99,128,157,186],apRatioByRank:[0.4,0.4,0.4,0.4,0.4],
  note:'Q · dano mínimo externo (2 cortes + corte final, sem stacks Snippy); variante mágica agregada. Conversão do centro para dano verdadeiro, passiva por vida máxima e geometria não incluídas.'
 },
 {
  champion:'Gwen',patch:'16.23.1',spell:'GwenQ',calculation:'MaximumSnipsCenter',source:'https://wiki.leagueoflegends.com/en-us/Gwen',sourceType:'wiki',
  damageType:'magic',baseByRank:[110,155,200,245,290],apRatioByRank:[0.6,0.6,0.6,0.6,0.6],
  note:'Q · seis cortes no centro: metade do dano agregado é convertida em dano verdadeiro. A parcela da passiva A Thousand Cuts é aplicada separadamente por corte no jogo e permanece fora deste agregado.'
 },
 {
  champion:'Gwen',patch:'16.23.1',spell:'GwenQ',calculation:'MaximumSnips',source:'https://wiki.leagueoflegends.com/en-us/Gwen',sourceType:'wiki',
  damageType:'magic',baseByRank:[110,155,200,245,290],apRatioByRank:[0.6,0.6,0.6,0.6,0.6],
  note:'Q · dano máximo externo com quatro stacks Snippy (6 cortes); variante mágica agregada. Conversão do centro para dano verdadeiro, passiva por vida máxima e geometria não incluídas.'
 },
 {
  champion:'Gwen',patch:'16.23.1',spell:'GwenR',calculation:'FirstNeedle',source:'https://wiki.leagueoflegends.com/en-us/Gwen',sourceType:'wiki',
  damageType:'magic',baseByRank:[35,65,95],apRatioByRank:[0.1,0.1,0.1],targetMaxHPRatio:0.01,targetMaxHPRatioPer100AP:0.006,
  note:'R · um único agulhão (35/65/95 + 10% AP) do primeiro lançamento. Não inclui recasts, quantidade crescente de agulhas, passiva, slow ou acertos múltiplos.'
 },
 {
  champion:'Hecarim',patch:'16.23.1',spell:'HecarimQ',calculation:'Damage',source:'https://wiki.leagueoflegends.com/en-us/Hecarim',sourceType:'wiki',
  damageType:'physical',baseByRank:[60,90,120,150,180],apRatioByRank:[0,0,0,0,0],bonusADRatioByRank:[0.9,0.9,0.9,0.9,0.9],
  note:'Q · um impacto físico de Rampage no patch 26.23: 60/90/120/150/180 + 90% DdA adicional. O motor aplica amplificação de 4% + 3% por 100 DdA adicional por stack, até três stacks, com redução de recarga e expiração escalonada; área e dano reduzido contra tropas não incluídos.'
 },
 {
  champion:'Hecarim',patch:'16.23.1',spell:'HecarimW',calculation:'SingleTick',source:'https://wiki.leagueoflegends.com/en-us/Hecarim',sourceType:'wiki',
  damageType:'magic',baseByRank:[20,30,40,50,60],apRatioByRank:[0.2,0.2,0.2,0.2,0.2],
  note:'W · um de quatro ticks temporais do dano total, cada um equivalente a 25% da fórmula agregada. Requer quatro ações manuais separadas durante a janela de 4s; área e dano de aliados não incluídos.'
 },
 {
  champion:'Hecarim',patch:'16.23.1',spell:'HecarimW',calculation:'TotalDamage',source:'https://wiki.leagueoflegends.com/en-us/Hecarim',sourceType:'wiki',
  damageType:'magic',baseByRank:[80,120,160,200,240],apRatioByRank:[0.8,0.8,0.8,0.8,0.8],
  note:'W · soma dos quatro ticks em um alvo durante 4s. Não simula ticks por segundo, área, resistências bônus nem cura baseada no dano causado na zona.'
 },
 {
  champion:'Heimerdinger',patch:'16.23.1',spell:'HeimerdingerR',calculation:'RocketSwarm',source:'https://wiki.leagueoflegends.com/en-us/Heimerdinger',sourceType:'wiki',
  damageType:'magic',baseByRank:[503,697.5,892],apRatioByRank:[1.83,1.83,1.83],
  note:'R+W · quatro ondas de cinco foguetes contra um único campeão: dano agregado 503/697,5/892 + 183% AP. Distribuição geométrica e múltiplos alvos não simulados; variante manual.'
 },
 {
  champion:'Heimerdinger',patch:'16.23.1',spell:'HeimerdingerQ',calculation:'TurretShot',source:'https://wiki.leagueoflegends.com/en-us/Heimerdinger',sourceType:'wiki',
  damageType:'magic',baseByRank:[7,11,15,19,23],apRatioByRank:[0.35,0.35,0.35,0.35,0.35],
  note:'Q · um disparo básico de uma torreta H-28G. Não simula instalação, alvo prioritário, cadência, duração, cargas nem raio carregado.'
 },
 {
  champion:'Heimerdinger',patch:'16.23.1',spell:'HeimerdingerQ',calculation:'TurretBeam',source:'https://wiki.leagueoflegends.com/en-us/Heimerdinger',sourceType:'wiki',
  damageType:'magic',baseByRank:[40,60,80,100,120],apRatioByRank:[0.55,0.55,0.55,0.55,0.55],
  note:'Q · raio carregado de uma torreta H-28G: 40/60/80/100/120 + 55% AP. Uma descarga isolada; não simula carga/cadência, direção, alvos atingidos ou torretas persistentes.'
 },
 {
  champion:'Heimerdinger',patch:'16.23.1',spell:'HeimerdingerR',calculation:'ApexTurretShot',source:'https://wiki.leagueoflegends.com/en-us/Heimerdinger',sourceType:'wiki',
  damageType:'magic',baseByRank:[80,100,120],apRatioByRank:[0.35,0.35,0.35],
  note:'R+Q · um ataque básico da torreta H-28Q Apex: 80/100/120 + 35% AP. Variante manual isolada, sem duração, cadência, alvos ou área.'
 },
 {
  champion:'Heimerdinger',patch:'16.23.1',spell:'HeimerdingerR',calculation:'ApexTurretBeam',source:'https://wiki.leagueoflegends.com/en-us/Heimerdinger',sourceType:'wiki',
  damageType:'magic',baseByRank:[100,140,180],apRatioByRank:[0.7,0.7,0.7],
  note:'R+Q · um raio carregado da torreta H-28Q Apex: 100/140/180 + 70% AP. Variante manual isolada; não simula carga, cadência, linha de acerto nem duração da torreta.'
 },
 {
  champion:'Heimerdinger',patch:'16.23.1',spell:'HeimerdingerW',calculation:'FullSalvo',source:'https://wiki.leagueoflegends.com/en-us/Heimerdinger',sourceType:'wiki',
  damageType:'magic',baseByRank:[90,135,180,225,270],apRatioByRank:[1.03,1.03,1.03,1.03,1.03],
  note:'W · salva completa de cinco foguetes contra um único campeão: primeiro foguete + quatro subsequentes com dano reduzido. Não modela distribuição/convergência, múltiplos alvos ou acertos em minions.'
 },
 {
  champion:'Heimerdinger',patch:'16.23.1',spell:'HeimerdingerW',calculation:'FirstRocket',source:'https://wiki.leagueoflegends.com/en-us/Heimerdinger',sourceType:'wiki',
  damageType:'magic',baseByRank:[50,75,100,125,150],apRatioByRank:[0.55,0.55,0.55,0.55,0.55],
  note:'W · primeiro foguete da salva: 50/75/100/125/150 + 55% AP (patch 26.3+). Foguetes subsequentes, convergência, distribuição, redução por acertos repetidos e carga de torretas não simulados.'
 },
 {
  champion:'Gwen',patch:'16.23.1',spell:'GwenW',calculation:'Activate',source:'https://wiki.leagueoflegends.com/en-us/Gwen',sourceType:'wiki',
  damageType:'magic',baseByRank:[0,0,0,0,0],apRatioByRank:[0,0,0,0,0],
  note:'W · Hallowed Mist: ação sem dano que concede 4s de armadura e resistência mágica bônus de 22/24/26/28/30 + 7% AP. Untargetability espacial não simulada.'
 },
 {
  champion:'Graves',patch:'16.23.1',spell:'GravesE',calculation:'Activate',source:'https://wiki.leagueoflegends.com/en-us/Graves',sourceType:'wiki',
  damageType:'physical',baseByRank:[0,0,0,0,0],apRatioByRank:[0,0,0,0,0],
  note:'E · Quickdraw: ação sem dano que concede um stack de True Grit por 4s; armadura por stack 4/7/10/13/16 (patch 25.21+) e MR equivalente a 50% da armadura bônus. O modelo de ataque básico usa apenas o primeiro projétil como baseline conservador; munição/recarga e pellets adicionais não simulados.'
 },
 {
  champion:'Gwen',patch:'16.23.1',spell:'GwenE',calculation:'Activate',source:'https://wiki.leagueoflegends.com/en-us/Gwen',sourceType:'wiki',
  damageType:'magic',baseByRank:[0,0,0,0,0],apRatioByRank:[0,0,0,0,0],
  note:'E · Skip n Slash: ação sem dano que ativa 4s de velocidade de ataque e ataques fortalecidos. Dash e reembolso de cooldown não simulados.'
 },
 {
  champion:'Gwen',patch:'16.23.1',spell:'GwenE',calculation:'EmpoweredAttack',source:'https://wiki.leagueoflegends.com/en-us/Gwen',sourceType:'wiki',
  damageType:'magic',baseByRank:[15,15,15,15,15],apRatioByRank:[0.2,0.2,0.2,0.2,0.2],
  note:'E · Skip n Slash: dano mágico adicional de 15 + 20% AP em ataques fortalecidos por 4s; velocidade de ataque e reembolso de cooldown não simulados.'
 },
 {
  champion:'Gwen',patch:'16.23.1',spell:'GwenR',calculation:'SecondCast',source:'https://wiki.leagueoflegends.com/en-us/Gwen',sourceType:'wiki',
  damageType:'magic',baseByRank:[105,195,285],apRatioByRank:[0.3,0.3,0.3],targetMaxHPRatioByRank:[0.03,0.03,0.03],targetMaxHPRatioPer100AP:0.018,
  note:'R · segundo lançamento: três agulhas, dano agregado 105/195/285 + 30% AP + 3% (+1,8% por 100 AP) da vida máxima do alvo; uma única aplicação agregada, sem slow.'
 },
 {
  champion:'Gwen',patch:'16.23.1',spell:'GwenR',calculation:'ThirdCast',source:'https://wiki.leagueoflegends.com/en-us/Gwen',sourceType:'wiki',
  damageType:'magic',baseByRank:[175,325,475],apRatioByRank:[0.5,0.5,0.5],targetMaxHPRatioByRank:[0.05,0.05,0.05],targetMaxHPRatioPer100AP:0.03,
  note:'R · terceiro lançamento: cinco agulhas, dano agregado 175/325/475 + 50% AP + 5% (+3% por 100 AP) da vida máxima do alvo; uma única aplicação agregada, sem slow.'
 },
 {
  champion:'Hecarim',patch:'16.23.1',spell:'HecarimE',calculation:'MinimumDamage',source:'https://wiki.leagueoflegends.com/en-us/Hecarim',sourceType:'wiki',
  damageType:'physical',baseByRank:[30,45,60,75,90],apRatioByRank:[0,0,0,0,0],bonusADRatioByRank:[0.5,0.5,0.5,0.5,0.5],
  note:'E · Devastating Charge: dano mínimo do ataque fortalecido 30/45/60/75/90 + 50% DdA adicional; distância percorrida não modelada.'
 },
 {
  champion:'Hecarim',patch:'16.23.1',spell:'HecarimE',calculation:'MaximumDamage',source:'https://wiki.leagueoflegends.com/en-us/Hecarim',sourceType:'wiki',
  damageType:'physical',baseByRank:[60,90,120,150,180],apRatioByRank:[0,0,0,0,0],bonusADRatioByRank:[1,1,1,1,1],
  note:'E · Devastating Charge: dano máximo após carga completa 60/90/120/150/180 + 100% DdA adicional; variante manual, depende da distância percorrida.'
 },
 {
  champion:'Hecarim',patch:'16.23.1',spell:'HecarimR',calculation:'SpectralRiders',source:'https://wiki.leagueoflegends.com/en-us/Hecarim',sourceType:'wiki',
  damageType:'magic',baseByRank:[150,250,350],apRatioByRank:[1,1,1],
  note:'R · Onslaught of Shadows: dano mágico dos cavaleiros espectrais 150/250/350 + 100% AP. Não inclui fear/slow nem geometria de colisão.'
 },
 {
  champion:'Heimerdinger',patch:'16.23.1',spell:'HeimerdingerE',calculation:'Impact',source:'https://wiki.leagueoflegends.com/en-us/Heimerdinger',sourceType:'wiki',
  damageType:'magic',baseByRank:[60,100,140,180,220],apRatioByRank:[0.6,0.6,0.6,0.6,0.6],
  note:'E · CH-2 Electron Storm Grenade: 60/100/140/180/220 + 60% AP; slow, stun central e recarga dos raios das torretas não simulados.'
 },
 {
  champion:'Heimerdinger',patch:'16.23.1',spell:'HeimerdingerR',calculation:'UpgradedGrenade',source:'https://wiki.leagueoflegends.com/en-us/Heimerdinger',sourceType:'wiki',
  damageType:'magic',baseByRank:[100,200,300],apRatioByRank:[0.6,0.6,0.6],
  note:'R+E · CH-3X Lightning Grenade: uma explosão de 100/200/300 + 60% AP. Três ricochetes e limites de dano por campeão não simulados; variante manual.'
 },
 {
  champion:'Illaoi',patch:'16.23.1',spell:'IllaoiE',calculation:'Activate',source:'https://wiki.leagueoflegends.com/en-us/Illaoi',sourceType:'wiki',
  damageType:'physical',baseByRank:[0,0,0,0,0],apRatioByRank:[0,0,0,0,0],
  note:'E · Test of Spirit: ação sem dano que cria espírito por 7s e ecoa 25/30/35/40/45% (+8% por 100 AD) do dano pré-mitigação recebido, limitado pela vida restante do espírito.'
 },
 {
  champion:'Illaoi',patch:'16.23.1',spell:'IllaoiQ',calculation:'TentacleStrike',source:'https://wiki.leagueoflegends.com/en-us/Illaoi',sourceType:'wiki',
  damageType:'physical',baseByRank:[9,9,9,9,9],baseByLevel:[9,20.24,31.47,42.71,53.95,65.18,76.42,87.65,98.89,110.13,121.36,132.6,143.84,155.07,166.31,177.55,188.78,200.12],
  apRatioByRank:[0.4,0.4,0.4,0.4,0.4],adRatioByRank:[1.1,1.1,1.1,1.1,1.1],damageAmpByRank:[0.1,0.15,0.2,0.25,0.3],
  note:'Q · um golpe de tentáculo: 9–200,12 por nível + 110% AD total + 40% AP, amplificado em 10–30% pelo rank de Q. Não simula múltiplos tentáculos nem cura passiva.'
 },
 {
  champion:'Illaoi',patch:'16.23.1',spell:'IllaoiW',calculation:'BonusMaxHealthDamage',source:'https://wiki.leagueoflegends.com/en-us/Illaoi',sourceType:'wiki',
  damageType:'physical',baseByRank:[0,0,0,0,0],apRatioByRank:[0,0,0,0,0],targetMaxHPRatioByRank:[0.03,0.035,0.04,0.045,0.05],targetMaxHPADRatio:0.00035,minimumDamageByRank:[20,30,40,50,60],
  note:'W · bônus físico do ataque fortalecido: 3/3,5/4/4,5/5% da vida máxima + 3,5% por 100 AD, com mínimo 20/30/40/50/60. Limite de 300 contra não campeões, ataque básico e golpes de tentáculo não incluídos.'
 },
 {
  champion:'Illaoi',patch:'16.23.1',spell:'IllaoiR',calculation:'Damage',source:'https://wiki.leagueoflegends.com/en-us/Illaoi',sourceType:'wiki',
  damageType:'physical',baseByRank:[150,250,350],apRatioByRank:[0,0,0],bonusADRatioByRank:[0.5,0.5,0.5],
  note:'R · impacto físico inicial em um alvo: 150/250/350 + 50% DdA adicional. Não inclui área, número de campeões atingidos, tentáculos invocados ou golpes subsequentes.'
 },
];
export function officialAdapterFor(champion:string,spell:string,calculation:string,patch:string):OfficialDamageAdapter|undefined{
 const validation=validateOfficialDamageAdapters();if(validation.length)throw Error(`Official adapter registry invalid: ${validation.join('; ')}`);
 return officialDamageAdapters.find(a=>a.champion===champion&&a.spell===spell&&a.calculation===calculation&&a.patch===patch);
}
export function evaluateOfficialAdapter(adapter:OfficialDamageAdapter,rank:number,stats:Pick<Stats,'ap'> & {bonusAD?:number;ad?:number;targetMaxHP?:number;level?:number}):number{
 if(!Number.isInteger(rank)||rank<1||rank>adapter.baseByRank.length)throw Error('Rank fora da tabela oficial');
 const base=adapter.baseByRank[rank-1],ratio=adapter.apRatioByRank[rank-1],bonusRatio=adapter.bonusADRatioByRank?.[rank-1]??0,adRatio=adapter.adRatioByRank?.[rank-1]??0,bonusAD=stats.bonusAD??0,ad=stats.ad??0,targetMaxHP=stats.targetMaxHP??0;
 if(!Number.isFinite(base)||!Number.isFinite(ratio)||!Number.isFinite(bonusRatio)||!Number.isFinite(adRatio)||!Number.isFinite(stats.ap)||!Number.isFinite(bonusAD)||!Number.isFinite(ad)||!Number.isFinite(targetMaxHP)||targetMaxHP<0)throw Error('Dados da fórmula oficial inválidos');
 const level=stats.level??1;if(adapter.baseByLevel&&(!Number.isInteger(level)||level<1||level>18||adapter.baseByLevel.length!==18))throw Error('Tabela de nível inválida');const levelBase=adapter.baseByLevel?.[level-1]??base;const hpRatio=(adapter.targetMaxHPRatio??adapter.targetMaxHPRatioByRank?.[rank-1]??0)+(adapter.targetMaxHPRatioPer100AP??0)*stats.ap/100;const result=levelBase+ratio*stats.ap+bonusRatio*bonusAD+adRatio*ad+hpRatio*targetMaxHP+(adapter.targetMaxHPBonusADRatio??0)*bonusAD*targetMaxHP+(adapter.targetMaxHPADRatio??0)*ad*targetMaxHP;const minimum=adapter.minimumDamageByRank?.[rank-1]??0;return Math.max(minimum,result)*(1+(adapter.damageAmpByRank?.[rank-1]??0));
}

/** Registry gate: invalid or ambiguous official rows must never enter runtime. */
export function validateOfficialDamageAdapters(adapters:OfficialDamageAdapter[]=officialDamageAdapters):string[]{
 const errors:string[]=[];
 const seen=new Set<string>();
 for(const [index,row] of adapters.entries()){
  const prefix=`adapter[${index}]`;
  if(!row.champion?.trim()||!row.spell?.trim()||!row.calculation?.trim())errors.push(`${prefix}: champion/spell/calculation required`);
  if(!/^\d+\.\d+\.\d+$/.test(row.patch))errors.push(`${prefix}: invalid patch version`);
  if((row.sourceType??'riot')==='riot'&&!/^https:\/\/(www\.)?leagueoflegends\.com\//.test(row.source))errors.push(`${prefix}: source must be an official Riot League URL`);
  else if(row.sourceType==='wiki'&&!/^https:\/\/wiki\.leagueoflegends\.com\//.test(row.source))errors.push(`${prefix}: wiki source must be League of Legends Wiki`);
  else if(row.sourceType!==undefined&&!['riot','wiki'].includes(row.sourceType))errors.push(`${prefix}: invalid source type`);
  if(!['physical','magic','true'].includes(row.damageType))errors.push(`${prefix}: invalid damage type`);
  if(!Array.isArray(row.baseByRank)||![3,5].includes(row.baseByRank.length)||row.baseByRank.some(v=>!Number.isFinite(v)||v<0))errors.push(`${prefix}: baseByRank must contain three or five finite nonnegative ranks`);
  if(!Array.isArray(row.apRatioByRank)||row.apRatioByRank.length!==row.baseByRank?.length||row.apRatioByRank.some(v=>!Number.isFinite(v)||v<0))errors.push(`${prefix}: apRatioByRank must match baseByRank`);
  if(row.bonusADRatioByRank&&(!Array.isArray(row.bonusADRatioByRank)||row.bonusADRatioByRank.length!==row.baseByRank?.length||row.bonusADRatioByRank.some(v=>!Number.isFinite(v)||v<0)))errors.push(`${prefix}: bonusADRatioByRank must match the rank table`);
  if(row.adRatioByRank&&(!Array.isArray(row.adRatioByRank)||row.adRatioByRank.length!==row.baseByRank?.length||row.adRatioByRank.some(v=>!Number.isFinite(v)||v<0)))errors.push(`${prefix}: adRatioByRank must match the rank table`);
  if(row.targetMaxHPRatio!==undefined&&(!Number.isFinite(row.targetMaxHPRatio)||row.targetMaxHPRatio<0))errors.push(`${prefix}: targetMaxHPRatio must be finite and nonnegative`);
  if(row.targetMaxHPRatioByRank&&(!Array.isArray(row.targetMaxHPRatioByRank)||row.targetMaxHPRatioByRank.length!==row.baseByRank?.length||row.targetMaxHPRatioByRank.some(v=>!Number.isFinite(v)||v<0)))errors.push(`${prefix}: targetMaxHPRatioByRank must match the rank table`);
  if(row.targetMaxHPBonusADRatio!==undefined&&(!Number.isFinite(row.targetMaxHPBonusADRatio)||row.targetMaxHPBonusADRatio<0))errors.push(`${prefix}: targetMaxHPBonusADRatio must be finite and nonnegative`);
  if(row.targetMaxHPADRatio!==undefined&&(!Number.isFinite(row.targetMaxHPADRatio)||row.targetMaxHPADRatio<0))errors.push(`${prefix}: targetMaxHPADRatio must be finite and nonnegative`);
  if(row.targetMaxHPRatioPer100AP!==undefined&&(!Number.isFinite(row.targetMaxHPRatioPer100AP)||row.targetMaxHPRatioPer100AP<0))errors.push(`${prefix}: targetMaxHPRatioPer100AP must be finite and nonnegative`);
  if(row.minimumDamageByRank&&(!Array.isArray(row.minimumDamageByRank)||row.minimumDamageByRank.length!==row.baseByRank?.length||row.minimumDamageByRank.some(v=>!Number.isFinite(v)||v<0)))errors.push(`${prefix}: minimumDamageByRank must match the rank table`);
  if(row.damageAmpByRank&&(!Array.isArray(row.damageAmpByRank)||row.damageAmpByRank.length!==row.baseByRank?.length||row.damageAmpByRank.some(v=>!Number.isFinite(v)||v<0)))errors.push(`${prefix}: damageAmpByRank must match the rank table`);
  if(row.baseByLevel&&(!Array.isArray(row.baseByLevel)||row.baseByLevel.length!==18||row.baseByLevel.some(v=>!Number.isFinite(v)||v<0)))errors.push(`${prefix}: baseByLevel must contain 18 finite nonnegative levels`);
  if(!row.note?.trim())errors.push(`${prefix}: scope note required`);
  const key=`${row.patch}|${row.champion}|${row.spell}|${row.calculation}`;
  if(seen.has(key))errors.push(`${prefix}: duplicate patch/champion/spell/calculation`);
  seen.add(key);
 }
 return errors;
}
