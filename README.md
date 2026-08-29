# DespachoCerto - Site Institucional

Site institucional do DespachoCerto, uma solução Elev Studio para gestão de
ordens de serviço, clientes, documentos, financeiro e equipe de despachantes
veiculares.

## Estrutura

- `index.html`: página institucional e dados estruturados da marca e do software.
- `site.css`: identidade visual e estilos da página institucional.
- `site.js`: navegação, demonstrações interativas e formulário da página institucional.
- `privacidade.html`: Política de Privacidade do site.
- `cookies.html`: Política de Cookies e inventário de armazenamento.
- `termos.html`: Termos de Uso do site institucional.
- `legal.css`: layout compartilhado pelas páginas legais.
- `legal.js`: comportamento comum e atualização do ano nas páginas legais.
- `site-preferences.js`: consentimento v3, centro de preferências e carregamento autorizado do GA4.
- `site-analytics.js`: eventos de conversão condicionados ao consentimento.
- `inter-latin.woff2`: fonte Inter hospedada localmente, sem chamada externa.
- `site-icon-data.js`: definições Lucide usadas pelo site, reduzidas ao conjunto necessário.
- `api/lead.js`: função server-side que envia pedidos de demonstração pelo Resend.
- `tests/lead-api.test.js`: testes de validação e envio da API de leads.
- `despachocerto-og.png`: imagem para compartilhamento em redes sociais.
- `despachocerto-logo-*.png`: arquivos oficiais da identidade visual.
- `favicon.svg`: ícone do site.
- `robots.txt`: regras para mecanismos de busca.
- `sitemap.xml`: mapa do site.
- `.github/workflows/indexnow.yml`: envio automático das URLs do sitemap ao IndexNow.
- `vercel.json`: rotas limpas, CSP e demais cabeçalhos de segurança.

## Privacidade e segurança

O site usa Google Consent Mode v2 em modo básico. O GA4 não é solicitado antes
de uma autorização explícita para a categoria analítica. A escolha é guardada
no armazenamento local em `despachocerto_consent_v3` e pode ser alterada pelo
botão **Preferências de cookies** em qualquer rodapé.

Rotas legais publicadas:

- `/privacidade`
- `/cookies`
- `/termos`

A Content Security Policy não permite `unsafe-inline` ou `unsafe-eval`, bloqueia
iframes de terceiros e autoriza o JSON-LD da home por hash SHA-256. Sempre que o
conteúdo do bloco `application/ld+json` mudar, atualize o hash em `vercel.json` e
execute `node --test tests/site-security.test.js`.

## Executar localmente

Para testar rotas limpas e cabeçalhos, sirva o projeto por HTTP:

```bash
npx --yes serve . -l 4175
```

Execute a suíte automatizada antes de publicar:

```bash
node --test
```

## Publicar na Vercel

1. Importe este repositório na Vercel.
2. Selecione `Other` como framework, caso seja solicitado.
3. Mantenha a raiz do repositório como diretório do projeto.
4. Não é necessário configurar comando de build.

Configure as variáveis de ambiente do projeto:

- `RESEND_API_KEY`: chave secreta do Resend.
- `LEAD_TO_EMAIL`: opcional; o padrão é `contato@elevstudio.com.br`.
- `LEAD_FROM_EMAIL`: opcional; o padrão é `DespachoCerto <contato@elevstudio.com.br>`.
- `SUPABASE_URL`: URL do projeto que armazena os leads.
- `SUPABASE_SERVICE_ROLE_KEY`: chave server-side do Supabase.
- `LEAD_RATE_LIMIT_SECRET`: segredo usado para pseudonimizar o IP no limite de requisições.
- `TURNSTILE_SITE_KEY`: chave pública do widget Cloudflare Turnstile.
- `TURNSTILE_SECRET_KEY`: chave server-side para validar o Turnstile.

Depois de alterar as variáveis, faça um novo deploy para aplicá-las.

Domínio previsto: `despachocerto.com.br`.

