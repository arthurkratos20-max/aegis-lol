# Aegis LoL — abrir no VS Code

1. Extraia este ZIP.
2. No VS Code, use Arquivo → Abrir Pasta e escolha `aegis-lol` (a pasta com `package.json`).
3. Instale Node.js 22 ou superior, se ainda não tiver.
4. Abra Terminal → Novo Terminal e execute:

```bash
npm ci
npm run dev
```

Abra http://localhost:3000 no navegador. Para parar, pressione Ctrl+C no terminal.

## Verificações

```bash
npm test
npm run typecheck
npm run build
```

O pacote inclui a versão publicada do projeto: engine, slider contínuo, grupos exclusivos, comparador, seleção/travas de runas, presets FREE e gate PRO. É uma aplicação Next.js/React/TypeScript para VS Code; não é uma solução .sln do Visual Studio.

## Supabase

O laboratório funciona localmente sem credenciais. O modo local é FREE e salva até três presets no navegador. Para conectar uma conta real, copie `.env.example` para `.env.local`, preencha apenas a URL e a chave pública anon/publishable do seu projeto Supabase e siga `SUPABASE_FREEMIUM.md`. As migrações SQL e funções estão em `supabase/`. Não envie `.env.local` ao GitHub. Nunca use `service_role` em variáveis NEXT_PUBLIC.

## Enviar ao GitHub

Crie um repositório vazio `aegis-lol` na conta `arthurkratos20-max`, sem README/licença/gitignore. Na pasta deste projeto:

```bash
git init
git branch -M main
git add .
git status
git commit -m "Publica projeto Aegis LoL"
git remote add origin https://github.com/arthurkratos20-max/aegis-lol.git
git push -u origin main
```

O `.gitignore` incluído evita enviar dependências, builds e arquivos de ambiente. GitHub Desktop também pode publicar esta pasta, caso prefira uma interface gráfica.

## Limites

A engine é exploratória: várias passivas e interações ainda não estão modeladas. Runas usam scores heurísticos onde faltam fórmulas; o otimizador guloso não garante ótimo global. TTK extrapola o DPS médio da janela configurada. O gate PRO protege a interface; os cálculos continuam no cliente. Sem credenciais, não há conexão real ao Supabase nem checkout ativo. Consulte as demais documentações incluídas.

Dependências e arquivos compilados não estão no ZIP; `npm ci` os instala conforme o lockfile.
