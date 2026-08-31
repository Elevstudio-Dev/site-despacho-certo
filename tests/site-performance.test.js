const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');

test('defers layout work for below-the-fold home sections', () => {
  const css = fs.readFileSync(path.join(projectRoot, 'site.css'), 'utf8');

  assert.match(css, /\.section,\s*\.final-section\s*\{[^}]*content-visibility:\s*auto;/s);
  assert.match(css, /\.section,\s*\.final-section\s*\{[^}]*contain-intrinsic-size:\s*auto\s+900px;/s);
  assert.match(css, /body:has\(:target\)\s+\.section,\s*body:has\(:target\)\s+\.final-section\s*\{[^}]*content-visibility:\s*visible;/s);
});
