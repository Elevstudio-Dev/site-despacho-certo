(function attachAnalytics(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory;
    return;
  }

  root.DespachoCertoAnalytics = factory(root);
})(typeof window !== "undefined" ? window : globalThis, function createAnalytics(target) {
  function hasAnalyticsConsent() {
    const consent = target.DespachoCertoConsent;
    return Boolean(
      consent
      && typeof consent.hasAnalyticsConsent === "function"
      && consent.hasAnalyticsConsent()
    );
  }

  function sendEvent(name, parameters) {
    if (!hasAnalyticsConsent() || typeof target.gtag !== "function") return false;
    target.gtag("event", name, parameters);
    return true;
  }

  return Object.freeze({
    trackCta(ctaId, destination) {
      return sendEvent("cta_click", {
        cta_id: String(ctaId || "unknown"),
        link_url: String(destination || "unknown"),
      });
    },

    trackLeadSuccess() {
      return sendEvent("generate_lead", {
        form_id: "leadForm",
        method: "website",
      });
    },
  });
});
