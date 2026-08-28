const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const indexPath = path.join(projectRoot, 'index.html');
const cssPath = path.join(projectRoot, 'site.css');
const scriptPath = path.join(projectRoot, 'site.js');

test('serves home styles from a same-origin stylesheet', () => {
  const index = fs.readFileSync(indexPath, 'utf8');

  assert.equal(fs.existsSync(cssPath), true);
  assert.match(index, /<link rel="stylesheet" href="site\.css" \/>/);
  assert.doesNotMatch(index, /<style\b/i);
  assert.doesNotMatch(index, /\sstyle=/i);
});

test('serves home behavior from a same-origin script', () => {
  const index = fs.readFileSync(indexPath, 'utf8');

  assert.equal(fs.existsSync(scriptPath), true);
  assert.match(index, /<script src="site\.js"><\/script>/);

  const scripts = [...index.matchAll(
    /<script(?:\s+type="([^"]+)")?[^>]*>([\s\S]*?)<\/script>/gi,
  )];
  const executableInline = scripts.filter(
    ([, type, body]) => type !== 'application/ld+json' && body.trim(),
  );

  assert.equal(executableInline.length, 0);
});

test('preserves the lead and analytics behavior in the external script', () => {
  assert.equal(fs.existsSync(scriptPath), true);
  const script = fs.readFileSync(scriptPath, 'utf8');

  assert.match(script, /DespachoCertoAnalytics/);
  assert.match(script, /leadForm\.addEventListener\("submit"/);
  assert.match(script, /trackLead\(\)/);
});
