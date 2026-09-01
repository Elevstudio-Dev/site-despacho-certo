const fs = require('node:fs');
const path = require('node:path');
const pages = require('./seo-pages-data.cjs');

const projectRoot = path.resolve(__dirname, '..');
const pageBySlug = new Map(pages.map((page) => [page.slug, page]));
const specializedPages = new Set([
  'sistema-para-despachante',
  'ordem-de-servico-para-despachante',
  'controle-financeiro-para-despachante',
  'gestao-de-documentos',
  'integracoes',
  'seguranca',
  'precos',
  'sobre',
  'contato',
]);

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
  const productSlugs = new Set([
    'sistema-para-despachante',
    'ordem-de-servico-para-despachante',
    'controle-financeiro-para-despachante',
    'gestao-de-documentos',
    'integracoes',
  ]);
  const current = (slug) => page.slug === slug ? ' aria-current="page"' : '';
  const productActive = productSlugs.has(page.slug);
  const contentActive = page.slug === 'sobre';

  return `
    <header class="site-navigation" aria-label="Cabeçalho principal">
      <div class="site-navigation__inner">
        <a class="site-navigation__brand" href="/" aria-label="DespachoCerto - página inicial"><img src="/despachocerto-logo-horizontal.png" alt="DespachoCerto" width="540" height="142" /></a>
        <nav class="site-navigation__desktop" aria-label="Navegação principal">
          <a class="site-navigation__link" href="/">Início</a>
          <div class="site-navigation__group">
            <button class="site-navigation__menu-button" id="productMenuButton" type="button" aria-expanded="false" aria-controls="productMenu" data-menu-button${productActive ? ' data-active="true"' : ''}>Produto<span class="site-navigation__chevron" aria-hidden="true"></span></button>
            <div class="site-navigation__panel" id="productMenu" hidden>
              <a href="/sistema-para-despachante"${current('sistema-para-despachante')}>Visão geral</a>
              <a href="/ordem-de-servico-para-despachante"${current('ordem-de-servico-para-despachante')}>Ordens de serviço</a>
              <a href="/controle-financeiro-para-despachante"${current('controle-financeiro-para-despachante')}>Financeiro</a>
              <a href="/gestao-de-documentos"${current('gestao-de-documentos')}>Documentos</a>
              <a href="/integracoes"${current('integracoes')}>Integrações</a>
            </div>
          </div>
          <a class="site-navigation__link" href="/seguranca"${current('seguranca')}>Segurança</a>
          <a class="site-navigation__link" href="/precos"${current('precos')}>Preços</a>
          <div class="site-navigation__group">
            <button class="site-navigation__menu-button" id="contentMenuButton" type="button" aria-expanded="false" aria-controls="contentMenu" data-menu-button${contentActive ? ' data-active="true"' : ''}>Conteúdo<span class="site-navigation__chevron" aria-hidden="true"></span></button>
            <div class="site-navigation__panel" id="contentMenu" hidden>
              <a href="/sobre"${current('sobre')}>Sobre o DespachoCerto</a>
              <a href="/blog">Blog</a>
            </div>
          </div>
          <a class="site-navigation__cta" data-cta="header-${page.slug}" data-site-header-cta="header-${page.slug}" href="/contato"${current('contato')}>Agendar demonstração</a>
        </nav>
        <button class="site-navigation__mobile-button" id="siteMenuButton" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="siteMobileMenu"><span class="site-navigation__mobile-icon" aria-hidden="true"></span></button>
      </div>
      <nav class="site-navigation__mobile" id="siteMobileMenu" aria-label="Navegação móvel" hidden>
        <a class="site-navigation__link" href="/">Início</a>
        <div class="site-navigation__mobile-section">
          <button class="site-navigation__toggle" id="mobileProductMenuButton" type="button" aria-expanded="false" aria-controls="mobileProductMenu" data-menu-button${productActive ? ' data-active="true"' : ''}>Produto${productActive ? '<span class="site-navigation__active-group-label">Atual</span>' : ''}<span class="site-navigation__chevron" aria-hidden="true"></span></button>
          <div class="site-navigation__mobile-panel" id="mobileProductMenu" hidden><a href="/sistema-para-despachante"${current('sistema-para-despachante')}>Visão geral</a><a href="/ordem-de-servico-para-despachante"${current('ordem-de-servico-para-despachante')}>Ordens de serviço</a><a href="/controle-financeiro-para-despachante"${current('controle-financeiro-para-despachante')}>Financeiro</a><a href="/gestao-de-documentos"${current('gestao-de-documentos')}>Documentos</a><a href="/integracoes"${current('integracoes')}>Integrações</a></div>
        </div>
        <a class="site-navigation__link" href="/seguranca"${current('seguranca')}>Segurança</a>
        <a class="site-navigation__link" href="/precos"${current('precos')}>Preços</a>
        <div class="site-navigation__mobile-section">
          <button class="site-navigation__toggle" id="mobileContentMenuButton" type="button" aria-expanded="false" aria-controls="mobileContentMenu" data-menu-button${contentActive ? ' data-active="true"' : ''}>Conteúdo${contentActive ? '<span class="site-navigation__active-group-label">Atual</span>' : ''}<span class="site-navigation__chevron" aria-hidden="true"></span></button>
          <div class="site-navigation__mobile-panel" id="mobileContentMenu" hidden><a href="/sobre"${current('sobre')}>Sobre o DespachoCerto</a><a href="/blog">Blog</a></div>
        </div>
        <a class="site-navigation__cta" data-cta="header-mobile-${page.slug}" data-site-header-cta="header-mobile-${page.slug}" href="/contato"${current('contato')}>Agendar demonstração</a>
      </nav>
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

function renderLeadForm() {
  return `<form class="lead-form" id="leadForm" action="/api/lead" method="post" data-clarity-mask="true">
            <header><h2>Prepare sua demonstração</h2><p>Conte um pouco sobre o escritório para prepararmos uma conversa útil.</p></header>
            <div class="form-grid">
              <label class="form-field">Seu nome<input name="name" type="text" autocomplete="name" placeholder="Como podemos chamar você?" required /></label>
              <label class="form-field">E-mail<input name="email" type="email" autocomplete="email" placeholder="voce@escritorio.com.br" required /></label>
              <label class="form-field">WhatsApp<input name="phone" type="tel" autocomplete="tel" placeholder="(00) 00000-0000" required /></label>
              <label class="form-field">Nome do escritório<input name="company" type="text" autocomplete="organization" placeholder="Empresa ou escritório" required /></label>
              <label class="form-field">Volume mensal de OS<select name="volume" required><option value="">Selecione</option><option>Até 50 OS</option><option>De 51 a 150 OS</option><option>De 151 a 300 OS</option><option>Mais de 300 OS</option></select></label>
              <label class="form-field full">Principal dificuldade hoje<textarea name="challenge" placeholder="Ex.: documentos, status, cobrança, financeiro ou equipe"></textarea></label>
              <div class="form-honeypot" aria-hidden="true"><label>Não preencha este campo<input name="website" type="text" autocomplete="off" tabindex="-1" /></label></div>
              <div class="turnstile-field"><div id="turnstileWidget"></div><p class="turnstile-status" id="turnstileStatus" aria-live="polite">Preparando verificação de segurança…</p></div>
              <p class="form-feedback" id="formFeedback" role="status" aria-live="polite" tabindex="-1"></p>
              <button class="button button-primary" id="leadSubmit" type="submit"><span id="leadSubmitLabel">Preparar minha demonstração</span> <i data-lucide="arrow-right" size="17" aria-hidden="true"></i></button>
              <p class="form-note">Ao enviar, você concorda em receber contato da equipe DespachoCerto sobre a demonstração solicitada. Consulte nossa <a href="/privacidade">Política de Privacidade</a>.</p>
            </div>
          </form>`;
}

function renderHero(page) {
  if (page.slug === 'contato') {
    return `<div class="container hero-layout">
          <div class="hero-copy"><p class="eyebrow">${escapeHtml(page.eyebrow)}</p><h1>${escapeHtml(page.h1)}</h1><p>${escapeHtml(page.intro)}</p><ul class="contact-outcomes">${page.outcomes.map(([title, text]) => `<li><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span></li>`).join('')}</ul></div>
          ${renderLeadForm()}
        </div>`;
  }

  return `<div class="container hero-layout">
          <div class="hero-copy"><p class="eyebrow">${escapeHtml(page.eyebrow)}</p><h1>${escapeHtml(page.h1)}</h1><p>${escapeHtml(page.intro)}</p><div class="hero-actions"><a class="button button-primary" data-cta="hero-${page.slug}" href="${page.ctaHref || '/contato'}">${escapeHtml(page.ctaLabel)} <i data-lucide="arrow-right" size="17" aria-hidden="true"></i></a><a class="button button-secondary" href="/sistema-para-despachante">Conhecer o sistema</a></div><div class="hero-note"><span><i data-lucide="check-circle-2" size="15" aria-hidden="true"></i> Demonstração orientada à rotina</span><span><i data-lucide="check-circle-2" size="15" aria-hidden="true"></i> Sem compromisso</span></div></div>
          ${renderVisual(page.visual)}
        </div>`;
}

function renderFooter() {
  return `<footer class="content-footer">
    <div class="container footer-grid">
      <div class="footer-brand"><a class="content-brand footer-brand-link" href="/" aria-label="DespachoCerto - página inicial"><span class="content-brand-mark" aria-hidden="true"></span><strong>DespachoCerto</strong></a><p>Gestão de ordens de serviço, clientes, documentos, financeiro e equipe para despachantes veiculares.</p></div>
      <div class="footer-column"><strong>Produto</strong><a href="/sistema-para-despachante">Sistema</a><a href="/ordem-de-servico-para-despachante">Ordens de serviço</a><a href="/controle-financeiro-para-despachante">Financeiro</a><a href="/gestao-de-documentos">Documentos</a></div>
      <div class="footer-column"><strong>Empresa</strong><a href="/sobre">Sobre</a><a href="/seguranca">Segurança</a><a href="/precos">Preços</a><a href="/contato">Contato</a><a href="https://elevstudio.com.br/" target="_blank" rel="noopener noreferrer">Elev Studio</a></div>
      <div class="footer-column"><strong>Legal</strong><a href="/privacidade">Privacidade</a><a href="/cookies">Cookies</a><a href="/termos">Termos</a><button class="footer-link-button" id="privacySettings" type="button">Preferências de cookies</button></div>
    </div>
    <div class="container footer-bottom"><span>© <span data-current-year>2026</span> DespachoCerto.</span><span>Uma solução Elev Studio.</span></div>
  </footer>`;
}

function renderPage(page) {
  const canonical = `https://despachocerto.com.br/${page.slug}`;
  const related = page.related.map((slug) => pageBySlug.get(slug));
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
    <link rel="stylesheet" href="/site-shell.css" />
  </head>
  <body>
    <a class="skip-link" href="#conteudo">Ir para o conteúdo</a>
    ${renderHeader(page)}
    <main id="conteudo">
      <div class="container breadcrumbs" aria-label="Navegação estrutural" itemscope itemtype="https://schema.org/BreadcrumbList">
        <ol><li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem"><a itemprop="item" href="/"><span itemprop="name">Início</span></a><meta itemprop="position" content="1" /></li><li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem"><span itemprop="name">${escapeHtml(page.eyebrow)}</span><meta itemprop="position" content="2" /></li></ol>
      </div>
      <section class="content-hero">
        ${renderHero(page)}
      </section>
      <section class="trust-strip" aria-label="Princípios desta solução"><div class="container trust-row">${page.trust.map(([title, text]) => `<div class="trust-item"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span></div>`).join('')}</div></section>
      <section class="content-section"><div class="container"><div class="section-heading"><h2>${escapeHtml(page.sectionTitle)}</h2><p>${escapeHtml(page.sectionLead)}</p></div><div class="feature-grid">${page.features.map(([title, text], index) => `<article class="feature-item"><span class="feature-number">${String(index + 1).padStart(2, '0')}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></article>`).join('')}</div></div></section>
      <section class="content-section alt"><div class="container split-section"><div class="split-copy"><p class="eyebrow">Como funciona</p><h2>${escapeHtml(page.splitTitle)}</h2><p>${escapeHtml(page.splitIntro)}</p><ul class="check-list">${page.checks.map((item) => `<li><i data-lucide="check-circle-2" size="19" aria-hidden="true"></i><span>${escapeHtml(item)}</span></li>`).join('')}</ul></div><div class="process-list">${page.process.map(([title, text], index) => `<div class="process-step"><span>${String(index + 1).padStart(2, '0')}</span><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></div></div>`).join('')}</div></div></section>
      <section class="content-section detail-band"><div class="container detail-layout"><div><p class="eyebrow eyebrow-on-dark">Em detalhes</p><h2>${escapeHtml(page.bandTitle)}</h2><p>${escapeHtml(page.bandText)}</p></div><div class="detail-points">${page.bandPoints.map(([title, text]) => `<div class="detail-point"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span></div>`).join('')}</div></div></section>
      <section class="content-section"><div class="container"><div class="section-heading"><h2>Escolha o próximo assunto da sua avaliação.</h2><p>Cada página aprofunda uma decisão específica sobre operação, implantação ou confiança.</p></div><div class="related-grid">${related.map((item) => `<a class="related-link" href="/${item.slug}"><span>DespachoCerto</span><strong>${escapeHtml(item.eyebrow)}</strong><p>${escapeHtml(item.description)}</p><i data-lucide="arrow-right" size="18" aria-hidden="true"></i></a>`).join('')}</div></div></section>
      <section class="content-cta"><div class="container cta-layout"><div><h2>${escapeHtml(page.ctaTitle)}</h2><p>${escapeHtml(page.ctaText)}</p></div><a class="button button-primary" data-cta="final-${page.slug}" href="${page.ctaHref || '/contato'}">${escapeHtml(page.ctaLabel)} <i data-lucide="arrow-right" size="17" aria-hidden="true"></i></a></div></section>
    </main>
    ${renderFooter()}
    ${renderPrivacy()}
    <script src="/site-icon-data.js" defer></script>
    <script src="/site-preferences.js" defer></script>
    <script src="/site-analytics.js" defer></script>
    <script src="/site-navigation.js" defer></script>
    <script src="/content-page.js" defer></script>
    ${page.slug === 'contato' ? '<script src="/lead-form.js" defer></script>' : ''}
  </body>
</html>\n`;
}

pages.forEach((page) => {
  const target = path.join(projectRoot, `${page.slug}.html`);
  if (specializedPages.has(page.slug) && fs.existsSync(target)) return;
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
