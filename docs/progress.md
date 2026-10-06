# Entrega 2026-10-01 — Engine, Otimizador, Interface

Ordem de trabalho executada: Engine → Otimizador → UI.

1. Engine: validação de custos/cooldowns/probabilidades/HP/recurso/condições/pesos; tempo em alcance zero não gera ataques; penetração não reduz resistência positiva abaixo de zero nem afeta resistência negativa.
2. Otimizador: accounting separado, alocação única de componentes, upgrades na busca, venda com autorização, locks exatos, objetivos defensivos ligados ao score, enumeração completa de conjuntos pequenos e limite sinalizado.
3. UI: compras/vendas/saldo/valor total, possuídos travados por padrão, mensagens de busca/progresso e cancelamento.

Verificação: npm test (59 testes, zero falhas); npm run typecheck; npm run build (exportação estática). Smoke browser Chromium: carregamento, bota T1 possuída, execução do worker e 3 alternativas; zero pageerrors. Viewports 1440×1000 e 390×844; mobile sem overflow horizontal; captura mobile inspecionada. Imagens do CDN podem não carregar no ambiente com rede restrita; conteúdo do catálogo e cálculos locais continuam funcionando. Revisão visual não equivale a auditoria completa de acessibilidade.

Estado de cobertura matemática: exploratório. Fixtures prioritárias existentes são parciais e não autorizam selo de validação integral. A engine não implementa todas as habilidades/passivas/runa/efeitos. Grupos únicos pendentes deixam recomendações sujeitas a revisão. Supabase remoto, cobrança real e publicação não configurados/verificados nesta entrega. Nenhuma URL pública criada.

## Cartão Rápido / tooltips / compatibilidade / acúmulos — 2026-10-01

Nova entrada Hextech Dark com escolha de campeão/nível/inimigo/rota, três cores + botas como destino, runas sugeridas por kit, veredicto estratégico e métricas de combate modelado. Ambos os níveis iniciais são 18; persistência v2 preserva alterações novas sem apagar a chave v1 anterior. Compras na base são separadas do destino e respeitam componentes/slots/locks.

Botões Estou atrás / Snowball / Anti-cura / Anti-shield e slider mudam recomendações compatíveis por perfil; não demonstram ótimo global. Kits usam dados completos P/Q/W/E/R/recurso/alcance e regras curadas descritivas, com filtros conservadores de requisitos. Teste de todas as páginas de runas geradas para os 173 campeões verifica slots/compatibilidade. Não constitui validação in-game de todas as sinergias. Nimbus não depende de mana; Aproximação admite debilitamento de movimento. Compatibilidade não restringe editor manual Free.

Tooltips seguras com tooltip/leveltip/effect/vars/datavalues, adapters de cálculos nativos suportados, custo, AH aplicável e tabela por rank. Sem HTML arbitrário ou eval. Variáveis resolvíveis são calculadas; base sem escala recebe indicação explícita; base não fornecida permanece identificada. Override numérico local somente para papel autorizado owner/admin; Supabase ainda não configurado para provisionar esse papel. Passivas permanecem texto estático quando não há adapter.

Skins: splash usa parentSkin quando existe; num da skin base nas URLs; chroma IDs não são usados. Teste usa chroma real do snapshot.

Acúmulos com unidades reais para Coração de Aço (HP), Lágrima (mana), Mejai/Lacre (AP), Bastão das Eras (HP/mana/AP), Lenda: Espontaneidade (AS), Lenda: Aceleração (AH básica), Lenda: Linhagem (roubo de vida/HP), Caça Suprema (AH ultimate). Fórmulas versionadas para dados 16.19.1 e derivadas das descrições do snapshot; geração/perda ao longo do combate não modeladas. Nível concedido pelo Bastão não é aplicado automaticamente; nível é um controle separado. Brasa de Bami não recebe stack artificial. Nomes legados/ausentes não são inseridos.

Loja nas duas interfaces com categorias Mana / Dano físico / AP / Defesa / Suporte, itens com várias categorias e preço crescente. Nenhum valor universal de eficiência de ouro inventado.

Gold Check: enumeração pequena de até três componentes distintos das receitas alvo e comparação de upgrades concluídos. Score estático por perfil, não todas as passivas ou ótimo global; preço, crédito de componentes e saldo exatos dentro desse conjunto. Registrar compra atualiza saldo/owned/locks. Pico é por ouro/itens, sem minuto ou probabilidade fabricados.

