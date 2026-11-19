# Auditoria das mudanças oficiais — patch 26.23 (Data Dragon 16.23.1)

Fonte primária: [Riot Games — Patch 26.23 Notes, 17/11/2026](https://www.leagueoflegends.com/en-sg/news/game-updates/league-of-legends-patch-26-23-notes/).

Este documento registra mudanças relevantes para o motor de combate. Ele **não** converte texto de patch notes em adapters executáveis automaticamente. Valores listados abaixo são dados oficiais de balanceamento; condições, múltiplos hits, mitigação, ordem temporal e interação com outras mecânicas ainda exigem modelagem e fixtures próprias.

## Summoner's Rift — mudanças numéricas

| Campeão | Habilidade | Mudança oficial no 26.23 | Trabalho necessário no Aegis |
|---|---|---|---|
| Annie | R — Tibbers | Vida: 1275–4000 por nível + 50% AP + 150% vida bônus; aura 10/15/20 + 4% AP; AD do Tibbers 30/50/70 + 10% AP | Modelo de pet, escalonamento por nível, vida bônus e DPS de aura separado |
| Azir | W — Arise! | Razão de dano/on-hit: 67% (antes 50%); alcance base 550 (antes 525; não altera alcance dos soldados) | Soldados e ataques do campeão precisam ser entidades/alcances separados |
| Bard | Q — Cosmic Binding | 80/125/170/215/260 + 100% AP | Fórmula direta por rank |
| Ezreal | W — Essence Flux | 80/135/190/245/300 + 115% AD bônus + 100% AP | Detonação e gatilho de W devem continuar condicionais |
| Ezreal | R — Trueshot Barrage | Dano a campeões: 350/600/850 + 110% AD bônus + 120% AP | Dano a campeões distinto do dano a não campeões e redução por alvos atravessados, se aplicável |
| Galio | W — Shield of Durand | Escudo (também afeta R): 8/11/14/17/20% da vida máxima | Escudo não deve ser somado ao dano; modelar duração/condições |
| Gnar | Q — Boomerang/Boulder | Mini: 5/45/85/125/165 + 135% AD; Mega: 45/90/135/180/225 + 150% AD | Forma Mini/Mega explícita |
| K'Sante | W — Path Maker | Mana 45; dano 45/85/125/165/205; aumento de dano da carga All Out 10/26,25/42,5/58,75/75% | Estado All Out, carga e rank precisam ser modelados |
| LeBlanc | Q — Sigil of Malice | Razão AP inicial e marca: 35% (antes 40%) | Dois impactos separados; evitar aplicar razão duas vezes no mesmo evento |
| Master Yi | Q — Alpha Strike | Dano 20/40/60/80/100 + 60% AD; máximo em alvo único 35/70/105/140/175 + 105% AD; pode critar | Multi-hit, alvo único e crítico precisam de regra própria |
| Mel | Q — Radiant Barrage | Dano por projétil subsequente 6/11/16/21/26 + 9% AP; dano máximo 90/126/172/228/294 + 70/79/88/97/106% AP | Projéteis, hits subsequentes e teto máximo separados |
| Mel | W — Rebuttal | Escudo 50/90/130/170/210 + 50% AP; retaliação 35/45/55/65/75 + 10% AP | Escudo e retaliação são eventos distintos |
| Syndra | E — Scatter the Weak | Custo de mana 60; cooldown 17/16,5/16/15,5/15 s | Atualizar custos e cooldowns no catálogo de habilidades |
| Vel'Koz | R — Life Form Disintegration Ray | Dano total 450/700/950 | Canalização e dano total; não dividir em ticks sem regra documentada |
| Vi | E — Relentless Force | 10/35/60/85/110 + 110% AD + 100% AP | Ataque fortalecido/área deve ser evento próprio |

## Itens

- Voltaic Cyclosword — Firmament: dano adicional de vida atual reduzido para 8%/6% (dependendo da condição da fonte oficial). O proc precisa de gatilho, cooldown e regra de vida atual; não somar como dano permanente.

## Separação de modos

As mudanças em Classic/temporadas históricas, Arena e ARAM: Mayhem não devem ser aplicadas ao motor padrão de Summoner's Rift. O patch notes também inclui versões históricas de campeões para o modo Classic; não são os kits atuais. Modificadores específicos de modos devem ficar isolados por ruleset.

## Estado da ingestão e da certificação

- Catálogo Data Dragon 16.23.1 / 173 campeões foi ingerido para pt_BR e en_US, validado por testes, TypeScript, build e auditoria de cobertura, e commitado na branch de trabalho.
- mechanics.json ainda é 16.19.1 e não é combinado com o catálogo 16.23.1.
- exactKits permanece restrito ao snapshot 16.20.1. Nenhuma fórmula antiga é automaticamente promovida para 16.23.1.
- O manifesto mantém validatedPatch: null. Isso é intencional: catálogo atualizado não significa motor matemático certificado.
- O inventário permanece seis kits parciais, 167 sem adapters numéricos nativos e zero kits completos validados.

## Próximas tarefas mecânicas priorizadas

1. Implementar e testar Bard Q e Vi E como casos diretos de fórmula/rank.
2. Atualizar Ezreal W/R e LeBlanc Q com regras condicionais/múltiplos impactos.
3. Modelar Annie R e Mel Q/W (pet, projéteis, escudo/retaliação) sem converter essas entidades em dano instantâneo simples.
4. Modelar Azir W, Gnar Q e K'Sante W com estados/forma/carga.
5. Atualizar custos/cooldowns de Syndra E e o proc de Voltaic Cyclosword.
6. Implementar Yi Q com alvo único e crítico.
7. Criar fixtures independentes por campeão e por patch antes de habilitar qualquer resultado como Exato.

Não declarar o motor completo para 173 campeões até que cada kit, passiva, item/runa relevante e interação tenha adapter, fonte, teste independente e compatibilidade de patch.
