# Aegis Lab — Comando mestre de implementação

Versão da especificação: 1.1 · Idioma inicial: português brasileiro · Produto novo · Supabase Free

## 1. Missão e forma de execução

Atue como arquiteto de software, engenheiro de simulação de combate, desenvolvedor full-stack e designer de produto. Construa do zero o **Aegis Lab**, plataforma de análise e otimização de builds de League of Legends, com interface minimalista, bonita, responsiva e cálculos auditáveis.

Implemente o produto, não apenas uma landing page ou um conjunto de telas demonstrativas. Organize o trabalho nas fases abaixo. Antes de avançar, verifique os critérios de aceite, registre evidências e corrija falhas. Aprovação de fase significa aprovação técnica pelos critérios: não interrompa rotineiramente para pedir confirmação. Solicite informações somente quando uma dependência real não puder ser resolvida por configuração, alternativa documentada ou decisão reversível.

Não declare uma fase concluída quando houver funcionalidades simuladas apresentadas como reais. Dados de demonstração devem ser identificados e separados da execução normal. Não publique preços, estatísticas, tempos de animação, fórmulas ou escalamentos inventados. Não prometa precisão absoluta ou exclusividade mundial dos recursos PRO.

Preserve esta especificação, o código, os testes e os registros de validação. Ao terminar cada fase, atualize `docs/progress.md` com implementação, testes, limitações e próxima etapa. A especificação é o contrato do produto; divergências materiais precisam ser identificadas.

## 2. Escopo e prioridades

### MVP

- Catálogo dinâmico com todos os campeões disponíveis no snapshot de dados selecionado; sem número fixo de campeões no código.
- Montagem manual de itens, runas, habilidades e cenários para todos os campeões.
- Qualquer campeão em qualquer rota: Top, Jungle, Mid, Bot e Support. Função nativa não restringe rota escolhida.
- Combate 1v1 com ações dos dois campeões na mesma simulação.
- Prioridade de validação: **Shen, Ezreal, Yasuo, Yone, Riven e Darius**. Validação por habilidade, efeito, item e combinação, não um selo indiscriminado por campeão.
- Seleção dos quatro aliados para funções e composição de equipe. Buffs e auras de aliados não participam do combate enquanto não validados.
- Interface PT-BR e estrutura de internacionalização EN desde o primeiro dia.
- Free anônimo, contas para persistência na nuvem e assinatura, trial PRO de 14 dias sem cartão, painel de proprietário/admin.

### Evolução posterior

Preparar os contratos para múltiplas entidades e confronto 5v5. Simulação completa de tropas, torres, objetivos, patches históricos e buffs de aliados fica para atualizações posteriores. Não anunciar essas funcionalidades como disponíveis no MVP.

## 3. Arquitetura e infraestrutura

Use TypeScript estrito, React/Next.js e componentes acessíveis. Node.js é usado no desenvolvimento/build e scripts; não exigir servidor Node contratado. Escolha versões estáveis compatíveis após consultar documentação oficial vigente. Fixe dependências com lockfile. Recomenda-se Tailwind para tokens/layout, um sistema de componentes consistente, validação de schemas e biblioteca de gráficos com suporte a acessibilidade.

Destino: **Supabase Free + hospedagem gratuita do frontend**, sem Hostinger, VPS ou serviço mensal obrigatório. Supabase fornece PostgreSQL, Auth, Storage quando necessário e Edge Functions para operações protegidas. Ele não substitui a hospedagem do frontend Next.js. Preferir Next.js com exportação estática em Cloudflare Pages quando todas as rotas puderem operar com APIs externas; documentar limitações de SSR, rotas de servidor e otimização de imagem nesse modo. Se houver necessidade demonstrada de execução Next.js no servidor, avaliar Cloudflare Workers e compatibilidade vigente, mantendo limites gratuitos. Não criar dependência paga sem autorização explícita.

Simulação e otimização básica executam em **Web Workers no navegador**, com cancelamento, progresso e limites locais. Edge Functions atendem autenticação autorizada, operações administrativas, Riot API e webhooks; não executar busca combinatória longa nelas. Otimização PRO protegida exige serviço de cálculo com autorização no servidor e workload que caiba nos limites: medir e limitar consultas, ou manter esse recurso explicitamente pendente até infraestrutura viável. Recursos enviados ao navegador podem ser inspecionados e não têm proteção comercial absoluta; não anunciar que um gate de UI protege código local contra execução independente.

Separar:

