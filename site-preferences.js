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
  const storageKey = "despachocerto_analytics_preference_v2";
  const validChoices = new Set(["granted", "denied"]);
  let currentChoice = null;
  let analyticsLoaded = false;
  let listenersBound = false;

  function getElement(id) {
    return document && typeof document.getElementById === "function"
      ? document.getElementById(id)
      : null;
  }

  function readChoice() {
    try {
      const savedChoice = storage && storage.getItem(storageKey);
      return validChoices.has(savedChoice) ? savedChoice : null;
    } catch (error) {
      return null;
    }
  }

  function saveChoice(choice) {
    currentChoice = choice;
    try {
      if (storage) storage.setItem(storageKey, choice);
    } catch (error) {
      // The current-page choice still applies when storage is unavailable.
    }
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

  function accept() {
    saveChoice("granted");
    setBannerVisibility(false);
    enableAnalytics();
    return true;
  }

  function reject() {
    const shouldReload = analyticsLoaded || currentChoice === "granted";

    if (typeof target.gtag === "function") {
      target.gtag("consent", "update", consentDefaults());
    }

    saveChoice("denied");
    setBannerVisibility(false);
    removeAnalyticsCookies();

    if (shouldReload && target.location && typeof target.location.reload === "function") {
      target.location.reload();
    }

    return true;
  }

  function openPreferences() {
    setBannerVisibility(true);
    const rejectButton = getElement("privacyDeclineAnalytics");
    if (rejectButton && typeof rejectButton.focus === "function") rejectButton.focus();
  }

  function bindListeners() {
    if (listenersBound) return;

    const acceptButton = getElement("privacyAcceptAnalytics");
    const rejectButton = getElement("privacyDeclineAnalytics");
    const preferencesButton = getElement("privacySettings");

    if (acceptButton) acceptButton.addEventListener("click", accept);
    if (rejectButton) rejectButton.addEventListener("click", reject);
    if (preferencesButton) preferencesButton.addEventListener("click", openPreferences);
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
    hasAnalyticsConsent() {
      return currentChoice === "granted";
    },
  });
});
