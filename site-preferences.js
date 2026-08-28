(function attachConsent(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory;
    return;
  }

  const consent = factory(root, {
    document: root.document,
    storage: root.localStorage,
    measurementId: "G-K4TCRD4ND5",
  });

  root.DespachoCertoConsent = consent;
  consent.initialize();
})(typeof window !== "undefined" ? window : globalThis, function createConsent(target, options = {}) {
  const document = options.document;
  const storage = options.storage;
  const measurementId = options.measurementId || "G-K4TCRD4ND5";
  const now = options.now || (() => new Date().toISOString());
  const consentVersion = "2026-08-28";
  const storageKey = "despachocerto_consent_v3";
  const legacyStorageKey = "despachocerto_analytics_preference_v2";
  const validChoices = new Set(["granted", "denied"]);
  let currentChoice = null;
  let analyticsLoaded = false;
  let listenersBound = false;
  let returnFocusTarget = null;

  function getElement(id) {
    return document && typeof document.getElementById === "function"
      ? document.getElementById(id)
      : null;
  }

  function preferenceRecord(choice) {
    return {
      version: consentVersion,
      analytics: choice,
      updatedAt: now(),
    };
  }

  function parsePreference(rawValue) {
    if (!rawValue) return null;

    try {
      const parsed = JSON.parse(rawValue);
      if (
        parsed
        && parsed.version === consentVersion
        && validChoices.has(parsed.analytics)
        && typeof parsed.updatedAt === "string"
      ) {
        return parsed.analytics;
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  function persistChoice(choice) {
    currentChoice = choice;
    try {
      if (storage) {
        storage.setItem(storageKey, JSON.stringify(preferenceRecord(choice)));
        storage.removeItem(legacyStorageKey);
      }
    } catch (error) {
      // The current-page choice still applies when storage is unavailable.
    }
  }

  function readChoice() {
    try {
      if (!storage) return null;

      const savedChoice = parsePreference(storage.getItem(storageKey));
      if (savedChoice) return savedChoice;

      const legacyChoice = storage.getItem(legacyStorageKey);
      if (validChoices.has(legacyChoice)) {
        persistChoice(legacyChoice);
        return legacyChoice;
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  function setBannerVisibility(visible) {
    const banner = getElement("privacyChoicePanel");
    if (banner) banner.hidden = !visible;
  }

  function consentDefaults() {
    return {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    };
  }

  function enableAnalytics() {
    if (analyticsLoaded || !document || !document.head) return;

    target.dataLayer = target.dataLayer || [];
    target.gtag = target.gtag || function gtag() {
      target.dataLayer.push(arguments);
    };

    target.gtag("consent", "default", consentDefaults());
    target.gtag("consent", "update", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "granted",
    });
    target.gtag("js", new Date());
    target.gtag("config", measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });

    const script = document.createElement("script");
    script.async = true;
    script.id = "google-analytics-tag";
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
    analyticsLoaded = true;
  }

  function removeAnalyticsCookies() {
    if (!document || typeof document.cookie !== "string") return;

    const cookieNames = document.cookie
      .split(";")
      .map((cookie) => cookie.trim().split("=")[0])
      .filter((name) => name === "_gid" || name.startsWith("_ga") || name.startsWith("_gat"));

    const hostname = target.location && target.location.hostname;
    const rootDomain = hostname ? hostname.replace(/^www\./, "") : null;

    cookieNames.forEach((name) => {
      const expired = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
      document.cookie = expired;
      if (rootDomain) {
        document.cookie = `${expired}; Domain=${rootDomain}`;
        document.cookie = `${expired}; Domain=.${rootDomain}`;
      }
    });
  }

  function closePreferences() {
    const dialog = getElement("privacyPreferencesDialog");
    if (dialog && dialog.open && typeof dialog.close === "function") dialog.close();

    if (returnFocusTarget && typeof returnFocusTarget.focus === "function") {
      returnFocusTarget.focus();
    }
    returnFocusTarget = null;
  }

  function disableAnalytics(shouldReload) {
    if (typeof target.gtag === "function") {
      target.gtag("consent", "update", consentDefaults());
    }

    removeAnalyticsCookies();

    if (shouldReload && target.location && typeof target.location.reload === "function") {
      target.location.reload();
    }
  }

  function savePreferences({ analytics }) {
    if (!validChoices.has(analytics)) return false;

    const shouldReload = analytics === "denied"
      && (analyticsLoaded || currentChoice === "granted");
    persistChoice(analytics);
    setBannerVisibility(false);
    closePreferences();

    if (analytics === "granted") enableAnalytics();
    else disableAnalytics(shouldReload);

    return true;
  }

  function accept() {
    return savePreferences({ analytics: "granted" });
  }

  function reject() {
    return savePreferences({ analytics: "denied" });
  }

  function openPreferences() {
    const dialog = getElement("privacyPreferencesDialog");
    const analyticsToggle = getElement("privacyAnalyticsToggle");
    if (!dialog) return false;

    returnFocusTarget = document && document.activeElement
      ? document.activeElement
      : getElement("privacySettings");
    if (analyticsToggle) analyticsToggle.checked = currentChoice === "granted";

    if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
    return true;
  }

  function bindListeners() {
    if (listenersBound) return;

    const acceptButton = getElement("privacyAcceptAnalytics");
    const rejectButton = getElement("privacyDeclineAnalytics");
    const preferencesButtons = [
      getElement("privacySettings"),
      getElement("privacyOpenPreferences"),
    ].filter(Boolean);
    const saveButton = getElement("privacySavePreferences");
    const closeButton = getElement("privacyClosePreferences");
    const dialog = getElement("privacyPreferencesDialog");
    const analyticsToggle = getElement("privacyAnalyticsToggle");

    if (acceptButton) acceptButton.addEventListener("click", accept);
    if (rejectButton) rejectButton.addEventListener("click", reject);
    preferencesButtons.forEach((button) => button.addEventListener("click", openPreferences));
    if (saveButton) {
      saveButton.addEventListener("click", (event) => {
        event.preventDefault();
        savePreferences({ analytics: Boolean(analyticsToggle && analyticsToggle.checked) ? "granted" : "denied" });
      });
    }
    if (closeButton) {
      closeButton.addEventListener("click", (event) => {
        event.preventDefault();
        closePreferences();
      });
    }
    if (dialog) {
      dialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        closePreferences();
      });
    }
    listenersBound = true;
  }

  function initialize() {
    bindListeners();
    currentChoice = readChoice();

    if (currentChoice === "granted") {
      setBannerVisibility(false);
      enableAnalytics();
      return;
    }

    setBannerVisibility(currentChoice !== "denied");
  }

  return Object.freeze({
    accept,
    reject,
    initialize,
    openPreferences,
    savePreferences,
    hasAnalyticsConsent() {
      return currentChoice === "granted";
    },
  });
});