1. Aplicação web, APIs autenticadas e controle de acesso.
2. Pacote puro de engine, executável em testes, Web Worker e processo Node.
3. Ingestão, normalização, versionamento e auditoria de dados.
4. Otimizador e execução de tarefas com limites de CPU, tempo e memória.
5. Persistência de contas, cenários, pagamentos e auditoria.

Utilizar **PostgreSQL do Supabase**, migrações SQL versionadas e Supabase Auth. Habilitar RLS em tabelas expostas, com políticas testadas por proprietário do registro e papel administrativo. Guardar cenários, trial, assinatura e papéis em tabelas protegidas; usuário não pode alterar seu papel, validade de trial ou status PRO. Usar função/transação para ativação única do trial, com horário do banco e validação de elegibilidade. Publishable/anon key pode estar no frontend com RLS correta; `service_role`, secret keys e credenciais Riot/pagamento ficam somente em ambiente confiável. Nunca usar `user_metadata` editável pelo cliente como autoridade administrativa.

Não exigir Redis, fila paga ou daemon persistente no MVP. Adapters permitem evolução posterior. Guardar somente configurações e resumos necessários, evitando logs completos de cada evento de cada simulação no banco. Assets do jogo devem usar fontes/CDNs apropriadas, sem duplicar todo o catálogo de imagens no Storage. Monitorar quotas e definir retenção de telemetria. Uso anônimo Free não cria conta Supabase automática para cada visitante.

Revalidar limites do Free na implantação; documentar pausa por inatividade, ausência de backups automáticos incluídos e exportação/restauração manual. Verificar entregabilidade e limites de email Auth e configurar SMTP apropriado antes de abrir cadastros públicos. Não simular disponibilidade permanente ou escala ilimitada. Taxas transacionais de pagamento não são eliminadas pela infraestrutura gratuita.

Estrutura sugerida, adaptável ao workspace:

```text
apps/web/
packages/engine/
packages/optimizer/
packages/data/
packages/contracts/
supabase/migrations/
supabase/functions/
scripts/ingestion/
tests/fixtures/
docs/formulas/
docs/coverage/
docs/deployment/
```

## 4. Dados e atualização de patches

### Fontes

- Data Dragon: versões disponíveis, catálogo, identificadores, atributos expostos, textos, ícones, runas, habilidades e skins.
- CommunityDragon: complemento comunitário quando a estrutura e proveniência forem verificadas; não tratar como API oficial da Riot.
- Fórmulas/interações não fornecidas de forma executável precisam de adapters curados, fontes rastreáveis e fixtures de validação.
- Riot Match-V5, quando houver credenciais e fluxo de ingestão apropriados, pode alimentar estatísticas observadas. Não é um endpoint pronto de "melhor build".
- Outros provedores somente por interfaces autorizadas e documentadas. Não depender de scraping de terceiros como integração garantida.

Consultar documentação atual e registrar URLs/fontes em `docs/sources.md`. A descrição textual de habilidade não é substituto de fórmula. Não interpretar HTML ou placeholders como valores numéricos verificados.

### Snapshots

Descobrir a versão disponível por `https://ddragon.leagueoflegends.com/api/versions.json`; usar URLs versionadas para datasets de campeão/item/runa e os detalhes individuais. Idiomas do Data Dragon devem ser mapeados para os locales internos.

Persistir `patchId`, versão do Data Dragon, locale, modo/mapa, origem, timestamp, checksum, schema e versão da engine. Não misturar silenciosamente dados de versões distintas. Mapear patch do jogo e versão dos assets explicitamente; publicação dos dados pode ocorrer depois da atualização do jogo.

Mostrar **Patch de Dados** e **Patch Validado pela Engine**. A cobertura é granular: um patch não fica inteiramente "verificado" pela validação de um único campeão. A atualização chega a staging, produz diff de atributos/fórmulas/elegibilidade e invalida validações afetadas. Promover snapshot atomicamente, manter última versão íntegra e permitir rollback.

### Builds do adversário

Oferecer:

- **Teórica:** gerada pela engine, rota e preferências; alternativa principal sem dados suficientes.
- **Observada:** somente quando há dataset real, com patch, região, rota, recorte, quantidade de partidas e definição da métrica.

Não confundir frequência com melhor desempenho. Definir denominadores e controles de amostra; não somar itens populares isoladamente e chamar isso de build observada. Exibir fonte e permitir edição completa.

## 5. Design e organização da interface

Criar identidade própria para Aegis Lab: fundo carvão/azul muito escuro, superfícies discretas, dourado contido, boa tipografia e hierarquia. A referência é acabamento sofisticado; não copiar layout, logotipo ou identidade do cliente da Riot.

