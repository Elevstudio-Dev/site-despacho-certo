const assert = require('node:assert/strict');
const fs = require('node:fs');
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
  const cta = new FakeElement('headerCta', { href: '/contato' });
  cta.dataset.siteHeaderCta = 'header-test';

  const elements = new Map([
    [productButton.id, productButton],
    [contentButton.id, contentButton],
    [mobileButton.id, mobileButton],
    [productMenu.id, productMenu],
    [contentMenu.id, contentMenu],
    [mobileMenu.id, mobileMenu],
  ]);
  const documentListeners = new Map();
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
      ? [productButton, contentButton]
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
    innerWidth: 800,
    DespachoCertoAnalytics: {
      trackCta: (...args) => analyticsCalls.push(args),
    },
    addEventListener() {},
  };

  return {
    analyticsCalls,
    contentButton,
    contentMenu,
    cta,
    document,
    mobileButton,
    mobileMenu,
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

test('tracks the header CTA through the shared analytics interface', () => {
  const harness = createHarness();
  createSiteNavigation(harness.target, harness.document).initialize();

  harness.cta.dispatch('click');

  assert.deepEqual(harness.analyticsCalls, [['header-test', '/contato']]);
});
