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