Fluxo: **Escolher campeão → configurar objetivo e cenário → montar/otimizar → analisar**. Esconder complexidade em seções expansíveis sem perder descobribilidade.

### Catálogo

- Grade com retrato de cada campeão e nome imediatamente abaixo.
- Busca, filtros de função, indicação de cobertura e filtros opcionais; não restringir campeões por rota.
- Estados de carregamento, erro, ausência de resultado e imagem indisponível.
- Seleção por teclado, nome acessível e virtualização/paginação se necessário.

### Laboratório

- Cabeçalho com campeão selecionado, rota, nível 1–18, patches, estado de cobertura e modo Estrito/Exploratório.
- Splash art e seletor de skins com miniaturas e nomes. Skin altera somente apresentação. Recolher arte no mobile.
- Quatro seletores de aliados e painel do adversário, com rota independente.
- Funções genéricas/nativas separadas de rota e de preferências da build.
- Barra principal dano ↔ defesa; botão de edição avançada.
- **Matriz de habilidades imediatamente acima do editor de runas.**
- Editor de runas com ícones de Precisão, Dominação, Feitiçaria, Determinação e Inspiração, ícones individuais e fragmentos.
- Build, atributos base/derivados, condições/efeitos, sinergias e resultados organizados em painéis claros.

No desktop usar colunas com largura legível; no mobile usar seções/abas e reservar rolagem horizontal apenas para matriz e linha do tempo. Nunca esconder dados essenciais atrás de hover. Respeitar contraste, foco visível, labels, alternativas textuais e preferência de movimento reduzido.

## 6. Preferências e objetivos

Barra simples: esquerda favorece dano, direita defesa. Definir uma transformação documentada e monotônica para pesos normalizados. O editor avançado contém **Ofensiva, Defesa e Utilidade**, cuja soma é 100%. Tratar limites, arredondamento e todos os pesos zerados de forma determinística.

Subpesos opcionais: AD, AP, burst, DPS, dano de ataque, dano de habilidade, crítico, velocidade de ataque, penetração, HP, armadura, RM, cura, escudo, sustain, recursos, regeneração, aceleração, movimento e tenacidade. Não somar unidades brutas de HP e DPS como se fossem equivalentes. Alteração manual gera o rótulo **Preferência Personalizada**. Presets apenas preenchem controles, não travam itens.

Objetivo ofensivo selecionável:

- Burst em janela configurável.
- DPS continuado, com duração definida.
- Dano por ataque ou habilidade específica, com rank, hits e alvo.

Objetivo defensivo selecionável:

- Resistir a combo.
- Sobreviver por X segundos.
- Sustentar trocas, considerando cura, escudos, recursos e recuperação permitida no cenário.

Presets: burst, DPS, anti-tanque, resistência física/mágica, sustain, waveclear, mobilidade e utilidade. Waveclear não recebe simulação quantitativa de tropas antes de existir modelo validado; indicar seu alcance no MVP.

## 7. Builds, orçamento, botas e travas

Separar **ouro disponível para compras**, **itens possuídos** e **valor total da build**. No máximo seis slots legais, admitindo builds parciais e zero a seis itens conforme regras do campeão/modo. Respeitar grupos únicos, incompatibilidades, upgrades, requisitos e exceções de campeão.

Itens já possuídos ficam travados por padrão. Travar também itens selecionados, runas, fragmentos, sequência de habilidades e componentes do cenário. O algoritmo só modifica elementos autorizados. "Permitir venda/substituição" é opção explícita, com retorno de venda e saldo contabilizados conforme regras verificadas.

Botas:

- Automático: a engine escolhe, respeitando elegibilidade.
- Fixar: manter o par selecionado.
- Sem botas: não reservar slot nem assumir velocidade implícita.
- Opção de Bota de Velocidade Tier 1 já comprada para builds parciais.

Botas ocupam slot e têm custo. Upgrade substitui o item anterior; não duplicar custo quando uma receita usa componente já possuído. Não aplicar hipótese global de "todo mundo já tem botas".

Busca por ID canônico e nome localizado, com aliases como Gume, BT, Bota de CDR e Zhonyas. Aliases ambíguos precisam de resolução visível. Itens antigos só entram se elegíveis no snapshot atual; patches legados são futuros.

Tooltips: preço, receita, atributos, passivas/ativas, restrições, cobertura e condições. Eficiência de ouro deve declarar a metodologia e não transformar efeitos situacionais em valores universais.

Dashboard expansível: ouro gasto/restante, valor total, slots, regra de botas, stacks, condições, passivas, dados estimados e efeitos omitidos.

## 8. Runas e ordem de habilidades

