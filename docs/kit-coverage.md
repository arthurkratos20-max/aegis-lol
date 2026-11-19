# Cobertura de kits — auditoria executada em 19 de novembro de 2026

O catálogo Data Dragon 16.23.1 (patch 26.23) contém 173 campeões e os locales pt_BR/en_US. A ingestão está na branch de trabalho. A cobertura de fórmulas de combate para esse catálogo, porém, é **1/173**: um kit parcial (Bardo, somente Q) e 172 sem adapters ativos; zero kits integralmente validados. O adapter do Bardo é isolado, patch-scoped e não inclui passiva, colisão/segundo alvo ou controle de grupo.

## Resultado reproduzido

A cobertura declarada abaixo inclui o adapter patch-scoped recém-adicionado. A auditoria automatizada correspondente está sendo executada no CI do commit atual; o resultado gerado pelo workflow ainda precisa ser confirmado antes de tratar estes números como aprovados.

| Métrica | Resultado |
|---|---:|
| Patch do catálogo | 16.23.1 |
| Campeões auditados | 173 |
| Kits parciais ativos | 1 (Bardo: Q) |
| Kits sem adapters ativos | 172 |
| Kits completos validados | 0 |

O relatório JSON será produzido em `artifacts/kit-coverage-16.23.1.json` pelo CI atual, caso os testes e a auditoria terminem com sucesso.

## Por que os adapters antigos não contam

- `public/data/mechanics.json` permanece em 16.19.1.
- `src/officialAdapters.ts` contém um adapter de Bardo Q, explicitamente vinculado ao patch 16.23.1 e às notas oficiais Riot; não depende do snapshot antigo.
- `src/exactKits.ts` e seu snapshot de efeitos estão certificados apenas para 16.20.1.
- O catálogo atual é 16.23.1. O carregador rejeita a combinação de snapshots incompatíveis e os efeitos exatos antigos ficam desativados.
- `manualMechanicsTemplate` contém apenas seis registros vazios de piloto; não fornece fórmulas executáveis.
- Portanto, os seis kits parciais do snapshot antigo **não estão ativos no patch 16.23.1**. A única cobertura parcial atual é o adapter novo do Bardo Q, com escopo limitado e sem certificação de kit completo.

## O que continua funcionando

- Catálogo de campeões, habilidades descritivas, itens e runas do Data Dragon.
- Seleção de campeões e cenários, pesos ofensivo/defensivo/utilidade e otimização heurística de itens/runas.
- Ações de combate inseridas manualmente pelo usuário.
- Fórmulas isoladas dos seis campeões-piloto somente quando executadas com o snapshot certificado correspondente (16.20.1); elas não são promovidas automaticamente para 16.23.1.
- Avisos de cobertura e bloqueio de modo estrito evitam apresentar estimativas como dano exato.

Essas funcionalidades não equivalem a um simulador fiel de todos os kits no patch atual. A otimização de builds usa heurísticas onde não há cálculo validado.

## Validação técnica

CI anterior (44576440785) validou a base anterior, não este adapter. A validação do novo adapter está pendente no workflow atual.
- Auditoria dos 173 campeões passou e gerou o relatório acima.
- Artefato estático e relatório foram enviados com sucesso.

Para reproduzir a auditoria:

```bash
npm run audit:coverage
```

## Bloqueio para concluir os kits

A ingestão Meraki encontrou 171/173 campeões, com slots P/Q/W/E/R presentes, mas a auditoria do campo `patchLastChanged` revelou que os registros mais recentes chegam somente ao patch 25.15. O catálogo Data Dragon 16.23.1 corresponde ao patch de jogo 26.23. A fonte está, portanto, desatualizada e não pode ser usada para certificar fórmulas atuais. Locke e Zaahen não aparecem no snapshot Meraki.

Foi adicionado `scripts/extract-meraki-formula-review.mjs`, que transforma os efeitos estruturados em um inventário de candidatos para revisão, preservando descrição, valores, unidades, tipo de dano, slot, condições de alvo e notas. O resultado `public/data/meraki-formula-review.json` mantém cada candidato como `unreviewed` e `runtimeEnabled: false`. Isso permite auditar e priorizar fórmulas sem executar coeficientes antigos. A auditoria compara agora a versão mais recente da fonte com a versão de jogo do catálogo, em vez de apenas verificar se os campos existem.

O acesso aos arquivos atuais do CommunityDragon retornou HTTP 403 nas tentativas anteriores. Descrições do Data Dragon e notas de balanceamento não fornecem, sozinhas, todas as fórmulas, condições, múltiplos impactos, recasts, pets, geometria e interações necessárias.

Ainda faltam:
- Adapters de dano/escudo/cura para P/Q/W/E/R de cada campeão.
- Passivas, stacks, marcas, recasts, cargas, formas, pets, DoT, projéteis e condições espaciais.
- Procs, efeitos e grupos exclusivos de itens e runas integrados à simulação.
- Fixtures independentes por campeão e por patch, comparadas com fontes atuais.
- Revalidação do modo estrito após cobertura suficiente e testes de combos/DPS/TTK.

Não é seguro preencher essas lacunas com coeficientes inferidos ou inventados. Cada adapter só deve ser ativado depois de fonte patchada, implementação explícita e fixture independente.

## Próximos marcos

1. Continuar ampliando adapters isolados patch-scoped a partir de notas oficiais, com fixtures e limites explícitos; obter também uma fonte atual de mecânicas para passivas e interações complexas.
2. Atualizar os snapshots mecânicos e criar fixtures por campeão.
3. Implementar e validar kits em lotes pequenos, sem marcar como completos os campeões ainda incompletos.
4. Integrar efeitos de itens/runas e interações ao motor de combate.
5. Revalidar combos, DPS, EHP, TTK e o otimizador; só então considerar liberar modo estrito.


## Inventário externo em quarentena

- Fonte: Meraki Analytics / dados derivados da League of Legends Wiki.
- Cobertura observada: 171/173 campeões; Locke e Zaahen ausentes.
- Atualidade observada: último marcador de alteração 25.15, contra patch de jogo 26.23 no catálogo.
- Todos os registros são apenas candidatos de revisão; nenhum é ativado pelo runtime.
- O inventário preserva fórmulas/descrições estruturadas, mas não resolve automaticamente passivas, recasts, sweetspots, stacks, modificadores condicionais, pets ou geometria.
- A fonte só poderá ser promovida depois de confirmação da versão por campeão, revisão de cada impacto e fixture independente comparada ao patch atual.

### Métricas do inventário gerado em 19/11/2026

O refresh run [44606542886](https://github.com/arthurkratos20-max/aegis-lol/actions/runs/44606542886) concluiu com sucesso e persistiu o inventário na branch:

| Métrica | Resultado |
|---|---:|
| Campeões Meraki encontrados | 171/173 |
| Último patch indicado pela fonte | 25.15 |
| Patch do catálogo | 26.23 |
| Habilidades/slots inventariados | 927 |
| Efeitos estruturados examinados | 2.515 |
| Efeitos com tabelas de nivelamento | 1.019 |
| Candidatos de fórmula extraídos | 1.709 |
| Modificadores com unidade ainda não suportada | 655 |
| Modificadores estruturalmente malformados | 0 |
| Efeitos sem tabela de nivelamento | 1.496 |

Os 1.709 candidatos são linhas de revisão, não 1.709 fórmulas prontas: muitos pertencem a habilidades antigas, condicionais ou com múltiplos impactos. Todos permanecem `unreviewed` e `runtimeEnabled: false`. O campo de unidade desconhecida é preservado em vez de descartado ou convertido por aproximação.
