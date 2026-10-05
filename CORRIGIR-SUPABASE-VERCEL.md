# Diagnóstico: demonstração FREE e Supabase não configurado

As duas mensagens observadas são consistentes: a build abriu sem uma URL e uma chave pública do Supabase. O nome mostrado no modo de demonstração não é uma identidade autenticada pelo Supabase. A whitelist PRO só libera o proprietário depois de `auth.getUser()` validar o e-mail confirmado.

## Corrigir na Vercel

1. Abra o projeto que publica `aegis-lol.vercel.app` → Settings → Environment Variables.
2. Em **Production**, configure `NEXT_PUBLIC_SUPABASE_URL` com a Project URL do Supabase e uma das chaves públicas: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon antiga) **ou** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (publishable atual). Esses valores precisam ser do mesmo projeto Supabase. Variáveis `SUPABASE_URL` sem o prefixo `NEXT_PUBLIC_` não configuram este cliente no navegador.
3. Faça um novo deploy da branch `main`. Alterar as variáveis depois da build não modifica os arquivos estáticos já publicados. No Redeploy, evite reutilizar o build cache se a versão continuar exibindo demonstração.
4. No Supabase → Authentication → URL Configuration, confirme `https://aegis-lol.vercel.app` na Site URL e Redirect URLs.
5. Se ainda não aplicada, execute a migração `supabase/migrations/202610050001_dynamic_plans.sql` no SQL Editor. Ela depende das migrações anteriores; não reaplique migrações já instaladas.
6. No site, clique em Sair/Sair da demonstração e entre novamente com `arthurkratos20@gmail.com`. Confirme o e-mail no Supabase. O plano do proprietário passa a PRO tanto no modo rápido quanto no manual.

Use somente chaves públicas no frontend. Nunca configure service_role como NEXT_PUBLIC.

## Correções nesta versão

- Account e SessionBadge leem o mesmo AuthProvider. Login, logout e plano não têm estados de autorização independentes.
- Permissões de edição/administração no laboratório também leem o contexto compartilhado.
- A demonstração mostra “sem conta Supabase”, para não confundir um mock com uma conta real FREE.
- Falhas de configuração mostram os nomes das variáveis ausentes, sem mostrar chaves.
- Cliente aceita a chave anon ou publishable e não quebra com uma URL inválida.
- Ícones de atributos nos controles, comparador, painel manual e fragmentos do card compartilhado; rótulos de texto continuam visíveis.

A aplicação usa `accounts` como perfil autoritativo, por meio de `my_entitlement()`. `user_builds` armazena presets, não o plano.
