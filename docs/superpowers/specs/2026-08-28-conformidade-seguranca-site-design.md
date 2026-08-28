# Conformidade, Consentimento e Segurança do Site DespachoCerto

**Data:** 28 de agosto de 2026
**Status:** aprovado para planejamento
**Escopo:** primeira entrega do fechamento do site institucional

## Objetivo

Concluir os itens parciais de conformidade, consentimento, identidade estruturada e segurança de navegador do site `despachocerto.com.br`, mantendo o carregamento rápido, a experiência atual e a coleta conservadora de dados.

Esta entrega transforma a implementação atual em uma base auditável: políticas separadas, consentimento versionado e revogável, dados estruturados completos e uma Content Security Policy aplicada sem depender de `unsafe-inline`.

## Responsável jurídico

O site apresentará a marca DespachoCerto como uma solução da Elev Studio e identificará o responsável da seguinte forma:

- Nome empresarial: `62.574.201 Carlos Eduardo Filho da Conceição`.
- Nome utilizado publicamente: `Elev Studio`.
- CNPJ: `62.574.201/0001-50`.
- Localidade pública: `Tubarão/SC`.
- Canal de privacidade e atendimento: `contato@elevstudio.com.br`.

O endereço residencial completo não será publicado no site institucional. A identificação por nome empresarial, CNPJ, cidade, estado e canal eletrônico será usada nas páginas legais. O endereço completo poderá constar em contratos comerciais quando necessário.

Os documentos terão caráter informativo e operacional, sem alegar substituição de revisão jurídica profissional. A adequação dos CNAEs será tratada pela Elev Studio separadamente e não bloqueará esta entrega.

## Limites desta entrega

Incluído:

- revisão da Política de Privacidade;
- criação de Política de Cookies separada;
- criação de Termos de Uso do site institucional;
- banner com Aceitar, Recusar e Preferências;
- painel acessível de preferências;
- consentimento versionado, revogável e compatível com Google Consent Mode v2;
- dados estruturados `WebSite`, `Organization`, `Brand`, `SoftwareApplication` e `FAQPage`;
- logo oficial e identificação jurídica nos dados estruturados;
- extração de CSS e JavaScript executável que hoje estão dentro dos arquivos HTML;
- CSP aplicada, bloqueio de iframe e cabeçalhos complementares;
- testes automatizados e verificação visual em produção.

Não incluído:

- contrato de licenciamento, SLA ou tratamento de dados do SaaS;
- política interna do aplicativo autenticado;
- armazenamento de leads, CRM, confirmação automática e página de agradecimento;
- rate limit, Cloudflare Turnstile e alertas do Resend;
- alteração de SPF, DKIM, DMARC ou BIMI;
- novas páginas de conteúdo SEO.

Os itens não incluídos pertencem às entregas seguintes: funil de leads, conteúdo SEO e monitoramento/distribuição.

## Abordagem escolhida

Será mantida uma solução própria e leve, adequada ao cenário atual de duas categorias:

1. **Necessários:** recursos indispensáveis para funcionamento e para memorizar a escolha de privacidade. Sempre ativos.
2. **Analíticos:** Google Analytics 4. Desativados por padrão e carregados somente depois de autorização explícita.

Não será adotada uma plataforma externa de gestão de consentimento. O site não usa publicidade, remarketing ou personalização de anúncios, portanto uma CMP paga adicionaria custo, dependências e impacto de desempenho sem benefício proporcional.

## Arquitetura de arquivos

### Arquivos novos

- `cookies.html`: Política de Cookies, tabela de tecnologias e instruções de revogação.
- `termos.html`: Termos de Uso do site institucional.
- `site.css`: estilos extraídos da página inicial.
- `site.js`: interações da página inicial extraídas do HTML.
- `legal.css`: estilos compartilhados pelas três páginas legais.
- `legal.js`: interações comuns das páginas legais, sem lógica de consentimento.
- `tests/site-legal.test.js`: cobertura das páginas legais, links e identificação jurídica.
- `tests/site-security.test.js`: cobertura de CSP, cabeçalhos e ausência de código executável inline.
- `tests/site-structured-data.test.js`: validação sintática e semântica do JSON-LD.

### Arquivos modificados

- `index.html`: referências externas de CSS/JS, novo JSON-LD e links legais.
- `privacidade.html`: conteúdo revisado e estilos/scripts externos.
- `site-preferences.js`: preferência versionada, migração e painel granular.
- `site-analytics.js`: manutenção dos eventos condicionados ao consentimento.
- `vercel.json`: CSP e cabeçalhos de segurança.
- `sitemap.xml`: inclusão de `/cookies` e `/termos`.
- `README.md`: documentação do comportamento de consentimento e dos testes.
- `tests/site-consent.test.js`: novos fluxos de preferência e migração.
- `tests/site-analytics.test.js`: garantia de que eventos permanecem bloqueados sem consentimento.

