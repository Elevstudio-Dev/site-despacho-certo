const fs = require('node:fs');
const path = require('node:path');
const pages = require('./seo-pages-data.cjs');

const projectRoot = path.resolve(__dirname, '..');
const pageBySlug = new Map(pages.map((page) => [page.slug, page]));

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderPrivacy() {
  return `
    <section class="privacy-choice-panel" id="privacyChoicePanel" aria-labelledby="privacyChoiceTitle" aria-describedby="privacyChoiceDescription">
      <div class="privacy-choice-inner">
        <span class="privacy-choice-icon" aria-hidden="true"><i data-lucide="shield-check" size="20"></i></span>
        <div class="privacy-choice-copy"><strong id="privacyChoiceTitle">Privacidade sob seu controle</strong><p id="privacyChoiceDescription">Recursos necessários mantêm o site funcionando. Com sua autorização, usamos Analytics para melhorar a experiência. Consulte nossa <a href="/privacidade">Política de Privacidade</a> e a <a href="/cookies">Política de Cookies</a>.</p></div>
        <div class="privacy-choice-actions"><button class="privacy-choice-button privacy-choice-button-secondary" id="privacyDeclineAnalytics" type="button">Recusar</button><button class="privacy-choice-button privacy-choice-button-secondary" id="privacyOpenPreferences" type="button">Preferências</button><button class="privacy-choice-button privacy-choice-button-primary" id="privacyAcceptAnalytics" type="button">Aceitar analíticos</button></div>
      </div>
    </section>
    <dialog class="privacy-preferences-dialog" id="privacyPreferencesDialog" aria-labelledby="privacyPreferencesTitle">
      <div class="privacy-preferences-card">
        <header><div><span class="privacy-preferences-kicker">Controle de privacidade</span><h2 id="privacyPreferencesTitle">Preferências de cookies</h2></div><button class="privacy-dialog-close" id="privacyClosePreferences" type="button" aria-label="Fechar preferências"><span aria-hidden="true">×</span></button></header>
        <section class="privacy-category"><div><strong>Necessários</strong><p>Mantêm o site funcionando e lembram sua escolha de privacidade.</p></div><span class="privacy-always-on">Sempre ativos</span></section>
        <section class="privacy-category"><div><strong>Analíticos</strong><p>Ajudam a medir navegação e conversões pelo Google Analytics 4.</p></div><label class="privacy-toggle"><input id="privacyAnalyticsToggle" type="checkbox" role="switch" /><span aria-hidden="true"></span><span class="sr-only">Permitir cookies analíticos</span></label></section>
        <p class="privacy-dialog-links"><a href="/privacidade">Política de Privacidade</a><a href="/cookies">Política de Cookies</a></p>
        <footer><button class="privacy-choice-button privacy-choice-button-primary" id="privacySavePreferences" type="button">Salvar preferências</button></footer>
      </div>
    </dialog>`;
}

function renderHeader(page) {
  return `
    <header class="content-header">
      <div class="container header-row">
        <a class="content-brand" href="/" aria-label="DespachoCerto - página inicial"><img src="/despachocerto-logo-horizontal.png" alt="DespachoCerto" width="540" height="142" /></a>
        <nav class="content-nav" aria-label="Navegação principal">
          <a href="/sistema-para-despachante"${page.slug === 'sistema-para-despachante' ? ' aria-current="page"' : ''}>Sistema</a>
          <a href="/precos"${page.slug === 'precos' ? ' aria-current="page"' : ''}>Preços</a>
          <a href="/seguranca"${page.slug === 'seguranca' ? ' aria-current="page"' : ''}>Segurança</a>
          <a href="/sobre"${page.slug === 'sobre' ? ' aria-current="page"' : ''}>Sobre</a>
          <a href="/blog">Blog</a>
          <a class="header-cta" data-cta="header-${page.slug}" href="/contato">Agendar demonstração <i data-lucide="arrow-right" size="15" aria-hidden="true"></i></a>
        </nav>
        <button class="menu-button" id="contentMenuButton" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="contentMobileMenu"><i data-lucide="menu" aria-hidden="true"></i></button>
      </div>
      <nav class="mobile-menu" id="contentMobileMenu" aria-label="Navegação móvel" hidden><a href="/sistema-para-despachante">Sistema</a><a href="/precos">Preços</a><a href="/seguranca">Segurança</a><a href="/sobre">Sobre</a><a href="/blog">Blog</a><a href="/contato">Agendar demonstração</a></nav>
    </header>`;
}

