const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const primitives = [
  'product-map',
  'os-timeline',
  'finance-ledger',
  'document-desk',
  'integration-matrix',
  'trust-layers',
  'proposal-builder',
  'story-rail',
];
const contentPages = [
  'contato.html',
  'sistema-para-despachante.html',
  'ordem-de-servico-para-despachante.html',
  'controle-financeiro-para-despachante.html',
  'gestao-de-documentos.html',
  'integracoes.html',
  'seguranca.html',
  'precos.html',
  'sobre.html',
];

function loadPlaywright() {
  const candidates = [
    process.env.CODEX_WORKSPACE_NODE_MODULES,
    process.env.NODE_PATH,
    path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules'),
  ].filter(Boolean);

  try {
    return require('playwright');
  } catch {}

  for (const modulesPath of candidates) {
    try {
      return require(path.join(modulesPath, 'playwright'));
    } catch {}
  }

  throw new Error('Playwright is required. Set CODEX_WORKSPACE_NODE_MODULES to a node_modules directory containing playwright.');
}

function mimeType(filePath) {
  const extension = path.extname(filePath);
  if (extension === '.html') return 'text/html; charset=utf-8';
  if (extension === '.css') return 'text/css; charset=utf-8';
  if (extension === '.woff2') return 'font/woff2';
  return 'application/octet-stream';
}

function createServer() {
  return http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const requested = pathname === '/' ? '/tests/fixtures/site-visual-system.html' : pathname;
    const filePath = path.resolve(root, `.${requested}`);

    if (!filePath.startsWith(`${root}${path.sep}`) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }

    response.writeHead(200, { 'Content-Type': mimeType(filePath) });
    fs.createReadStream(filePath).pipe(response);
  });
}

function luminance([red, green, blue]) {
  const linear = [red, green, blue].map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * linear[0]) + (0.7152 * linear[1]) + (0.0722 * linear[2]);
}

function contrast(first, second) {
  const brighter = Math.max(luminance(first), luminance(second));
  const darker = Math.min(luminance(first), luminance(second));
  return (brighter + 0.05) / (darker + 0.05);
}

function rgb(value) {
  const channels = value.match(/[\d.]+/g).map(Number);
  assert.equal(channels[3] ?? 1, 1, `Expected an opaque color, received ${value}`);
  return channels.slice(0, 3);
}

async function inspectLayout(page, width) {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(page.url(), { waitUntil: 'networkidle' });

  return page.evaluate((names) => {
    const hero = document.querySelector('.hero-layout');
    const heading = document.querySelector('.content-hero h1');
    const headingStyle = getComputedStyle(heading);
    const viewportWidth = document.documentElement.clientWidth;
    const boxes = Object.fromEntries(names.map((name) => {
      const element = document.querySelector(`.${name}`);
      const rect = element.getBoundingClientRect();
      return [name, { left: rect.left, right: rect.right, width: rect.width }];
    }));

    return {
      boxes,
      fontSize: headingStyle.fontSize,
      headingLines: Math.round(heading.getBoundingClientRect().height / parseFloat(headingStyle.lineHeight)),
      heroColumns: getComputedStyle(hero).gridTemplateColumns.trim().split(/\s+/).length,
      pageClientWidth: viewportWidth,
      pageScrollWidth: document.documentElement.scrollWidth,
      ledger: {
        clientWidth: document.querySelector('.finance-ledger').clientWidth,
        scrollWidth: document.querySelector('.finance-ledger').scrollWidth,
      },
      matrix: {
        clientWidth: document.querySelector('.integration-matrix').clientWidth,
        scrollWidth: document.querySelector('.integration-matrix').scrollWidth,
      },
      escapedElements: [...document.querySelectorAll('body *')]
        .map((element) => ({ element, rect: element.getBoundingClientRect() }))
        .filter(({ rect }) => rect.left < -1 || rect.right > viewportWidth + 1)
        .slice(0, 8)
        .map(({ element, rect }) => ({
          className: element.className || element.tagName,
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        })),
    };
  }, primitives);
}

async function tabTo(page, selector) {
  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press('Tab');
    if (await page.evaluate((target) => document.activeElement.matches(target), selector)) return;
  }
  assert.fail(`Keyboard focus did not reach ${selector}`);
}

