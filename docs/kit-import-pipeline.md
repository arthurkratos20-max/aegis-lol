# Pipeline de kits

`npm run sync:kits` tenta obter o dataset Meraki configurado. `npm run sync:kits -- /caminho/snapshot.json` aceita um snapshot local; uma URL HTTPS pode ser passada no mesmo argumento. Uma falha HTTP, payload inválido ou patch ausente/divergente encerra o comando sem substituir o catálogo nem o último staging válido.

O envelope precisa conter `version` exatamente igual à versão do catálogo e `champions` (ou `data`). Não se deve acrescentar uma versão presumida a um dump `latest` sem comprovação da origem/patch. No esquema Meraki, habilidades são agrupadas em `abilities.P/Q/W/E/R`, com variantes, efeitos e entradas `leveling`. O parser aceita apenas modificadores numéricos estruturados e unidades reconhecidas. Texto de fórmulas nunca é executado. Estruturas CommunityDragon sem esse esquema precisam de um adaptador e prova de versão; não são tratadas como Meraki nem certificadas por inferência.

Termos suportados: valor base, AD total, AD adicional, AP, Vida máxima própria, Armadura, Resistência Mágica e Aceleração. Unidades percentuais são divididas por 100 exatamente uma vez. Termos, condições ou tipos desconhecidos ficam em quarentena. Escudo e cura não se somam ao DPS de dano. E da Lulu mantém impactos de dano em inimigo e escudo em aliado separados. Outros gatilhos, stacks, marcas e recasts permanecem pendentes quando não representados.

O staging fica em `public/data/kit-import.json`. Importação nunca ativa `reviewed` nem `isExactFormula`. Até modelar e testar todas as condições de P/Q/W/E/R, a badge é **Estimativa Algorítmica de Kit**. **Modelo Matemático Auditado** depende da cobertura completa do kit, que atualmente não existe; os seis adaptadores nativos também são parciais.

`npm run audit:kits` escreve `docs/kit-pipeline-audit.json`, incluindo habilidades ausentes, placeholders não resolvidos, coeficientes candidatos, condições e pendências. Não faz requisições nem depende de rede para auditar o catálogo local.

Para kits incompletos, `exactDPS` é `null`. A estimativa de rotação fica em `estimatedRotationDPS` para comparação exploratória, sem ser o critério ofensivo dos sliders. O ranking automático utiliza `offenseBasis: attribute-index`, um índice explícito de atributos/sinergia sem unidades de dano por segundo. Ações configuradas pelo usuário são avaliadas separadamente como `configured-actions`, sem serem certificadas como kit exato. Os testes de fixtures do parser usam números sintéticos; não são coeficientes reais da Lulu.

## Verificação da fonte nesta entrega

A URL Meraki documentada usa `en-US` (hífen), não `en_US`. O endpoint com hífen respondeu com JSON estruturado, mas não apresenta uma versão do snapshot no payload. `patchLastChanged` descreve a última alteração de cada campeão e não comprova o patch de todo o dataset. Por isso, o pipeline rejeita esse `latest` sem prova de versão e mantém o staging/catalogue anterior. Nenhum coeficiente desse dump foi promovido ao cálculo de produção.
