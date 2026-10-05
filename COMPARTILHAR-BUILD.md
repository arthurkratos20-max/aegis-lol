# Compartilhar build e atualizar a Vercel

Os arquivos do repositório ficam na raiz. No checkout da prévia, os mesmos arquivos ficam sob `source/`.

## Arquivos para copiar/substituir

| Arquivo | Responsabilidade |
| --- | --- |
| `src/auth/AuthProvider.tsx` | Sessão Supabase, sincronização e contexto global |
| `src/auth/planAccess.ts` | SUPER_USERS e verificação do plano |
| `src/auth/entitlementCache.ts` | Último plano sincronizado, somente offline |
| `src/auth/mockAuth.ts` | Tipos de usuário e demonstração FREE |
| `src/auth/SessionBadge.tsx` | Plano atual e estado de sincronização |
| `src/services/supabase.ts` | Cliente e consulta my_entitlement |
| `supabase/migrations/202610050001_dynamic_plans.sql` | Plano/validade/ciclo e proprietário PRO no banco |
| `src/buildShare.ts` | Link versionado e compactado; validação ao abrir |
| `src/ShareBuildModal.tsx` | Card, QR Code, PNG e copiar link |
| `src/Laboratory.tsx` | Carregamento do link e botão no editor |
| `src/QuickLab.tsx` | Botão para a sugestão atual do slider |
| `app/globals.css` | Estilos do card e modal |
| `package.json` e `package-lock.json` | Dependências de exportação e QR Code |
| `tests/buildShare.test.ts` e `tests/plans.test.ts` | Verificações de links, planos e autorização SQL |

Com o repositório atualizado, não é necessário colar trechos individualmente.
Para instalar somente as novas dependências:

```sh
npm install html-to-image qrcode lz-string
npm install --save-dev @types/qrcode
```

## Supabase existente

A aplicação já consulta o perfil em `accounts`, que é a tabela de contas do projeto. `user_builds` contém presets privados e não deve ser usada como fonte de plano.
Execute **somente** `202610050001_dynamic_plans.sql` no SQL Editor se as migrações anteriores já foram aplicadas. Não reaplique uma migração já instalada. O e-mail confirmado `arthurkratos20@gmail.com` recebe PRO permanente no cliente e no servidor.
Se seu banco usa uma tabela `profiles` diferente da estrutura deste repositório, migre/alinhe os perfis com `accounts` antes da publicação; não mantenha duas fontes de autorização independentes. Consulte `PLANOS-SUPABASE.md`.

## Vercel já conectada

1. Confira Settings → Git: repositório `arthurkratos20-max/aegis-lol`, branch Production `main`. Neste repositório o `package.json` fica na raiz; Root Directory deve estar vazio ou `.`.
2. Confira Settings → Environment Variables: `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` precisam existir para Production. Preserve os valores do seu projeto Supabase. Não use service_role no frontend.
3. Após o envio ao GitHub, confira Deployments. Se não houve deploy automático, use Redeploy na versão mais recente. Alterações nas variáveis NEXT_PUBLIC exigem uma nova build.
4. No Supabase Auth → URL Configuration, mantenha o domínio da Vercel em Site URL e Redirect URLs. Entre novamente com seu e-mail confirmado.

Não é necessário recriar o Supabase nem o projeto Vercel.

## Card e link

O botão captura a sugestão atual do slider ao abrir. O PNG inclui campeão, nível, rota, seis slots em ordem, runas, fragmentos, matchup, build adversária e QR Code. O QR e o botão de copiar apontam para o mesmo link no domínio atual.
O link contém somente uma configuração compactada no fragmento `#build=`. Não inclui e-mail, token, plano, senha ou dados privados da conta. Não exige salvar um preset no banco; o destinatário pode abrir sem login. O patch deve ser compatível.
Itens e runas recebidos são travados para preservar a build; podem ser destravados no laboratório. O link compartilha a configuração de build e atributos; não exporta rotações personalizadas de habilidades.
Baixar/copiar mantém o gate PRO existente. Isso é uma restrição de interface; fórmulas e snapshots continuam no cliente.
O download do PNG depende do navegador suportar SVG/Canvas e de acesso aos ícones da Riot. Falhas mostram mensagem e permitem nova tentativa. O QR Code é gerado no navegador, sem serviço externo.
