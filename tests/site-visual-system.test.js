const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const contentStyles = fs.readFileSync(path.join(root, 'content-page.css'), 'utf8');
const homeStyles = fs.readFileSync(path.join(root, 'site.css'), 'utf8');

test('defines a multi-color operational visual system', () => {
  assert.match(contentStyles, /--blue-register:\s*#0b3454/i);
  assert.match(contentStyles, /--cyan-signal:\s*#38bfe8/i);
  assert.match(contentStyles, /--green-checked:\s*#17745b/i);
  assert.match(contentStyles, /--coral-pending:\s*#c94f3d/i);
  assert.match(contentStyles, /font-family:\s*"Archivo"/);

  for (const name of [
    'product-map',
    'os-timeline',
    'finance-ledger',
    'document-desk',
    'integration-matrix',
    'trust-layers',
    'proposal-builder',
    'story-rail',
    'record-id',
    'record-status',
    'record-value',
    'page-next-step',
  ]) {
    assert.match(contentStyles, new RegExp(`\\.${name}\\b`));
  }

  assert.doesNotMatch(contentStyles, /font-size:\s*clamp\([^)]*vw/);
  assert.doesNotMatch(contentStyles, /transition:\s*all/);
});

test('shares Archivo and operational color tokens with the home page', () => {
  assert.match(homeStyles, /font-family:\s*"Archivo"/);
  assert.match(homeStyles, /--blue-register:\s*#0b3454/i);
  assert.match(homeStyles, /--blue-action:\s*#155a9c/i);
  assert.match(homeStyles, /--cyan-signal:\s*#38bfe8/i);
  assert.match(homeStyles, /--green-checked:\s*#17745b/i);
  assert.match(homeStyles, /--coral-pending:\s*#c94f3d/i);
  assert.match(homeStyles, /--paper-cool:\s*#f5f8fa/i);
  assert.doesNotMatch(homeStyles, /font-size:\s*clamp\([^)]*vw/);
  assert.doesNotMatch(homeStyles, /transition:\s*all/);
});

test('marks selection and status with more than color', () => {
  assert.match(contentStyles, /\.product-map\s+\[data-product-module\]\[aria-selected="true"\]/);
  assert.match(contentStyles, /\.os-timeline\s+\[data-os-event\]\[aria-current="step"\]/);
  assert.match(contentStyles, /\.record-status\[data-status="checked"\]::before[\s\S]*?content:\s*"\\2713"/);
  assert.match(contentStyles, /\.record-status\[data-status="pending"\]::before[\s\S]*?content:\s*"!"/);
});

test('ships the local Archivo variable font', () => {
  const fontPath = path.join(root, 'archivo-latin.woff2');

  assert.ok(fs.existsSync(fontPath), 'Expected archivo-latin.woff2 to exist');
  assert.ok(fs.statSync(fontPath).size > 10000, 'Expected a non-empty Archivo WOFF2 asset');
});