Editor manual gratuito completo, respeitando árvore primária/secundária, slots, incompatibilidades e fragmentos disponíveis no patch. Ações: **Limpar runas**, restaurar e travar. Estado vazio é permitido para comparação, mas identificado como página incompleta; não atribuir efeitos de runas removidas.

Matriz 1–18: colunas de nível, linhas de Q/W/E/R, ícone, tecla e indicação do ponto investido. Validar pontos por nível, ranks, requisitos e exceções individuais, incluindo campeões com evolução, transformações, habilidade automática ou regras especiais.

Botões: **Conservadora**, **Experimental PRO**, **Travar**, **Restaurar**. A sequência até 18 pode existir com campeão em nível menor, mas somente ranks alcançados no nível atual participam dos cálculos.

Conservadora usa prioridades justificadas e regras verificadas. Se não houver dados de meta, dizer "preset conservador" e não "meta comprovado". Experimental explora sequências legais e avalia o cenário. Não otimizar apenas a soma de atributos ignorando o combo e as condições de uso.

Free edita manualmente runas e sequência; PRO permite otimização conjunta automática. Não limitar o editor manual para fabricar valor do plano pago.

## 9. Cenário, efeitos e atributos personalizados

Configurar para os dois campeões: nível, itens, runas, HP/recurso inicial, orçamento, rota, alvo e condições. Definir duração, distância inicial, chances de acerto, tempos efetivamente em alcance e preset de execução **Básico / Consistente / Ideal**.

Não modelar geometria completa como se fosse implementada. No MVP distância pode alimentar regras explícitas de elegibilidade/tempo em alcance; relatar simplificações. Tempos de cancelamento da Riven e outros campeões precisam de evidência. Valores ajustados pelo usuário ficam marcados como customizados.

Controle de efeitos separado:

1. Stacks inteiros reais, com limite, duração e perda/consumo definidos pelo efeito.
2. Ativar/desativar condição ou definir ação no tempo, como estase.
3. Aproveitamento contextual 0–100%, quando a abstração for apropriada.

Não aplicar stacks manuais e stacks dinâmicos duas vezes. Diferenciar stack inicial, máximo e gerado durante combate. Sliders de aproveitamento não substituem fórmulas ou regras de ativação. Não multiplicar indiscriminadamente duração de estase, velocidade de ataque ou dano verdadeiro por um fator contextual.

Cobrir, conforme elegibilidade no patch, efeitos exemplificados por Cutelo Negro, Mejai, Shojin, Guinsoo/phantom hit, efeitos de Tiamat, Sunfire, Zhonya, Shurelya, itens de proc, Quebra-passos, Quebra-cascos, Presa da Serpente, feridas graves, Statikk, Chuva de Lâminas, Perspicácia Cósmica e botas. Nomes citados não constituem fórmulas ou confirmação de disponibilidade atual. Efeitos não implementados permanecem sinalizados.

Separar aceleração de habilidade, de item e de feitiço; bônus de ataque, temporários de ataque, movimento, tenacidade e resistências a slow. Não tratar Impacto Repentino automaticamente como bônus de movimento.

Dragões: stacks por tipo, limites/regras do patch, alma e outros buffs distinguíveis. Somente efeitos validados entram em modo Estrito. Evitar combinações impossíveis no modo padrão; permitir cenários hipotéticos apenas com tag customizada.

Painel de atributos: HP, AD, AP, regeneração de HP, mana/energia/recurso específico, regeneração, armadura, RM, movimento, alcance, attack speed base, attack speed ratio, bônus e total, crítico, penetração, acelerações, tenacidade, cura/roubo de vida conforme cobertura. Campeões sem mana mostram o recurso correto. Distinguir base, crescimento, bônus e total; "vida" e "HP" não são métricas duplicadas.

**Modo Personalizado:** override de atributos, dano, escalamentos, custo, cooldown e propriedades de efeito suportadas. Exibir "Simulação Customizada", origem de cada override e botão **Restaurar Padrão do Patch**. Inputs não executam JavaScript arbitrário; usar schemas e expressões seguras. Customizado não recebe selo de validação oficial da engine para a fórmula alterada.

## 10. Engine de combate

Engine pura, determinística e desacoplada da UI. Usar fila de eventos, relógio da simulação e ordem estável/documentada para eventos simultâneos. RNG, quando necessário, tem seed; modo de valor esperado precisa ser explicitamente separado de uma trajetória concreta.

Entidades tipadas incluem atributos, HP/recurso, buffs/debuffs, cooldowns, habilidade/rank, alvo, elegibilidade de ação e estado. Eventos: ataque, cast, projétil/impacto quando modelado, dano, cura, escudo, proc, stack, expiração, CC, mudança de atributo e morte.

