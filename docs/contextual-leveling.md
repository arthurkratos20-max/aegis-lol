# Ordens contextuais, times e adaptação de itens

A abertura (níveis 1–3), a prioridade de maximização e o caminho completo por nível são decisões diferentes. O guia passa a apresentar os três e a identificar a origem de cada recomendação.

## Dados e cobertura

- Snapshot numérico de MetaBot.gg para os 173 campeões do catálogo 16.19.1; 536 registros de rota, 504 caminhos completos extraídos e 273 prioridades alternativas com pelo menos 100 partidas.
- Todos os caminhos extraídos passam pelas regras de rank/nível antes de serem usados. Um caminho só recebe o indicador de referência de partidas quando é legal, do mesmo patch e da rota atual, com pelo menos 100 partidas na prioridade principal.
- Rotas sem amostra suficiente usam a referência da rota mais amostrada, identificada como estimativa. Prioridades alternativas observadas recebem caminhos legalmente gerados e não são apresentadas como sequências observadas por nível.
- Aphelios evolui atributos, não Q/W/E/R: mostra a prioridade AD/AS/Letalidade da fonte sem converter os pontos em ranks de habilidades. A matriz convencional permanece desativada.
- Jayce não recebe pontos manuais em R. Elise/Nidalee/Karma têm R automático inicial e pontos posteriores nos níveis 6/11/16. Zilean usa regras convencionais. Udyr não tem ultimate convencional e só recebe sexto rank a partir do nível 16; seu template R/W/E/Q é explicitamente estimado, sem atribuir essa variante aos dados de prioridade que omitem R.

## Contexto e controle manual

- Darius Top separa abertura de lane de emboscada com E. Abertura Q/E/W é uma sugestão de alcance contra inimigos ranged; Q/E/W continua a prioridade de maximização. Começar com E não significa maximizar E.
- Sett Top apresenta alternativa W/Q/E em contexto ranged, com descrição da exigência de Ousadia/centro do W e sem vantagem estatística alegada.
- Urgot Top tem variante editorial com segundo Q no nível 4 e cinco pontos de W no nível 9. Referência: GoliathGames, https://www.mobafire.com/league-of-legends/build/goliathgames-ultimate-guide-to-urgot-tips-on-every-matchup-8m-mastery-554383.
- Onde não existe variante sustentada, o guia mantém a referência da rota e informa que não há sequência validada para aquele adversário. O catálogo cobre todos; não existe estatística de skills por matchup integrada para cada um dos 29.929 pares.
- Edições e alternativas selecionadas pelo usuário entram em modo manual. Trocar inimigo/rota preserva esses pontos. “Automático” reativa o cálculo contextual. Presets legados com sequência personalizada são migrados para modo manual; presets genéricos podem acompanhar a recomendação.
- O caminho automático é resolvido antes da montagem da build e sincronizado ao estado exibido, incluindo importações e presets. Os coeficientes de dano continuam com sua cobertura anterior; uma ordem observada não transforma uma fórmula estimada em exata.

## Build e imagens

- Bota automática e core deixam de ser imutáveis. A bota é comparada no pool de botas T2 compráveis, e o core no conjunto de afinidade elegível. Ambos usam o mesmo objetivo ponderado de ofensiva/EHP/utilidade; os slots restantes continuam com busca gulosa.
- Botas de evolução condicional ficam fora da seleção automática inicial. Botas fixas e itens possuídos/travados continuam autorizados e preservados. Mago sem perfil de ataques contínuos não recebe Grevas automaticamente.
- Resistências, atributos do adversário, bônus contextual limitado e sliders influenciam a pontuação. Uma troca de matchup não precisa trocar todos os itens: o vencedor pode continuar sendo o mesmo. Não é busca combinatória global, nem cálculo integral de todas as passivas.
- Cada decisão livre, incluindo bota/core, fornece candidatos e decomposição matemática ao guia.
- Splash retangular local à esquerda e nome à direita nos times e nas recomendações de sinergia. Os retratos de matchups difíceis/favoráveis continuam circulares. O bloco de sinergias não herda mais o layout global de uma classe homônima.

## Validação

- `npm test`: suíte de regressão, incluindo 101 valores do slider, adaptação física/mágica, travas, exclusão de botas condicionais, todos os campeões/rotas e variantes legais.
- `node --experimental-strip-types scripts/audit-skill-paths.mjs`: 150.510 contextos (173 × 174 × 5), incluindo “Não sei ainda”; 870 são a exceção de evolução de atributos do Aphelios.
- `node --experimental-strip-types scripts/audit-attribute-preferences.mjs`: 451.530 cenários de slider/matchup/rota e 865 casos adicionais de utilidade pura, com reconstrução independente de mitigação e score.
- `npm run typecheck` e `npm run build`.

Os resultados finais desta execução são registrados nos relatórios JSON desta pasta antes do envio à main.

As escolhas explícitas “Anti-cura” e “Anti-shield” mantêm uma resposta compatível na seleção do core quando há espaço livre; esse requisito é separado dos atributos/passivas efetivamente modelados. As travas de inventário têm precedência.

Resultado final: 211 testes aprovados; TypeScript/build aprovados; 452.395 cenários de builds sem erros de execução ou matemática; 150.510 contextos de caminhos sem erros, incluindo a exceção de atributos do Aphelios. A validação confirma legalidade e aritmética do modelo declarado, não optimalidade global ou vantagem estatística de cada matchup.
