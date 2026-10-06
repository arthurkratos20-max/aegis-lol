# Cobertura de kits — 6 de outubro de 2026

O pedido de considerar integralmente os kits dos 173 campeões **não está concluído**.

Patch do catálogo: 16.19.1. Cobertura: seis kits parciais, 167 sem adapters numéricos nativos disponíveis e zero kits integralmente validados.

| Campeão | Fórmulas disponíveis | Pendentes |
|---|---|---|
| Darius | Q, R | P, W, E |
| Ezreal | Q, E, R | P, W |
| Riven | Q, W, E | P, R |
| Shen | Q, E | P, W, R |
| Yasuo | Q, E | P, W, R |
| Yone | Q | P, W, E, R |

## Implementado

- Cobertura identificada por campeão e compartilhada entre a montagem de builds e os avisos da simulação.
- Na ausência de ações configuradas, os seis kits disponíveis são comparados por impactos isolados das fórmulas do snapshot: um impacto por habilidade suportada/evoluída, custo de recurso e mitigação do alvo. Um ataque físico é somado quando habilitado e em alcance. Não representa DPS, repetição automática, ordem temporal validada ou combo completo.
- Duplicação das variantes do Q de Shen evitada; bônus não considerado quando os ataques estão desativados ou fora de alcance. Escudos são mantidos separados do dano e não adicionados arbitrariamente ao EHP.
- Ações manuais permanecem autoritativas. O simulador continua executando apenas essas ações e os ataques habilitados; não inventa habilidades/passivas ausentes.
- DPS/TTK existentes não recebem dano fictício da estimativa. A comparação por potencial mágico continua estimada quando não há adapters nem ações configuradas.
- O caminho de reserva do carregamento agora anexa mecânicas compatíveis com o patch. Snapshots de outro patch ou com estrutura de atributos inválida são rejeitados; flags inferidas são recalculadas após carregar fórmulas.
- Cobertura parcial/ausente aparece na interface e nas advertências.

## Validação

179 testes passaram; TypeScript e compilação passaram. A varredura adicional cobriu 173 campeões × 18 níveis × três pesos (0/50/100), totalizando 9.342 builds e páginas de runas em adversário desconhecido, sem erros de legalidade ou métricas não finitas detectados. Não é validação de fidelidade integral ao jogo, de todas as habilidades ou de todos os matchups.

Para reproduzir o inventário de cobertura:

    node --experimental-strip-types scripts/audit-kit-coverage.mjs

## Bloqueio para concluir

O acesso aos arquivos atuais do CommunityDragon retornou HTTP 403. O espelho alternativo acessível expõe dados do patch 14.10.1 e apenas 167 campeões; esses coeficientes não foram incorporados ao catálogo 16.19.1. A base de fórmulas atuais por campeão precisa ser obtida antes de implementar e validar os adapters restantes.

Ainda faltam os adapters de passivas, múltiplos impactos/DoT, recasts, cargas, formas, pets, conversões de atributos, cura/escudos, CC, efeitos de itens/runas e interações específicas não modeladas. O índice de kit parcial não corrige sozinho os objetivos avançados ou o peso de Utilidade que a auditoria anterior identificou como desconectados da montagem ao vivo.