Os dois campeões executam sequências automáticas editáveis. Respeitar disponibilidade, custo, cooldown, lockout, estado de CC, estase e morte. Ações ilegais produzem mensagens úteis; não desaparecem silenciosamente. Permitir configuração de acerto e sequência sem prometer inteligência de adversário equivalente ao jogo real.

Registrar contribuição por ataque/habilidade/item/runa, dano antes/depois da mitigação, escudo absorvido, overkill, HP/recurso, cooldowns e condições. Simulação não pode continuar causando ações normais depois da morte sem regra específica implementada.

Modelos de habilidade devem registrar capacidades separadas: ataque ou spell, físico/mágico/verdadeiro, on-hit/on-attack, elegibilidade para phantom hit, spell effects, cura/roubo de vida, CC, targeting, hits, custo, cooldown, escalamentos e exceções. Não presumir que todo spell ativa qualquer item ou todo on-hit admite phantom hit. Interações como Mandato Imperial e custos/efeitos de mana exigem regras próprias.

### Matemática

Documentar e testar individualmente:

- Crescimento de atributos por nível e exceções; não assumir crescimento linear universal.
- Mitigação com resistências positivas/negativas, reduções e penetrações na ordem correta do patch.
- Dano verdadeiro e suas exceções, sem aplicar armadura/RM.
- Dano baseado em HP máximo/atual/perdido e origem do HP considerado.
- Velocidade de ataque base/ratio, caps e exceções; crítico com modificadores de campeão e de efeitos.
- Cooldown usando a aceleração aplicável; resets, reduções e casts especiais.
- Cura, escudos, feridas graves, redução de escudo, dano periódico e stacks.
- Arredondamento de exibição separado da precisão interna.

Uma fórmula sem evidência é pendente, não verificada. Fixtures devem ter origem e tolerância justificadas; testes que repetem a própria implementação não bastam como prova.

### Resultados

Burst, DPS com denominador definido, dano por ação, HP restante, cura/escudo úteis, tempo de morte e de sobrevivência. Se ninguém morrer na janela, mostrar **"Sobreviveu à janela; tempo até a morte não determinado"**, não infinito garantido.

Barras de composição para os dois campeões: **físico, mágico e verdadeiro**. Exibir valores e percentuais do cenário, com opção de bruto vs. efetivamente entregue. Não fixar percentuais por campeão. Se dano total for zero, indicar ausência de dano, sem divisão por zero. AD/AP são atributos, nunca substitutos diretos de tipo de dano.

Aliados sem cenários individuais não recebem composição numérica "exata"; mostrar classificação/estimativa com origem. Não somar percentuais de aliados sem ponderação ou configuração equivalente.

## 11. Cobertura e honestidade dos resultados

Manifesto por patch, entidade, habilidade, efeito e condição. Estados: **verificado**, **em testes**, **dados estáticos**, **não implementado**. Incluir evidência, data, revisão e casos cobertos.

- **Estrito:** somente cenário com todas as dependências efetivamente usadas verificadas. Bloquear cálculo/otimização incompatível e explicar dependências ausentes. Não remover silenciosamente um efeito para fazer o modo passar.
- **Exploratório:** usar componentes implementados, listar omissões e estimativas; permitir overrides explícitos. Não inventar efeito ausente. Resultados não são comparáveis aos estritos sem explicar diferenças.

No catálogo, selo indica cobertura resumida; no cenário, status reflete a combinação real. Ausência de fonte ou falha de ingestão não se transforma em placeholder numérico no fluxo normal.

## 12. Otimização e sinergias

Implementar busca com filtros legais, pruning, cache, cancelamento, progresso e limite de execução. Começar por conjunto reduzido de candidatos justificado; não enumerar cegamente todas as combinações. Usar busca exata para espaços pequenos e comparação com heurística. Separar "melhor entre candidatos avaliados" de ótimo global demonstrado.

Score usa métricas normalizadas contra referências explícitas e fixas durante a busca, com pesos de ofensiva/defesa/utilidade. Documentar penalidades, restrições e métricas ainda não modeladas. Não recompensar duas vezes o mesmo efeito por DPS e por AD sem justificativa. Retornar alternativas e explicar trade-offs.

Respeitar orçamento, locks, slots, botas, elegibilidade e cobertura. Free otimiza itens para um cenário mantendo runas e skills do usuário. PRO permite busca conjunta de itens, runas e sequência legal. Evitar edição arbitrária de alvo/cenário pela engine para artificialmente melhorar o score.

