const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const contentStyles = read('content-page.css');

function read(file) {
  return fs.readFileSync(path.join(projectRoot, file), 'utf8');
}

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

test('switches product-map panels by click and arrow key', () => {
  let activeElement = null;
  const listeners = new WeakMap();

  function element(dataset = {}) {
    const attributes = new Map();
    const node = {
      dataset,
      hidden: false,
      tabIndex: 0,
      addEventListener(type, listener) {
        const handlers = listeners.get(node) || {};
        handlers[type] = listener;
        listeners.set(node, handlers);
      },
      focus() { activeElement = node; },
      getAttribute(name) { return attributes.get(name) ?? null; },
      setAttribute(name, value) { attributes.set(name, String(value)); },
    };
    return node;
  }

  const modules = [element({ productModule: 'clientes' }), element({ productModule: 'ordens' })];
  const panels = [element({ productPanel: 'clientes' }), element({ productPanel: 'ordens' })];
  const map = {
    querySelectorAll(selector) {
      if (selector === '[data-product-module]') return modules;
      if (selector === '[data-product-panel]') return panels;
      return [];
    },
  };
  const document = {
    querySelectorAll(selector) { return selector === '.product-map' ? [map] : []; },
  };

  vm.runInNewContext(read('content-page.js'), {
    document,
    window: { location: { hash: '' } },
    Date,
  });

  listeners.get(modules[1]).click();
  assert.equal(modules[0].getAttribute('aria-selected'), 'false');
  assert.equal(modules[0].tabIndex, -1);
  assert.equal(modules[1].getAttribute('aria-selected'), 'true');
  assert.equal(panels[0].hidden, true);
  assert.equal(panels[1].hidden, false);

  let prevented = false;
  listeners.get(modules[0]).keydown({ key: 'ArrowRight', preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(activeElement, modules[1]);
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
