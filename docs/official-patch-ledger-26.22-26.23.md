# Registro oficial de mudanças — patches 26.22 e 26.23

Atualizado em 19/11/2026. Este arquivo é um índice de mudanças confirmadas nas notas oficiais da Riot, não uma implementação executável de habilidades. Mudanças de Summoner's Rift e modos alternativos são separadas para evitar contaminar os cálculos padrão.

## Patch 26.22 — Summoner's Rift

Fonte: https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-22-notes/

### Atributos base incorporados ao catálogo

- **Mel:** Vida base 590; crescimento de vida 107; mana base 455; crescimento de mana 38; crescimento de armadura 5,4; AD base 52; crescimento de velocidade de ataque 2,75%.
- **Thresh:** AD base 54.
- **Viktor:** crescimento de vida 105.

Essas correções são aplicadas somente a partir do catálogo 16.22.1 (patch 26.22), com a URL oficial registrada em cada entrada do ledger. O restante dos atributos continua vindo do Data Dragon versionado.

### Mudanças de habilidades registradas para implementação e fixtures

| Campeão | Habilidade | Mudança oficial | Estado no Aegis |
|---|---|---|---|
| Aurelion Sol | E | Dano total e escalamento de AP aumentados | Pendente de adapter/fixture |
| Corki | R | Dano base e razão de bonus AD aumentados; Big One separado | Pendente de adapter/fixture |
| Kayle | Q/R | Tempos de recarga reduzidos | Pendente de adapter/fixture |
| Locke | Q/W | Dano de stacks e duração alterados | Pendente; kit/source precisa validação |
| Maokai | Q | Razão de vida máxima do alvo aumentada por rank | Pendente de adapter/fixture |
| Mel | P/Q/W/E/R | Midscope: multi-hit, retornos de recarga, destruição/retaliação de projéteis, escudo e duração condicional | Pendente de adapter completo |
| Naafiri | Q/W | Cura e bonus AD alterados | Pendente de adapter/fixture |
| Rumble | R | Dano por segundo e máximo de AP aumentados | Pendente de adapter/fixture |
| Shen | Q | Modificador contra monstros alterado | Pendente; regra de monstro separada |
| Smolder | W | Dano da explosão aumentado | Pendente de adapter/fixture |
| Thresh | R | Dano base reduzido | Pendente de adapter/fixture |
| Viktor | R | Dano de conjuração e razão de AP alterados | Pendente de adapter/fixture |
| Yasuo | Q | Razão de AD total reduzida | Pendente de adapter/fixture |
| Zaahen | Q | Recarga reduzida por rank | Pendente; kit/source precisa validação |

Os valores detalhados de cada alteração permanecem nas notas oficiais vinculadas acima. Não foram convertidos automaticamente em fórmulas do motor: casos como Mel exigem contagem de impactos, alvos múltiplos, retaliations e condições de projéteis.

### Itens

- Doran's Bow: AD 8 → 7.
- Overlord's Bloodmail: AD 30 → 40; Retribution passa a conceder até 10% de AD total conforme vida perdida.

Os dados de itens ativos continuam vindo do JSON versionado do Data Dragon. Não foi criada uma segunda camada de overrides de itens sem validar IDs, campos e valores no snapshot atual.

## Patch 26.23

Fonte: https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-23-notes/

As mudanças de campeões exibidas nas notas 26.23 são explicitamente de ARAM: Mayhem, ARAM e Arena (incluindo variantes de habilidades e itens desses modos). Elas **não devem ser aplicadas ao motor de Summoner's Rift**. O catálogo de Summoner's Rift permanece ancorado em Data Dragon 16.23.1.

## Política de confiabilidade

1. Data Dragon da Riot, com URL e versão imutáveis, é a fonte primária para catálogo, atributos, itens, runas e assets.
2. Notas oficiais da Riot são a fonte para alterações de balanceamento explicitamente publicadas; cada correção tem patch efetivo e URL.
3. Dados Meraki antigos continuam em quarentena de revisão e não ativam coeficientes no runtime.
4. Nenhuma linha desta tabela de habilidades é declarada como fórmula exata implementada. O estado só muda após adapter explícito, tratamento de casos especiais e fixture independente no patch correspondente.
5. Não misturar valores de Arena/ARAM/Mayhem com Summoner's Rift.

## Estado de cobertura

As correções de atributos não alteram a cobertura de kits: **0/173 kits com adapter de habilidade parcial ou completo validado no patch 26.23**. O catálogo está atualizado; o motor de habilidades ainda requer trabalho por campeão.
