# GitHub Explorer Greg

App estático (HTML + Tailwind via CDN + JS modular) para explorar perfis e repositórios públicos do GitHub.

## Funcionalidades (MVP)
- Busca de usuário com debounce (~400ms)
- Exibe perfil (/users/:username)
- Lista repositórios (/users/:username/repos?per_page=10&page=1&sort=updated)
- Paginação (Anterior/Próxima)
- Filtros: linguagem e stars mín. (client-side)
- Ordenação: updated ou stars (client-side)
- Dark mode com toggle e persistência
- Acessibilidade: labels/aria, foco visível, aria-live para loading/erro
- Estados: loading, empty, erro (404/403). Se 403 por rate limit, mostra tempo estimado

## Tecnologias
- HTML estático
- Tailwind CSS via CDN
- JavaScript ES Modules

## Como rodar
- Use uma extensão Live Server no VS Code ou qualquer servidor HTTP simples.
- Abra a URL local e pesquise um usuário.

## Fontes (Google)
- Inter e Manrope com preconnect + display=swap para reduzir FOUT/CLS e acelerar renderização.

## Limites da API do GitHub
- Não autenticado: ~60 requisições/hora por IP.
- Quando atingir 403 (rate limit), exibimos tempo estimado com base no header X-RateLimit-Reset.
- Cache com sessionStorage por 10 minutos reduz chamadas repetidas.

## Querystring
`?u=USERNAME&page=1&lang=JavaScript&stars=10&sort=updated|stars`

## Estrutura
```
index.html
assets/og.png
src/api.js
src/state.js
src/ui.js
src/utils.js
.prettierrc
.editorconfig
.gitignore
README.md
LICENSE
vercel.json
```

## Deploy (Vercel)
- Tipo: Other
- Sem build
- Output: /
- `vercel.json` adiciona cache para `/assets`.

## Licença
MIT