Sinergias por P/Q/W/E/R, em painel independente dos pesos:

- Free: itens compatíveis e explicação causal, condições e cobertura.
- PRO: ganho marginal calculado contra baseline identificado, com comparação de DPS/dano/defesa, custo e janela.

Para Q do Shen e demais habilidades, derivar compatibilidade de tags/regras verificadas e escalamentos reais, não somente classe ou palavras na descrição. Ranking de sinergia não equivale a recomendação de build completa. Itens comparados precisam de condições equivalentes e diferença de custo visível.

## 13. Free, PRO, trial e contas

| Recurso | Free | PRO / trial |
|---|---|---|
| Todos os campeões, skins e montagem manual | Sim | Sim |
| Editor de runas/fragmentos e matriz de skills | Sim | Sim |
| Cenário 1v1, atributos, locks e resultados básicos | Sim | Sim |
| Otimização de itens para um cenário | Sim | Sim |
| Sinergias qualitativas por habilidade | Sim | Sim |
| Otimização conjunta itens + runas + skills | Não | Sim |
| Sequência experimental automática | Não | Sim |
| Múltiplos cenários e busca de consistência | Não | Sim |
| Linha do tempo detalhada e decomposição de eventos | Não | Sim |
| Comparação avançada e fronteira dano/sobrevivência | Não | Sim |
| Planejamento de compras e picos de poder | Não | Sim |
| Ganho marginal quantitativo de sinergias | Não | Sim |

A engine pode produzir eventos internos em ambos os planos; o Free continua recebendo resultados e avisos suficientes para interpretar a simulação. O acesso aos endpoints/exports detalhados PRO deve ser aplicado no servidor, não apenas escondido em CSS.

Salvar builds/cenários na nuvem exige conta; incluir salvamento básico para usuários cadastrados e cotas configuráveis sem inventar valores comerciais. Uso local anônimo preserva cenário no dispositivo, com schema versionado.

Trial de **14 dias sem cartão**, início registrado no servidor uma única vez por conta elegível. Datas UTC, apresentação local, expiração automática para Free; sem conversão automática em assinatura paga. Cadastro não deve iniciar cobrança. Comunicar claramente ativação e término do trial.

Autenticação com Supabase Auth, validação de identidade nas Edge Functions/APIs e RLS no banco, recuperação de acesso, proteção de sessão e isolamento entre usuários. No frontend estático, tratar sessão com SDK mantido e proteção contra XSS; não exigir cookies HttpOnly que uma SPA sozinha não consegue provisionar. Não usar um email enviado pelo navegador ou `isPro=true` como autoridade de acesso.

## 14. Pagamentos e administração

Adapters para **Stripe, Asaas e Mercado Pago**. Provedor ativo, mensal/anual, moeda, preços e identificadores de produto/preço configuráveis no painel. Códigos de integração ainda precisam ser implementados/testados: um seletor não torna qualquer provedor funcional. Liberar apenas adapters aprovados em sandbox e compatíveis com recorrência desejada.

Credenciais protegidas no servidor/secret manager; painel não exibe segredos completos. Alterar preço deve respeitar semântica do provedor e não modificar assinaturas existentes silenciosamente. Checkout hospedado quando adequado; PRO só é concedido após confirmação confiável de pagamento/assinatura.

Webhooks com validação de assinatura/token conforme provedor, idempotência, registro de recebimento, reconciliação e tratamento de eventos fora de ordem. Modelar trial, ativa, pendente, atraso, cancelada, expirada e reembolso conforme adapter. Não confiar em retorno de URL do checkout como prova de pagamento.

Proprietário/admin provisionado por procedimento de bootstrap protegido no servidor, sem senha padrão pública. Papéis separados e testes de autorização. Proprietário tem acesso completo sem depender de assinatura, com trilha de auditoria; não aceitar promoção de papel pelo cliente.

Painel: assinantes, trial, permissões, configurações comerciais, cobertura, snapshots, diffs, promoção/rollback, relatórios de falhas, latência, tarefas da engine e telemetria agregada. Registrar alterações administrativas com autor e horário. Não coletar desnecessariamente dados pessoais, tokens ou conteúdo privado nos logs. Auditoria matemática não pode ser apenas um botão que muda o selo sem evidências.

## 15. Recursos PRO com valor concreto

