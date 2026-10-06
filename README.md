# Aegis Lab — Engine → Otimizador → Interface

Código TypeScript/React/Next.js para análise exploratória de builds de LoL.

## Executar

Node compatível com Next 16 e `--experimental-strip-types` (ambiente verificado: Node 22+).

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run dev
```

`out/` é a exportação estática. Não inclui servidor Node em produção.

## Ordem dos módulos

1. `src/contracts.ts`, `src/model.ts`, `src/native.ts`, `src/engine.ts`: contratos, atributos, fórmulas extraídas e combate 1v1 determinístico.
2. `src/optimizer.ts`, `src/optimizer.worker.ts`: busca de itens, custos, travas, upgrades, vendas autorizadas, score e alternativas.
3. `src/Laboratory.tsx`, `src/components.tsx`, `app/globals.css`: interface responsiva integrada aos módulos anteriores.

## Limites reais

Resultados exploratórios. Modo Estrito permanece bloqueado. Passivas de itens, runas, dragões, grupos únicos e várias exceções de campeões não estão implementados. Nenhuma recomendação representa ótimo global ou meta observado. Fórmulas piloto extraídas não equivalem à validação completa de um campeão. Cast representa lockout; impacto continua instantâneo no tempo da ação, sem projétil/geometria. Valores esperados de crítico/acerto não representam trajetória aleatória. Subpesos são rascunhos e não entram no score.

Supabase é opcional para uso local. Copie `.env.example` e configure um projeto próprio para contas/persistência. Migrações e funções estão incluídas, mas conexão, cobrança e publicação não foram verificadas em serviços reais nesta entrega. Nenhum preço ou segredo é incluído. UI PRO não constitui proteção de cálculos enviados ao navegador.

Leia `docs/progress.md` para a validação realizada e `docs/formulas/core.md` para as hipóteses.
