const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const sitemap = fs.readFileSync(path.join(projectRoot, 'sitemap.xml'), 'utf8');
const contentPageStyles = fs.readFileSync(path.join(projectRoot, 'content-page.css'), 'utf8');
const pages = [
  'sistema-para-despachante',
  'ordem-de-servico-para-despachante',
  'controle-financeiro-para-despachante',
  'gestao-de-documentos',
  'integracoes',
  'seguranca',
  'precos',
  'sobre',
  'contato',
];

function readPage(slug) {
  return fs.readFileSync(path.join(projectRoot, `${slug}.html`), 'utf8');
}

test('publishes every high-intent SEO page with unique metadata', () => {
  const titles = new Set();
  const descriptions = new Set();

  pages.forEach((slug) => {
    const html = readPage(slug);
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]+)"/i)?.[1];

    assert.ok(title, `Missing title for ${slug}`);
    assert.ok(description && description.length >= 90, `Weak description for ${slug}`);
    assert.equal(titles.has(title), false, `Duplicate title: ${title}`);
    assert.equal(descriptions.has(description), false, `Duplicate description: ${description}`);
    titles.add(title);
    descriptions.add(description);

    assert.match(html, new RegExp(`<link rel="canonical" href="https://despachocerto\\.com\\.br/${slug}"`));
    assert.equal((html.match(/<h1\b/g) || []).length, 1, `Expected one H1 for ${slug}`);
  });
});

test('connects pages through breadcrumbs, navigation and legal links', () => {
  pages.forEach((slug) => {
    const html = readPage(slug);
    assert.match(html, /itemtype="https:\/\/schema\.org\/BreadcrumbList"/);
    assert.match(html, /href="\/sistema-para-despachante"/);
    assert.match(html, /href="\/contato"/);
    assert.match(html, /href="\/privacidade"/);
    assert.match(html, /href="\/cookies"/);
    assert.match(html, /href="\/termos"/);
  });
});

test('adds every SEO page to the sitemap', () => {
  pages.forEach((slug) => {
    assert.match(sitemap, new RegExp(`<loc>https://despachocerto\\.com\\.br/${slug}</loc>`));
  });
});

test('links the product hub from the home page', () => {
  const index = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
  assert.match(index, /href="\/sistema-para-despachante"/);
  assert.match(index, /href="\/precos"/);
  assert.match(index, /href="\/sobre"/);
  assert.match(index, /href="\/contato"/);
});

test('keeps the Inter typeface on content pages', () => {
  assert.match(contentPageStyles, /body\s*\{[^}]*font-family:\s*"Inter"/s);
  assert.doesNotMatch(contentPageStyles, /body\s*,[^{}]*\{[^}]*font:\s*inherit/s);
});

test('uses the official brand in the light header and a readable mark in the dark footer', () => {
  pages.forEach((slug) => {
    const html = readPage(slug);
    assert.match(html, /class="site-navigation__brand"[^>]*>[\s\S]*?despachocerto-logo-horizontal\.png/);
    assert.equal((html.match(/content-brand-mark/g) || []).length, 1, `Expected a readable footer lockup for ${slug}`);
  });
});

test('keeps related destinations distinct on the about page', () => {
  const about = readPage('sobre');
  const relatedNavigation = about.match(/<nav class="journey-links"[\s\S]*?<\/nav>/)?.[0];
  assert.ok(relatedNavigation, 'Expected the contextual navigation on sobre');

  const destinations = [...relatedNavigation.matchAll(/href="([^"]+)"/g)]
    .map((match) => match[1]);
  assert.ok(destinations.length >= 2);
  assert.equal(destinations.length, new Set(destinations).size);
});
