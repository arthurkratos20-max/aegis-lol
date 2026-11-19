# Implantação

Frontend: npm ci && npm run build; publicar out em hospedagem estática. Supabase: provisionar projeto próprio, aplicar migrações em ordem e configurar variáveis públicas de .env.example. Secrets de funções somente no servidor. Validar políticas RLS e SMTP antes de abrir contas. Revisar quotas e documentação atual do provedor antes de implantação.

Migrações RLS testadas em PGlite local; Supabase remoto, functions, webhooks de provedores e permissões de produção exigem validação adicional. Checkout não está aprovado para cobrança real. Não existe URL publicada nesta entrega.


## Sincronização protegida de patches

O endpoint `POST /api/patch/sync` exige o segredo `PATCH_SYNC_TOKEN` configurado como secret no ambiente do Cloudflare Worker. Use um valor aleatório com pelo menos 32 caracteres e envie `Authorization: Bearer <PATCH_SYNC_TOKEN>` somente a partir de um agendador ou serviço confiável. Não exponha esse segredo em variáveis `NEXT_PUBLIC_*`, no bundle do navegador ou no repositório. Sem o secret, o endpoint falha fechado com HTTP 503; credencial incorreta recebe HTTP 401. Rotacione o secret se houver suspeita de exposição.

A rotina GitHub Actions `Refresh Riot catalog` executa diariamente e também pode ser iniciada manualmente. Ela atualiza os dois idiomas, roda testes, typecheck e build e abre um pull request para revisão; não publica diretamente na `main`. Para que a criação automática do PR funcione, habilite em Settings → Actions → General a permissão de GitHub Actions para criar pull requests. O catálogo novo só entra em produção após revisão e merge do PR.