Smoke de browser local: cartão pronto em 287ms com assets externos bloqueados para isolar JS; nível 18; Gold Check de 1100 G retornou compra 1050 G/saldo 50 G; tooltip de Shen Q; clipboard JSON com campeão 98; editor manual; zero pageerrors e zero overflow mobile 390px. Layout desktop/mobile inspecionado. Esse tempo não garante cold-load global menor que 3s. Imagens CDN no site publicado não foram verificadas pelo browser local. Importação do JSON no cliente LoL não testada.

## Tooltips de itens — 2026-10-01
- Parser seguro de description e plaintext: tags de estatísticas, passivas/ativas, regras e cores viram spans React, sem HTML executável.
- Cards flutuantes no cartão, compras na base, loja, slots próprios/adversários e alternativas. Hover/teclado desktop, toque/ícone de informação fixa, X/Escape fecha, leitura com scroll no viewport móvel.
- Custos total, combinação (gold.base) e venda; receita recursiva preserva componentes repetidos e bloqueia ciclos.
- Contextos separados: build alvo completa no cartão; atributos atuais na loja/editor. Ganho marginal de adição separado (slots livres), sem modificar inventário ou presumir passivas.
- Adapter do dano bruto do Consumo Colossal: 70 + 6% HP máximo, somente 16.19.1 e texto esperado. Reage aos acúmulos. Não aplica a passiva no combate nem presume dano pós-mitigação/HP obtido. Demais efeitos sem adapter: [Cálculo indisponível]. Cooldown 0s do snapshot explicitamente indicado como não verificado.
- TypeScript/build export aprovados; 83 testes aprovados, incluindo segurança do parser, fórmula reativa, diferenças de patch/texto, ganho marginal e receitas duplicadas/cíclicas.

## Preferência automática e painel de runas — 2026-10-01
- Slider compartilhado: pausa de 300ms, flush ao soltar/teclado/blur, cancela timers antigos e limpa ao desmontar. O editor usa worker com limite de 1200 avaliações/1500ms e descarta resultados de cenário antigo.
- Editor: candidatos estratégicos por classe/recurso, comparação real da simulação configurada, incluindo a build atual no conjunto avaliado. Só aplica se houver score estritamente maior (epsilon 1e-9), ou se a atual for ilegal. Mantém runas/habilidades/owned/locks; orçamento, slots e autorização de venda continuam em legalBuild/purchasePlan. Sem passivas desconhecidas; grupos únicos ainda exigem revisão.
- Cartão: enumera combinações de três cores do conjunto de afinidade e bota contextual; objetivo explícito de atributos (AP/100 como potencial, ataques básicos, mitigação/resistências do alvo, EHP pela ameaça declarada/inferida da classe/atributos equipados, movimento/AH). Não é DPS completo do campeão nem máximo global; efeitos condicionais ausentes sinalizados. Mantém ordem em empates; preserva respostas anti-cura/anti-shield e travas que caibam no cartão. Destino não é limitado pelo orçamento da compra atual.
- Runas em duas colunas, runachave maior, fontes/icon URLs oficiais do snapshot. Tooltips com longDesc e atributos calculados de Lenda/Caça Suprema com stacks; demais [Cálculo indisponível]. Editor mantém seleção manual em seção expansível. Três fragmentos com ícones de interface e valores customizados, pois não há catálogo de fragmentos no snapshot Data Dragon; nenhum ícone/efeito oficial inventado.
- 88 testes aprovados. Navegador local: slider muda cartão, editor aplica automaticamente, alterações rápidas deixam os pesos finais corretos, runas/habilidades preservadas, hover de runa funcional, sem erros JS e sem overflow horizontal em 390px.

## Matchup e Draft on-demand — 2026-10-03
- `counterEvaluation.ts`: funções puras parametrizadas para 1v1/draft, pesos semânticos, elegibilidade e ranking determinístico; nenhum catálogo de pares ou composições pré-calculado. Draft deduplicado e limitado a cinco inimigos.
- `counterAdapters.ts`: atributos por entidade derivados do snapshot e dos perfis curados existentes; `counterTraits` opcionais permitem atributos explícitos em tempo de execução. Tags de candidatos por item/runa, mantendo elegibilidade de recurso, afinidade de classe e requisitos de runas. Metadados heurísticos não são win rate nem simulação de combate 5v5.
- Seletores React existentes conectados à avaliação; opções repetidas desabilitadas no mesmo lado e atualização de resultados anunciada. Prévia depende das seleções atuais; botão aplica o preset existente ao otimizador, preservando orçamento, travas, grupos exclusivos e runas travadas.
- Enumeração limitada de builds no otimizador existente é independente da avaliação de campeões; não foi substituída por pré-cálculo de matchups.
- Validação: 112 testes aprovados, incluindo reatividade de atributos, dano misto/verdadeiro, limites de draft, elegibilidade, deduplicação de tags e preservação de página travada. TypeScript aprovado. Não realizada QA de navegador nesta alteração.

