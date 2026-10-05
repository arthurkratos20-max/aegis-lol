# Modelo exploratório

Crescimento comum: g(L)=0.7025(L−1)+0.0175(L−1)². Exceções de campeões não são consideradas universais.
Mitigação: r≥0 → 100/(100+r); r<0 → 2−100/(100−r).
Penetração: resistência positiva → max(0,r×(1−penPercent)−penFlat); negativa permanece igual. Reduções de resistência por efeitos não implementadas.
Cooldown: CD×100/(100+max(0,haste)). Crítico usa valor esperado. AS usa base e ratio quando disponível; cap comum 2.5, sem exceções.

Eventos são ordenados por tempo e ordem de inserção, com jogador antes do adversário em empate. Shield expira no instante final exclusivo. Cura é limitada à vida faltante; escudo útil representa dano absorvido. DPS é dano efetivamente removido do HP dividido pela janela inteira. Overkill e dano absorvido ficam separados.

## Orçamento

purchasePlan retorna compra bruta, venda, líquido, saldo e valor total. Cada componente possuído é consumido uma única vez pela árvore de receita. Sem venda autorizada, sobras possuídas tornam a build ilegal. Trava explícita exige o ID exato. Na UI marcar um item como possuído também o trava; desbloquear autoriza upgrade, mantendo preservação econômica do componente. Venda depende de autorização adicional. Botas ocupam slot.

## Score

Referências fixas: campeão sem itens, mesmo nível/runas/overrides. Ofensiva é dano da janela, dano nos primeiros 3s ou maior dano de ação, dividido por max(1,AD_base×AS_base×janela). Defesa combo = HP final/HP referência; sustain = (HP final+cura útil+absorção)/HP referência; survive = morte/janela ou 1+HP final/HP referência se sobreviveu. Utilidade = (movimento/movimento referência+haste/100)/2.

Pesos normalizados somam 100%; referências não dependem dos candidatos. Sustain é uma métrica de recuperação/absorção, não apenas tempo vivo. Busca Free preserva runas e skills. Beam não prova ótimo; enumeração exata prova somente melhor no conjunto de candidatos legal quando termina sem limites. Comparação com enumeração independente valida exploração combinatória, não fidelidade ao jogo.
