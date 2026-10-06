# Imagens locais

Os ícones do catálogo (campeões, passivas, habilidades, itens e runas) são servidos pelo próprio domínio em `/assets/riot/icons`. As artes originais dos campeões estão em `/assets/riot/splash`, otimizadas para WebP. Isso elimina a dependência de acesso ao domínio da Riot para os ícones e as artes originais, inclusive em redes que bloqueiam sites de jogos.

As artes de skins alternativas ainda usam Data Dragon, com retorno à arte original local quando o acesso falha. Os dados e a autenticação mantêm suas integrações existentes.

Ao atualizar o catálogo, execute `python scripts/sync-image-assets.py` dentro do projeto antes de compilar (Python 3 e Pillow). Os assets ficam incluídos na publicação; os visitantes não executam o download. O script valida o formato dos PNGs, tenta novamente falhas transitórias e registra as imagens no manifest. Os testes conferem todas as referências dos catálogos pt_BR e en_US.

Assets de League of Legends pertencem à Riot Games. Aegis não é endossado pela Riot.

## Publicação no GitHub/Vercel

As partes `assets/riot-images.part-*` são reunidas durante a build em `assets/riot-images.tar.gz`, que contém todas as imagens locais. Os comandos npm de desenvolvimento, testes e build extraem esse pacote automaticamente antes de iniciar. A aplicação continua servindo os arquivos de `/assets/riot/`. Após atualizar as imagens, regenere o pacote com `tar -czf assets/riot-images.tar.gz -C public/assets riot`.

Após regenerar o pacote, execute `split -b 600000 -d -a 3 assets/riot-images.tar.gz assets/riot-images.part-` e publique as partes atualizadas.