## Experiência de consentimento

### Primeira visita

O banner continuará visível no HTML antes da execução do JavaScript, evitando atraso visual e bloqueio por filtros cosméticos. Ele apresentará três comandos:

- **Recusar:** registra Analytics como negado e fecha o banner.
- **Preferências:** abre o painel de categorias sem registrar uma decisão.
- **Aceitar analíticos:** registra Analytics como permitido e carrega o GA4.

O texto explicará, em linguagem curta, que os recursos necessários permanecem ativos e que o Analytics é opcional.

### Painel de preferências

O painel será um diálogo acessível com:

- categoria Necessários, visível e permanentemente ativada;
- categoria Analíticos, controlada por um toggle;
- botão Salvar preferências;
- botão Fechar que não altera a escolha;
- links para as Políticas de Privacidade e Cookies.

O foco será movido para o diálogo quando ele abrir e devolvido ao elemento de origem quando fechar. `Escape` fechará o painel sem salvar. O conteúdo permanecerá operável por teclado e leitor de tela.

### Persistência e versão

A chave anterior `despachocerto_analytics_preference_v2` será migrada para `despachocerto_consent_v3`. O novo valor será um objeto JSON com:

```json
{
  "version": "2026-08-28",
  "analytics": "granted",
  "updatedAt": "2026-08-28T20:00:00.000Z"
}
```

O horário será gerado no navegador. Nenhum nome, telefone, e-mail ou identificador do formulário será armazenado nessa preferência.

Uma escolha compatível e na versão atual esconderá o banner nas visitas seguintes. Uma preferência ausente, inválida ou de versão anterior exibirá novamente o banner. Se o armazenamento do navegador estiver indisponível, a escolha valerá apenas para a página atual e o comportamento permanecerá fechado por padrão.

### Consent Mode v2

O site continuará usando o modo básico e conservador:

- `ad_storage`: `denied`;
- `ad_user_data`: `denied`;
- `ad_personalization`: `denied`;
- `analytics_storage`: `denied` antes da autorização;
- `analytics_storage`: `granted` somente após aceitação.

Nenhuma requisição ao Google será feita antes da autorização. Ao revogar Analytics, o site atualizará o consentimento, apagará cookies `_ga`, `_ga_*` e `_gid` acessíveis no domínio e recarregará a página para interromper a instância já carregada.

## Conteúdo legal

### Política de Privacidade

A página `/privacidade` será revisada para informar:

- responsável jurídico e contato;
- dados fornecidos no formulário;
- dados técnicos processados pela Vercel;
- finalidades, bases legais e coleta mínima;
- fornecedores Vercel, Resend e Google Analytics;
- retenção e critérios de eliminação;
- direitos previstos na LGPD e canal para exercício;
- transferências internacionais associadas aos fornecedores;
- medidas de segurança e atualização da política;
- vínculo para Política de Cookies e Termos de Uso.

### Política de Cookies

A página `/cookies` explicará:

- diferença entre armazenamento necessário e cookies analíticos;
- preferência local `despachocerto_consent_v3`;
- cookies GA4 `_ga` e `_ga_<container-id>`, com duração padrão de até dois anos;
- finalidade, fornecedor e condição de ativação;
- como aceitar, recusar, revogar e apagar cookies pelo navegador;
- ausência atual de cookies publicitários.

### Termos de Uso

A página `/termos` cobrirá apenas o site institucional:

- identificação da Elev Studio e da marca DespachoCerto;
- finalidade informativa e comercial do site;
- regras de uso lícito;
- propriedade intelectual;
- conteúdo demonstrativo do sistema;
- formulário e veracidade das informações;
- links externos e disponibilidade;
- privacidade e cookies;
- atualização dos termos, legislação brasileira e canal de contato.

O documento declarará expressamente que contratação, licenciamento, suporte, disponibilidade e tratamento de dados dentro do sistema serão regidos por instrumento comercial próprio.

## Dados estruturados

O grafo JSON-LD da página inicial terá nós conectados por `@id`:

- `WebSite #website`: nome `DespachoCerto`, alternativa `Despacho Certo`, URL canônica e publisher.
- `Organization #organization`: nome `Elev Studio`, nome empresarial, CNPJ em `taxID`, e-mail, telefone, cidade/UF, URL da Elev Studio e logo quadrado de 512 px.
- `Brand #brand`: nome `DespachoCerto`, URL e logo oficial.
- `SoftwareApplication #software`: descrição e funcionalidades atuais, publisher e brand.
- `FAQPage #faq`: perguntas e respostas que já aparecem visualmente na página.

Não serão incluídas avaliações, preços, perfis sociais ou endereço completo enquanto esses dados não estiverem publicados e verificáveis.

## Política de segurança do navegador

### Extração de código inline

