# Implantação

Frontend: npm ci && npm run build; publicar out em hospedagem estática. Supabase: provisionar projeto próprio, aplicar migrações em ordem e configurar variáveis públicas de .env.example. Secrets de funções somente no servidor. Validar políticas RLS e SMTP antes de abrir contas. Revisar quotas e documentação atual do provedor antes de implantação.

Migrações RLS testadas em PGlite local; Supabase remoto, functions, webhooks de provedores e permissões de produção exigem validação adicional. Checkout não está aprovado para cobrança real. Não existe URL publicada nesta entrega.
