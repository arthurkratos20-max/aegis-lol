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
2. **Shen passiva / ShieldValue:** é um `GameCalculationConditional` dependente do buff `{7dfdcd99}`. A avaliação requer estado de buff/condição que a API escalar atual não recebe.
3. **Shen passiva:** há nós de tipo `{f3cbe7b2}` que referenciam outras chaves de cálculo. Ainda não há interpretador para esse nó.
4. Habilidades utilitárias sem árvores de dano (por exemplo Shen W e Yasuo W) permanecem presentes no snapshot; não devem ser convertidas artificialmente em dano.

## Ajuste de regressão após a auditoria

- A suíte identificou uma expectativa antiga incorreta para Ezreal W: o snapshot 16.23 registra `mCoefficient = 1.15` para DdA adicional, não `1.0`. O teste independente foi alinhado ao coeficiente presente na fórmula extraída; o cálculo do jogo não foi alterado.

## Próximos passos

- Adicionar contexto de estado/condições ao motor antes de interpretar cálculos condicionais.
- Resolver e confirmar a inconsistência de nomenclatura Yone W com fonte oficial independente antes de normalizar o alias.
- Criar ações nativas por habilidade com condições explícitas, incluindo custos, recargas, stacks, recasts, escudos, passivas e impactos múltiplos.
- Testar as ações dentro de `simulate`, não apenas a aritmética isolada.
- Manter `coverage: testing` até validação por habilidade e cenário.

**Status:** piloto de extração validado; cobertura de kits permanece parcial/experimental. Nenhum campeão deste piloto está certificado como kit completo.
