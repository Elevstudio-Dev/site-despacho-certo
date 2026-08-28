# Conformidade e Segurança do Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar políticas legais separadas, consentimento granular e revogável, dados estruturados completos e uma CSP forte no site DespachoCerto.

**Architecture:** O site continuará estático na Vercel, com a função `/api/lead` preservada. CSS e JavaScript executável serão externos para permitir `style-src 'self'` e `script-src` sem `unsafe-inline`; o único script inline será o JSON-LD autorizado por hash. O consentimento continuará próprio, em modo básico do Google Consent Mode v2, com migração da preferência atual e sem chamadas ao Google antes da autorização.

**Tech Stack:** HTML5, CSS, JavaScript sem framework, Node.js `node:test`, Vercel static hosting e Functions, GA4/gtag.js.

**Spec:** `docs/superpowers/specs/2026-08-28-conformidade-seguranca-site-design.md`

## Global Constraints

- Identificar o responsável como `62.574.201 Carlos Eduardo Filho da Conceição`, CNPJ `62.574.201/0001-50`, marca Elev Studio, Tubarão/SC.
- Publicar somente cidade e UF; não publicar o endereço residencial completo.
- Não carregar GA4 antes de consentimento analítico explícito.
- Manter publicidade, sinais do Google e personalização de anúncios desativados.
- Preservar o formulário `/api/lead`, os eventos `cta_click` e `generate_lead` e o visual atual.
- Não adicionar dependências de produção ou CMP externa.
- Não usar `unsafe-inline` nem `unsafe-eval` na CSP.
- Usar TDD e um commit independente por tarefa.
- Não incluir artefatos locais de Lighthouse ou Playwright nos commits.

---

### Task 1: Tornar o HTML compatível com uma CSP forte

**Files:**
- Create: `site.css`
- Create: `site.js`
- Create: `tests/site-csp-readiness.test.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: marcação e comportamento atuais de `index.html`.
- Produces: `site.css` com todo o CSS da home, `site.js` com todas as interações da home e HTML sem estilos ou JavaScript executável inline.

- [ ] **Step 1: Escrever os testes de preparação para CSP**

Criar `tests/site-csp-readiness.test.js` com leitura de `index.html`, `site.css` e `site.js`. Os testes devem exigir:

```js
assert.match(index, /<link rel="stylesheet" href="site\.css" \/>/);
assert.match(index, /<script src="site\.js"><\/script>/);
assert.doesNotMatch(index, /<style\b/i);
assert.doesNotMatch(index, /\sstyle=/i);

