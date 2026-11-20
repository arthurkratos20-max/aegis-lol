# Lote 02 — kits completos

## Campeões selecionados

1. Gragas
2. Graves
3. Gwen
4. Hecarim
5. Heimerdinger
6. Illaoi

A seleção segue a ordem alfabética após o primeiro lote (Shen, Jinx, Ashe, Vayne, Lux e Garen), para tornar o progresso auditável e evitar priorização arbitrária.

## Estado

- **Não implementado nem certificado ainda.**
- O snapshot de mecânicas disponível no repositório é antigo e não deve ser usado como se fosse 16.23.1.
- CommunityDragon é uma fonte técnica útil para os dados BIN, mas cada arquivo precisa ser obtido da versão correspondente e confrontado com as notas de patch Riot.
- A listagem pública de CommunityDragon expõe arquivos por campeão, mas o acesso direto ao JSON versionado 16.23 não foi validado nesta execução.
- Nenhum dos seis pode ser marcado como completo até que passiva, Q, W, E, R, condições, múltiplos impactos, tipos de dano, limites e interações estejam representados e testados.

## Critério de aceite por campeão

- Snapshot de mecânicas com versão e URL de origem explícitas.
- Passiva modelada com gatilhos, stacks, duração e cooldown relevantes.
- Q/W/E/R modelados com fórmulas por rank, tipo de dano, alvos, recasts e impactos.
- Separação de impacto isolado, sequência/combinação e efeitos condicionais.
- Testes de rank mínimo/máximo, nível, atributos, condições válidas/inválidas e ausência de dados.
- Auditoria do lote sem dados de versões incompatíveis.
- CI verde (testes, TypeScript, build e auditoria dos 173 campeões).

Não substituir dados ausentes por estimativas silenciosas. Quando uma mecânica não puder ser comprovada, manter o efeito fora do runtime e registrar a lacuna.
