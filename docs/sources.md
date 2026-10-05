# Fontes e limites

Documentação Riot consultada em 2026-10-01: https://developer.riotgames.com/docs/lol
Dados estáticos versionados: public/data/manifest.json, pt_BR.json e en_US.json.
Fórmulas extraídas dos seis pilotos: data/sources/, normalizadas por scripts/normalize-mechanics.mjs.

Data Dragon fornece catálogo/atributos, não um simulador executável. As fórmulas extraídas e testes de regressão não certificam comportamento integral in-game. Atualizações de snapshot precisam revalidar essas mecânicas. Nenhum selo de patch integral verificado foi concedido.

Tooltips/chromas: https://developer.riotgames.com/docs/lol (consultado 2026-10-01). O snapshot contém tooltip, leveltip, vars e parentSkin. Fórmulas nativas complementares vêm do snapshot mechanics.json, com cobertura parcial.
Acúmulos/condições de runas: descrições de itens/runas em public/data/pt_BR.json, versão 16.19.1. Cabeçalhos <stats> fornecem AH/penetrações/regeneração explicitamente; texto de passiva não é convertido automaticamente em fórmula.
Conjuntos de itens: formato exportado tem associatedChampions, associatedMaps e blocks/items; estrutura comparada com implementação publicada em https://github.com/WordlessMeteor/LoL-DIY-Programs/blob/main/Customized%20Program%2023%20-%20Manage%20Item%20Sets.py . Compatibilidade de importação no cliente não verificada nesta entrega.
