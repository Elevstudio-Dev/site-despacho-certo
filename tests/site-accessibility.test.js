const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
const homeStyles = fs.readFileSync(path.join(projectRoot, 'site.css'), 'utf8');
const legalStyles = fs.readFileSync(path.join(projectRoot, 'legal.css'), 'utf8');

function luminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi).map((value) => parseInt(value, 16) / 255);
  const linear = channels.map((value) => (
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  ));
  return (0.2126 * linear[0]) + (0.7152 * linear[1]) + (0.0722 * linear[2]);
}

function contrast(first, second) {
  const brightest = Math.max(luminance(first), luminance(second));
  const darkest = Math.min(luminance(first), luminance(second));
  return (brightest + 0.05) / (darkest + 0.05);
}

function cssVariable(source, name) {
  const match = source.match(new RegExp(`--${name}:\\s*(#[a-f\\d]{6})`, 'i'));
  assert.ok(match, `Expected --${name} to be defined`);
  return match[1];
}

test('gives the dashboard preview a valid semantic role', () => {
  assert.match(
    index,
    /<div class="hero-product" role="img" aria-label="Demonstração visual do dashboard DespachoCerto">/
  );
});

test('keeps secondary text above WCAG AA contrast on light surfaces', () => {
  for (const styles of [homeStyles, legalStyles]) {
    const muted = cssVariable(styles, 'muted');
    assert.ok(contrast(muted, '#f4f6f8') >= 4.5);
    assert.ok(contrast(muted, '#eaf4ff') >= 4.5);
  }
});

test('keeps red status text above WCAG AA contrast', () => {
  const red = cssVariable(homeStyles, 'red');
  assert.ok(contrast(red, '#fcecec') >= 4.5);
});
