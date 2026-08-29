const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const htmlPath = path.join(projectRoot, 'index.html');
const analyticsPath = path.join(projectRoot, 'site-analytics.js');
const iconsPath = path.join(projectRoot, 'site-icon-data.js');

function loadAnalyticsFactory() {
  if (!fs.existsSync(analyticsPath)) return () => ({});
  delete require.cache[require.resolve(analyticsPath)];
  return require(analyticsPath);
}

test('delegates GA4 loading to the consent manager', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');

  assert.doesNotMatch(html, /<script[^>]+googletagmanager\.com\/gtag\/js/);
  assert.doesNotMatch(html, /fonts\.(googleapis|gstatic)\.com/);
  assert.doesNotMatch(html, /unpkg\.com/);
  assert.match(html, /<script src="site-preferences\.js" defer><\/script>/);
  assert.doesNotMatch(html, /(?:id|class)="[^"]*cookie-banner/i);
  assert.match(html, /<script src="site-analytics\.js" defer><\/script>/);
});

test('serves the icon bundle without requesting a missing source map', () => {
  const icons = fs.readFileSync(iconsPath, 'utf8');
  assert.doesNotMatch(icons, /sourceMappingURL=/);
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
  const analytics = createAnalytics({
    DespachoCertoConsent: { hasAnalyticsConsent: () => true },
    gtag: (...args) => calls.push(args),
  });

  assert.equal(typeof analytics.trackCta, 'function');
  assert.equal(analytics.trackCta('hero', '#contato'), true);
  assert.deepEqual(calls, [
    ['event', 'cta_click', { cta_id: 'hero', link_url: '#contato' }],
  ]);
});

test('records a successful lead without sending personal information', () => {
  const calls = [];
  const createAnalytics = loadAnalyticsFactory();
  const analytics = createAnalytics({
    DespachoCertoConsent: { hasAnalyticsConsent: () => true },
    gtag: (...args) => calls.push(args),
  });

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

test('does not send events when analytics consent is denied', () => {
  const calls = [];
  const createAnalytics = loadAnalyticsFactory();
  const analytics = createAnalytics({
    DespachoCertoConsent: { hasAnalyticsConsent: () => false },
    gtag: (...args) => calls.push(args),
  });

  assert.equal(analytics.trackCta('hero', '#contato'), false);
  assert.equal(analytics.trackLead(), false);
  assert.deepEqual(calls, []);
});

test('fails closed when the consent manager is unavailable', () => {
  const calls = [];
  const createAnalytics = loadAnalyticsFactory();
  const analytics = createAnalytics({ gtag: (...args) => calls.push(args) });

  assert.equal(analytics.trackLead(), false);
  assert.deepEqual(calls, []);
});
