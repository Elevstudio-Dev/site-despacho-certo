# DespachoCerto Site Content and Navigation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** rebuild the public site so navigation is predictable, every page has a unique conversion role and visual signature, the form lives on `/contato`, and the unpublished Ohana material is unavailable in production.

**Architecture:** keep the current static HTML, CSS and JavaScript stack. Introduce one shared navigation controller, preserve serverless lead infrastructure, and replace the rigid internal-page template with a library of focused layout primitives that pages compose differently. Each public URL remains stable except `/clientes/ohana-consultoria`, which is withdrawn from the deployment.

**Tech Stack:** static HTML5, CSS, vanilla JavaScript, Node.js built-in test runner, Vercel static hosting and Functions, GA4, Microsoft Clarity, Cloudflare Turnstile, Supabase and Resend.

**Spec:** `docs/superpowers/specs/2026-08-31-arquitetura-conteudo-navegacao-design.md`

## Global Constraints

- Do not introduce a frontend framework, build step or client-side HTML rendering.
- Preserve the existing production URLs for all public pages except `/clientes/ohana-consultoria`.
- Do not publish the Ohana name, services, participation, logo or implementation context.
- Keep Analytics, Clarity and Vercel metrics blocked until analytics consent is granted.
- Preserve the existing Supabase, Resend, Turnstile, rate-limit and `generate_lead` behavior.
- Use Archivo for headings, Inter for body/UI and system monospace for OS IDs, plates and monetary data.
- Use `#0B3454`, `#155A9C`, `#38BFE8`, `#17745B`, `#C94F3D` and `#F5F8FA` as the core visual tokens.
- Do not fabricate prices, statistics, testimonials, integrations, guarantees or customer results.
- Do not use viewport-width units to scale typography.
- Honor `prefers-reduced-motion`, visible focus, keyboard navigation and 44 px touch targets.
- Keep cards at 8 px radius or less and avoid nested cards or decorative section containers.
- Run `node --test` and `git diff --check` before every task commit.

---

### Task 1: Withdraw the unpublished Ohana page

**Files:**
- Create: `.vercelignore`
- Create: `drafts/clientes/ohana-consultoria.html`
- Delete: `clientes/ohana-consultoria.html`
- Modify: `sitemap.xml`
- Modify: `sobre.html`
- Modify: `tests/site-seo-pages.test.js`
- Modify: `tests/site-structured-data.test.js`
- Create: `tests/site-publication.test.js`

**Interfaces:**
- Produces: a production build with no `/clientes/ohana-consultoria` artifact, sitemap entry or public internal link.
- Consumes: current static deployment behavior where every non-ignored HTML file is published.

