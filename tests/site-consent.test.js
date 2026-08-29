const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const consentPath = path.join(projectRoot, 'site-preferences.js');
const measurementId = 'G-K4TCRD4ND5';
const consentVersion = '2026-08-29';
const storageKey = 'despachocerto_consent_v3';
const legacyStorageKey = 'despachocerto_analytics_preference_v2';
const fixedNow = '2026-08-28T20:00:00.000Z';

function loadConsentFactory() {
  delete require.cache[require.resolve(consentPath)];
  return require(consentPath);
}

function createHarness({ legacyChoice = null, savedPreference = null } = {}) {
  const values = new Map();
  if (legacyChoice !== null) values.set(legacyStorageKey, legacyChoice);
  if (savedPreference !== null) values.set(storageKey, JSON.stringify(savedPreference));

  const listeners = new Map();
  let focusedElement = null;

  function createButton(prefix) {
    return {
      addEventListener(type, listener) { listeners.set(`${prefix}:${type}`, listener); },
      focus() { focusedElement = prefix; },
    };
  }

  function createDialog() {
    return {
      open: false,
      showModal() { this.open = true; },
      close() { this.open = false; },
      addEventListener(type, listener) { listeners.set(`dialog:${type}`, listener); },
    };
  }

  const elements = {
    privacyChoicePanel: { hidden: false },
    privacyAcceptAnalytics: createButton('accept'),
    privacyDeclineAnalytics: createButton('reject'),
    privacySettings: createButton('footer-preferences'),
    privacyOpenPreferences: createButton('open-preferences'),
    privacyPreferencesDialog: createDialog(),
    privacyAnalyticsToggle: { checked: false },
    privacySavePreferences: createButton('save-preferences'),
    privacyClosePreferences: createButton('close-preferences'),
  };
  const scripts = [];
  const removedCookies = [];
  let reloads = 0;

  const document = {
    activeElement: elements.privacySettings,
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
    location: {
      hostname: 'despachocerto.com.br',
      reload() { reloads += 1; },
    },
  };

  const createConsent = loadConsentFactory();
  const consent = createConsent(target, {
    document,
    storage,
    measurementId,
    now: () => fixedNow,
  });

  return {
    consent,
    elements,
    listeners,
    removedCookies,
    scripts,
    target,
    values,
    invoke(key, event = { preventDefault() {} }) {
      const listener = listeners.get(key);
      assert.equal(typeof listener, 'function', `Expected listener ${key}`);
      listener(event);
    },
    get focusedElement() { return focusedElement; },
    get reloads() { return reloads; },
  };
}

function storedPreference(harness) {
  return JSON.parse(harness.values.get(storageKey));
}

test('shows the banner without contacting Google before a choice', () => {
  const harness = createHarness();
  harness.consent.initialize();

  assert.equal(harness.elements.privacyChoicePanel.hidden, false);
  assert.equal(harness.scripts.length, 0);
  assert.equal(harness.target.gtag, undefined);
  assert.equal(harness.consent.hasAnalyticsConsent(), false);
});

