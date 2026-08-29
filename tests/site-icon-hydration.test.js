const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const siteScript = fs.readFileSync(path.join(projectRoot, 'site.js'), 'utf8');
const iconDataPath = path.join(projectRoot, 'site-icon-data.js');

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

test('ships only the icon definitions used by the site', () => {
  assert.doesNotMatch(index, /src="lucide\.min\.js"/);
  assert.match(index, /src="site-icon-data\.js" defer/);
  assert.ok(fs.existsSync(iconDataPath));

  const iconData = fs.readFileSync(iconDataPath, 'utf8');
  const usedIcons = new Set(
    [...`${index}\n${siteScript}`.matchAll(/data-lucide=["']([^"']+)/g)].map((match) => match[1]),
  );
  usedIcons.forEach((name) => {
    const componentName = name.replace(/(^|[-_\s])(\w)/g, (_match, _separator, letter) => letter.toUpperCase());
    assert.match(iconData, new RegExp(`"${componentName}":`), `Missing icon definition for ${name}`);
  });
});
