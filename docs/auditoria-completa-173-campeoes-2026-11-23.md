# Auditoria integral dos 173 campeões — Aegis LoL

- Data da auditoria: 2026-11-23
- Dataset auditado: Data Dragon 16.19.1
- Campeões no catálogo: 173
- Campeões com snapshot de mecânicas: 6
- Modos considerados: Summoner's Rift, League of Legends base; sem Classic ou modos alternativos.

## Resultado executivo

| Indicador | Resultado |
|---|---:|
| Kits com certificação matemática integral | 0/173 |
| Campeões com snapshot de mecânicas | 6/173 |
| Campeões com placeholders de tooltip não resolvidos | 173/173 |
| Total de placeholders encontrados nas habilidades | 3307 |
| Campeões com impactos no kit-import do patch | 0/173 |
| Habilidades ausentes (P) | 173/173 |
| Habilidades ausentes (Q) | 167/173 |
| Habilidades ausentes (W) | 171/173 |
| Habilidades ausentes (E) | 169/173 |
| Habilidades ausentes (R) | 169/173 |

**Conclusão:** o catálogo de 173 campeões existe, mas não há evidência suficiente para declarar os kits completos ou matematicamente validados. O snapshot de mecânicas contém apenas seis campeões: Shen, Ezreal, Yasuo, Yone, Riven e Darius. A auditoria não encontrou impactos importados para nenhum campeão.

## Problemas estruturais que afetam a auditoria

1. **Desalinhamento de versões:** `public/data/mechanics.json` está em `16.19.1`; `src/exactKits.ts` declara `EXACT_PATCH = 16.20.1`; os adaptadores oficiais encontrados declaram `16.23.1`. As fórmulas condicionadas à versão não são intercambiáveis e podem ser ignoradas quando a versão do dataset não corresponde.
2. **Cobertura de passivas:** `championKitCoverage` marca P como ausente para todos os campeões. Passivas precisam de um modelo próprio, incluindo gatilhos, stacks, cooldowns e condições.
3. **Tooltips não são fórmulas:** os textos do Data Dragon contêm placeholders sem valores resolvidos. Não se deve extrair coeficientes matemáticos apenas do texto exibido.
4. **Cobertura não equivale a rotação:** os adaptadores representam impactos isolados; não garantem combos, DPS sustentado, custos de recurso, recasts, procs, alvos múltiplos ou estados temporais.
5. **Escalonamentos por classe são estimativas:** `championScaling.ts` usa fallback de classe para desbloquear atributos quando não há evidência explícita. Isso não certifica escalamentos de habilidades.
6. **Métrica conservadora:** o relatório do pipeline registra `fullyValidated = 0`; a função atual de cobertura também define `isExactFormula` como falso por construção. Portanto, zero é o número de kits certificados pelo pipeline, não uma prova de que cada fórmula isolada existente esteja errada.

## Inventário campeão por campeão