async function assertFocus(page, selector) {
  await tabTo(page, selector);
  const focus = await page.evaluate(() => {
    const element = document.activeElement;
    const style = getComputedStyle(element);
    return {
      color: style.outlineColor,
      offset: parseFloat(style.outlineOffset),
      style: style.outlineStyle,
      width: parseFloat(style.outlineWidth),
    };
  });

  assert.equal(focus.style, 'solid');
  assert.ok(focus.width >= 3, `Expected a 3px focus ring on ${selector}`);
  assert.ok(focus.offset >= 2, `Expected focus separation on ${selector}`);

  const ring = rgb(focus.color);
  const surfaces = ['#ffffff', '#f5f8fa', '#e7f2f7', '#dff3fa', '#e1f2f8', '#0b3454'].map((hex) => (
    [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((channel) => parseInt(channel, 16))
  ));
  for (const surface of surfaces) {
    assert.ok(contrast(ring, surface) >= 3, `${focus.color} must reach 3:1 against rgb(${surface.join(', ')})`);
  }
}

async function main() {
  const { chromium } = loadPlaywright();
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  try {
    await page.goto(`http://127.0.0.1:${port}/tests/fixtures/site-visual-system.html`, { waitUntil: 'networkidle' });
    const fontLoaded = await page.evaluate(async () => {
      await document.fonts.load('400 16px Archivo');
      await document.fonts.load('900 64px Archivo');
      return document.fonts.check('400 16px Archivo') && document.fonts.check('900 64px Archivo');
    });
    assert.equal(fontLoaded, true, 'Expected Archivo 400 and 900 to decode and load');
    assert.match(await page.locator('.content-hero h1').evaluate((element) => getComputedStyle(element).fontFamily), /Archivo/);

    await assertFocus(page, '.product-map [data-product-module]');
    await assertFocus(page, '.os-timeline [data-os-event]');

    const layouts = {};
    for (const width of [1440, 1181, 961, 960, 640, 390]) layouts[width] = await inspectLayout(page, width);

    assert.equal(layouts[1440].heroColumns, 2);
    assert.equal(layouts[1440].fontSize, '64px');
    assert.equal(layouts[1181].heroColumns, 2);
    assert.equal(layouts[1181].fontSize, '64px');
    assert.ok(layouts[1181].headingLines <= 5, 'Expected a viable heading measure when two columns resume');
    for (const width of [961, 960]) {
      assert.equal(layouts[width].heroColumns, 1, `Expected a single-column hero at ${width}px`);
      assert.equal(layouts[width].fontSize, '52px', `Expected stable intermediate type at ${width}px`);
      assert.ok(layouts[width].headingLines <= 4, `Expected a viable heading measure at ${width}px`);
    }
    assert.equal(layouts[390].heroColumns, 1);
    assert.equal(layouts[390].fontSize, '38px');

    for (const [width, layout] of Object.entries(layouts)) {
      assert.ok(
        layout.pageScrollWidth <= layout.pageClientWidth,
        `Page overflow at ${width}px (${layout.pageScrollWidth}/${layout.pageClientWidth}): ${JSON.stringify(layout.escapedElements)}`
      );
      for (const [name, box] of Object.entries(layout.boxes)) {
        assert.ok(box.left >= -1 && box.right <= layout.pageClientWidth + 1, `${name} escapes the viewport at ${width}px`);
      }
    }

    for (const name of ['ledger', 'matrix']) {
      assert.ok(layouts[390][name].scrollWidth > layouts[390][name].clientWidth, `${name} must contain its mobile overflow`);
      assert.ok(layouts[1440][name].scrollWidth <= layouts[1440][name].clientWidth + 1, `${name} should fit at desktop width`);
    }

    for (const width of [961, 960]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const file of contentPages) {
        await page.goto(`http://127.0.0.1:${port}/${file}`, { waitUntil: 'networkidle' });
        const metrics = await page.evaluate(async () => {
          await document.fonts.load('900 52px Archivo');
          const hero = document.querySelector('.hero-layout');
          const heading = document.querySelector('.content-hero h1');
          const style = getComputedStyle(heading);
          return {
            columns: getComputedStyle(hero).gridTemplateColumns.trim().split(/\s+/).length,
            fontSize: style.fontSize,
            lines: Math.round(heading.getBoundingClientRect().height / parseFloat(style.lineHeight)),
            overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          };
        });
        assert.equal(metrics.columns, 1, `${file} must use one hero column at ${width}px`);
        assert.equal(metrics.fontSize, '52px', `${file} must use intermediate hero type at ${width}px`);
        assert.ok(metrics.lines <= 4, `${file} heading is too tall at ${width}px (${metrics.lines} lines)`);
        assert.equal(metrics.overflow, false, `${file} overflows at ${width}px`);
      }
    }

    console.log('Browser visual-system regression passed at 1440, 1181, 961, 960, 640 and 390 px.');
  } finally {
    await browser.close();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