const scripts = [...index.matchAll(/<script(?:\s+type="([^"]+)")?[^>]*>([\s\S]*?)<\/script>/gi)];
const executableInline = scripts.filter(([, type, body]) => type !== 'application/ld+json' && body.trim());
assert.equal(executableInline.length, 0);
assert.match(siteJs, /DespachoCertoAnalytics/);
assert.match(siteJs, /leadForm\.addEventListener\("submit"/);
```

- [ ] **Step 2: Executar o teste e confirmar a falha**

Run: `node --test tests/site-csp-readiness.test.js`

Expected: FAIL porque `site.css` e `site.js` ainda não existem e a home contém `<style>`, atributos `style` e script executável inline.

- [ ] **Step 3: Extrair CSS e JavaScript sem alterar comportamento**

Mover verbatim o conteúdo do único `<style>` de `index.html` para `site.css` e substituí-lo por:

```html
<link rel="stylesheet" href="site.css" />
```

Mover o conteúdo do último `<script>` inline executável para `site.js` e substituí-lo, depois de `site-analytics.js`, por:

```html
<script src="site.js"></script>
```

Manter o JSON-LD inline. Manter a ordem:

```html
<script src="lucide.min.js"></script>
<script src="site-preferences.js"></script>
<script src="site-analytics.js"></script>
<script src="site.js"></script>
```

- [ ] **Step 4: Remover os nove atributos de estilo inline**

Adicionar a `site.css`:

```css
.bar-fill-88 { --bar: 88%; }
.bar-fill-64 { --bar: 64%; }
.bar-fill-46 { --bar: 46%; }
.bar-fill-30 { --bar: 30%; }
.chart-height-32 { --height: 32%; }
.chart-height-42 { --height: 42%; }
.chart-height-44 { --height: 44%; }
.chart-height-51 { --height: 51%; }
.chart-height-52 { --height: 52%; }
.chart-height-61 { --height: 61%; }
.chart-height-72 { --height: 72%; }
.chart-height-88 { --height: 88%; }
.eyebrow-on-dark { color: #b9daf5; }
```

Substituir cada `style="--bar: N%"` por `class="bar-fill bar-fill-N"`, cada `style="--height: N%"` pela classe `chart-height-N` no mesmo elemento e `style="color: #b9daf5"` por `class="eyebrow eyebrow-on-dark"`.

- [ ] **Step 5: Executar testes e conferir o diff**

Run: `node --test tests/site-csp-readiness.test.js && node --test`

Expected: todos os testes PASS. Conferir `git diff --check` e confirmar que o diff apenas moveu CSS/JS e substituiu estilos inline por classes.

- [ ] **Step 6: Commit**

```bash
git add index.html site.css site.js tests/site-csp-readiness.test.js
git commit -m "refactor: prepare site for strict content security policy"
```

---

### Task 2: Implementar consentimento versionado e centro de preferências

**Files:**
- Modify: `site-preferences.js`
- Modify: `index.html`
- Modify: `privacidade.html`
- Modify: `site.css`
- Modify: `tests/site-consent.test.js`

**Interfaces:**
- Consumes: `window.DespachoCertoConsent`, IDs atuais do banner e chave `despachocerto_analytics_preference_v2`.
- Produces: API pública preservada (`accept`, `reject`, `initialize`, `openPreferences`, `hasAnalyticsConsent`) e nova API `savePreferences({ analytics })` com armazenamento `despachocerto_consent_v3`.

- [ ] **Step 1: Atualizar o harness e escrever testes falhando**

Adicionar ao harness de `tests/site-consent.test.js` helpers definidos dentro de `createHarness`, depois da criação de `listeners`:

```js
let focusedElement = null;

function createButton(prefix) {
  return {
    addEventListener(type, listener) { listeners.set(`${prefix}:${type}`, listener); },
    focus() { focusedElement = prefix; },
  };
}

function createDialog() {
  return {
    open: false,
    showModal() { this.open = true; },
    close() { this.open = false; },
    addEventListener(type, listener) { listeners.set(`dialog:${type}`, listener); },
  };
}
```

Usar os helpers nos elementos:

```js
privacyOpenPreferences: createButton('open-preferences'),
privacyPreferencesDialog: createDialog(),
privacyAnalyticsToggle: { checked: false },
privacySavePreferences: createButton('save-preferences'),
privacyClosePreferences: createButton('close-preferences'),
```

Exigir os fluxos:

```js
assert.deepEqual(JSON.parse(values.get('despachocerto_consent_v3')), {
  version: '2026-08-28',
  analytics: 'granted',
  updatedAt: '2026-08-28T20:00:00.000Z',
});
assert.equal(values.has('despachocerto_analytics_preference_v2'), false);
```

Adicionar testes para migração de `granted` e `denied`, abertura do diálogo, cancelamento sem salvar, toggle analítico, salvamento, revogação e preferência inválida/antiga exibindo o banner.

- [ ] **Step 2: Executar o teste e confirmar a falha**

Run: `node --test tests/site-consent.test.js`

Expected: FAIL porque a chave v3, o diálogo e `savePreferences` não existem.

- [ ] **Step 3: Implementar o modelo v3 e a migração**

Em `site-preferences.js`, definir:

```js
const consentVersion = "2026-08-28";
const storageKey = "despachocerto_consent_v3";
const legacyStorageKey = "despachocerto_analytics_preference_v2";
```

`readChoice()` deve validar `version`, `analytics` e `updatedAt`. Se não houver v3 válido, deve migrar `granted` ou `denied` da chave legada, salvar o objeto novo, remover a chave antiga e retornar a escolha. O relógio deve ser injetável nos testes por `options.now` e usar `new Date().toISOString()` em produção.

Implementar:

```js
function savePreferences({ analytics }) {
  if (!validChoices.has(analytics)) return false;
  saveChoice(analytics);
  setBannerVisibility(false);
  closePreferences();
  if (analytics === "granted") enableAnalytics();
  else disableAnalytics();
  return true;
}
```

`accept()` chamará `savePreferences({ analytics: "granted" })` e `reject()` chamará `savePreferences({ analytics: "denied" })`.

- [ ] **Step 4: Criar o diálogo acessível e o terceiro botão**

No banner de `index.html` e `privacidade.html`, manter Recusar e Aceitar e adicionar:

```html
<button class="privacy-choice-button privacy-choice-button-secondary" id="privacyOpenPreferences" type="button">Preferências</button>
```

Adicionar depois do banner:

```html
<dialog class="privacy-preferences-dialog" id="privacyPreferencesDialog" aria-labelledby="privacyPreferencesTitle">
  <form method="dialog" class="privacy-preferences-card">
    <header>
      <div>
        <span class="privacy-preferences-kicker">Controle de privacidade</span>
        <h2 id="privacyPreferencesTitle">Preferências de cookies</h2>
      </div>
      <button class="privacy-dialog-close" id="privacyClosePreferences" value="cancel" type="submit" aria-label="Fechar preferências">×</button>
    </header>
    <section class="privacy-category">
      <div><strong>Necessários</strong><p>Mantêm o site funcionando e lembram sua escolha.</p></div>
      <span class="privacy-always-on">Sempre ativos</span>
    </section>
    <section class="privacy-category">
      <div><strong>Analíticos</strong><p>Ajudam a medir navegação e conversões pelo Google Analytics 4.</p></div>
      <label class="privacy-toggle"><input id="privacyAnalyticsToggle" type="checkbox" /><span aria-hidden="true"></span><span class="sr-only">Permitir cookies analíticos</span></label>
    </section>
    <p class="privacy-dialog-links"><a href="/privacidade">Política de Privacidade</a><a href="/cookies">Política de Cookies</a></p>
    <footer><button class="privacy-choice-button privacy-choice-button-primary" id="privacySavePreferences" value="default" type="submit">Salvar preferências</button></footer>
  </form>
</dialog>
```

Adicionar a `site.css` os estados do diálogo, backdrop, toggle, foco visível e layout mobile com raio máximo de 8 px. Trocar o botão de fechar textual por ícone Lucide quando o pacote estiver disponível, preservando `aria-label`.

- [ ] **Step 5: Ligar foco, teclado e salvamento**

`openPreferences()` deve sincronizar o checkbox, chamar `showModal()` e guardar o elemento que tinha foco. `closePreferences()` deve fechar o diálogo e devolver o foco. `Escape` e o botão fechar não alteram a preferência. Salvar lê `privacyAnalyticsToggle.checked`. O harness deve expor `focusedElement` por getter para validar a devolução do foco.

- [ ] **Step 6: Executar os testes**

Run: `node --test tests/site-consent.test.js && node --test`

Expected: todos os testes PASS, incluindo ausência de requisição ao Google antes da aceitação.

- [ ] **Step 7: Commit**

```bash
git add index.html privacidade.html site.css site-preferences.js tests/site-consent.test.js
git commit -m "feat: add versioned privacy preference center"
```

---

### Task 3: Separar e completar as páginas legais

**Files:**
- Create: `cookies.html`
- Create: `termos.html`
- Create: `legal.css`
- Create: `legal.js`
- Create: `tests/site-legal.test.js`
- Modify: `privacidade.html`
- Modify: `index.html`
- Modify: `sitemap.xml`

**Interfaces:**
- Consumes: identidade visual de `privacidade.html` e consentimento de `site-preferences.js`.
- Produces: rotas limpas `/privacidade`, `/cookies` e `/termos`, com links recíprocos e identificação jurídica uniforme.

- [ ] **Step 1: Escrever testes legais falhando**

Criar `tests/site-legal.test.js` e exigir, para as três páginas:

```js
assert.match(html, /62\.574\.201 Carlos Eduardo Filho da Conceição/);
assert.match(html, /62\.574\.201\/0001-50/);
assert.match(html, /Tubarão\/SC/);
assert.match(html, /contato@elevstudio\.com\.br/);
assert.match(html, /<link rel="stylesheet" href="legal\.css" \/>/);
assert.doesNotMatch(html, /<style\b/i);
assert.doesNotMatch(html, /\sstyle=/i);
```

Exigir títulos e canonicals exclusivos, links `/privacidade`, `/cookies` e `/termos` no rodapé e as três URLs em `sitemap.xml`.

- [ ] **Step 2: Executar o teste e confirmar a falha**

Run: `node --test tests/site-legal.test.js`

Expected: FAIL porque duas páginas e os dados jurídicos completos não existem.

- [ ] **Step 3: Extrair o layout legal**

Mover o CSS de `privacidade.html` para `legal.css`, trocar o bloco `<style>` por `<link rel="stylesheet" href="legal.css" />` e carregar no fim:

```html
<script src="site-preferences.js"></script>
<script src="legal.js"></script>
```

`legal.js` deve atualizar todo elemento `[data-current-year]` com o ano atual e não executar coleta analítica.

- [ ] **Step 4: Revisar `/privacidade`**

Atualizar a data para 28 de agosto de 2026 e identificar o controlador com nome empresarial, CNPJ, Elev Studio, Tubarão/SC e e-mail. Separar cookies em um resumo com link para `/cookies`. Manter dados do formulário, Vercel, Resend, GA4, finalidades, bases legais, retenção de 14 meses configurada no GA4, direitos, transferências internacionais, segurança e atualização.

- [ ] **Step 5: Criar `/cookies`**

Reutilizar cabeçalho, navegação lateral, rodapé e diálogo. Incluir uma tabela com:

| Tecnologia | Tipo | Finalidade | Duração |
| --- | --- | --- | --- |
| `despachocerto_consent_v3` | Armazenamento local necessário | Lembrar a escolha | Até alteração, limpeza do navegador ou nova versão |
| `_ga` | Cookie analítico opcional | Distinguir usuários no GA4 | Até 2 anos |
| `_ga_<container-id>` | Cookie analítico opcional | Preservar estado de sessão | Até 2 anos |

Explicar aceitação, recusa, revogação e ausência de cookies publicitários.

- [ ] **Step 6: Criar `/termos`**

Reutilizar o layout legal e criar seções numeradas para identificação, finalidade do site, regras de uso, propriedade intelectual, demonstrações, formulário, links externos, disponibilidade, privacidade, alterações, legislação brasileira e contato. Incluir a frase:

```html
<p>A contratação, o licenciamento, o suporte, os níveis de serviço e o tratamento de dados dentro do sistema DespachoCerto serão regidos por instrumento comercial próprio.</p>
```

- [ ] **Step 7: Atualizar links e sitemap**

No rodapé da home e das páginas legais, publicar links separados para Privacidade, Cookies e Termos. Em `sitemap.xml`, adicionar `/cookies` e `/termos` com `changefreq` anual e prioridade `0.3`.

- [ ] **Step 8: Executar testes**

Run: `node --test tests/site-legal.test.js && node --test`

Expected: todos os testes PASS.

- [ ] **Step 9: Commit**

```bash
git add index.html privacidade.html cookies.html termos.html legal.css legal.js sitemap.xml tests/site-legal.test.js
git commit -m "feat: publish complete legal documentation"
```

---

### Task 4: Completar dados estruturados da marca e do site

**Files:**
- Create: `tests/site-structured-data.test.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: grafo JSON-LD atual.
- Produces: nós conectados `#website`, `#organization`, `#brand`, `#software` e `#faq`.

- [ ] **Step 1: Escrever o parser e os testes falhando**

Extrair o conteúdo de `<script type="application/ld+json">`, executar `JSON.parse` e indexar `@graph` por `@id`. Exigir:

```js
assert.equal(nodes['https://despachocerto.com.br/#website']['@type'], 'WebSite');
assert.equal(nodes['https://despachocerto.com.br/#website'].name, 'DespachoCerto');
assert.deepEqual(nodes['https://despachocerto.com.br/#website'].alternateName, ['Despacho Certo', 'despachocerto.com.br']);
assert.equal(nodes['https://despachocerto.com.br/#organization'].legalName, '62.574.201 Carlos Eduardo Filho da Conceição');
assert.equal(nodes['https://despachocerto.com.br/#organization'].taxID, '62.574.201/0001-50');
assert.equal(nodes['https://despachocerto.com.br/#organization'].logo.url, 'https://despachocerto.com.br/despachocerto-logo-512.png');
assert.equal(nodes['https://despachocerto.com.br/#brand']['@type'], 'Brand');
assert.deepEqual(nodes['https://despachocerto.com.br/#software'].brand, { '@id': 'https://despachocerto.com.br/#brand' });
```

Também confirmar que toda pergunta do `FAQPage` aparece no HTML visível.

- [ ] **Step 2: Executar o teste e confirmar a falha**

Run: `node --test tests/site-structured-data.test.js`

Expected: FAIL porque `WebSite`, `Brand`, `legalName`, `taxID` e logo ainda não existem.

- [ ] **Step 3: Atualizar o grafo JSON-LD**

Adicionar `WebSite`, enriquecer `Organization`, adicionar `Brand` e conectar `SoftwareApplication`. Usar `PostalAddress` apenas com `addressLocality: "Tubarão"`, `addressRegion: "SC"` e `addressCountry: "BR"`. Não adicionar perfis sociais, avaliações, preço ou rua.

- [ ] **Step 4: Executar testes**

Run: `node --test tests/site-structured-data.test.js && node --test`

Expected: todos os testes PASS e JSON válido.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/site-structured-data.test.js
git commit -m "feat: identify DespachoCerto with structured data"
```

---

### Task 5: Aplicar CSP e proteção contra iframe

**Files:**
- Create: `tests/site-security.test.js`
- Modify: `vercel.json`

**Interfaces:**
- Consumes: HTML sem código executável ou estilos inline e JSON-LD estável.
- Produces: cabeçalhos de segurança verificáveis, com hash SHA-256 sincronizado ao JSON-LD.

- [ ] **Step 1: Escrever testes de segurança falhando**

Em `tests/site-security.test.js`, ler o header `Content-Security-Policy` de `vercel.json`, extrair o JSON-LD e calcular:

```js
const digest = crypto.createHash('sha256').update(jsonLdBody, 'utf8').digest('base64');
const expectedHash = `'sha256-${digest}'`;
assert.ok(csp.includes(expectedHash), `CSP precisa conter ${expectedHash}`);
assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval/);
assert.match(csp, /frame-ancestors 'none'/);
assert.match(csp, /form-action 'self'/);
assert.equal(headers['X-Frame-Options'], 'DENY');
assert.equal(headers['Cross-Origin-Opener-Policy'], 'same-origin');
```

- [ ] **Step 2: Executar o teste e confirmar a falha**

Run: `node --test tests/site-security.test.js`

Expected: FAIL porque CSP, hash, frame protection e COOP ainda não estão configurados.

- [ ] **Step 3: Configurar os cabeçalhos**

Executar este comando depois da Task 4 para obter o valor exato do hash:

```powershell
node -e "const fs=require('node:fs'),crypto=require('node:crypto');const h=fs.readFileSync('index.html','utf8').match(/<script type=\"application\/ld\+json\">([\s\S]*?)<\/script>/i)[1];console.log('sha256-'+crypto.createHash('sha256').update(h,'utf8').digest('base64'))"
```

Adicionar ao bloco global de `vercel.json` uma CSP com `default-src 'self'`; `script-src` limitado a `'self'`, `https://www.googletagmanager.com` e ao valor `sha256-...` impresso pelo comando; `connect-src` limitado a `'self'`, `https://*.google-analytics.com`, `https://*.analytics.google.com` e `https://*.googletagmanager.com`; `img-src` limitado a `'self'`, `data:`, `https://*.google-analytics.com` e `https://*.googletagmanager.com`; além de `style-src 'self'`, `font-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'` e `upgrade-insecure-requests`.

Adicionar `X-Frame-Options: DENY` e `Cross-Origin-Opener-Policy: same-origin`. Preservar `X-Content-Type-Options`, `Referrer-Policy` e `Permissions-Policy`.

- [ ] **Step 4: Executar testes e validação JSON**

Run: `node --test tests/site-security.test.js && node --test && git diff --check`

Expected: todos os testes PASS, `vercel.json` válido e nenhuma exceção insegura na CSP.

- [ ] **Step 5: Commit**

```bash
git add vercel.json tests/site-security.test.js
git commit -m "feat: enforce strict browser security headers"
```

---

### Task 6: Documentar, validar no navegador e publicar

**Files:**
- Modify: `README.md`
- Modify: arquivos das tarefas anteriores somente se a verificação revelar defeito.

**Interfaces:**
- Consumes: implementação completa local.
- Produces: documentação atualizada, versão publicada e validação em produção.

- [ ] **Step 1: Atualizar o README**

Documentar `site.css`, `site.js`, `legal.css`, `legal.js`, `cookies.html`, `termos.html`, consentimento v3, páginas legais, CSP e comandos de teste. Registrar que mudanças no JSON-LD exigem atualização do hash da CSP e execução de `node --test tests/site-security.test.js`.

- [ ] **Step 2: Executar a verificação automatizada completa**

Run:

```powershell
node --test
git diff --check
git status --short
```

Expected: zero falhas; somente arquivos desta entrega modificados ou adicionados; `.playwright-cli/` e `artifacts/` permanecem fora do commit.

- [ ] **Step 3: Testar localmente no navegador**

Iniciar um servidor em porta livre:

```powershell
npx --yes serve . -l 4175
```

Verificar desktop e mobile:

- home e três páginas legais sem sobreposição;
- console sem erro;
- nenhum recurso 404;
- primeira visita mostra banner;
- Recusar fecha sem carregar `googletagmanager.com`;
- Preferências abre diálogo e respeita foco/Escape;
- aceitar carrega GA4;
- revogar remove cookies analíticos e recarrega;
- formulário ainda recebe resposta de `/api/lead` no ambiente compatível;
- CSP não bloqueia CSS, JS, imagens, fonte ou GA4 autorizado.

- [ ] **Step 4: Corrigir qualquer defeito pelo ciclo TDD**

Para cada defeito, adicionar teste que reproduza a falha, executar para confirmar FAIL, aplicar a correção mínima e executar a suíte para confirmar PASS.

- [ ] **Step 5: Commit de documentação e correções de verificação**

```bash
git add README.md index.html privacidade.html cookies.html termos.html site.css site.js legal.css legal.js site-preferences.js site-analytics.js sitemap.xml vercel.json tests
git commit -m "docs: document privacy and security controls"
```

Se não houver correção além do README, adicionar apenas `README.md`.

- [ ] **Step 6: Sincronizar e publicar**

Run:

```powershell
git fetch origin
git status -sb
git push origin main
```

Expected: `main` sincronizada com `origin/main`; Vercel inicia o deploy automático.

- [ ] **Step 7: Verificar produção**

Confirmar HTTP 200 para:

```text
https://despachocerto.com.br/
https://despachocerto.com.br/privacidade
https://despachocerto.com.br/cookies
https://despachocerto.com.br/termos
https://despachocerto.com.br/sitemap.xml
https://despachocerto.com.br/robots.txt
```

Ler os headers da home e confirmar CSP, `X-Frame-Options: DENY`, COOP, `nosniff`, Referrer Policy e Permissions Policy. Repetir o fluxo de consentimento no domínio público e confirmar a rede antes e depois da aceitação.

- [ ] **Step 8: Auditar qualidade em produção**

Executar Lighthouse móvel na URL pública e exigir:

- performance >= 95;
- acessibilidade = 100;
- boas práticas = 100;
- SEO = 100;
- LCP < 2,5 s;
- CLS < 0,1.

Validar o JSON-LD no Schema Markup Validator e confirmar ausência de erro sintático.

- [ ] **Step 9: Solicitar reindexação no Search Console**

Usar a sessão existente do navegador para inspecionar e solicitar indexação de `/`, `/privacidade`, `/cookies` e `/termos`. Se a sessão pedir autenticação, solicitar ao usuário apenas que conclua o login e informar exatamente em qual tela continuar.

- [ ] **Step 10: Registrar evidências finais**

Executar novamente `node --test`, `git status -sb` e `git log -1 --oneline`. Relatar commit publicado, contagem de testes, rotas, cabeçalhos, resultados Lighthouse e eventual etapa externa bloqueada por autenticação.