| Campeão | Status do kit | Habilidades ausentes | Placeholders | Impactos importados |
|---|---|---|---:|---:|
| Akshan | Parcial / não certificado | P, Q, W, E, R | 13 | 0 |
| Ambessa | Parcial / não certificado | P, Q, W, E, R | 23 | 0 |
| Alistar | Parcial / não certificado | P, Q, W, E, R | 14 | 0 |
| Ahri | Parcial / não certificado | P, Q, W, E, R | 16 | 0 |
| Akali | Parcial / não certificado | P, Q, W, E, R | 17 | 0 |
| Aatrox | Parcial / não certificado | P, Q, W, E, R | 16 | 0 |
| Anivia | Parcial / não certificado | P, Q, W, E, R | 18 | 0 |
| Amumu | Parcial / não certificado | P, Q, W, E, R | 13 | 0 |
| Annie | Parcial / não certificado | P, Q, W, E, R | 15 | 0 |
| AurelionSol | Parcial / não certificado | P, Q, W, E, R | 23 | 0 |
| Ashe | Parcial / não certificado | P, Q, W, E, R | 14 | 0 |
| Belveth | Parcial / não certificado | P, Q, W, E, R | 27 | 0 |
| Aphelios | Parcial / não certificado | P, Q, W, E, R | 6 | 0 |
| Azir | Parcial / não certificado | P, Q, W, E, R | 14 | 0 |
| Bard | Parcial / não certificado | P, Q, W, E, R | 19 | 0 |
| Aurora | Parcial / não certificado | P, Q, W, E, R | 18 | 0 |
| Blitzcrank | Parcial / não certificado | P, Q, W, E, R | 15 | 0 |
| Brand | Parcial / não certificado | P, Q, W, E, R | 11 | 0 |
| Camille | Parcial / não certificado | P, Q, W, E, R | 22 | 0 |
| Briar | Parcial / não certificado | P, Q, W, E, R | 28 | 0 |
| Caitlyn | Parcial / não certificado | P, Q, W, E, R | 16 | 0 |
| Cassiopeia | Parcial / não certificado | P, Q, W, E, R | 19 | 0 |
| Braum | Parcial / não certificado | P, Q, W, E, R | 20 | 0 |
| Chogath | Parcial / não certificado | P, Q, W, E, R | 18 | 0 |
| Darius | Parcial / não certificado | P, W, E | 19 | 0 |
| Corki | Parcial / não certificado | P, Q, W, E, R | 15 | 0 |
| DrMundo | Parcial / não certificado | P, Q, W, E, R | 25 | 0 |
| Ekko | Parcial / não certificado | P, Q, W, E, R | 17 | 0 |
| Diana | Parcial / não certificado | P, Q, W, E, R | 16 | 0 |
| Draven | Parcial / não certificado | P, Q, W, E, R | 17 | 0 |
| Elise | Parcial / não certificado | P, Q, W, E, R | 8 | 0 |
| Ezreal | Parcial / não certificado | P | 12 | 0 |
| Evelynn | Parcial / não certificado | P, Q, W, E, R | 22 | 0 |
| Fiddlesticks | Parcial / não certificado | P, Q, W, E, R | 16 | 0 |
| Fiora | Parcial / não certificado | P, Q, W, E, R | 20 | 0 |
| Fizz | Parcial / não certificado | P, Q, W, E, R | 19 | 0 |
| Galio | Parcial / não certificado | P, Q, W, E, R | 23 | 0 |
| Gangplank | Parcial / não certificado | P, Q, W, E, R | 24 | 0 |
| Garen | Parcial / não certificado | P, Q, W, E, R | 25 | 0 |
| Gragas | Parcial / não certificado | P, Q, W, E, R | 18 | 0 |
| Gnar | Parcial / não certificado | P, Q, W, E, R | 20 | 0 |
| Graves | Parcial / não certificado | P, Q, W, E, R | 15 | 0 |
| Gwen | Parcial / não certificado | P, Q, W, E, R | 24 | 0 |
| Heimerdinger | Parcial / não certificado | P, Q, W, E, R | 18 | 0 |
| Hecarim | Parcial / não certificado | P, Q, W, E, R | 22 | 0 |
| Hwei | Parcial / não certificado | P, Q, W, E, R | 27 | 0 |
| Janna | Parcial / não certificado | P, Q, W, E, R | 20 | 0 |
| Jayce | Parcial / não certificado | P, Q, W, E, R | 14 | 0 |
| Irelia | Parcial / não certificado | P, Q, W, E, R | 22 | 0 |
| Ivern | Parcial / não certificado | P, Q, W, E, R | 21 | 0 |
| Illaoi | Parcial / não certificado | P, Q, W, E, R | 16 | 0 |
| JarvanIV | Parcial / não certificado | P, Q, W, E, R | 17 | 0 |
| Jax | Parcial / não certificado | P, Q, W, E, R | 22 | 0 |
| Jhin | Parcial / não certificado | P, Q, W, E, R | 20 | 0 |
| Karma | Parcial / não certificado | P, Q, W, E, R | 21 | 0 |
| Jinx | Parcial / não certificado | P, Q, W, E, R | 21 | 0 |
| Kaisa | Parcial / não certificado | P, Q, W, E, R | 27 | 0 |
| Kalista | Parcial / não certificado | P, Q, W, E, R | 14 | 0 |
| Katarina | Parcial / não certificado | P, Q, W, E, R | 18 | 0 |
| Karthus | Parcial / não certificado | P, Q, W, E, R | 13 | 0 |
| Kassadin | Parcial / não certificado | P, Q, W, E, R | 18 | 0 |
| Kayle | Parcial / não certificado | P, Q, W, E, R | 17 | 0 |
| Kayn | Parcial / não certificado | P, Q, W, E, R | 22 | 0 |
| Khazix | Parcial / não certificado | P, Q, W, E, R | 15 | 0 |
| KogMaw | Parcial / não certificado | P, Q, W, E, R | 20 | 0 |
| Kennen | Parcial / não certificado | P, Q, W, E, R | 19 | 0 |
| Kled | Parcial / não certificado | P, Q, W, E, R | 20 | 0 |
| Kindred | Parcial / não certificado | P, Q, W, E, R | 18 | 0 |
| KSante | Parcial / não certificado | P, Q, W, E, R | 31 | 0 |
| LeeSin | Parcial / não certificado | P, Q, W, E, R | 19 | 0 |
| Leblanc | Parcial / não certificado | P, Q, W, E, R | 21 | 0 |
| Lillia | Parcial / não certificado | P, Q, W, E, R | 17 | 0 |
| Lissandra | Parcial / não certificado | P, Q, W, E, R | 18 | 0 |
| Leona | Parcial / não certificado | P, Q, W, E, R | 16 | 0 |
| Lux | Parcial / não certificado | P, Q, W, E, R | 13 | 0 |
| Locke | Parcial / não certificado | P, Q, W, E, R | 31 | 0 |
| Lucian | Parcial / não certificado | P, Q, W, E, R | 13 | 0 |
| Lulu | Parcial / não certificado | P, Q, W, E, R | 21 | 0 |
| MasterYi | Parcial / não certificado | P, Q, W, E, R | 23 | 0 |
| Malzahar | Parcial / não certificado | P, Q, W, E, R | 17 | 0 |
| Malphite | Parcial / não certificado | P, Q, W, E, R | 19 | 0 |
| Maokai | Parcial / não certificado | P, Q, W, E, R | 21 | 0 |
| Mel | Parcial / não certificado | P, Q, W, E, R | 21 | 0 |
| Milio | Parcial / não certificado | P, Q, W, E, R | 18 | 0 |
| MissFortune | Parcial / não certificado | P, Q, W, E, R | 22 | 0 |
| Mordekaiser | Parcial / não certificado | P, Q, W, E, R | 15 | 0 |
| MonkeyKing | Parcial / não certificado | P, Q, W, E, R | 22 | 0 |
| Naafiri | Parcial / não certificado | P, Q, W, E, R | 23 | 0 |
| Morgana | Parcial / não certificado | P, Q, W, E, R | 17 | 0 |
| Nami | Parcial / não certificado | P, Q, W, E, R | 18 | 0 |
| Nasus | Parcial / não certificado | P, Q, W, E, R | 19 | 0 |
| Nautilus | Parcial / não certificado | P, Q, W, E, R | 14 | 0 |
| Neeko | Parcial / não certificado | P, Q, W, E, R | 20 | 0 |
| Nidalee | Parcial / não certificado | P, Q, W, E, R | 13 | 0 |
| Nilah | Parcial / não certificado | P, Q, W, E, R | 20 | 0 |
| Olaf | Parcial / não certificado | P, Q, W, E, R | 24 | 0 |
| Nocturne | Parcial / não certificado | P, Q, W, E, R | 17 | 0 |
| Nunu | Parcial / não certificado | P, Q, W, E, R | 26 | 0 |
| Orianna | Parcial / não certificado | P, Q, W, E, R | 16 | 0 |
| Ornn | Parcial / não certificado | P, Q, W, E, R | 19 | 0 |
| Poppy | Parcial / não certificado | P, Q, W, E, R | 23 | 0 |
| Pantheon | Parcial / não certificado | P, Q, W, E, R | 28 | 0 |
| Pyke | Parcial / não certificado | P, Q, W, E, R | 16 | 0 |
| Qiyana | Parcial / não certificado | P, Q, W, E, R | 17 | 0 |
| Quinn | Parcial / não certificado | P, Q, W, E, R | 15 | 0 |
| Rammus | Parcial / não certificado | P, Q, W, E, R | 23 | 0 |
| Rakan | Parcial / não certificado | P, Q, W, E, R | 17 | 0 |
| RekSai | Parcial / não certificado | P, Q, W, E, R | 14 | 0 |
| Rell | Parcial / não certificado | P, Q, W, E, R | 18 | 0 |
| Renata | Parcial / não certificado | P, Q, W, E, R | 19 | 0 |
| Riven | Parcial / não certificado | P | 12 | 0 |
| Renekton | Parcial / não certificado | P, Q, W, E, R | 29 | 0 |
| Rengar | Parcial / não certificado | P, Q, W, E, R | 23 | 0 |
| Samira | Parcial / não certificado | P, Q, W, E, R | 12 | 0 |
| Rumble | Parcial / não certificado | P, Q, W, E, R | 28 | 0 |
| Ryze | Parcial / não certificado | P, Q, W, E, R | 17 | 0 |
| Sett | Parcial / não certificado | P, Q, W, E, R | 24 | 0 |
| Shen | Parcial / não certificado | P, W, R | 20 | 0 |
| Senna | Parcial / não certificado | P, Q, W, E, R | 17 | 0 |
| Shaco | Parcial / não certificado | P, Q, W, E, R | 27 | 0 |
| Shyvana | Parcial / não certificado | P, Q, W, E, R | 32 | 0 |
| Seraphine | Parcial / não certificado | P, Q, W, E, R | 18 | 0 |
| Singed | Parcial / não certificado | P, Q, W, E, R | 14 | 0 |
| Sejuani | Parcial / não certificado | P, Q, W, E, R | 16 | 0 |
| Sion | Parcial / não certificado | P, Q, W, E, R | 23 | 0 |
| Sivir | Parcial / não certificado | P, Q, W, E, R | 15 | 0 |
| Swain | Parcial / não certificado | P, Q, W, E, R | 20 | 0 |
| Skarner | Parcial / não certificado | P, Q, W, E, R | 24 | 0 |
| Smolder | Parcial / não certificado | P, Q, W, E, R | 30 | 0 |
| Syndra | Parcial / não certificado | P, Q, W, E, R | 23 | 0 |
| Sona | Parcial / não certificado | P, Q, W, E, R | 26 | 0 |
| Soraka | Parcial / não certificado | P, Q, W, E, R | 18 | 0 |
| Sylas | Parcial / não certificado | P, Q, W, E, R | 16 | 0 |
| TahmKench | Parcial / não certificado | P, Q, W, E, R | 27 | 0 |
| Talon | Parcial / não certificado | P, Q, W, E, R | 16 | 0 |
| Taliyah | Parcial / não certificado | P, Q, W, E, R | 18 | 0 |
| Taric | Parcial / não certificado | P, Q, W, E, R | 16 | 0 |
| Teemo | Parcial / não certificado | P, Q, W, E, R | 19 | 0 |
| Thresh | Parcial / não certificado | P, Q, W, E, R | 17 | 0 |
| Tryndamere | Parcial / não certificado | P, Q, W, E, R | 20 | 0 |
| Trundle | Parcial / não certificado | P, Q, W, E, R | 18 | 0 |
| Tristana | Parcial / não certificado | P, Q, W, E, R | 17 | 0 |
| TwistedFate | Parcial / não certificado | P, Q, W, E, R | 15 | 0 |
| Twitch | Parcial / não certificado | P, Q, W, E, R | 21 | 0 |
| Urgot | Parcial / não certificado | P, Q, W, E, R | 20 | 0 |
| Udyr | Parcial / não certificado | P, Q, W, E, R | 32 | 0 |
| Vayne | Parcial / não certificado | P, Q, W, E, R | 16 | 0 |
| Velkoz | Parcial / não certificado | P, Q, W, E, R | 15 | 0 |
| Veigar | Parcial / não certificado | P, Q, W, E, R | 13 | 0 |
| Varus | Parcial / não certificado | P, Q, W, E, R | 27 | 0 |
| Vex | Parcial / não certificado | P, Q, W, E, R | 15 | 0 |
| Viego | Parcial / não certificado | P, Q, W, E, R | 18 | 0 |
| Vi | Parcial / não certificado | P, Q, W, E, R | 17 | 0 |
| Viktor | Parcial / não certificado | P, Q, W, E, R | 22 | 0 |
| Volibear | Parcial / não certificado | P, Q, W, E, R | 28 | 0 |
| Vladimir | Parcial / não certificado | P, Q, W, E, R | 24 | 0 |
| Xayah | Parcial / não certificado | P, Q, W, E, R | 15 | 0 |
| Warwick | Parcial / não certificado | P, Q, W, E, R | 14 | 0 |
| Xerath | Parcial / não certificado | P, Q, W, E, R | 16 | 0 |
| XinZhao | Parcial / não certificado | P, Q, W, E, R | 20 | 0 |
| Yunara | Parcial / não certificado | P, Q, W, E, R | 24 | 0 |
| Yasuo | Parcial / não certificado | P, W | 16 | 0 |
| Yone | Parcial / não certificado | P, W, E, R | 16 | 0 |
| Yorick | Parcial / não certificado | P, Q, W, E, R | 21 | 0 |
| Zaahen | Parcial / não certificado | P, Q, W, E, R | 17 | 0 |
| Zac | Parcial / não certificado | P, Q, W, E, R | 16 | 0 |
| Yuumi | Parcial / não certificado | P, Q, W, E, R | 29 | 0 |
| Zeri | Parcial / não certificado | P, Q, W, E, R | 22 | 0 |
| Ziggs | Parcial / não certificado | P, Q, W, E, R | 14 | 0 |
| Zed | Parcial / não certificado | P, Q, W, E, R | 17 | 0 |
| Zilean | Parcial / não certificado | P, Q, W, E, R | 13 | 0 |
| Zoe | Parcial / não certificado | P, Q, W, E, R | 13 | 0 |
| Zyra | Parcial / não certificado | P, Q, W, E, R | 23 | 0 |

