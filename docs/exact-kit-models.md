# Modelos de efeitos · patch 16.20.1

Primeira leva: Shen (4), Jinx (6), Ashe (3), Vayne (4), Lux (4), Garen (5), Malphite (5), Darius (5): 36 efeitos isolados.

O badge valida somente a matemática isolada do efeito e as condições descritas no card. Kit completo, atributos globais, recomendações e sequência de combate permanecem estimativas algorítmicas.

## Fonte e reprodução

Snapshots fixados no cliente 16.20 via CommunityDragon. `scripts/normalize-exact-kits.mjs <diretório>` normaliza os oito arquivos BIN JSON em `src/exactSnapshot.ts`. Não mistura a cobertura legada 16.19 com a nova fonte.

## Integração

Marcas de Lux, terceiro impacto de Vayne, cargas de Shen, Foco de Ashe, acúmulos de minigun e Hemorragia/Noxian Might, resets confirmados, executores com vida corrente, redução do E de Garen, Coragem e escudos isolados. Recargas distinguem aceleração básica e de ultimate. Cutelo Negro aplica redução após impactos físicos confirmados. Reduções antecedem penetrações. Ações customizadas preservam suas fórmulas; editar parâmetros matemáticos remove a associação ao efeito validado.

## Limites explícitos

Não simula geometria, regeneração, periodicidade do sangramento, todas as passivas de itens/runas, todas as velocidades de ataque de habilidades, reset de ultimate ou o kit inteiro. Escudos de Lux/Shen são efeitos isolados, com a condição descrita; não equivalem ao fluxo completo da habilidade. Slots e runas travados, matriz de trocas e otimizadores existentes são preservados.

## Validação

Seis camadas: fórmulas isoladas, condições do kit, recargas/execução, mitigação, combate integrado e regressão. Fixtures de dano independentes com resultados calculados manualmente. Cobertura de criação/valores finitos para 8 campeões × 5 rotas × 18 níveis = 720 casos. A suíte também verifica que o badge global nunca seja promovido, estados não vazem entre simulações e ataques explícitos não dupliquem ataques automáticos.
