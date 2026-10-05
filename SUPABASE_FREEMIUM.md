# Supabase e plano FREE/PRO

1. Crie um projeto Supabase e aplique as migrações em `supabase/migrations` na ordem dos nomes. A nova migração `202610040001_user_builds.sql` depende das duas anteriores. Não reaplique migrações já instaladas.
2. Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` nas variáveis de build do Next.js e recompile o site. Nunca coloque `service_role` em variáveis públicas.
3. No Supabase Auth, configure a URL do site e adicione a origem publicada às URLs de redirecionamento. Com confirmação de e-mail ligada, o cadastro solicita confirmação antes de abrir uma sessão.
4. Opcional: defina `NEXT_PUBLIC_PRO_ACTION_URL` com o endereço HTTPS do fluxo de assinatura ou uma rota interna. Sem essa variável, o modal informa que a compra ainda não está disponível; não há checkout simulado.

Sem as duas variáveis do Supabase, a aplicação usa demonstração local FREE. Apenas nome/e-mail são persistidos para a sessão local; senhas não são salvas nem verificadas. Presets locais têm limite de três, por identidade local neste navegador. Não há migração automática de presets locais para a nuvem.

Na nuvem, `my_entitlement()` deriva PRO da tabela protegida `accounts` (assinatura, trial ou papel administrativo). Metadata editável de usuário não concede PRO. `user_builds` usa RLS e trigger com bloqueio da conta para limitar inserções FREE a três, inclusive inserções concorrentes. Usuários PRO não têm limite de plano; armazenamento e cotas operacionais do Supabase continuam aplicáveis. Após expiração, presets existentes permanecem acessíveis, mas novos salvamentos seguem o limite FREE.

Exportação e análise são gates de interface; os dados do laboratório e o motor continuam no cliente. O gate não oculta fórmulas contra inspeção do JavaScript. Operações na nuvem são autorizadas no banco.

Validação local: testes de TypeScript, cálculo, limites e SQL com PGlite. Sem credenciais de um projeto real, autenticação, confirmação de e-mail e persistência hospedada não foram testadas ponta a ponta. As migrações fornecidas não foram aplicadas em um projeto remoto automaticamente.
