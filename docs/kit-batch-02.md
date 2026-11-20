# Lote 02 — cobertura parcial validada (LoL base / Summoner's Rift)

## Campeões

1. Gragas
2. Graves
3. Gwen
4. Hecarim
5. Heimerdinger
6. Illaoi

**Escopo:** Summoner's Rift moderno, catálogo 16.23.1 (patch 26.23). Nenhuma fórmula de League of Legends Classic é utilizada.

## Estado real

Os seis campeões possuem declarações P/Q/W/E/R e opções nativas ligadas a adaptadores de dano patch-scoped. Os efeitos cobertos têm testes de fórmula, estados ou interações específicas. **Nenhum dos seis kits é completo ou certificado como exato.** A presença de uma habilidade no catálogo ou no seletor não significa que sua rotação esteja simulada.

O teste de lote verifica agora que todas as opções nativas declaradas para estes seis campeões resolvem para um adaptador 16.23.1 e produzem valores finitos não negativos. Isso valida a integridade das opções isoladas; não valida geometria, duração, número de alvos nem DPS real de pets/projéteis.

## Cobertura implementada

| Campeão | Efeitos já representados | Lacunas relevantes |
|---|---|---|
| Gragas | P: cura e cooldown por nível; Q mínimo/máximo; W: redução defensiva e ataque fortalecido; E: dano/atordoamento/reembolso em acerto; R: impacto | Fermentação e tempo do Q; área/terreno/knockback; dano em estruturas e limite em monstros |
| Graves | P: baseline conservador do primeiro projétil; Q: impacto/detonação separados; W: impacto; E: True Grit e resistências; R: impacto direto/cone separados | Pellets e distância; munição/recarga; geometria/terreno; nuvem, slow e nearsight; recuo |
| Gwen | P: dano adicional em ataques; Q: faixas agregadas; W: resistências temporárias; E: AS e ataque fortalecido; R: lançamentos separados e dano por vida máxima | Centro verdadeiro do Q e stacks Snippy; cura da P; fronteira/untargetability da W; dash/reembolso do E; condições e slow dos recasts do R |
| Hecarim | P: conversão de velocidade em AD; Q: stacks, amplificação e redução de recarga; W: dano agregado, resistências e cura do próprio dano; E: mínimo/máximo; R: dano | Expiração individual de stacks; ticks/área e cura de aliados no W; carga/distância/knockback do E; trajetória, alvos e fear do R |
| Heimerdinger | P: bônus de movimento quando proximidade é informada; Q: tiro básico; W: primeiro foguete; E: impacto; R+E: explosão | Proximidade automática; ciclo de torretas/laser/cargas; salva completa e convergência de foguetes; área/stun; variantes R+Q e R+W |
| Illaoi | Q: golpe isolado; W: bônus de vida máxima; E: espírito, duração e eco limitado pela vida do espírito; R: impacto inicial | Cadência/cura da P; ataques e tentáculos do W; vida/mitigação/slow do espírito e tentáculos do E; área, número de alvos e tentáculos acelerados do R |

## Restrições de interpretação

- Os impactos mínimos/máximos alternativos são variantes manuais; não devem ser somados automaticamente quando representam cenários mutuamente exclusivos.
- O dano agregado de Hecarim W não reproduz os quatro eventos temporais.
- O primeiro projétil de Graves é uma aproximação conservadora declarada, não uma simulação fiel da espingarda.
- A detecção de proximidade de Heimerdinger depende do estado explícito `heimer-turret-nearby`; o motor não calcula posição no mapa.
- O eco de Illaoi usa o dano bruto limitado pela vida restante do espírito; a simulação espacial do espírito ainda é simplificada.
- Fórmulas da Gwen R incluem a parcela de dano por vida máxima correspondente à passiva no valor agregado de cada lançamento; a passiva não é um proc independente adicional no R.

## Critério para promover um campeão a completo

É necessário implementar e testar passiva e Q/W/E/R com fórmulas atuais, gatilhos, duração, stacks, recasts, múltiplos impactos, tipos de dano, alvos e condições espaciais relevantes. Não promover por mera cobertura de slots. Enquanto faltar geometria ou dados de fonte, manter o kit como parcial.

## Próximo passo

O lote 02 ainda não satisfaz o critério de kit completo. As lacunas acima permanecem registradas e não devem ser ocultadas para iniciar o lote seguinte.