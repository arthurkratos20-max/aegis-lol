# Auditoria do piloto CommunityDragon — patch 16.23

Escopo: somente Summoner's Rift (LoL base). Snapshot de seis campeões sincronizado de CommunityDragon 16.23 para catálogo Data Dragon 16.23.1.

## O que o snapshot contém

| Campeão | Objetos extraídos | Cálculos com nome |
|---|---:|---:|
| Shen | Q, W, E, R, passiva | 4 + 0 + 2 + 2 + 7 |
| Ezreal | Q, W, E, R, passiva | 1 + 1 + 1 + 2 + 0 |
| Yasuo | Q, W, E, R, passiva | 2 + 0 + 2 + 1 + 3 |
| Yone | Q, W, E, R, passiva | 2 + 5 + 1 + 2 + 1 |
| Riven | Q, W, E, R, passiva | 1 + 1 + 1 + 3 + 1 |
| Darius | Q, W, E, R, passiva | 2 + 1 + 0 + 2 + 2 |

Os arrays de cooldown, custo, valores nomeados e árvores de cálculo são preservados. A extração não significa que cada objeto seja executável como uma habilidade completa.

## Avaliador genérico

`mechanicsCalculation` resolve uma fórmula nomeada no snapshot do Dataset e delega ao interpretador nativo. A API valida presença de campeão, habilidade, fórmula, rank e nível. A avaliação não confere selo de fórmula exata e não modela condições de combate que não estejam no contexto.

## Bloqueios encontrados na auditoria estática

1. **Yone W / WShield:** a árvore usa o DataValue `ShieldBADRatio`, mas o snapshot contém `ShieldbADRatio`. A referência não é resolvida e o avaliador deve falhar explicitamente. Não foi aplicada correção por suposição.
2. **Shen passiva / ShieldValue:** é um `GameCalculationConditional` dependente do buff `{7dfdcd99}`. O interpretador agora recebe buffs explícitos via `NativeCalculationContext`; o motor também mantém buffs concedidos por ações até a expiração. Porém, a declaração e o vínculo semântico desse ID continuam sem confirmação no snapshot, então a ativação real da passiva de Shen ainda não é automática.
3. **Shen passiva:** há nós de tipo `{f3cbe7b2}` que referenciam outras chaves de cálculo. Ainda não há interpretador para esse nó.
4. Habilidades utilitárias sem árvores de dano (por exemplo Shen W e Yasuo W) permanecem presentes no snapshot; não devem ser convertidas artificialmente em dano.

## Ajuste de regressão após a auditoria

- A suíte identificou uma expectativa antiga incorreta para Ezreal W: o snapshot 16.23 registra `mCoefficient = 1.15` para DdA adicional, não `1.0`. O teste independente foi alinhado ao coeficiente presente na fórmula extraída; o cálculo do jogo não foi alterado.

## Próximos passos

- Auditar as declarações e os eventos reais que concedem/consomem cada buff antes de ligar IDs a habilidades de campeões.
- Resolver e confirmar a inconsistência de nomenclatura Yone W com fonte oficial independente antes de normalizar o alias.
- Criar ações nativas por habilidade com condições explícitas, incluindo custos, recargas, stacks, recasts, escudos, passivas e impactos múltiplos.
- Testar as ações dentro de `simulate`, não apenas a aritmética isolada.
- Manter `coverage: testing` até validação por habilidade e cenário.

**Status:** piloto de extração validado; cobertura de kits permanece parcial/experimental. Nenhum campeão deste piloto está certificado como kit completo.

## Ciclo temporal genérico de buffs — experimental

`Action.buffGrants` permite conceder um ID de buff após uma ação válida, com duração em segundos. `simulate` mantém o estado separado por lado, disponibiliza os IDs ativos às fórmulas nativas condicionais e remove o buff quando o relógio alcança sua expiração. Uma nova concessão do mesmo ID atualiza sua expiração. O editor permite configurar esses grants manualmente; o campo de buffs ativos de uma ação continua sendo um override pontual.

O teste de integração sintético verifica o ramo fortalecido durante a janela de duração e o retorno ao ramo padrão no instante da expiração. Isso valida o mecanismo genérico, não a fidelidade da ativação de buffs de campeões reais. Ainda não há automação de consumo, stacks ou concessão automática por eventos reais de habilidades.

## Índice de requisitos de buff — inventário sem inferências

O sincronizador agora produz `buffReferences` por campeão usando `scripts/mechanics-buff-index.mjs`. O índice separa três evidências:

- `requirementPaths`: locais onde uma fórmula exige explicitamente um buff via `HasBuffCastRequirement`;
- `referencePaths`: outros campos que referenciam o mesmo identificador;
- `declarationPaths`: objetos do tipo buff que declaram esse identificador.

Os estados são deliberadamente conservadores: `unresolved` quando não há declaração independente e `declaration-found-needs-semantic-audit` quando uma declaração foi encontrada. O segundo estado **não** significa que a condição esteja semanticamente compreendida ou que o buff possa ser ativado automaticamente.

A indexação ignora campos internos da própria declaração ao contar referências externas, evitando confundir `mScriptName`/nomes de declaração com referências de uso. Testes sintéticos cobrem tanto a separação entre requisito, referência e declaração quanto o caso sem declaração.

Nenhum ID é inferido a partir do nome do campeão ou de semelhança textual. O índice serve para orientar investigação. O motor agora suporta o ciclo temporal genérico de buffs concedidos por uma ação (ativação e expiração); consumo, acúmulos, substituição/renovação e vínculos automáticos com habilidades reais ainda exigem regras semânticas por campeão.
