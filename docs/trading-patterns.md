# Matriz de padrões de troca

`src/tradingPatterns.ts` complementa a afinidade base por kit em `runeAffinity.ts` e os scores heurísticos de `runeOptimizer.ts`. Não calcula DPS de runas nem taxa de vitória. Não altera a legalidade do editor manual.

## Seleção

1. Filtra pelo snapshot atual e pelos requisitos já existentes da runa.
2. Na recomendação contextual, restringe keystones a sinergias revisadas: ataques imediatos para Chuva de Lâminas, ataques contínuos para Ritmo Fatal, kit contínuo para Conquistador e imobilização/afinidade defensiva para Pós-Choque. Travas explícitas preservam escolhas manuais.
3. A afinidade base continua pontuada pelos pesos de dano, defesa e utilidade; a matriz acrescenta prioridades editoriais na mesma escala. Os valores são pesos de decisão, não coeficientes do jogo.
4. Pressão de poke revisada tem precedência; depois janela curta de burst/iniciação, depois troca prolongada contra tanque/lutador. Sem traço revisado, mantém perfil neutro. Alcance sozinho não determina poke.
5. Compara a keystone contextual com a recomendação sem inimigo, usando as mesmas configurações/travas, e explica a mudança no cartão e no Manual.

O perfil prolongado pressupõe acesso contínuo ao alvo; não garante stacks. Aperto é preparado entre trocas e não é modelado como Conquistador/Ritmo Fatal. Cometa e Aery são opções de pressão/utilidade, não de mobilidade. Pós-Choque requer imobilização; Chuva de Lâminas não protege de burst.

## Exemplos de regressão

- Kai'Sa: Chuva de Lâminas contra Zed, Ritmo Fatal contra Garen.
- Jinx: Agilidade nos Pés contra Caitlyn; Ritmo Fatal contra Zed. Chuva de Lâminas não é uma alternativa automática revisada para seu kit.
- Cassiopeia: Conquistador contra Garen.
- Shen: Pós-Choque contra Zed, Aperto contra Garen.
- Renekton: Chuva de Lâminas contra Zed, Conquistador contra Garen.

Esses exemplos validam o comportamento do produto, não comprovam que as páginas são estatisticamente ótimas. A matriz é aplicada a todos os campeões nas cinco rotas, com fallback conservador para sinergias não revisadas. Poke e kits têm metadados curados: novos campeões ou alterações de kit exigem revisão. Não há simulação de distância, chance de acertar CC, recarga do inimigo ou tempo real de ataques neste ranking. As runas são selecionadas somente entre IDs presentes no patch carregado.

## Verificação

`tests/tradingPatterns.test.ts` cobre migração de keystone nas cinco classes, restrições de artilharia, adversário desconhecido, travas, explicação e os 173 campeões nas cinco rotas contra quatro perfis. Os testes de matchup continuam verificando a página completa e a sequência legal de habilidades. Executar `npm test`, `npm run build` e `npm run typecheck` antes de publicar.
