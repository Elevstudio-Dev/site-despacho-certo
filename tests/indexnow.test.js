const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const key = 'ac1067625d0c36a8e032ea6b43826db1';

test('publishes the IndexNow ownership key at the site root', () => {
  const keyFile = fs.readFileSync(path.join(root, `${key}.txt`), 'utf8').trim();

  assert.equal(keyFile, key);
});

test('submits sitemap URLs to IndexNow after production pushes', () => {
  const workflow = fs.readFileSync(
    path.join(root, '.github', 'workflows', 'indexnow.yml'),
    'utf8'
  );

  assert.match(workflow, /branches:\s*\n\s*- main/);
  assert.match(workflow, /api\.indexnow\.org\/indexnow/);
  assert.match(workflow, /ET\.parse\("sitemap\.xml"\)/);
  assert.match(workflow, new RegExp(`INDEXNOW_KEY: ${key}`));
  assert.match(workflow, /\$\{INDEXNOW_KEY\}\.txt/);
});
