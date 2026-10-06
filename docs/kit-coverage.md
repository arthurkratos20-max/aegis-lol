# Cobertura de kits — 6 de outubro de 2026

O processamento dos 173 campeões agora conta com um fallback de classe. A cobertura exata e integral dos kits **não está concluída**. Veja `attribute-preferences.md` para a versão híbrida atual.

Patch do catálogo: 16.19.1. Cobertura: seis kits parciais, 167 sem adapters numéricos nativos disponíveis e zero kits integralmente validados.

| Campeão | Fórmulas disponíveis | Pendentes |
|---|---|---|
| Darius | Q, R | P, W, E |
| Ezreal | Q, W (detonação manual), E, R | P |
| Riven | Q, W, E, R (mínimo manual) | P |
| Shen | Q, E | P, W, R |
| Yasuo | Q, E, R (alvo no ar manual) | P, W |
| Yone | Q | P, W, E, R |

## Implementado

- Cobertura identificada por campeão e compartilhada entre a montagem de builds e os avisos da simulação.
- Na ausência de ações configuradas, os seis kits disponíveis são comparados por impactos isolados das fórmulas do snapshot: um impacto por habilidade suportada/evoluída, custo de recurso e mitigação do alvo. Um ataque físico é somado quando habilitado e em alcance. Não representa DPS, repetição automática, ordem temporal validada ou combo completo.
- Duplicação das variantes do Q de Shen evitada; bônus não considerado quando os ataques estão desativados ou fora de alcance. Escudos são mantidos separados do dano e não adicionados arbitrariamente ao EHP.
- Ações manuais permanecem autoritativas. O simulador continua executando apenas essas ações e os ataques habilitados; não inventa habilidades/passivas ausentes.
- DPS/TTK existentes não recebem dano fictício da estimativa. A comparação por potencial mágico continua estimada quando não há adapters nem ações configuradas.
- O caminho de reserva do carregamento agora anexa mecânicas compatíveis com o patch. Snapshots de outro patch ou com estrutura de atributos inválida são rejeitados; flags inferidas são recalculadas após carregar fórmulas.
- Cobertura parcial/ausente aparece na interface e nas advertências.

- W de Ezreal, R de Yasuo e dano mínimo do R de Riven disponíveis como impactos manuais condicionais. Não entram no índice automático; seus requisitos e interações pendentes aparecem junto à ação. Fórmulas verificadas contra valores base e coeficientes AD/AP do snapshot.

## Validação

180 testes passaram; TypeScript e compilação passaram. A varredura adicional cobriu 173 campeões × 18 níveis × três pesos (0/50/100), totalizando 9.342 builds e páginas de runas em adversário desconhecido, sem erros de legalidade ou métricas não finitas detectados. Não é validação de fidelidade integral ao jogo, de todas as habilidades ou de todos os matchups.

Para reproduzir o inventário de cobertura:

    node --experimental-strip-types scripts/audit-kit-coverage.mjs

## Bloqueio para concluir

O acesso aos arquivos atuais do CommunityDragon retornou HTTP 403. O espelho alternativo acessível expõe dados do patch 14.10.1 e apenas 167 campeões; esses coeficientes não foram incorporados ao catálogo 16.19.1. Uma consulta adicional ao CDN original de Meraki encontrou 171 campeões, com últimas alterações até 25.15; não confirma compatibilidade com 16.19 e não foi incorporada. A base de fórmulas atuais por campeão precisa ser obtida antes de implementar e validar os adapters restantes.

Ainda faltam os adapters de passivas, múltiplos impactos/DoT, recasts, cargas, formas, pets, conversões de atributos, cura/escudos, CC, efeitos de itens/runas e interações específicas não modeladas. Os pesos de Utilidade e os objetivos de Dano/Defesa foram conectados à montagem ao vivo na implementação híbrida descrita em `attribute-preferences.md`.