## Critério para considerar um campeão concluído

Um campeão só deve receber status de **matematicamente validado** quando passiva e Q/W/E/R tiverem fórmula rastreável a fonte da versão correta, ranks e níveis corretos, tipo de dano, escalamentos, condições e estados modelados; e quando testes de referência cobrirem dano, mitigação, recurso, crítico, alvos e interações relevantes. Habilidades utilitárias devem ser catalogadas mesmo quando não causam dano.

## Próxima sequência de implementação

1. Fixar uma única versão de dados para o patch de Summoner's Rift escolhido e rejeitar snapshots incompatíveis de forma explícita.
2. Criar pipeline de importação com origem e revisão por habilidade, sem promover tooltip não resolvido a fórmula.
3. Implementar e testar seis campeões por lote, incluindo passiva, habilidades, estados, custos, combo e DPS.
4. Rodar testes de regressão globais após cada lote e atualizar esta auditoria automaticamente.
5. Só elevar o status de um campeão após validação independente de fórmulas e cenários.

## Fonte técnica

- `scripts/audit-kits.mjs`
- `scripts/audit-kit-coverage.mjs`
- `src/championKit.ts`
- `src/exactKits.ts`
- `src/native.ts`
- `src/officialAdapters.ts`
- `src/championScaling.ts`
- `public/data/mechanics.json`
- `docs/kit-pipeline-audit.json`
- `docs/kit-pipeline-math-audit.json`