## Slider contínuo e montagem greedy — 2026-10-03
- `continuousBuild.ts`: pesos exatos de dano/defesa, sem faixas de preferência. Bota contextual e item-chave calculados independentemente do slider entram primeiro. Inventário e travas adicionais são preservados; inventário completamente travado reutiliza seu próprio core, sem venda implícita.
- Catálogo elegível inteiro de itens completos convencionais, com filtro de mapa/compra/recurso/afinidade AD/AP e grupos exclusivos. Greedy reavalia candidatos a cada slot em função dos itens já escolhidos, capturando limites de AS/crítico e penetração no modelo. Não enumera combinações de campeões nem builds completas.
- ItemScore = pesoDano × DPS normalizado + pesoDefesa × EHP normalizado + bônusCounter. Bônus contextual até 0,05, multiplicado por 4 × pesoDano × pesoDefesa: zero nos extremos para não contrariar dano/defesa puros. Counter aplicado fornece contexto e runas; seus itens não são travas implícitas.
- Slider com step=1 e onChange imediato, sem debounce de 300ms. Ambas as interfaces usam fullBuild via useMemo dependente do cenário. Slider principal usa percentual de dano diretamente, direção visual preservada. Sem sequência configurada, throughput dos ataques básicos usado para ranking é contínuo, sem degraus artificiais por contagem de ataques na janela.
- Componentes comprados mantidos em upgrades; componente adicional não é contado como consumido por um item completo já possuído. Orçamento segue informativo na meta e vinculante nas compras.
- Validação: 116 testes, incluindo 101 percentuais, preservação dos dois slots fixos, grupos/slots, extremos sem bônus de counter, travas compradas e interpolação de scores. Jinx vs Malphite em 100% Dano mantém Mercúrio/Gume; slots livres: Canivete, Dominik, Dançarina, Yun Tal no snapshot atual. Resultados dependem do cenário/snapshot. Ranking greedy não é ótimo global; AP sem sequência de habilidades e efeitos sem fórmula continuam sem dano de kit modelado. QA de navegador não realizada nesta alteração.

## Runas contínuas e contas de demonstração — 2026-10-03
- `calculateOptimalRunes` em `runeOptimizer.ts` usa scores relativos explicitamente tipados como `coverage: heuristic`; não representa DPS/EHP medidos nem efeitos de combate inventados. Mesmo percentual utilizado em fullBuild para itens e runas, com contra-bônus nulo em 0/100.
- Estrutura: melhor Keystone viável define primária; uma escolha em cada linha primária; secundária com melhor soma de duas linhas menores distintas; fragmentos da tabela interna do snapshot (sem armadura/RM removidas inventadas). Requisitos por kit e snapshot preservados.
- RuneLocks permite árvores, IDs individuais e fragmentos; página totalmente travada permanece intacta. Runas travadas fixam sua árvore e linha. Conflitos de duas travas na mesma linha falham explicitamente. Editor manual em ambas as interfaces com controles de travar/destravar. IDs descontinuados deixam de conservar travas inválidas após reconciliação de patch.
- Rotas Next.js `/login`, `/register`, `/forgot-password`, navegação por Link/router e AuthProvider global. Formulários escuros, campos acessíveis, validação, botão disabled/spinner e mock assíncrono de 1000ms. Nome obrigatório até 40 caracteres, email válido, senha mínima 8 e confirmação exata. Recuperação é explicitamente simulada, sem envio de email.
- Mock separado em src/auth/mockAuth.ts. Registro válido abre sessão somente em memória, encerrada por logout/reload. Login aceita email válido/senha com comprimento válido para demonstração e informa que não verifica credenciais. Senha não aparece no User, não vai para storage/rede/banco. Toda sessão criada tem isPro=false, role=user, source=mock.
- GateKeepPro aplicado à análise/linha do tempo; mock não concede PRO mesmo com flags locais alteradas. Estrutura visual somente: autorização real permanece nas políticas/RPCs/servidor Supabase existentes, não foi substituída pelo mock. Entitlements reais existentes são preservados.
- Validação: 123 testes aprovados, incluindo todos os campeões em três pesos, 101 percentuais de scores/páginas, travas individuais/árvores/fragmentos, erro de trava conflitante, formulários, atraso via relógio simulado e ausência de credenciais/privilégios no User. TypeScript e build export aprovados com as três novas rotas. Sem QA de navegador nesta alteração.