function renderVisual(visual) {
  return `<div class="product-visual" aria-label="Exemplo visual: ${escapeHtml(visual.title)}">
    <div class="visual-shell">
      <div class="visual-topbar"><span class="visual-brand-dot"></span><strong>DespachoCerto</strong><span class="visual-status">Ambiente demonstrativo</span></div>
      <div class="visual-body">
        <aside class="visual-sidebar" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></aside>
        <div class="visual-workspace">
          <div class="visual-heading"><div><span>${escapeHtml(visual.caption)}</span><strong>${escapeHtml(visual.title)}</strong></div><span class="visual-chip">Atualizado</span></div>
          <div class="visual-grid">
            ${visual.metrics.map(([label, value]) => `<div class="visual-metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('')}
            <div class="visual-list">${visual.rows.map(([label, status]) => `<div class="visual-row"><b>${escapeHtml(label)}</b><em>${escapeHtml(status)}</em></div>`).join('')}</div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function renderFooter() {
  return `<footer class="content-footer">
    <div class="container footer-grid">
      <div class="footer-brand"><img src="/despachocerto-logo-horizontal.png" alt="DespachoCerto" width="540" height="142" /><p>Gestão de ordens de serviço, clientes, documentos, financeiro e equipe para despachantes veiculares.</p></div>
      <div class="footer-column"><strong>Produto</strong><a href="/sistema-para-despachante">Sistema</a><a href="/ordem-de-servico-para-despachante">Ordens de serviço</a><a href="/controle-financeiro-para-despachante">Financeiro</a><a href="/gestao-de-documentos">Documentos</a></div>
      <div class="footer-column"><strong>Empresa</strong><a href="/sobre">Sobre</a><a href="/clientes/ohana-consultoria">Clientes</a><a href="/precos">Preços</a><a href="/contato">Contato</a><a href="https://elevstudio.com.br/" target="_blank" rel="noopener noreferrer">Elev Studio</a></div>
      <div class="footer-column"><strong>Legal</strong><a href="/privacidade">Privacidade</a><a href="/cookies">Cookies</a><a href="/termos">Termos</a><button class="footer-link-button" id="privacySettings" type="button">Preferências de cookies</button></div>
    </div>
    <div class="container footer-bottom"><span>© <span data-current-year>2026</span> DespachoCerto.</span><span>Uma solução Elev Studio.</span></div>
  </footer>`;
}

function renderPage(page) {
  const canonical = `https://despachocerto.com.br/${page.slug}`;
  const related = page.related.map((slug) => pageBySlug.get(slug));
  const sourceLink = page.sourceUrl ? `<p>Conheça também o <a href="${escapeHtml(page.sourceUrl)}" target="_blank" rel="noopener noreferrer">site oficial da Ohana Consultoria <i data-lucide="external-link" size="14" aria-hidden="true"></i></a>.</p>` : '';
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta name="theme-color" content="#0b3454" />
    <link rel="canonical" href="${canonical}" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <meta property="og:locale" content="pt_BR" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="DespachoCerto" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="https://despachocerto.com.br/despachocerto-og.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="stylesheet" href="/content-page.css" />
  </head>
  <body>
    <a class="skip-link" href="#conteudo">Ir para o conteúdo</a>
    ${renderHeader(page)}
    <main id="conteudo">
      <div class="container breadcrumbs" aria-label="Navegação estrutural" itemscope itemtype="https://schema.org/BreadcrumbList">
        <ol><li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem"><a itemprop="item" href="/"><span itemprop="name">Início</span></a><meta itemprop="position" content="1" /></li><li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem"><span itemprop="name">${escapeHtml(page.eyebrow)}</span><meta itemprop="position" content="2" /></li></ol>
      </div>
      <section class="content-hero">
        <div class="container hero-layout">
          <div class="hero-copy"><p class="eyebrow">${escapeHtml(page.eyebrow)}</p><h1>${escapeHtml(page.h1)}</h1><p>${escapeHtml(page.intro)}</p><div class="hero-actions"><a class="button button-primary" data-cta="hero-${page.slug}" href="${page.ctaHref || '/contato'}">${escapeHtml(page.ctaLabel)} <i data-lucide="arrow-right" size="17" aria-hidden="true"></i></a><a class="button button-secondary" href="/sistema-para-despachante">Conhecer o sistema</a></div><div class="hero-note"><span><i data-lucide="check-circle-2" size="15" aria-hidden="true"></i> Demonstração orientada à rotina</span><span><i data-lucide="check-circle-2" size="15" aria-hidden="true"></i> Sem compromisso</span></div></div>
          ${renderVisual(page.visual)}
        </div>
      </section>
      <section class="trust-strip" aria-label="Princípios desta solução"><div class="container trust-row">${page.trust.map(([title, text]) => `<div class="trust-item"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span></div>`).join('')}</div></section>
      <section class="content-section"><div class="container"><div class="section-heading"><h2>${escapeHtml(page.sectionTitle)}</h2><p>${escapeHtml(page.sectionLead)}</p></div><div class="feature-grid">${page.features.map(([title, text], index) => `<article class="feature-item"><span class="feature-number">${String(index + 1).padStart(2, '0')}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></article>`).join('')}</div></div></section>
      <section class="content-section alt"><div class="container split-section"><div class="split-copy"><p class="eyebrow">Como funciona</p><h2>${escapeHtml(page.splitTitle)}</h2><p>${escapeHtml(page.splitIntro)}</p><ul class="check-list">${page.checks.map((item) => `<li><i data-lucide="check-circle-2" size="19" aria-hidden="true"></i><span>${escapeHtml(item)}</span></li>`).join('')}</ul></div><div class="process-list">${page.process.map(([title, text], index) => `<div class="process-step"><span>${String(index + 1).padStart(2, '0')}</span><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></div></div>`).join('')}</div></div></section>
      <section class="content-section detail-band"><div class="container detail-layout"><div><p class="eyebrow eyebrow-on-dark">Em detalhes</p><h2>${escapeHtml(page.bandTitle)}</h2><p>${escapeHtml(page.bandText)}</p>${sourceLink}</div><div class="detail-points">${page.bandPoints.map(([title, text]) => `<div class="detail-point"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span></div>`).join('')}</div></div></section>
      <section class="content-section"><div class="container"><div class="section-heading"><h2>Continue explorando o DespachoCerto.</h2><p>Veja como os principais módulos e decisões do produto se conectam na rotina do escritório.</p></div><div class="related-grid">${related.map((item) => `<a class="related-link" href="/${item.slug}"><span>DespachoCerto</span><strong>${escapeHtml(item.eyebrow)}</strong><p>${escapeHtml(item.description)}</p><i data-lucide="arrow-right" size="18" aria-hidden="true"></i></a>`).join('')}</div></div></section>
      <section class="content-cta"><div class="container cta-layout"><div><h2>${escapeHtml(page.ctaTitle)}</h2><p>${escapeHtml(page.ctaText)}</p></div><a class="button button-primary" data-cta="final-${page.slug}" href="${page.ctaHref || '/contato'}">${escapeHtml(page.ctaLabel)} <i data-lucide="arrow-right" size="17" aria-hidden="true"></i></a></div></section>
    </main>
    ${renderFooter()}
    ${renderPrivacy()}
    <script src="/site-icon-data.js" defer></script>
    <script src="/site-preferences.js" defer></script>
    <script src="/site-analytics.js" defer></script>
    <script src="/content-page.js" defer></script>
  </body>
</html>\n`;
}

pages.forEach((page) => {
  const target = path.join(projectRoot, `${page.slug}.html`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, renderPage(page));
});

const sitemapEntries = [
  ['/', 'weekly', '1.0'],
  ...pages.map((page) => [`/${page.slug}`, page.slug.startsWith('clientes/') ? 'monthly' : 'weekly', page.slug === 'sistema-para-despachante' ? '0.9' : '0.8']),
  ['/privacidade', 'yearly', '0.3'],
  ['/cookies', 'yearly', '0.3'],
  ['/termos', 'yearly', '0.3'],
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries.map(([slug, changefreq, priority]) => `  <url>\n    <loc>https://despachocerto.com.br${slug}</loc>\n    <lastmod>2026-08-29</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(projectRoot, 'sitemap.xml'), sitemap);

console.log(`Generated ${pages.length} SEO pages and sitemap.xml.`);
