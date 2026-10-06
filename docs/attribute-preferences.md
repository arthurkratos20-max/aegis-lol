# Preferências de atributos e modelo híbrido — patch 16.19.1

## Comportamento

Dano, Defesa e Utilidade participam da mesma pontuação normalizada, tanto na montagem por slots quanto na comparação de candidatos completos. Os três pesos são divididos pela sua soma. Em 100% Utilidade, Dano e Defesa recebem peso zero; não existe fallback para Defesa. O caso sem nenhum peso usa três partes iguais.

A pontuação de item é:

    dano × ofensiva normalizada + defesa × EHP normalizado + utilidade × utilidade normalizada + bônus contextual

O bônus contextual é limitado a 5% e é zero em cada objetivo puro. Botas, item-chave e inventário travado seguem preservados. A busca é gulosa por slot, não uma prova de ótimo global.

Utilidade é um índice explícito de AH, aumento de movimento, mana e regeneração de mana relativos ao campeão sem itens. AH recebe afinidade adicional quando o kit descritivo tem CC ou cura/escudo. Essas afinidades são heurísticas, não tempos de controle ou valores de cura medidos. Os scores de runas e fragmentos também recebem o peso de Utilidade.

Os objetivos de Dano usam DPS, dano nos primeiros três segundos ou maior impacto individual. Os objetivos defensivos incluem recuperação na janela selecionada; roubo de vida só usa dano de ataques, sem aplicar cura a dano de habilidades.

## Dados oficiais e fallback

O endpoint oficial `https://ddragon.leagueoflegends.com/cdn/16.19.1/data/pt_BR/championFull.json` foi consultado com sucesso: 173 campeões, 692 habilidades, nenhum coeficiente em `vars`.

O script `scripts/refresh-abilities.mjs` atualiza habilidades/passivas pelo patch fixo do catálogo. Rejeita outro patch ou respostas incompletas antes de alterar o catálogo. A cópia oficial consultada corresponde às habilidades já empacotadas.

`normalizeSpell` lê apenas coeficientes finitos com links conhecidos, custos e cooldowns. Campos ausentes ou malformados não viram fórmulas exatas. O modelo de classe utiliza proxies de atributos com escala unitária, evolução da habilidade e cooldown oficial ajustado por AH. Magos/suportes usam AP; classes físicas usam AD; tanques recebem um componente relativo de Vida. Não são coeficientes alegados das habilidades reais.

Sem ações manuais, o modelo considera as três habilidades básicas evoluídas, throughput por cooldown, recurso e regeneração de mana e aproveitamento. Impactos nativos disponíveis substituem o proxy do respectivo impacto. Escudos nativos e impactos condicionais conhecidos não são somados como dano automático. Cast times, alcance de habilidades, passivas, R, recasts, pets e procs não são uma simulação completa nesse fallback. Mana usa disponibilidade média na janela; energia e recursos especiais não estão integralmente simulados no modelo de classe.

Com ações manuais, a sequência configurada substitui a rotação estimada. O simulador de eventos continua executando ações explícitas e ataques habilitados; a estimativa de classe entra no cálculo de builds e comparação de DPS/TTK, sem inventar eventos de combate na linha do tempo.

`isExactFormula=false` identifica o modelo e os kits incompletos. Os seis kits com adapters nativos ainda são parciais. A UI mostra “DPS Estimado por Classe” e, quando há impacto nativo disponível, “Fórmula Validada · impacto parcial”; não declara todo o kit validado.

## Estado do slider

O controle é dirigido pelo estado React e entrega cada alteração sem deduplicação por valor anterior. O controle Dano/Defesa preserva o peso atual de Utilidade. Há controle de Utilidade no cartão rápido e no editor. Presets e alterações posteriores recalculam a recomendação pelo cenário atual.

## Validação

- 187 testes automatizados passaram, incluindo os três objetivos puros, composição dos pesos, AH/AP/mana, objetivos de Dano/Defesa e parser resiliente.
- TypeScript e compilação passaram.
- Teste real em Chromium: 100% Utilidade; preset Mobilidade seguido de Home/End no slider; estado final 0/0/100 e indicação visual de DPS por classe.
- Matriz exaustiva: 451.530 cenários base + 865 casos de Utilidade pura = 452.395 verificações aprovadas em 813,074 segundos, sem erros de execução ou divergências matemáticas. Nenhuma build ficou igual entre os extremos de Dano e Defesa. O resumo está em `attribute-preferences-audit.json`.
- Matemática de runas: 3.460 páginas e 20.760 scores verificados nos três objetivos puros e no perfil 60/30/10, sem divergências.

Para reproduzir:

    npm test
    npm run typecheck
    npm run build
    node --experimental-strip-types scripts/audit-attribute-preferences.mjs

A matriz cobre 173 × 174 adversários (incluindo desconhecido) × cinco rotas × três pesos Dano/Defesa = 451.530 cenários, mais 865 casos desconhecidos com Utilidade pura. Confere legalidade, grupos exclusivos, compatibilidade, finitude, composição/mitigação de DPS e a equação de pontuação de cada item. Fidelidade ao jogo das fórmulas ausentes e ótimo global não são afirmados por esse teste.