test('loads GA4 with Consent Mode v2 only after acceptance', () => {
  const harness = createHarness();
  harness.consent.initialize();
  harness.consent.accept();

  assert.deepEqual(storedPreference(harness), {
    version: consentVersion,
    analytics: 'granted',
    updatedAt: fixedNow,
  });
  assert.equal(harness.values.has(legacyStorageKey), false);
  assert.equal(harness.elements.privacyChoicePanel.hidden, true);
  assert.equal(harness.scripts.length, 3);
  assert.equal(harness.scripts[0].src, `https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
  assert.equal(harness.scripts[1].src, '/_vercel/insights/script.js');
  assert.equal(harness.scripts[2].src, '/_vercel/speed-insights/script.js');
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

  assert.deepEqual(storedPreference(harness), {
    version: consentVersion,
    analytics: 'denied',
    updatedAt: fixedNow,
  });
  assert.equal(harness.elements.privacyChoicePanel.hidden, true);
  assert.equal(harness.scripts.length, 0);
  assert.equal(harness.target.gtag, undefined);
});

test('migrates a saved v2 acceptance and removes the legacy key', () => {
  const harness = createHarness({ legacyChoice: 'granted' });
  harness.consent.initialize();

  assert.deepEqual(storedPreference(harness), {
    version: consentVersion,
    analytics: 'granted',
    updatedAt: fixedNow,
  });
  assert.equal(harness.values.has(legacyStorageKey), false);
  assert.equal(harness.elements.privacyChoicePanel.hidden, true);
  assert.equal(harness.scripts.length, 3);
});

test('asks again when a saved preference belongs to an older policy version', () => {
  const harness = createHarness({
    savedPreference: {
      version: '2026-01-01',
      analytics: 'granted',
      updatedAt: '2026-01-01T12:00:00.000Z',
    },
  });
  harness.consent.initialize();

  assert.equal(harness.elements.privacyChoicePanel.hidden, false);
  assert.equal(harness.scripts.length, 0);
  assert.equal(harness.consent.hasAnalyticsConsent(), false);
});

test('opens and closes preferences without changing the saved choice', () => {
  const harness = createHarness({
    savedPreference: {
      version: consentVersion,
      analytics: 'denied',
      updatedAt: fixedNow,
    },
  });
  harness.consent.initialize();

  harness.consent.openPreferences();
  assert.equal(harness.elements.privacyPreferencesDialog.open, true);
  assert.equal(harness.elements.privacyAnalyticsToggle.checked, false);

  harness.invoke('dialog:cancel');
  assert.equal(harness.elements.privacyPreferencesDialog.open, false);
  assert.equal(storedPreference(harness).analytics, 'denied');
  assert.equal(harness.focusedElement, 'footer-preferences');
});

test('allows analytics consent to be revoked from preferences', () => {
  const harness = createHarness({
    savedPreference: {
      version: consentVersion,
      analytics: 'granted',
      updatedAt: fixedNow,
    },
  });
  harness.consent.initialize();
  harness.consent.openPreferences();
  harness.elements.privacyAnalyticsToggle.checked = false;

  harness.invoke('save-preferences:click');

  assert.equal(storedPreference(harness).analytics, 'denied');
  assert.equal(harness.reloads, 1);
  assert.equal(harness.removedCookies.some((cookie) => cookie.startsWith('_ga=')), true);
  assert.equal(harness.removedCookies.some((cookie) => cookie.startsWith('_ga_TEST=')), true);
  assert.equal(harness.removedCookies.some((cookie) => cookie.startsWith('session=')), false);
});

test('publishes privacy controls and documentation', () => {
  const index = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
  const privacy = fs.readFileSync(path.join(projectRoot, 'privacidade.html'), 'utf8');
  const sitemap = fs.readFileSync(path.join(projectRoot, 'sitemap.xml'), 'utf8');

  for (const html of [index, privacy]) {
    assert.match(html, /id="privacyChoicePanel"/);
    assert.match(html, /id="privacyAcceptAnalytics"/);
    assert.match(html, /id="privacyDeclineAnalytics"/);
    assert.match(html, /id="privacyOpenPreferences"/);
    assert.match(html, /id="privacyPreferencesDialog"/);
    assert.match(html, /id="privacyAnalyticsToggle"/);
    assert.match(html, /id="privacySavePreferences"/);
    assert.match(html, /href="\/privacidade"/);
    assert.match(html, /href="\/cookies"/);
  }
  assert.match(index, /id="privacySettings"/);
  assert.match(privacy, /Google Analytics/);
  assert.match(privacy, /Resend/);
  assert.match(privacy, /Vercel/);
  assert.match(privacy, /Supabase/);
  assert.match(privacy, /Cloudflare Turnstile/);
  assert.match(privacy, /contato@elevstudio\.com\.br/);
  assert.doesNotMatch(privacy, /fonts\.(googleapis|gstatic)\.com/);
  assert.match(sitemap, /https:\/\/despachocerto\.com\.br\/privacidade/);
});
