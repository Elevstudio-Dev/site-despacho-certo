const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const contentStyles = read('content-page.css');
const systemPage = read('sistema-para-despachante.html');

const productModules = [
  { name: 'clientes', moduleId: 'productModuleClientes', panelId: 'productPanelClientes' },
  { name: 'ordens', moduleId: 'productModuleOrdens', panelId: 'productPanelOrdens' },
  { name: 'documentos', moduleId: 'productModuleDocumentos', panelId: 'productPanelDocumentos' },
  { name: 'equipe', moduleId: 'productModuleEquipe', panelId: 'productPanelEquipe' },
  { name: 'financeiro', moduleId: 'productModuleFinanceiro', panelId: 'productPanelFinanceiro' },
];

function read(file) {
  return fs.readFileSync(path.join(projectRoot, file), 'utf8');
}

function createProductMapHarness({ hash = '', width = 1200 } = {}) {
  let activeElement = null;
  const listeners = new WeakMap();
  const windowListeners = new Map();
  const mediaListeners = [];
  const historyCalls = [];

  function element({ id = '', dataset = {}, attributes = {}, hidden = false } = {}) {
    const attributeMap = new Map(Object.entries(attributes));
    const node = {
      id,
      dataset,
      hidden,
      tabIndex: Number(attributes.tabindex ?? 0),
      addEventListener(type, listener) {
        const handlers = listeners.get(node) || {};
        handlers[type] = listener;
        listeners.set(node, handlers);
      },
      focus() { activeElement = node; },
      getAttribute(name) { return attributeMap.get(name) ?? null; },
      setAttribute(name, value) { attributeMap.set(name, String(value)); },
    };
    return node;
  }

  const modules = productModules.map((contract, index) => element({
    id: contract.moduleId,
    dataset: { productModule: contract.name },
    attributes: {
      'aria-controls': contract.panelId,
      'aria-selected': index === 0 ? 'true' : 'false',
      tabindex: index === 0 ? '0' : '-1',
    },
  }));
  const panels = productModules.map((contract, index) => element({
    id: contract.panelId,
    dataset: { productPanel: contract.name },
    attributes: { 'aria-labelledby': contract.moduleId },
    hidden: index !== 0,
  }));
  const tablist = element({ attributes: { 'aria-orientation': 'vertical' } });
  const map = {
    querySelector(selector) {
      return selector === '[role="tablist"]' ? tablist : null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-product-module]') return modules;
      if (selector === '[data-product-panel]') return panels;
      return [];
    },
  };
  const document = {
    querySelectorAll(selector) { return selector === '.product-map' ? [map] : []; },
  };
  const location = { hash };
  const window = {
    location,
    history: {
      state: null,
      replaceState(_state, _title, url) {
        historyCalls.push(url);
        location.hash = url;
      },
    },
    matchMedia(query) {
      return {
        matches: query === '(min-width: 641px) and (max-width: 960px)'
          && width >= 641
          && width <= 960,
        addEventListener(type, listener) {
          if (type === 'change') mediaListeners.push(listener);
        },
      };
    },
    addEventListener(type, listener) { windowListeners.set(type, listener); },
  };

  vm.runInNewContext(read('content-page.js'), { document, window, Date });

  return {
    get activeElement() { return activeElement; },
    historyCalls,
    mediaListeners,
    modules,
    panels,
    tablist,
    window,
    dispatch(node, type, event = {}) { listeners.get(node)?.[type]?.(event); },
    dispatchWindow(type) { windowListeners.get(type)?.(); },
  };
}

function assertProductModuleState(harness, expectedName) {
  const selectedModules = harness.modules.filter(
    (module) => module.getAttribute('aria-selected') === 'true',
  );
  const tabbableModules = harness.modules.filter((module) => module.tabIndex === 0);
  const visiblePanels = harness.panels.filter((panel) => !panel.hidden);

  assert.equal(selectedModules.length, 1);
  assert.equal(selectedModules[0].dataset.productModule, expectedName);
  assert.equal(tabbableModules.length, 1);
  assert.equal(tabbableModules[0].dataset.productModule, expectedName);
  assert.equal(visiblePanels.length, 1);
  assert.equal(visiblePanels[0].dataset.productPanel, expectedName);
}

test('gives home and platform overview different jobs', () => {
  const home = read('index.html');
  assert.match(home, /class="module-routes"/);
  assert.doesNotMatch(home, /class="product-map"/);
  assert.match(systemPage, /class="product-map"/);
  assert.match(systemPage, /data-product-module="ordens"/);
  assert.match(systemPage, /data-product-panel="financeiro"/);
  assert.doesNotMatch(systemPage, /Continue explorando o DespachoCerto/);
});

test('publishes all five product modules with reciprocal tab and panel relationships', () => {
  const publishedModules = [...systemPage.matchAll(/data-product-module="([^"]+)"/g)]
    .map((match) => match[1]);
  const publishedPanels = [...systemPage.matchAll(/data-product-panel="([^"]+)"/g)]
    .map((match) => match[1]);

  assert.deepEqual(publishedModules, productModules.map(({ name }) => name));
  assert.deepEqual(publishedPanels, productModules.map(({ name }) => name));

  productModules.forEach(({ name, moduleId, panelId }) => {
    const moduleTag = systemPage.match(
      new RegExp(`<button\\b[^>]*data-product-module="${name}"[^>]*>`),
    )?.[0];
    const panelTag = systemPage.match(
      new RegExp(`<article\\b[^>]*data-product-panel="${name}"[^>]*>`),
    )?.[0];

    assert.ok(moduleTag, `Missing module button for ${name}`);
    assert.match(moduleTag, new RegExp(`id="${moduleId}"`));
    assert.match(moduleTag, new RegExp(`aria-controls="${panelId}"`));
    assert.ok(panelTag, `Missing module panel for ${name}`);
    assert.match(panelTag, new RegExp(`id="${panelId}"`));
    assert.match(panelTag, new RegExp(`aria-labelledby="${moduleId}"`));
  });
});

