# Arquitetura

Engine pura → Otimizador puro → Web Worker → UI React. UI armazena cenário versionado localmente. Alterações invalidam resultados e encerram workers antigos. Cancelamento da UI encerra o worker; callback cancelled serve a execuções em Node. Workers não podem processar mensagem de cancelamento durante uma função síncrona; por isso terminate é utilizado.

Supabase: Auth/PostgreSQL, migrações RLS e funções protegidas incluídas. Nenhuma key secreta deve ser enviada ao cliente. Frontend exportado para hospedagem estática gratuita. Nenhum deploy ocorreu nesta revisão.
