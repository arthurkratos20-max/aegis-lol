# Planos FREE e PRO

O perfil autoritativo é `public.accounts`. `user_builds` armazena presets.
`AuthProvider` consulta `my_entitlement()` com identidade validada por `auth.getUser()`.
O banco determina `plan`, validade, papel e ciclo de cobrança; metadados editáveis não autorizam PRO.

## Configuração

1. Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no ambiente de build do Next.js e gere uma nova versão. Nunca publique a service-role key no frontend.
2. Aplique as migrações de `supabase/migrations` em ordem. Se as anteriores já estão aplicadas, execute somente `202610050001_dynamic_plans.sql` no SQL Editor do seu projeto Supabase.
3. Entre com `arthurkratos20@gmail.com` e confirme o e-mail. Essa identidade recebe PRO vitalício no cliente e no RPC do banco. A migração promove o perfil já confirmado para owner.

Sem as variáveis, a aplicação mantém o modo de demonstração FREE, sem sessão persistida e sem permissões de administrador.
A sessão Supabase é persistida pelo SDK. O plano não é salvo no localStorage. Um cache separado em IndexedDB mantém o último resultado sincronizado por até 24 horas para uso offline com sessão ainda válida; ele nunca autoriza operações no backend.
Mudanças de conta são acompanhadas pelo Realtime (accounts), foco da janela, reconexão e consulta a cada 60 segundos.

## Atribuição de plano pelo servidor

Para uma assinatura gerenciada manualmente, execute pelo SQL Editor/servidor:

```sql
update public.accounts
set plan='pro', billing_cycle='monthly', plan_expires_at=now()+interval '1 month'
where id='UUID_DO_USUARIO';
```

Para anual, use `billing_cycle='annual'` e `interval '1 year'`.
`plan='pro'` com `plan_expires_at=null` é uma concessão permanente feita pelo administrador.
Os webhooks existentes continuam usando `pro_until`, que também habilita PRO enquanto válido. Não grave uma concessão manual permanente para assinaturas controladas por webhook.
O cliente autenticado possui apenas SELECT em accounts; não pode alterar seu próprio plano.
Uma falha de sincronização online não restaura um PRO em cache. O cabeçalho indica sincronização pendente.