1. **Robustez entre cenários:** otimizar contra diferentes builds/níveis/janelas do inimigo, mostrar melhor média e pior caso; declarar pesos e usar cenários plausíveis definidos pelo usuário.
2. **Linha do tempo:** eventos dos dois campeões, dano acumulado, HP, recursos, shields, cooldowns e procs; edição, explicação e comparação de execução.
3. **Plano de compras:** caminho de componentes e upgrades com ouro disponível e itens possuídos, picos de poder por orçamento/nível; sem alegar prever tempo real de aquisição de ouro sem modelo.
4. **Trade-offs:** fronteira de Pareto entre dano, sobrevivência e custo; explicar quanto se ganha/perde em cada alternativa, sem sugerir causalidade estatística a partir da simulação.
5. **Persistência e patches:** salvar, compartilhar cenários com permissão explícita e comparar mudanças entre snapshots suportados. Link compartilhado não expõe conta ou credenciais; indicar patch/engine e preservar cenário original.

Não anunciar "nenhum outro site possui" sem pesquisa específica. O valor comercial é análise rastreável e útil, não quantidade de sliders.

## 16. Cache, segurança operacional e implantação

Cache público de snapshots versionados com chave incluindo versão, locale, modo e schema. Cache de estatísticas inclui recortes e timestamp. Expiração/revalidação explícitas e tratamento de erro sem cachear falhas como dataset válido.

Cloudflare não deve cachear sessões, painel administrativo, pagamento, resultados privados ou cenários pessoais. Respostas privadas usam política apropriada de `private`/`no-store`; regras de edge não devem sobrescrevê-la. Chave Riot fica exclusivamente no backend. Implementar limites por endpoint, retentativas controladas, timeout e respeito aos rate limits.

Cache de resultados usa hash canônico de cenário, patch, engine, cobertura, seeds e objetivos. Não reutilizar resultado com runas/locks alterados. Cancelar e descartar respostas obsoletas quando o usuário mudar o cenário.

Documentar variáveis em `.env.example` sem valores reais, migrações Supabase, RLS, exportação/restauração, TLS, domínio gratuito, build/export do frontend, Edge Functions, logs e rollback. Separar as variáveis públicas das secrets. Não exigir domínio comprado, plano Supabase Pro, VPS ou container em produção no MVP. Qualquer evolução paga deve ser apresentada como opcional e depender de autorização.

Revisar documentação vigente de uso dos dados e monetização da Riot antes de cobrança real; registrar produto e cumprir exigências aplicáveis. Incluir aviso de não endosso e identidade visual própria. A integração técnica do checkout pode ser entregue em sandbox enquanto requisitos externos estão pendentes.

## 17. Fases executáveis e critérios de aceite

### Fase 0 — Fundação e contrato

Entregar repositório, decisões de arquitetura, schemas de cenário/efeitos, manifesto de cobertura, mapa Free/PRO e plano de testes.

**Aceite:** instalação e build reproduzíveis; TypeScript/lint passam; nenhuma credencial secreta no código; contratos diferenciam AD/AP e tipo de dano; caminho Supabase Free + frontend gratuito documentado; RLS e limites de cálculo protegido PRO definidos; fontes pendentes documentadas.

### Fase 1 — Dados e interface utilizável

Implementar ingestão versionada, catálogo com retratos/nomes, laboratório, skins, seletores de aliados/inimigo/rota/nível, preferências, orçamento, botas, locks, runas, matriz de habilidades e i18n.

**Aceite:** catálogo real completo do snapshot; qualquer rota selecionável; skin não altera cenário matemático; runas/skills obedecem regras; matriz acima das runas; controles alteram estado real; erros de API visíveis; desktop/mobile e navegação por teclado verificados. Fórmulas não implementadas não geram números fictícios.

### Fase 2 — Engine 1v1 e cobertura piloto

Implementar eventos, atributos, dano, recursos, efeitos suportados, duas sequências, overrides, dragões e prioridade dos seis campeões. Ampliar escopo validado gradualmente em vez de tentar marcar todos de uma vez.

**Aceite:** fixtures independentes para mecânicas prioritárias; resultados determinísticos; custos/cooldowns/stacks corretos; CC/morte/estase respeitados quando cobertos; dano por origem reconciliado com totais; Estrito bloqueia dependências não verificadas; Exploratório lista omissões. Nenhum dos seis campeões ganha selo geral sem comprovação das interações usadas.

### Fase 3 — Otimização Free e sinergias

Implementar busca de itens, orçamento/locks/botas, presets, explicações e sinergias qualitativas.

**Aceite:** não altera runas/skills travadas; nunca excede slots/orçamento; contabiliza componentes e venda; busca exata em cenários pequenos serve de comparação; presets editáveis; timeout/cancelamento funcionam; alternativas e hipóteses acessíveis; modo observado só aparece com dados reais.

### Fase 4 — Contas e PRO

