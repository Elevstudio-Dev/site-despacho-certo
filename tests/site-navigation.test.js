const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const createSiteNavigation = require('../site-navigation.js');

const root = path.resolve(__dirname, '..');
const pages = [
  'index.html',
  'sistema-para-despachante.html',
  'ordem-de-servico-para-despachante.html',
  'controle-financeiro-para-despachante.html',
  'gestao-de-documentos.html',
  'integracoes.html',
  'seguranca.html',
  'precos.html',
  'sobre.html',
  'contato.html',
  'privacidade.html',
  'cookies.html',
  'termos.html',
  'obrigado.html',
];
const generatedPages = pages.slice(1, 10);
const shellStyles = fs.readFileSync(path.join(root, 'site-shell.css'), 'utf8');

test('publishes the same global information architecture on every page', () => {
  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    assert.match(html, /class="site-navigation"/, page);
    assert.match(html, /href="\/"[^>]*>Início<\/a>/, page);
    assert.match(html, /id="productMenuButton"[^>]+aria-expanded="false"/, page);
    assert.match(html, /id="contentMenuButton"[^>]+aria-expanded="false"/, page);
    assert.match(html, /href="\/sistema-para-despachante"[^>]*>Visão geral<\/a>/, page);
    assert.match(html, /href="\/ordem-de-servico-para-despachante"/, page);
    assert.match(html, /href="\/controle-financeiro-para-despachante"/, page);
    assert.match(html, /href="\/gestao-de-documentos"/, page);
    assert.match(html, /href="\/integracoes"/, page);
    assert.match(html, /href="\/seguranca"[^>]*>Segurança<\/a>/, page);
    assert.match(html, /href="\/precos"[^>]*>Preços<\/a>/, page);
    assert.match(html, /href="\/sobre"[^>]*>Sobre o DespachoCerto<\/a>/, page);
    assert.match(html, /href="\/blog"[^>]*>Blog<\/a>/, page);
    assert.match(html, /href="\/contato"[^>]*>\s*Agendar demonstração/, page);
    assert.match(html, /id="siteMenuButton"[^>]+aria-expanded="false"/, page);
    assert.match(html, /id="siteMobileMenu"[^>]+hidden/, page);
    assert.match(html, /href="\/site-shell\.css"/, page);
    assert.match(html, /src="\/?site-preferences\.js"/, page);
    assert.match(html, /src="\/?site-analytics\.js"/, page);
    assert.match(html, /src="\/site-navigation\.js"/, page);
    assert.doesNotMatch(html, /contentMobileMenu|id="menuButton"|id="mobileMenu"/, page);
    assert.doesNotMatch(html, /ohana/i, page);

    const pageStylesheet = html.search(/(?:site|content-page|legal)\.css/);
    const shellStylesheet = html.indexOf('/site-shell.css');
    const analyticsScript = Math.max(html.indexOf('/site-analytics.js'), html.indexOf('"site-analytics.js'));
    const navigationScript = html.indexOf('/site-navigation.js');
    const pageScript = Math.max(html.indexOf('/site.js'), html.indexOf('/content-page.js'), html.indexOf('/legal.js'));
    assert.ok(shellStylesheet > pageStylesheet, `${page}: shell CSS must load after page CSS`);
    assert.ok(analyticsScript < navigationScript, `${page}: analytics must load before navigation`);
    assert.ok(pageScript === -1 || navigationScript < pageScript, `${page}: navigation must load before page script`);
  }
});

test('marks the active mobile group with visible text and a distinct treatment', () => {
  const productPage = fs.readFileSync(path.join(root, 'sistema-para-despachante.html'), 'utf8');
  const contentPage = fs.readFileSync(path.join(root, 'sobre.html'), 'utf8');

  assert.match(
    productPage,
    /id="mobileProductMenuButton"[^>]*data-active="true"[^>]*>Produto<span class="site-navigation__active-group-label">Atual<\/span>/,
  );
  assert.match(
    contentPage,
    /id="mobileContentMenuButton"[^>]*data-active="true"[^>]*>Conteúdo<span class="site-navigation__active-group-label">Atual<\/span>/,
  );
  assert.match(shellStyles, /\.site-navigation__toggle\[data-active="true"\]/);
  assert.match(shellStyles, /\.site-navigation__active-group-label\s*\{[^}]*border:/s);
});

function normalizeShell(html) {
  const shell = html.match(/<header class="site-navigation"[\s\S]*?<\/header>/)?.[0];
  assert.ok(shell, 'Expected a site navigation shell');
  return shell.replace(/\s+/g, ' ').trim();
}