## Elegibilidade por escalas e múltiplas classes — 2026-10-04 UTC
- ChampionScaling agrega AD/AP/crítico/AS/vida/resistências e classes principal/secundária. Resolve flags explícitas do snapshot antes de qualquer fallback. Lê vars com coeficientes não nulos e nós nativos de atributos quando disponíveis. Adapters por kit para os híbridos aprovados; catálogo sem coeficientes completos usa fallback identificado como estimated, com evidence. Não constitui auditoria integral de todas as escalas do jogo.
- `isEligibleForChampion` / `eligibilityForItem`: incompatível -> synergyMultiplier=0, removido do pool greedy/counter/afinidade. Removidos bloqueios globais AP/AD por perfil primário. Mana, AS/crítico, classes combinadas e especializações respeitados. Dano híbrido confirmado/curado libera ambos os pools. Vida + AD em itens de lutador/tanque podem aproveitar escala de vida sem justificar AD puro.
- ADCs excluem tanque puro sem atributo ofensivo; sobrevivência com AD/AS/crítico/roubo de vida permanece disponível. Tanques excluem crítico/roubo de vida e dano puro sem atributos defensivos. Azir conserva AS, não recebe pool crítico apenas pela tag Marksman.
- Suportes: auto por rota, seletor Utilidade/Dano nas duas interfaces. Utilidade exclui AP egoísta sem aura/cura/proteção; Dano em rota solo libera AP compatível. Tags de utilidade usam metadados do catálogo, não orçamento ou preços inventados.
- Eligibility e ItemScore marcados estimated; métricas calculadas usam somente efeitos suportados pelo modelo. Permissão de item não gera fórmula de habilidade ausente nem promete ótimo global. Runas de ataque consideram capacidades derivadas da matriz e mantêm requisitos de recurso/CC e travas.
- Validação: 128 testes, incluindo pools AD/AP dos oito híbridos pedidos, ausência de tanque puro em ADCs, bloqueios de magos/bruisers, dados explícitos sobrepondo classe, Azir/Kayle, suporte por rota e modo, e todos os campeões em três pesos com seis itens distintos elegíveis. TypeScript/build necessários antes da publicação. Sem QA de navegador nesta alteração.


## Correções do draft — 2026-10-06
- Composição inicial respeita a rota do jogador e mantém cinco campeões distintos em cada lado. Drafts antigos com IDs ausentes, duplicados ou índice ativo inválido são normalizados sem perder seleções válidas.
- Prévia e aplicação usam a rota do slot ativo e o nível atual. Aplicar o draft inicial persiste toda a composição para o otimizador avaliar os cinco adversários. Tipo de counter explícito, com compatibilidade para presets antigos.
- Validação: 160 testes aprovados, incluindo os 173 campeões nas cinco rotas para inicialização do draft, recuperação de drafts antigos e preservação de inventário/pesos. TypeScript e build de produção aprovados.

- Runas e fragmento de tenacidade consideram todos os inimigos do draft aplicado; adversário desconhecido e extremos do slider preservam bônus zero.


## Afinidade de runas para magos — 2026-10-06
- Scores de runas por kit: burst, poke, dano contínuo de habilidades, encantador e ataques AP. São estimativas curadas de afinidade, sem alegação de ótimo global ou meta observado.
- Magos de habilidades não recebem automaticamente Ritmo Fatal, Chuva de Lâminas ou runas de AS/roubo de vida. Classificação Fighter secundária não comprova sinergia com ataques contínuos. Azir/Kayle/Teemo preservam acesso; Twisted Fate/Neeko podem mudar afinidade com inventário AD/AS explícito.
- Runas de mana, aceleração e defesa seguem requisitos/kit. Travas individuais, páginas travadas, edição manual e estrutura legal de seis runas/três fragmentos preservadas.
- Validação: 164 testes aprovados; varredura de todos os 101 percentuais em 15 magos, expectativas de arquétipos, exceções de ataques AP e travas. TypeScript e build de produção aprovados.


## Afinidade de runas para suportes e tanques — 2026-10-06
- Suportes separados em encantadores, engage, proteção e dano por ataques. Aery valoriza encantadores, Pós-Choque valoriza engage com imobilização, Guardião valoriza proteção de aliados e Aperto valoriza tanques de rota. Suportes de dano preservam afinidade de habilidades; Senna/Pyke possuem perfis próprios.
- Runas menores priorizam cura/escudo, proteção e durabilidade conforme kit. Guardião não exige que o próprio campeão tenha uma habilidade de cura/escudo. Pós-Choque continua condicionado a CC; runas de mana respeitam recurso; travas preservadas.
- Validação: 168 testes aprovados, incluindo magos, suportes/tanques nos extremos e intermediário do slider, oito tanques em 101 percentuais, exceções ofensivas e travas. Scores são heurísticas curadas, não dados de meta nem demonstração de ótimo global.