Implementar contas, salvamento, trial, autorização, otimização conjunta, múltiplos cenários, linha do tempo, Pareto, compras e sinergias quantitativas.

**Aceite:** anônimo usa Free; RLS impede leitura/escrita de cenários privados alheios; trial usa horário do banco e ativação atômica; usuário não modifica privilégios; endpoints PRO recusam Free; proprietário autorizado tem acesso; comparações usam configurações equivalentes e identificam dados incompletos. Recursos PRO locais têm limites de proteção documentados e não são vendidos como serviços inacessíveis sem assinatura se o código estiver publicamente disponível.

### Fase 5 — Administração e pagamentos

Implementar painel, auditoria, telemetria, configurações comerciais e adapters de cobrança. Manter produção desativada até provedores/credenciais/requisitos externos estarem configurados.

**Aceite:** acesso admin negado a usuário comum; segredos não vazam; sandbox executa ciclo de assinatura, cancelamento e falha; webhooks falsos/repetidos/fora de ordem testados; preço/provedor configuráveis entre adapters efetivamente implementados; promoção de patch exige evidência e rollback funciona.

### Fase 6 — QA e entrega

Entregar código completo, suíte de testes, documentação de fórmulas/fontes/cobertura, guia Supabase Free + frontend gratuito/Cloudflare, artefato de código sem segredos e checklist factual de prontidão.

**Aceite:** build e testes passam em ambiente limpo; principais fluxos E2E passam; layout desktop/mobile revisado; benchmarks em máquina descrita; restauração/migração verificadas; pendências externas explícitas. Não declarar aplicação implantada sem URL e verificação real.

## 18. Testes obrigatórios

- Unitários de crescimento, mitigação, penetração, crítico, attack speed, haste, recursos, stacks, cura, escudos e ações simultâneas.
- Casos prioritários: Q de Shen, on-hit/CD de Ezreal, crítico/attack speed de Yasuo e Yone, timing/cancelamento de Riven, stacks e execução de Darius, sempre conforme patch e fontes.
- Regressão com fixtures referenciadas; tolerâncias declaradas e separação de esperado vs. calculado.
- Invariantes: stacks nos limites, HP/recurso válidos, ausência de NaN, ranks legais, orçamento/slots, locks preservados, ausência de dupla contagem e consistência de logs.
- Otimizador comparado com enumeração em casos pequenos e cenário em que itens da mesma classe produzem resultados diferentes.
- Integração: snapshot incompleto, fonte fora do ar, cache inválido, atualização de patch, autorização, trial e pagamentos.
- E2E: seleção de campeão/skin/rota, runas/skills, bota T1 e upgrade, builds parciais, inimigo editável, modo customizado e limites Free/PRO.

Cobertura percentual de testes não prova fidelidade ao jogo. Registrar cobertura de mecânicas separadamente.

## 19. Documentação e relatório final

Arquivos mínimos:

- `README.md`: executar, testar e estrutura.
- `docs/architecture.md`: decisões e contratos.
- `docs/sources.md`: fontes, revisão e limites.
- `docs/formulas/`: equações, ordem de efeitos, exemplos e tolerâncias.
- `docs/coverage/`: manifesto e evidências por patch.
- `docs/monetization.md`: recursos e estados de conta.
- `docs/deployment/supabase-cloudflare.md`: implantação gratuita, RLS, quotas e rollback.
- `docs/progress.md`: fases e evidências.

Ao entregar, informar o que funciona, o que foi validado, testes executados, limitações e dependências externas. Fornecer código e acesso à aplicação quando efetivamente disponível. Não substituir implementação por promessas ou screenshots.

**Início da execução:** inspecione o workspace e as instruções locais; crie o projeto novo se não existir; execute a Fase 0 e avance autonomamente pelos critérios. Priorize confiança matemática, boa experiência e limites claros. Não esconda uma engine incompleta atrás de uma interface bonita.

## Referências oficiais para revalidação na execução

- Riot — documentação e políticas de LoL: https://developer.riotgames.com/docs/lol
- Riot — versões de dados: https://ddragon.leagueoflegends.com/api/versions.json
- Cloudflare — documentação de cache: https://developers.cloudflare.com/cache/
- Supabase — plano e quotas: https://supabase.com/pricing
- Supabase — RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase — limites de Edge Functions: https://supabase.com/docs/guides/functions/limits
- Cloudflare — Next.js estático: https://developers.cloudflare.com/pages/framework-guides/nextjs/

Esses links são pontos de partida. Consulte versões vigentes antes de escolher bibliotecas, regras de hospedagem, políticas de monetização ou configurar cobrança.
