const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const consentPath = path.join(projectRoot, 'site-consent.js');
const measurementId = 'G-K4TCRD4ND5';

function loadConsentFactory() {
  if (!fs.existsSync(consentPath)) return () => ({});
  delete require.cache[require.resolve(consentPath)];
  return require(consentPath);
}

function createHarness(savedChoice = null) {
  const values = new Map();
  if (savedChoice !== null) values.set('despachocerto_analytics_consent', savedChoice);

  const listeners = new Map();
  const elements = {
    cookieBanner: { hidden: true },
    cookieAccept: {
      addEventListener(type, listener) { listeners.set(`accept:${type}`, listener); },
    },
    cookieReject: {
      addEventListener(type, listener) { listeners.set(`reject:${type}`, listener); },
    },
    cookiePreferences: {
      addEventListener(type, listener) { listeners.set(`preferences:${type}`, listener); },
    },
  };
  const scripts = [];
  const removedCookies = [];
  let reloads = 0;

  const document = {
    getElementById(id) { return elements[id] || null; },
    createElement(tagName) { return { tagName, async: false, src: '', id: '' }; },
    head: { appendChild(node) { scripts.push(node); } },
    set cookie(value) { removedCookies.push(value); },
    get cookie() { return '_ga=abc; _ga_TEST=def; session=keep'; },
  };
  const storage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
    removeItem(key) { values.delete(key); },
  };
  const target = {
    location: { reload() { reloads += 1; } },
  };

  const createConsent = loadConsentFactory();
  const consent = createConsent(target, { document, storage, measurementId });

  return {
    consent,
    elements,
    listeners,
    removedCookies,
    scripts,
    storage,
    target,
    values,
    get reloads() { return reloads; },
  };
}

test('shows the banner without contacting Google before a choice', () => {
  const harness = createHarness();

  assert.equal(typeof harness.consent.initialize, 'function');
  harness.consent.initialize();

  assert.equal(harness.elements.cookieBanner.hidden, false);
  assert.equal(harness.scripts.length, 0);
  assert.equal(harness.target.gtag, undefined);
  assert.equal(harness.consent.hasAnalyticsConsent(), false);
});

test('loads GA4 with Consent Mode v2 only after acceptance', () => {
  const harness = createHarness();
  harness.consent.initialize();
  harness.consent.accept();

  assert.equal(harness.values.get('despachocerto_analytics_consent'), 'granted');
  assert.equal(harness.elements.cookieBanner.hidden, true);
  assert.equal(harness.scripts.length, 1);
  assert.equal(harness.scripts[0].src, `https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
  assert.equal(harness.consent.hasAnalyticsConsent(), true);

  const commands = harness.target.dataLayer.map((entry) => Array.from(entry));
  assert.deepEqual(commands[0], ['consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  }]);
  assert.deepEqual(commands[1], ['consent', 'update', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted',
  }]);
  assert.equal(commands[2][0], 'js');
  assert.deepEqual(commands[3], ['config', measurementId, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  }]);
});

test('stores a refusal without loading analytics', () => {
  const harness = createHarness();
  harness.consent.initialize();
  harness.consent.reject();

  assert.equal(harness.values.get('despachocerto_analytics_consent'), 'denied');
  assert.equal(harness.elements.cookieBanner.hidden, true);
  assert.equal(harness.scripts.length, 0);
  assert.equal(harness.target.gtag, undefined);
});

test('restores a saved acceptance without showing the banner', () => {
  const harness = createHarness('granted');
  harness.consent.initialize();

  assert.equal(harness.elements.cookieBanner.hidden, true);
  assert.equal(harness.scripts.length, 1);
  assert.equal(harness.consent.hasAnalyticsConsent(), true);
});

test('allows preferences to be reopened and consent to be revoked', () => {
  const harness = createHarness('granted');
  harness.consent.initialize();
  harness.consent.openPreferences();

  assert.equal(harness.elements.cookieBanner.hidden, false);
  harness.consent.reject();

  assert.equal(harness.values.get('despachocerto_analytics_consent'), 'denied');
  assert.equal(harness.reloads, 1);
  assert.equal(harness.removedCookies.some((cookie) => cookie.startsWith('_ga=')), true);
  assert.equal(harness.removedCookies.some((cookie) => cookie.startsWith('_ga_TEST=')), true);
  assert.equal(harness.removedCookies.some((cookie) => cookie.startsWith('session=')), false);
});

test('publishes privacy controls and documentation', () => {
  const index = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
  const privacyPath = path.join(projectRoot, 'privacidade.html');
  const privacy = fs.existsSync(privacyPath) ? fs.readFileSync(privacyPath, 'utf8') : '';
  const sitemap = fs.readFileSync(path.join(projectRoot, 'sitemap.xml'), 'utf8');

  assert.match(index, /id="cookieBanner"/);
  assert.match(index, /id="cookieAccept"/);
  assert.match(index, /id="cookieReject"/);
  assert.match(index, /id="cookiePreferences"/);
  assert.match(index, /href="\/privacidade"/);
  assert.match(privacy, /Política de Privacidade e Cookies/);
  assert.match(privacy, /Google Analytics/);
  assert.match(privacy, /Resend/);
  assert.match(privacy, /Vercel/);
  assert.match(privacy, /contato@elevstudio\.com\.br/);
  assert.doesNotMatch(privacy, /fonts\.(googleapis|gstatic)\.com/);
  assert.match(sitemap, /https:\/\/despachocerto\.com\.br\/privacidade/);
});
