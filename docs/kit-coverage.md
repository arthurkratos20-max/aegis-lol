# Auditoria de cobertura de kits — LoL base

**Catálogo:** Data Dragon 16.23.1 (patch 26.23), 173 campeões, locales pt_BR/en_US.  
**Modo:** Summoner's Rift moderno. Não utilizar dados do League of Legends Classic.

## Interpretação da cobertura

A cobertura é dividida em três camadas diferentes:

1. **Catálogo:** o campeão e suas habilidades estão disponíveis no seletor.
2. **Impactos isolados:** existem opções/adaptadores para um ou mais impactos, com patch e fonte declarados.
3. **Kit completo validado:** passiva e Q/W/E/R, incluindo estados, gatilhos, condições, múltiplos impactos e interações relevantes, têm implementação e fixtures independentes.

A camada 2 não implica a camada 3. Um impacto isolado não é um combo, não representa DPS contínuo e não deve ser apresentado como build matematicamente exata.

## Adaptadores ativos

O registro `src/officialAdapters.ts` contém adaptadores isolados vinculados a 16.23.1. O lote 02 adiciona Gragas, Graves, Gwen, Hecarim, Heimerdinger e Illaoi, além dos adaptadores anteriores de Bardo, Ezreal e Master Yi. Alguns impactos são apenas variantes manuais; os efeitos espaciais e sequenciais permanecem incompletos.

O relatório gerado por `npm run audit:coverage` é a fonte de contagem dos campeões e impactos no commit executado. Não reutilizar relatórios antigos de 16.19.1 como se fossem a auditoria do catálogo 16.23.1.

## Lote 02

O inventário detalhado, com efeitos implementados e lacunas por campeão, está em [kit-batch-02.md](./kit-batch-02.md). Os seis kits permanecem parciais. A suíte testa fórmulas e estados selecionados e também verifica que cada opção nativa do lote resolve para adaptador 16.23.1; esse teste não certifica a simulação integral do kit.

## Fontes e quarentena

- Adaptadores com `sourceType: 'riot'` devem apontar para notas oficiais Riot que comprovem o ajuste de balanceamento.
- Adaptadores baseados na Wiki devem manter URL, patch de escopo e limitações explícitas; não os descrever como transcrição oficial da Riot.
- O inventário Meraki antigo é material de revisão, não runtime. Os candidatos permanecem `unreviewed` e `runtimeEnabled: false` enquanto não houver validação por patch e fixture.
- Snapshots antigos, incluindo `public/data/mechanics.json` 16.19.1, não podem ser usados para certificar automaticamente o catálogo 16.23.1.

## Critério de conclusão global

Nenhum campeão deve ser marcado como completo até que a passiva e todas as habilidades relevantes estejam implementadas com condições e estados, e cobertas por testes de ranks, níveis, atributos, alvos, duração, ausência de dados e interações. Após ampliar a cobertura, revalidar combos, DPS, EHP, TTK e o otimizador antes de liberar qualquer modo estrito.

Para reproduzir a auditoria: `npm run audit:coverage`.