- [ ] **Step 1: Write the failing publication test**

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('keeps the Ohana case outside the public deployment', () => {
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const publicHtml = fs.readdirSync(root)
    .filter((name) => name.endsWith('.html'))
    .map((name) => fs.readFileSync(path.join(root, name), 'utf8'))
    .join('\n');

  assert.equal(fs.existsSync(path.join(root, 'clientes', 'ohana-consultoria.html')), false);
  assert.equal(fs.existsSync(path.join(root, 'drafts', 'clientes', 'ohana-consultoria.html')), true);
  assert.doesNotMatch(sitemap, /ohana-consultoria/i);
  assert.doesNotMatch(publicHtml, /Ohana|clientes\/ohana-consultoria/i);
  assert.match(fs.readFileSync(path.join(root, '.vercelignore'), 'utf8'), /^drafts\/$/m);
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test tests/site-publication.test.js`  
Expected: FAIL because the public file and sitemap entry still exist.

- [ ] **Step 3: Move the case to a deployment-excluded draft**

Use `apply_patch` to move the current HTML to `drafts/clientes/ohana-consultoria.html`. Add this exact `.vercelignore` content:

```text
drafts/
tmp/
```

Remove the Ohana URL from `sitemap.xml`, replace the related link on `/sobre` with `/seguranca`, and remove Ohana from public-page arrays in existing SEO/structured-data tests.

- [ ] **Step 4: Run publication and SEO tests**

Run: `node --test tests/site-publication.test.js tests/site-seo-pages.test.js tests/site-structured-data.test.js`  
Expected: PASS.

- [ ] **Step 5: Run the complete suite and commit**

```powershell
node --test
git diff --check
git add .vercelignore drafts/clientes/ohana-consultoria.html clientes/ohana-consultoria.html sitemap.xml sobre.html tests/site-publication.test.js tests/site-seo-pages.test.js tests/site-structured-data.test.js
git commit -m "chore: withdraw unpublished customer case"
```

### Task 2: Build one accessible navigation system

**Files:**
- Create: `site-navigation.js`
- Create: `site-shell.css`
- Modify: `content-page.js`
- Modify: `site.js`
- Modify: `index.html`
- Modify: `sistema-para-despachante.html`
- Modify: `ordem-de-servico-para-despachante.html`
- Modify: `controle-financeiro-para-despachante.html`
- Modify: `gestao-de-documentos.html`
- Modify: `integracoes.html`
- Modify: `seguranca.html`
- Modify: `precos.html`
- Modify: `sobre.html`
- Modify: `contato.html`
- Modify: `privacidade.html`
- Modify: `cookies.html`
- Modify: `termos.html`
- Modify: `obrigado.html`
- Create: `tests/site-navigation.test.js`

**Interfaces:**
- Produces: `createSiteNavigation(target, document)` returning `{ initialize, closeAll }`.
- Produces: IDs `siteMenuButton`, `siteMobileMenu`, `productMenuButton`, `productMenu`, `contentMenuButton`, `contentMenu` in every public header.
- Consumes: `window.DespachoCertoAnalytics.trackCta` for the header CTA.

- [ ] **Step 1: Write navigation structure tests**

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const pages = [
  'index.html', 'sistema-para-despachante.html',
  'ordem-de-servico-para-despachante.html',
  'controle-financeiro-para-despachante.html', 'gestao-de-documentos.html',
  'integracoes.html', 'seguranca.html', 'precos.html', 'sobre.html', 'contato.html',
];

test('publishes the same global information architecture on every page', () => {
  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    assert.match(html, /href="\/">Início/);
    assert.match(html, /id="productMenuButton"[^>]+aria-expanded="false"/);
    assert.match(html, /id="contentMenuButton"[^>]+aria-expanded="false"/);
    assert.match(html, /href="\/ordem-de-servico-para-despachante"/);
    assert.match(html, /href="\/controle-financeiro-para-despachante"/);
    assert.match(html, /href="\/gestao-de-documentos"/);
    assert.match(html, /href="\/integracoes"/);
    assert.match(html, /href="\/contato"[^>]*>[^<]*Agendar demonstração/);
    assert.match(html, /src="\/site-navigation\.js"/);
  }
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test tests/site-navigation.test.js`  
Expected: FAIL because the shared dropdown structure does not exist.

- [ ] **Step 3: Implement the shared controller**

Implement `site-navigation.js` with this public shape:

```js
(function attachNavigation(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory;
    return;
  }
  factory(root, root.document).initialize();
})(typeof window !== 'undefined' ? window : globalThis, function createSiteNavigation(target, document) {
  const menuButtons = [...document.querySelectorAll('[data-menu-button]')];
  const mobileButton = document.getElementById('siteMenuButton');
  const mobileMenu = document.getElementById('siteMobileMenu');

  function closeDropdowns(exceptId = '') {
    menuButtons.forEach((button) => {
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      const keepOpen = panel && panel.id === exceptId;
      button.setAttribute('aria-expanded', String(keepOpen));
      if (panel) panel.hidden = !keepOpen;
    });
  }

  function closeAll() {
    closeDropdowns();
    mobileButton?.setAttribute('aria-expanded', 'false');
    if (mobileMenu) mobileMenu.hidden = true;
  }

  function initialize() {
    menuButtons.forEach((button) => button.addEventListener('click', () => {
      const panelId = button.getAttribute('aria-controls');
      const willOpen = button.getAttribute('aria-expanded') !== 'true';
      closeDropdowns(willOpen ? panelId : '');
    }));
    mobileButton?.addEventListener('click', () => {
      const willOpen = mobileButton.getAttribute('aria-expanded') !== 'true';
      mobileButton.setAttribute('aria-expanded', String(willOpen));
      mobileMenu.hidden = !willOpen;
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeAll();
    });
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.site-navigation')) closeDropdowns();
    });
  }

  return Object.freeze({ initialize, closeAll });
});
```

- [ ] **Step 4: Add shared shell styles and markup**

Create `site-shell.css` with a 72 px sticky header, explicit focus states, 44 px controls, positioned desktop menus and a full-width mobile panel. Use `overscroll-behavior: contain` for the mobile panel and hide it with the `hidden` attribute. Use buttons for menu actions and anchors for destinations.

Every public header must use the exact destination groups defined in the spec. Load `/site-shell.css` after the page stylesheet and `/site-navigation.js` before the page-specific script.

- [ ] **Step 5: Remove competing menu logic**

Delete `contentMenuButton` and `contentMobileMenu` behavior from `content-page.js`. Delete the old `menuButton` and `mobileMenu` behavior from `site.js`. Keep icon hydration and page interactions intact.

- [ ] **Step 6: Add behavior tests and run them**

Add a lightweight DOM harness to `tests/site-navigation.test.js` that verifies dropdown exclusivity, Escape closing and mobile `aria-expanded`. Run:

`node --test tests/site-navigation.test.js tests/site-accessibility.test.js tests/site-icon-hydration.test.js`  
Expected: PASS.

- [ ] **Step 7: Run the complete suite and commit**

```powershell
node --test
git diff --check
git add site-navigation.js site-shell.css site.js content-page.js *.html tests/site-navigation.test.js tests/site-accessibility.test.js tests/site-icon-hydration.test.js
git commit -m "feat: unify public site navigation"
```

### Task 3: Move lead conversion to `/contato`

**Files:**
- Create: `lead-form.js`
- Modify: `site.js`
- Modify: `index.html`
- Modify: `contato.html`
- Modify: `site.css`
- Modify: `content-page.css`
- Modify: `tests/site-conversion.test.js`
- Modify: `tests/site-consent.test.js`
- Modify: `tests/site-analytics.test.js`

**Interfaces:**
- Produces: `createLeadForm(target, document, fetchImpl)` returning `{ initialize, loadTurnstile }`.
- Produces: one production form with `id="leadForm"`, action `/api/lead` and `data-clarity-mask="true"` on `/contato` only.
- Consumes: `/api/public-config`, `/api/lead`, `window.turnstile` and `window.DespachoCertoAnalytics.trackLeadSuccess()`.

- [ ] **Step 1: Update conversion tests to require one form on `/contato`**

```js
test('keeps the complete lead form on the contact page only', () => {
  const home = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
  const contact = fs.readFileSync(path.join(projectRoot, 'contato.html'), 'utf8');
  assert.doesNotMatch(home, /id="leadForm"/);
  assert.match(home, /href="\/contato"/);
  assert.match(contact, /id="leadForm"[^>]+action="\/api\/lead"[^>]+data-clarity-mask="true"/);
  assert.match(contact, /name="email"[^>]+type="email"/);
  assert.match(contact, /src="\/lead-form\.js"/);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `node --test tests/site-conversion.test.js tests/site-consent.test.js`  
Expected: FAIL because the form remains on the home page.

- [ ] **Step 3: Extract the current form controller**

Move the Turnstile loading, validation, submit, success and reset code from `site.js` into `lead-form.js`. Preserve field names and the success redirect `/obrigado`. Initialize only when `leadForm` exists, so legal and product pages remain safe.

- [ ] **Step 4: Build the contact conversion layout**

Place the existing fields and privacy copy in `/contato`. Use this hero copy:

```html
<p class="eyebrow">Demonstração preparada para o seu escritório</p>
<h1>Mostre uma OS real. Veja como ela fica no DespachoCerto.</h1>
<p>Conte onde a equipe perde contexto hoje. A demonstração percorre esse processo, sem apresentação genérica e sem compromisso.</p>
```

Use submit label `Preparar minha demonstração`. Beside the form, show four outcomes: diagnóstico da rotina, fluxo aplicado, dúvidas técnicas and próximos passos.

- [ ] **Step 5: Replace the home form with a focused final CTA**

The home ending must link to `/contato` and contain no inputs. Use heading `Leve um processo do seu escritório para a demonstração.` and CTA `Preparar minha demonstração`.

- [ ] **Step 6: Run conversion, consent and analytics tests**

Run: `node --test tests/site-conversion.test.js tests/site-consent.test.js tests/site-analytics.test.js tests/lead-api.test.js`  
Expected: PASS.

- [ ] **Step 7: Run the complete suite and commit**

```powershell
node --test
git diff --check
git add lead-form.js site.js index.html contato.html site.css content-page.css tests/site-conversion.test.js tests/site-consent.test.js tests/site-analytics.test.js
git commit -m "feat: centralize lead conversion on contact page"
```

### Task 4: Create the distinctive content-page design system

**Files:**
- Add: `archivo-latin.woff2`
- Modify: `content-page.css`
- Modify: `site.css`
- Create: `tests/site-visual-system.test.js`

**Interfaces:**
- Produces layout primitives: `.product-map`, `.os-timeline`, `.finance-ledger`, `.document-desk`, `.integration-matrix`, `.trust-layers`, `.proposal-builder`, `.story-rail`.
- Produces utility primitives: `.record-id`, `.record-status`, `.record-value`, `.page-next-step`.
- Consumes the color and typography tokens from the design spec.

- [ ] **Step 1: Write visual-system tests**

```js
test('defines a multi-color operational visual system', () => {
  const css = fs.readFileSync(path.join(root, 'content-page.css'), 'utf8');
  assert.match(css, /--blue-register:\s*#0b3454/i);
  assert.match(css, /--cyan-signal:\s*#38bfe8/i);
  assert.match(css, /--green-checked:\s*#17745b/i);
  assert.match(css, /--coral-pending:\s*#c94f3d/i);
  assert.match(css, /font-family:\s*"Archivo"/);
  for (const name of ['product-map', 'os-timeline', 'finance-ledger', 'document-desk', 'integration-matrix', 'trust-layers', 'proposal-builder', 'story-rail']) {
    assert.match(css, new RegExp(`\\.${name}\\b`));
  }
  assert.doesNotMatch(css, /font-size:\s*clamp\([^)]*vw/);
  assert.doesNotMatch(css, /transition:\s*all/);
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test tests/site-visual-system.test.js`  
Expected: FAIL because the new primitives and font are absent.

- [ ] **Step 3: Add local Archivo and tokens**

Add a locally hosted Archivo WOFF2 asset and define:

```css
@font-face {
  font-family: "Archivo";
  src: url("/archivo-latin.woff2") format("woff2");
  font-style: normal;
  font-weight: 400 900;
  font-display: swap;
}

:root {
  --blue-register: #0b3454;
  --blue-action: #155a9c;
  --cyan-signal: #38bfe8;
  --green-checked: #17745b;
  --coral-pending: #c94f3d;
  --paper-cool: #f5f8fa;
}
```

- [ ] **Step 4: Replace the rigid template styles with composable primitives**

Keep containers, breadcrumbs, privacy UI and footer. Remove reliance on `.feature-grid`, `.process-list`, `.detail-band` and `.related-grid` as the mandatory page skeleton. Implement each produced primitive with stable grid dimensions, clear responsive collapse and data colors that do not rely on hue alone.

- [ ] **Step 5: Run tests and commit**

```powershell
node --test tests/site-visual-system.test.js tests/site-accessibility.test.js tests/site-performance.test.js
node --test
git diff --check
git add archivo-latin.woff2 content-page.css site.css tests/site-visual-system.test.js
git commit -m "style: add operational content page system"
```

### Task 5: Refocus the home and platform overview

**Files:**
- Modify: `index.html`
- Modify: `sistema-para-despachante.html`
- Modify: `site.css`
- Modify: `content-page.css`
- Modify: `site.js`
- Create: `tests/site-page-purpose.test.js`

**Interfaces:**
- Produces: home sections `problem`, `module-routes`, `proof`, `security-summary`, `faq`, `final-cta`.
- Produces: platform component `.product-map` with buttons using `data-product-module` and panels using `data-product-panel`.
- Consumes: navigation and visual primitives from Tasks 2 and 4.

- [ ] **Step 1: Write page-purpose tests**

```js
test('gives home and platform overview different jobs', () => {
  const home = read('index.html');
  const system = read('sistema-para-despachante.html');
  assert.match(home, /class="module-routes"/);
  assert.doesNotMatch(home, /class="product-map"/);
  assert.match(system, /class="product-map"/);
  assert.match(system, /data-product-module="ordens"/);
  assert.match(system, /data-product-panel="financeiro"/);
  assert.doesNotMatch(system, /Continue explorando o DespachoCerto/);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/site-page-purpose.test.js`  
Expected: FAIL against the current repeated structures.

- [ ] **Step 3: Shorten and refocus the home**

Keep the current hero product view and strongest operational pain section. Replace the full module tour, long role tour and SEO essay with five concise routes: Ordens, Clientes, Documentos, Financeiro and Equipe. Each route must state one concrete outcome and link to the relevant specialized page. Keep FAQ and security summary.

- [ ] **Step 4: Build the platform map page**

Use headline `Cliente, veículo, processo, documentos e valores na mesma linha de trabalho.` The map must show how a customer record feeds an OS, which receives documents, responsibility and financial entries. Selecting a module updates an adjacent explanation without resizing the overall layout.

- [ ] **Step 5: Add platform-map behavior**

Extend `content-page.js` with click and arrow-key behavior for `[data-product-module]`, setting `aria-selected`, `tabIndex` and matching panel visibility.

- [ ] **Step 6: Run tests and commit**

```powershell
node --test tests/site-page-purpose.test.js tests/site-accessibility.test.js tests/site-analytics.test.js
node --test
git diff --check
git add index.html sistema-para-despachante.html site.css content-page.css site.js content-page.js tests/site-page-purpose.test.js
git commit -m "feat: separate home and platform overview journeys"
```

### Task 6: Rebuild OS and finance pages around real workflows

**Files:**
- Modify: `ordem-de-servico-para-despachante.html`
- Modify: `controle-financeiro-para-despachante.html`
- Modify: `content-page.css`
- Modify: `content-page.js`
- Modify: `tests/site-page-purpose.test.js`

**Interfaces:**
- Produces: `.os-timeline` with `data-os-event` buttons and one `.os-event-detail` region.
- Produces: `.finance-ledger` with semantic table columns `Movimento`, `Tipo`, `Valor`, `Situação`.
- Consumes: `.record-id`, `.record-status`, `.record-value` from Task 4.

- [ ] **Step 1: Add failing structural and copy tests**

```js
test('makes OS and finance pages operationally distinct', () => {
  const os = read('ordem-de-servico-para-despachante.html');
  const finance = read('controle-financeiro-para-despachante.html');
  assert.match(os, /class="os-timeline"/);
  assert.match(os, /Troca de responsável|Documento pendente|Retorno ao cliente/);
  assert.match(os, />Montar uma OS na demonstração</);
  assert.match(finance, /class="finance-ledger"/);
  assert.match(finance, /Custo de terceiro|Recebimento parcial|Saldo da OS|Lucro bruto/);
  assert.match(finance, />Ver o fechamento de uma OS</);
  assert.notEqual(normalizeBody(os), normalizeBody(finance));
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/site-page-purpose.test.js`  
Expected: FAIL because both pages still use the common six-card template.

- [ ] **Step 3: Rebuild the OS page**

Use headline `A equipe não precisa perguntar onde o processo parou.` Follow one fictional transfer OS through opening, document pending, responsibility change, customer return, payment and delivery. Include a short “before / with DespachoCerto” comparison and contextual next links only to Documents and Finance.

- [ ] **Step 4: Rebuild the finance page**

Use headline `Faturamento não responde quanto cada serviço deixou.` Show one ledger with sale, partial payment, third-party costs, remaining balance and gross result. State explicitly that DespachoCerto controls operational finance and does not replace accounting.

- [ ] **Step 5: Add timeline behavior and test**

Implement one event-detail update function in `content-page.js`; clicks and arrow keys select the corresponding OS event without page navigation. Test selection and `aria-current="step"` in the existing lightweight DOM harness.

- [ ] **Step 6: Run and commit**

```powershell
node --test tests/site-page-purpose.test.js tests/site-accessibility.test.js tests/site-seo-pages.test.js
node --test
git diff --check
git add ordem-de-servico-para-despachante.html controle-financeiro-para-despachante.html content-page.css content-page.js tests/site-page-purpose.test.js
git commit -m "feat: give OS and finance pages distinct workflows"
```

### Task 7: Rebuild documents, integrations and security pages

**Files:**
- Modify: `gestao-de-documentos.html`
- Modify: `integracoes.html`
- Modify: `seguranca.html`
- Modify: `content-page.css`
- Modify: `tests/site-page-purpose.test.js`
- Modify: `tests/site-security.test.js`

**Interfaces:**
- Produces: `.document-desk`, `.integration-matrix`, `.trust-layers`.
- Consumes: status and page-next-step primitives from Task 4.

- [ ] **Step 1: Add failing page-signature tests**

```js
test('gives documents, integrations and security unique evidence', () => {
  const docs = read('gestao-de-documentos.html');
  const integrations = read('integracoes.html');
  const security = read('seguranca.html');
  assert.match(docs, /class="document-desk"/);
  assert.match(docs, /Pendente|Recebido|Conferido/);
  assert.match(integrations, /class="integration-matrix"/);
  assert.match(integrations, /Depende de fornecedor|Depende de credenciamento|Sob análise/);
  assert.match(security, /class="trust-layers"/);
  assert.match(security, /Responsabilidade do DespachoCerto|Responsabilidade do escritório/);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/site-page-purpose.test.js`  
Expected: FAIL.

- [ ] **Step 3: Build the document desk**

Use headline `O arquivo certo precisa aparecer dentro do processo certo.` Show a document checklist tied to one OS and distinguish reusable client files from service-specific attachments. Include storage usage and privacy as supporting information, not the main argument.

- [ ] **Step 4: Build the integration matrix**

Use headline `Integração só é útil quando a origem, a autorização e o retorno são confiáveis.` Rows must identify connection, intended use, current availability and dependency. Do not label any connection as available unless the existing product supports it.

- [ ] **Step 5: Build the trust center**

Use headline `Acesso começa pela empresa, passa pelo perfil e termina no dado permitido.` Show layers for authentication, tenant, role, resource and private file. Add a two-column responsibility table for platform versus customer operation.

- [ ] **Step 6: Run and commit**

```powershell
node --test tests/site-page-purpose.test.js tests/site-security.test.js tests/site-accessibility.test.js
node --test
git diff --check
git add gestao-de-documentos.html integracoes.html seguranca.html content-page.css tests/site-page-purpose.test.js tests/site-security.test.js
git commit -m "feat: specialize documents integrations and security pages"
```

### Task 8: Rebuild pricing and about pages

**Files:**
- Modify: `precos.html`
- Modify: `sobre.html`
- Modify: `content-page.css`
- Modify: `tests/site-page-purpose.test.js`
- Modify: `tests/site-structured-data.test.js`

**Interfaces:**
- Produces: `.proposal-builder` with non-interactive explanatory factors.
- Produces: `.story-rail` containing only verifiable DespachoCerto/Elev Studio milestones.
- Consumes: global navigation and CTA patterns.

- [ ] **Step 1: Add failing pricing and about tests**

```js
test('separates commercial clarity from company story', () => {
  const pricing = read('precos.html');
  const about = read('sobre.html');
  assert.match(pricing, /class="proposal-builder"/);
  assert.match(pricing, /Usuários|Armazenamento|Migração|Implantação|Integrações/);
  assert.match(pricing, /não calcula um preço automático/i);
  assert.match(about, /class="story-rail"/);
  assert.match(about, /Elev Studio/);
  assert.doesNotMatch(about, /Ohana/i);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/site-page-purpose.test.js tests/site-structured-data.test.js`  
Expected: FAIL.

- [ ] **Step 3: Build transparent pricing composition**

Use headline `Você entende o escopo antes de receber o valor.` The proposal builder explains factors without pretending to calculate a quote. Add FAQ answers for monthly fee, implantation, migration, storage expansion and third-party integration costs.

- [ ] **Step 4: Build the product origin story**

Use headline `Um produto da Elev Studio construído para uma operação que não cabe em um CRM genérico.` Cover the verified product premise, sector specialization, responsible integrations and continuous development. Do not name any customer.

- [ ] **Step 5: Run and commit**

```powershell
node --test tests/site-page-purpose.test.js tests/site-structured-data.test.js tests/site-seo-pages.test.js
node --test
git diff --check
git add precos.html sobre.html content-page.css tests/site-page-purpose.test.js tests/site-structured-data.test.js
git commit -m "feat: clarify pricing and product story pages"
```

### Task 9: Complete copy, SEO and contextual internal linking

**Files:**
- Modify: `index.html`
- Modify: `sistema-para-despachante.html`
- Modify: `ordem-de-servico-para-despachante.html`
- Modify: `controle-financeiro-para-despachante.html`
- Modify: `gestao-de-documentos.html`
- Modify: `integracoes.html`
- Modify: `seguranca.html`
- Modify: `precos.html`
- Modify: `sobre.html`
- Modify: `contato.html`
- Modify: `sitemap.xml`
- Modify: `tests/site-seo-pages.test.js`
- Modify: `tests/site-legal.test.js`
- Modify: `tests/site-analytics.test.js`

**Interfaces:**
- Produces: unique page title, description, H1, primary CTA and contextual next step for each public URL.
- Consumes: final page bodies from Tasks 5–8.

- [ ] **Step 1: Add uniqueness and banned-copy tests**

```js
test('avoids repeated generic page arguments', () => {
  const bodies = seoPages.map(({ file }) => stripSharedShell(read(file)));
  const h1s = seoPages.map(({ file }) => extractTag(read(file), 'h1'));
  const ctas = seoPages.map(({ file }) => extractPrimaryCta(read(file)));
  assert.equal(new Set(h1s).size, h1s.length);
  assert.ok(new Set(ctas).size >= Math.ceil(ctas.length * 0.75));
  for (const body of bodies) {
    assert.doesNotMatch(body, /Continue explorando o DespachoCerto/);
    assert.doesNotMatch(body, /otimize|transforme sua gestão|solução completa/i);
  }
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/site-seo-pages.test.js`  
Expected: FAIL until repeated blocks and generic CTAs are removed.

- [ ] **Step 3: Rewrite metadata and transitions**

Ensure each page targets its existing search intent without repeating the home description. Add one or two contextual next-step links based on the journey, for example OS → Documents/Finance and Security → Documents/Integrations. Do not render a repeated three-card “related” section everywhere.

- [ ] **Step 4: Align CTA analytics**

Use stable values such as `os-demo`, `finance-close-demo`, `document-checklist-demo`, `integration-review`, `security-conversation`, `proposal-request` and `contact-submit`. Keep destinations in real anchors and verify `site-analytics.js` sends no personal information.

- [ ] **Step 5: Run SEO, legal and analytics tests**

Run: `node --test tests/site-seo-pages.test.js tests/site-structured-data.test.js tests/site-legal.test.js tests/site-analytics.test.js`  
Expected: PASS.

- [ ] **Step 6: Run spelling scan and commit**

Use `rg` for the known errors `solucao`, `voce`, `nao`, `informacao`, `esta pronto` in visible HTML text, excluding URLs, identifiers and code tokens. Correct Portuguese accents with `apply_patch`.

```powershell
node --test
git diff --check
git add *.html sitemap.xml tests/site-seo-pages.test.js tests/site-legal.test.js tests/site-analytics.test.js
git commit -m "copy: give every page a focused conversion argument"
```

### Task 10: Browser QA, performance validation and production release

**Files:**
- Potentially modify after a reproduced defect: `site-shell.css`
- Potentially modify after a reproduced defect: `site-navigation.js`
- Potentially modify after a reproduced defect: `site.css`
- Potentially modify after a reproduced defect: `content-page.css`
- Potentially modify after a reproduced defect: `site.js`
- Potentially modify after a reproduced defect: `content-page.js`
- Potentially modify after a reproduced defect: `lead-form.js`
- Potentially modify after a reproduced defect: the specific HTML page where the defect is visible
- Test: complete Node suite and production URLs.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: published production site with verified navigation, responsive layout, consent and lead conversion.

- [ ] **Step 1: Run static verification**

```powershell
node --test
git diff --check
git status --short
```

Expected: every test passes; only known `tmp/` artifacts may remain untracked.

- [ ] **Step 2: Start a local static server**

Run: `npx http-server . -p 4173 -c-1`  
Expected: server available at `http://127.0.0.1:4173`.

- [ ] **Step 3: Verify desktop and mobile in the browser**

At 1440×900, 1280×800, 768×1024 and 360×800 verify:

- Product and Content menus open, close, retain focus and navigate correctly.
- Mobile groups expand without horizontal overflow.
- Every page has a visibly different hero and content rhythm.
- No text overlaps, clipped controls, nested cards or broken long words.
- `/contato` shows the full form and Turnstile.
- Home CTAs lead to `/contato`.
- `/clientes/ohana-consultoria` returns 404.
- Cookies remain usable and do not cover focused controls.

- [ ] **Step 4: Verify consent and conversion flows**

In a clean browser session verify no Google or Clarity script before choice. Accept analytics and verify both load. Revoke and verify both stop after reload. Submit one clearly marked technical lead and confirm redirect to `/obrigado`, Supabase persistence and queued email status.

- [ ] **Step 5: Run Lighthouse against the local candidate**

Run mobile Lighthouse for `/`, `/sistema-para-despachante`, `/seguranca` and `/contato`. Acceptance: Accessibility, Best Practices and SEO at least 95; homepage Performance at least 90; no CLS over 0.1; no missing image dimensions.

- [ ] **Step 6: Commit verified fixes and push**

```powershell
node --test
git diff --check
git add -u
git commit -m "fix: finish responsive site redesign"
git push origin main
```

If no QA fixes were required, skip the empty commit and push the existing task commits.

- [ ] **Step 7: Verify Vercel production**

Wait for the production deployment to report Ready. Check `https://despachocerto.com.br/api/health`, production CSP, homepage, all module routes, contact form, sitemap and the withdrawn customer route. Review Vercel error logs for the last 30 minutes.
