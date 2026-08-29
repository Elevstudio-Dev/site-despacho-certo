const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const siteScript = fs.readFileSync(path.join(projectRoot, 'site.js'), 'utf8');

test('hydrates critical icons without scanning the entire page', () => {
  assert.doesNotMatch(siteScript, /lucide\.createIcons/);
  assert.match(siteScript, /function hydrateIcons\(root\)/);
  assert.match(siteScript, /document\.querySelector\("\.site-header"\)/);
  assert.match(siteScript, /document\.querySelector\("\.hero"\)/);
  assert.match(siteScript, /document\.getElementById\("privacyChoicePanel"\)/);
  assert.match(siteScript, /document\.getElementById\("privacyPreferencesDialog"\)/);
});

test('defers offscreen icons and scopes dynamic updates', () => {
  assert.match(siteScript, /new IntersectionObserver/);
  assert.match(siteScript, /observeDeferredIcons\(document\)/);
  assert.match(siteScript, /hydrateIcons\(menuButton\)/);
  assert.match(siteScript, /hydrateIcons\(benefitPanel\)/);
});
