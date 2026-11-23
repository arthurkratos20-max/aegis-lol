# Lote 01 — integração de kits com runas e itens

Data: 2026-11-23  
Escopo: Summoner's Rift, League of Legends base.  
Catálogo de testes disponível no branch: Data Dragon 16.19.1.

## Campeões trabalhados

Aatrox, Ahri, Akali, Alistar, Amumu e Annie.

## Implementado neste lote

- Novo contrato de perfil estratégico em `src/kitBuildProfiles.ts`.
- Os seis campeões agora possuem prioridades explícitas de escalonamento e durabilidade, padrão de combate, recurso, itens centrais candidatos, orientação de runas e ressalvas mecânicas.
- `src/runeAffinity.ts` consome os perfis para que o otimizador de runas parta da identidade do kit: Aatrox (troca prolongada), Ahri (burst), Akali (burst híbrido), Alistar (engage), Amumu (tanque) e Annie (burst).
- `src/recommendation.ts` inclui os itens centrais de cada perfil no conjunto de candidatos da recomendação rápida. O otimizador contínuo também recebe esses itens por meio da recomendação-base e ainda os avalia pelas métricas da build, orçamento, cenário e travas.
- `src/championScaling.ts` usa os sinais explícitos dos perfis para corrigir escalonamentos que as tags de classe não representam bem — em especial Akali (AD + AP) e Alistar/Amumu (AP).
- Testes de integração em `tests/kitBuildProfiles.test.ts` verificam os seis perfis, afinidades de runas, entrada dos itens no recomendador e propagação dos escalonamentos.

## Limites importantes — não marcar como kits completos

Este lote é a primeira camada de integração estratégica. **Não adiciona ainda fórmulas completas de dano, passivas ou rotações para os seis campeões.** Os perfis não devem ser tratados como certificação matemática, nem como prova de que cada item listado é sempre o melhor item em qualquer matchup.

Pontos específicos:
- Aatrox: Q por zonas de acerto, passiva por vida máxima do alvo, W e amplificação de cura do R ainda precisam de estados e fórmulas próprios.
- Ahri: Q causa dano mágico na ida e verdadeiro na volta; W/E/R exigem modelagem de múltiplos projéteis, marca e recasts.
- Akali: Q/E/R têm múltiplos impactos, energia e ataques passivos condicionais; o perfil híbrido não substitui esses cálculos.
- Alistar: Q/W/E têm dano mágico e controle; E é periódico e habilita ataque fortalecido; P cura aliados; R reduz dano recebido.
- Amumu: W aplica dano periódico por vida máxima do alvo; Q possui cargas; E reduz dano; R aplica controle em área.
- Annie: P controla stacks e atordoamento; E tem escudo e dano reativo; R exige pet com vida, ataques, aura e duração. A mudança de Tibbers do patch 26.23 não deve ser ativada enquanto o catálogo local não for atualizado para 16.23.1.

## Próximos critérios para fechar o lote

1. Sincronizar o catálogo Data Dragon e os snapshots de mecânicas para a mesma versão do patch.
2. Implementar passiva e Q/W/E/R com fontes por habilidade e condições explicitadas.
3. Validar dano base, coeficientes, mitigação, recursos, cooldowns, recasts, ticks, pets e alvos.
4. Testar como cada item e runa altera o resultado medido, e não apenas a afinidade estratégica.
5. Só então elevar o status do campeão de parcial para validado.

## Correção global encontrada durante o lote

A base de crítico de Summoner's Rift foi atualizada para 200%; Gume do Infinito fornece +30 pontos percentuais no patch 26.23, resultando em 230% antes de modificadores específicos. A implementação e o teste de regressão foram atualizados em `src/model.ts` e `tests/exactKits.test.ts`.

Fonte: https://wiki.leagueoflegends.com/en-us/Infinity_Edge
