# Guia contextual

O guia básico é público: runas com foco por mouse/teclado/toque, caminho de habilidades configurado, explicação dos itens e listas de complementaridade e pressão de matchup. Dicas avançadas, alternativas com menor score e razões detalhadas de matchup reutilizam `GateKeepPro`, que consulta `useAuth().isPro`. Não há bypass por prop, nova consulta ao Supabase ou alteração de entitlement. O gate existente é visual; não é uma API nova de conteúdo privado.

`championKitCoverage.isExactFormula` continua falso em todo o elenco atual. Fórmulas parciais não autorizam o badge “Guia Refinado & Validado”. Textos derivados do catálogo são identificados como estimativas; não há estatística de partidas integrada.

O montador preserva os scores de cada rodada em `decisions`. A UI usa esses valores, inclusive normalização e contra-bônus, para explicar o vencedor e alternativas do mesmo slot. Não muda pesos, elegibilidade, regras de core ou target. Scores de slots diferentes não são diretamente comparáveis. Waveclear real, acúmulos futuros e timing do primeiro item não receberam uma fórmula nova; o guia não inventa penalidade numérica para esses efeitos.

Matchups são um índice de pressão por características (alcance básico, CC, tanque, burst), não taxas de vitória ou um ranking de meta. O catálogo completo é exibido sem filtro de popularidade por rota. Casos sem evidência de vantagem ficam sem lista favorável. Sinergias distinguem possibilidade de complementaridade de um combo comprovado; fontes de cura/escudo podem ser próprias.

Validação: 197 testes, incluindo cobertura de todo o elenco e recomposição das decisões para 173 campeões × 5 rotas (865 cenários); TypeScript e build de produção. Essa bateria não reexecuta a auditoria histórica de 451.530 matchups, pois o score não foi alterado.
