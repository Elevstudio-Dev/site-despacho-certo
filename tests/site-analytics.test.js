const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const htmlPath = path.join(projectRoot, 'index.html');
const analyticsPath = path.join(projectRoot, 'site-analytics.js');
const measurementId = 'G-K4TCRD4ND5';

function loadAnalyticsFactory() {
  if (!fs.existsSync(analyticsPath)) return () => ({});
  delete require.cache[require.resolve(analyticsPath)];
  return require(analyticsPath);
}

test('installs the configured GA4 tag on the institutional site', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');

  assert.match(html, new RegExp(`googletagmanager\\.com/gtag/js\\?id=${measurementId}`));
  assert.match(html, new RegExp(`gtag\\(["']config["'],\\s*["']${measurementId}["']`));
  assert.match(html, /<script src="site-analytics\.js"><\/script>/);
});

test('labels every demonstration link for CTA measurement', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const demonstrationLinks = html.match(/<a\b[^>]*href="#contato"[^>]*>/g) || [];

  assert.ok(demonstrationLinks.length >= 9);
  demonstrationLinks.forEach((link) => assert.match(link, /\bdata-cta="[^"]+"/));
});

test('sends a CTA event with its identifier and destination', () => {
  const calls = [];
  const createAnalytics = loadAnalyticsFactory();
  const analytics = createAnalytics({ gtag: (...args) => calls.push(args) });

  assert.equal(typeof analytics.trackCta, 'function');
  assert.equal(analytics.trackCta('hero', '#contato'), true);
  assert.deepEqual(calls, [
    ['event', 'cta_click', { cta_id: 'hero', link_url: '#contato' }],
  ]);
});

test('records a successful lead without sending personal information', () => {
  const calls = [];
  const createAnalytics = loadAnalyticsFactory();
  const analytics = createAnalytics({ gtag: (...args) => calls.push(args) });

  assert.equal(typeof analytics.trackLead, 'function');
  assert.equal(analytics.trackLead(), true);
  assert.deepEqual(calls, [
    ['event', 'generate_lead', { form_id: 'leadForm', method: 'website' }],
  ]);
  assert.doesNotMatch(JSON.stringify(calls), /name|email|phone|company|challenge/i);
});

test('fails quietly when the Google tag is unavailable', () => {
  const createAnalytics = loadAnalyticsFactory();
  const analytics = createAnalytics({});

  assert.equal(typeof analytics.trackLead, 'function');
  assert.equal(analytics.trackLead(), false);
});
