const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const siteScript = fs.readFileSync(path.join(projectRoot, 'site.js'), 'utf8');

test('collects an email address with clear privacy context', () => {
  assert.match(index, /<input name="email" type="email" autocomplete="email"[^>]+required/);
  assert.match(index, /Política de Privacidade/);
  assert.match(siteScript, /formData\.get\("email"\)/);
  assert.match(siteScript, /JSON\.stringify\(\{[^}]*email/s);
});

test('redirects a successful lead to a dedicated thank-you page', () => {
  const thankYouPath = path.join(projectRoot, 'obrigado.html');
  assert.ok(fs.existsSync(thankYouPath));
  const thankYou = fs.readFileSync(thankYouPath, 'utf8');

  assert.match(siteScript, /location\.assign\("\/obrigado"\)/);
  assert.match(thankYou, /<meta name="robots" content="noindex, nofollow"/);
  assert.match(thankYou, /Recebemos seu pedido de demonstração/);
  assert.match(thankYou, /href="\/sistema-para-despachante"/);
});

test('protects the lead form without falling back to an email application', () => {
  assert.match(index, /id="turnstileWidget"/);
  assert.match(siteScript, /\/api\/public-config/);
  assert.match(siteScript, /cf-turnstile-response/);
  assert.doesNotMatch(index, /id="formFallback"/);
  assert.doesNotMatch(siteScript, /formFallback|mailto:/);
});