test('keeps generated navigation shells synchronized with published pages', (context) => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatchocerto-navigation-'));
  context.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));
  const temporaryScripts = path.join(temporaryRoot, 'scripts');
  fs.mkdirSync(temporaryScripts);
  for (const file of ['generate-seo-pages.cjs', 'seo-pages-data.cjs']) {
    fs.copyFileSync(path.join(root, 'scripts', file), path.join(temporaryScripts, file));
  }

  const generation = spawnSync(process.execPath, [path.join(temporaryScripts, 'generate-seo-pages.cjs')], {
    cwd: temporaryRoot,
    encoding: 'utf8',
  });
  assert.equal(generation.status, 0, generation.stderr || generation.stdout);

  for (const page of generatedPages) {
    const generated = fs.readFileSync(path.join(temporaryRoot, page), 'utf8');
    const published = fs.readFileSync(path.join(root, page), 'utf8');
    assert.equal(normalizeShell(generated), normalizeShell(published), page);
  }
});

class FakeElement {
  constructor(id, attributes = {}) {
    this.id = id;
    this.attributes = new Map(Object.entries(attributes));
    this.dataset = {};
    this.hidden = true;
    this.listeners = new Map();
    this.focused = false;
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  dispatch(type, event = {}) {
    const emitted = { target: this, ...event };
    (this.listeners.get(type) || []).forEach((listener) => listener(emitted));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  focus() {
    this.focused = true;
  }

  closest(selector) {
    return selector === '.site-navigation' ? this : null;
  }
}

function createHarness() {
  const productButton = new FakeElement('productMenuButton', {
    'aria-controls': 'productMenu',
    'aria-expanded': 'false',
  });
  const contentButton = new FakeElement('contentMenuButton', {
    'aria-controls': 'contentMenu',
    'aria-expanded': 'false',
  });
  const mobileButton = new FakeElement('siteMenuButton', {
    'aria-controls': 'siteMobileMenu',
    'aria-expanded': 'false',
  });
  const productMenu = new FakeElement('productMenu');
  const contentMenu = new FakeElement('contentMenu');
  const mobileMenu = new FakeElement('siteMobileMenu');
  const mobileProductButton = new FakeElement('mobileProductMenuButton', {
    'aria-controls': 'mobileProductMenu',
    'aria-expanded': 'false',
  });
  const mobileContentButton = new FakeElement('mobileContentMenuButton', {
    'aria-controls': 'mobileContentMenu',
    'aria-expanded': 'false',
  });
  const mobileProductMenu = new FakeElement('mobileProductMenu');
  const mobileContentMenu = new FakeElement('mobileContentMenu');
  const cta = new FakeElement('headerCta', { href: '/contato' });
  cta.dataset.siteHeaderCta = 'header-test';

  const elements = new Map([
    [productButton.id, productButton],
    [contentButton.id, contentButton],
    [mobileButton.id, mobileButton],
    [productMenu.id, productMenu],
    [contentMenu.id, contentMenu],
    [mobileMenu.id, mobileMenu],
    [mobileProductButton.id, mobileProductButton],
    [mobileContentButton.id, mobileContentButton],
    [mobileProductMenu.id, mobileProductMenu],
    [mobileContentMenu.id, mobileContentMenu],
  ]);
  const documentListeners = new Map();
  const targetListeners = new Map();
  const navigation = {
    querySelectorAll(selector) {
      if (selector === '[data-site-header-cta]') return [cta];
      if (selector === 'a') return [cta];
      return [];
    },
  };
  const document = {
    querySelector: (selector) => selector === '.site-navigation' ? navigation : null,
    querySelectorAll: (selector) => selector === '[data-menu-button]'
      ? [productButton, contentButton, mobileProductButton, mobileContentButton]
      : [],
    getElementById: (id) => elements.get(id) || null,
    addEventListener(type, listener) {
      const listeners = documentListeners.get(type) || [];
      listeners.push(listener);
      documentListeners.set(type, listeners);
    },
    dispatch(type, event) {
      (documentListeners.get(type) || []).forEach((listener) => listener(event));
    },
  };
  const analyticsCalls = [];
  const target = {
    innerWidth: 1280,
    DespachoCertoAnalytics: {
      trackCta: (...args) => analyticsCalls.push(args),
    },
    addEventListener(type, listener) {
      const listeners = targetListeners.get(type) || [];
      listeners.push(listener);
      targetListeners.set(type, listeners);
    },
    dispatch(type) {
      (targetListeners.get(type) || []).forEach((listener) => listener());
    },
  };

  return {
    analyticsCalls,
    contentButton,
    contentMenu,
    cta,
    document,
    mobileButton,
    mobileContentButton,
    mobileContentMenu,
    mobileMenu,
    mobileProductButton,
    mobileProductMenu,
    productButton,
    productMenu,
    target,
  };
}

test('keeps only one dropdown expanded at a time', () => {
  const harness = createHarness();
  createSiteNavigation(harness.target, harness.document).initialize();

  harness.productButton.dispatch('click');
  assert.equal(harness.productButton.getAttribute('aria-expanded'), 'true');
  assert.equal(harness.productMenu.hidden, false);

  harness.contentButton.dispatch('click');
  assert.equal(harness.productButton.getAttribute('aria-expanded'), 'false');
  assert.equal(harness.productMenu.hidden, true);
  assert.equal(harness.contentButton.getAttribute('aria-expanded'), 'true');
  assert.equal(harness.contentMenu.hidden, false);
});

test('keeps only one mobile group expanded at a time', () => {
  const harness = createHarness();
  createSiteNavigation(harness.target, harness.document).initialize();

  harness.mobileProductButton.dispatch('click');
  assert.equal(harness.mobileProductButton.getAttribute('aria-expanded'), 'true');
  assert.equal(harness.mobileProductMenu.hidden, false);

  harness.mobileContentButton.dispatch('click');
  assert.equal(harness.mobileProductButton.getAttribute('aria-expanded'), 'false');
  assert.equal(harness.mobileProductMenu.hidden, true);
  assert.equal(harness.mobileContentButton.getAttribute('aria-expanded'), 'true');
  assert.equal(harness.mobileContentMenu.hidden, false);
});

test('closes open navigation with Escape and restores trigger focus', () => {
  const harness = createHarness();
  createSiteNavigation(harness.target, harness.document).initialize();
  harness.contentButton.dispatch('click');

  harness.document.dispatch('keydown', { key: 'Escape' });

  assert.equal(harness.contentButton.getAttribute('aria-expanded'), 'false');
  assert.equal(harness.contentMenu.hidden, true);
  assert.equal(harness.contentButton.focused, true);
});

test('does not move focus when Escape is pressed with navigation closed', () => {
  const harness = createHarness();
  const navigation = createSiteNavigation(harness.target, harness.document);
  navigation.initialize();
  harness.productButton.dispatch('click');
  navigation.closeAll();
  harness.productButton.focused = false;

  harness.document.dispatch('keydown', { key: 'Escape' });

  assert.equal(harness.productButton.focused, false);
});

test('restores focus to the visible main button when Escape closes the mobile panel', () => {
  const harness = createHarness();
  harness.target.innerWidth = 360;
  createSiteNavigation(harness.target, harness.document).initialize();
  harness.mobileButton.dispatch('click');
  harness.mobileProductButton.dispatch('click');

  harness.document.dispatch('keydown', { key: 'Escape' });

  assert.equal(harness.mobileMenu.hidden, true);
  assert.equal(harness.mobileProductMenu.hidden, true);
  assert.equal(harness.mobileButton.focused, true);
  assert.equal(harness.mobileProductButton.focused, false);
});

test('keeps mobile hidden state and aria-expanded in sync', () => {
  const harness = createHarness();
  createSiteNavigation(harness.target, harness.document).initialize();

  harness.mobileButton.dispatch('click');
  assert.equal(harness.mobileButton.getAttribute('aria-expanded'), 'true');
  assert.equal(harness.mobileButton.getAttribute('aria-label'), 'Fechar menu');
  assert.equal(harness.mobileMenu.hidden, false);

  harness.mobileButton.dispatch('click');
  assert.equal(harness.mobileButton.getAttribute('aria-expanded'), 'false');
  assert.equal(harness.mobileMenu.hidden, true);
});

test('resets every menu when crossing from desktop to mobile', () => {
  const harness = createHarness();
  createSiteNavigation(harness.target, harness.document).initialize();
  harness.productButton.dispatch('click');

  harness.target.innerWidth = 360;
  harness.target.dispatch('resize');

  for (const button of [
    harness.productButton,
    harness.contentButton,
    harness.mobileProductButton,
    harness.mobileContentButton,
    harness.mobileButton,
  ]) {
    assert.equal(button.getAttribute('aria-expanded'), 'false');
  }
  for (const panel of [
    harness.productMenu,
    harness.contentMenu,
    harness.mobileProductMenu,
    harness.mobileContentMenu,
    harness.mobileMenu,
  ]) {
    assert.equal(panel.hidden, true);
  }
});

test('resets every menu when crossing from mobile to desktop', () => {
  const harness = createHarness();
  harness.target.innerWidth = 360;
  createSiteNavigation(harness.target, harness.document).initialize();
  harness.mobileButton.dispatch('click');
  harness.mobileContentButton.dispatch('click');

  harness.target.innerWidth = 1280;
  harness.target.dispatch('resize');

  assert.equal(harness.mobileButton.getAttribute('aria-expanded'), 'false');
  assert.equal(harness.mobileMenu.hidden, true);
  assert.equal(harness.mobileContentButton.getAttribute('aria-expanded'), 'false');
  assert.equal(harness.mobileContentMenu.hidden, true);
});

test('tracks the header CTA through the shared analytics interface', () => {
  const harness = createHarness();
  createSiteNavigation(harness.target, harness.document).initialize();

  harness.cta.dispatch('click');

  assert.deepEqual(harness.analyticsCalls, [['header-test', '/contato']]);
});
