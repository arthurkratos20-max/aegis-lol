# Sincronização automática do catálogo Riot

O deploy Vercel é estático. O navegador consulta diretamente a lista oficial de versões do Data Dragon ao abrir, a cada cinco minutos e ao voltar à aba. ChampionFull, itens e runas são obtidos usando uma única URL de patch. Catálogos incompletos ou de versões divergentes são rejeitados. Falhas preservam o catálogo validado mais novo entre IndexedDB e o pacote do deploy; um cache antigo não substitui um pacote mais novo.

O workflow preparado em `docs/refresh-riot-catalog.yml` agenda a execução diária às 09:17 UTC (06:17 em Brasília), além da execução manual, quando instalado em `.github/workflows/refresh-riot-catalog.yml`. O envio dessa configuração foi recusado pela conexão GitHub desta sessão; por isso o agendamento diário não foi ativado. Baixa ambos os idiomas, valida, executa testes/build/TypeScript e só então envia os três arquivos do catálogo para main. A consulta pelo navegador não depende dessa atualização diária nem de novo deploy. Se o GitHub suspender agendamentos ou bloquear commits automáticos por política do repositório, o carregamento direto da Riot continua funcionando.

As fórmulas CommunityDragon, efeitos de stacks e amostras de ordem de habilidades continuam com sua própria versão e cobertura. Não são promovidos ou renomeados automaticamente. Testes de fórmulas nativas antigas utilizam o fixture explicitamente fixado em 16.19.1; as recomendações são testadas no catálogo atual.

## 26.20 / Data Dragon 16.20.1

Fonte das alterações: https://www.leagueoflegends.com/pt-br/news/game-updates/league-of-legends-patch-26-20-notes/

Dados base, cooldowns, custos, descrições de habilidades, itens, runas e skins foram atualizados nos dois idiomas. Ashe tem crescimento de AD 3; Lucian 2,9. Esses dois valores são correções pontuais respaldadas pelas notas oficiais, necessárias porque os endpoints Data Dragon retornam crescimento de AD zero em todo o elenco. As correções só valem para 16.20.1, preservam a origem e não certificam o kit completo. A lacuna nos demais campeões é indicada no badge; não foi preenchida por adivinhação.

A atualização do catálogo não implica DPS completo validado nem vantagem de matchup estatisticamente comprovada. O pacote de ícones locais permanece como fallback visual; futuras imagens ainda ausentes precisam ser atualizadas também.

O snapshot inicial 16.20.1 também é distribuído compactado em quatro partes base64 verificadas por SHA-256. Preparação de testes, build e ingestão restaura os JSON completos quando a cópia local é antiga; versões posteriores válidas nunca são substituídas por esse snapshot. Isso mantém o fallback completo no deploy estático sem depender de um download no momento do build.