test('switches all product-map panels by click', () => {
  const harness = createProductMapHarness();

  harness.modules.forEach((module) => {
    harness.dispatch(module, 'click');
    assertProductModuleState(harness, module.dataset.productModule);
    assert.equal(harness.window.location.hash, `#${module.id}`);
  });
});

test('supports every product-map navigation key and wraps arrow movement', () => {
  const cases = [
    { start: 'clientes', key: 'ArrowLeft', expected: 'financeiro' },
    { start: 'financeiro', key: 'ArrowRight', expected: 'clientes' },
    { start: 'clientes', key: 'ArrowUp', expected: 'financeiro' },
    { start: 'financeiro', key: 'ArrowDown', expected: 'clientes' },
    { start: 'documentos', key: 'Home', expected: 'clientes' },
    { start: 'documentos', key: 'End', expected: 'financeiro' },
  ];

  cases.forEach(({ start, key, expected }) => {
    const harness = createProductMapHarness();
    const startModule = harness.modules.find((module) => module.dataset.productModule === start);
    const expectedModule = harness.modules.find((module) => module.dataset.productModule === expected);
    let prevented = false;

    harness.dispatch(startModule, 'keydown', {
      key,
      preventDefault() { prevented = true; },
    });

    assert.equal(prevented, true, `${key} must prevent default browser movement`);
    assertProductModuleState(harness, expected);
    assert.equal(harness.activeElement, expectedModule);
    assert.equal(harness.window.location.hash, `#${expectedModule.id}`);
  });
});

test('restores hash selection without adding duplicate module history', () => {
  const harness = createProductMapHarness({ hash: '#productModuleEquipe' });
  assertProductModuleState(harness, 'equipe');
  assert.deepEqual(harness.historyCalls, []);

  const equipe = harness.modules.find((module) => module.dataset.productModule === 'equipe');
  harness.dispatch(equipe, 'click');
  assert.deepEqual(harness.historyCalls, []);

  harness.window.location.hash = '#productModuleDocumentos';
  harness.dispatchWindow('hashchange');
  assertProductModuleState(harness, 'documentos');
  assert.deepEqual(harness.historyCalls, []);

  const financeiro = harness.modules.find((module) => module.dataset.productModule === 'financeiro');
  harness.dispatch(financeiro, 'click');
  harness.dispatch(financeiro, 'click');
  assert.deepEqual(harness.historyCalls, ['#productModuleFinanceiro']);
});

test('synchronizes product-map orientation with its responsive layout', () => {
  assert.match(
    systemPage,
    /role="tablist"[^>]*aria-orientation="vertical"/,
  );

  const desktop = createProductMapHarness();
  assert.equal(desktop.tablist.getAttribute('aria-orientation'), 'vertical');
  desktop.mediaListeners[0]({ matches: true });
  assert.equal(desktop.tablist.getAttribute('aria-orientation'), 'horizontal');
  desktop.mediaListeners[0]({ matches: false });
  assert.equal(desktop.tablist.getAttribute('aria-orientation'), 'vertical');

  const tablet = createProductMapHarness({ width: 800 });
  assert.equal(tablet.tablist.getAttribute('aria-orientation'), 'horizontal');

  const mobile = createProductMapHarness({ width: 390 });
  assert.equal(mobile.tablist.getAttribute('aria-orientation'), 'vertical');
});

test('hides decorative icons introduced by the focused home sections', () => {
  const home = read('index.html');
  const sectionNames = ['problem', 'security-summary', 'final-cta'];

  sectionNames.forEach((sectionName) => {
    const section = home.match(
      new RegExp(`<section class="${sectionName}"[\\s\\S]*?(?=\\n\\s*<section class=|\\n\\s*</main>)`),
    )?.[0];
    assert.ok(section, `Missing ${sectionName} section`);

    const icons = section.match(/<i\b[^>]*data-lucide="[^"]+"[^>]*>/g) || [];
    assert.ok(icons.length > 0, `Expected decorative icons in ${sectionName}`);
    icons.forEach((icon) => {
      assert.match(icon, /aria-hidden="true"/, `${sectionName} icon must be decorative: ${icon}`);
    });
  });
});

test('reserves a stable mobile height for every product-map panel', () => {
  const mobileRules = contentStyles.slice(contentStyles.indexOf('@media (max-width: 640px)'));
  const panelRule = mobileRules.match(
    /\.product-map \[data-product-panel\] \{\s*min-height:\s*(\d+)px;/,
  );

  assert.ok(panelRule, 'Expected a mobile product-map panel height');
  assert.ok(Number(panelRule[1]) >= 800, 'Mobile panels must fit the longest explanation');
});

test('keeps deep-linked product modules below the sticky navigation', () => {
  assert.match(
    contentStyles,
    /\.product-map \[data-product-module\] \{[^}]*scroll-margin-top:\s*calc\(var\(--site-header-height\) \+ 12px\)/s,
  );
});