O CSS da página inicial irá para `site.css`. O JavaScript executável da página inicial irá para `site.js`. As páginas legais usarão `legal.css` e `legal.js`.

Os nove atributos `style` existentes na página inicial também serão removidos. Larguras de barras, alturas de gráficos e a cor excepcional do texto serão representadas por classes CSS explícitas, para que a política `style-src 'self'` não dependa de exceções para estilos inline.

O JSON-LD permanecerá inline por exigência prática de mecanismos de busca, mas será autorizado por hash SHA-256 específico na CSP. Um teste calculará o hash do conteúdo e exigirá correspondência com `vercel.json`.

### Cabeçalhos

`vercel.json` aplicará a todas as páginas:

- `Content-Security-Policy` com `default-src 'self'`;
- `script-src` limitado ao próprio domínio, Google Tag Manager e hash do JSON-LD;
- `connect-src` limitado ao próprio domínio e endpoints necessários do GA4;
- `img-src` limitado ao próprio domínio, `data:` e endpoints necessários do GA4;
- `style-src 'self'`;
- `font-src 'self'`;
- `object-src 'none'`;
- `base-uri 'self'`;
- `form-action 'self'`;
- `frame-ancestors 'none'`;
- `upgrade-insecure-requests`;
- `X-Frame-Options: DENY` como compatibilidade adicional;
- manutenção de `X-Content-Type-Options`, `Referrer-Policy` e `Permissions-Policy`;
- `Cross-Origin-Opener-Policy: same-origin`.

A CSP será aplicada diretamente depois de testes locais e de produção. Não será usada `unsafe-inline` nem `unsafe-eval`.

## Fluxos de erro

- Falha ao ler ou gravar preferências: Analytics permanece bloqueado e a escolha vale somente na página atual.
- Valor de preferência inválido: banner reaparece.
- Falha ao carregar GA4 após aceitação: navegação e formulário continuam funcionando; nenhum erro é exibido ao visitante.
- JavaScript desativado: políticas e conteúdo continuam acessíveis, e o banner permanece visível com texto explicativo.
- CSP incorreta: testes de recursos e console bloqueiam a publicação até o problema ser corrigido.
- Página legal indisponível: testes HTTP em produção impedem considerar a entrega concluída.

## Testes e critérios de aceite

### Automatizados

- todos os testes atuais continuam passando;
- migração de `v2` para `v3` coberta;
- primeira visita não carrega GA4;
- aceitar carrega GA4 e atualiza Consent Mode v2;
- recusar não carrega GA4;
- painel salva, cancela e revoga preferências;
- nenhuma informação pessoal é enviada ao GA4;
- páginas legais contêm identificação jurídica e links recíprocos;
- sitemap contém as três páginas legais;
- JSON-LD é JSON válido e contém os nós definidos;
- CSP não contém `unsafe-inline` ou `unsafe-eval`;
- HTML não contém estilos ou JavaScript executável inline;
- hash do JSON-LD corresponde à CSP;
- `X-Frame-Options` e `frame-ancestors` estão definidos.

### Navegador

- desktop e mobile sem sobreposição;
- banner visível em nova sessão;
- aceitar, recusar, preferências e revogação funcionam;
- foco e teclado funcionam no diálogo;
- Brave não bloqueia o controle por nome genérico;
- formulário continua enviando pelo endpoint `/api/lead`;
- console sem violações de CSP e sem recursos 404;
- GA4 ausente antes da autorização e presente depois da autorização.

### Produção

- `/`, `/privacidade`, `/cookies`, `/termos`, `/sitemap.xml` e `/robots.txt` retornam HTTP 200;
- cabeçalhos de segurança aparecem no domínio;
- Lighthouse móvel mantém no mínimo 95 em desempenho e 100 em acessibilidade, boas práticas e SEO;
- Schema Markup Validator aceita o JSON-LD sem erro sintático;
- Search Console recebe solicitação de nova indexação para a página inicial e as páginas legais.

## Referências normativas e técnicas

- Guia orientativo de cookies da ANPD: `https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-cookies-e-protecao-de-dados-pessoais.pdf`
- Google Consent Mode: `https://developers.google.com/tag-platform/security/guides/consent`
- Cookies do GA4: `https://support.google.com/analytics/answer/11397207`
- Nome do site no Google: `https://developers.google.com/search/docs/appearance/site-names`

## Sequência após esta entrega

1. Funil de leads: e-mail, página de agradecimento, persistência, confirmação, Turnstile, rate limit e alertas.
2. Conteúdo SEO: páginas de solução, recursos, preço, empresa, contato, blog e caso Ohana.
3. Medição: Vercel Web Analytics, Speed Insights, uptime, Clarity e Bing Webmaster Tools.
4. Autoridade e reputação: redes sociais, backlinks, Perfil da Empresa quando elegível, DMARC em modo de aplicação e BIMI.
