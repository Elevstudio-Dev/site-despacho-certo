# DespachoCerto - Site Institucional

Site institucional do DespachoCerto, uma solução Elev Studio para gestão de
ordens de serviço, clientes, documentos, financeiro e equipe de despachantes
veiculares.

## Estrutura

- `index.html`: página institucional completa.
- `privacidade.html`: Política de Privacidade e Cookies do site.
- `site-preferences.js`: preferências de privacidade e carregamento autorizado do GA4.
- `site-analytics.js`: eventos de conversão condicionados ao consentimento.
- `inter-latin.woff2`: fonte Inter hospedada localmente, sem chamada externa.
- `lucide.min.js`: biblioteca de ícones servida pelo próprio site.
- `api/lead.js`: função server-side que envia pedidos de demonstração pelo Resend.
- `tests/lead-api.test.js`: testes de validação e envio da API de leads.
- `despachocerto-og.png`: imagem para compartilhamento em redes sociais.
- `despachocerto-logo-*.png`: arquivos oficiais da identidade visual.
- `favicon.svg`: ícone do site.
- `robots.txt`: regras para mecanismos de busca.
- `sitemap.xml`: mapa do site.
- `vercel.json`: configuração de publicação e cabeçalhos de segurança.

## Executar localmente

O site é estático e pode ser aberto diretamente pelo arquivo `index.html`.

Para servir por HTTP:

```bash
npx serve .
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

Depois de alterar as variáveis, faça um novo deploy para aplicá-las.

Domínio previsto: `despachocerto.com.br`.

