(function attachLeadForm(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory;
    return;
  }

  factory(root, root.document, root.fetch.bind(root)).initialize();
})(typeof window !== "undefined" ? window : globalThis, function createLeadForm(target, document, fetchImpl) {
  const leadForm = document.getElementById("leadForm");
  const leadSubmit = document.getElementById("leadSubmit");
  const leadSubmitLabel = document.getElementById("leadSubmitLabel");
  const formFeedback = document.getElementById("formFeedback");
  const turnstileStatus = document.getElementById("turnstileStatus");
  let turnstileToken = "";
  let turnstileWidgetId = null;
  let turnstileLoadPromise = null;

  function setTurnstileStatus(message) {
    if (turnstileStatus) turnstileStatus.textContent = message;
  }

  function loadTurnstile() {
    if (!leadForm || turnstileLoadPromise) return turnstileLoadPromise;

    turnstileLoadPromise = fetchImpl("/api/public-config", {
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        const config = await response.json().catch(() => null);
        if (!response.ok || !config?.turnstileSiteKey) throw new Error("Turnstile indisponível");
        return config.turnstileSiteKey;
      })
      .then((sitekey) => new Promise((resolve, reject) => {
        if (target.turnstile) {
          resolve(sitekey);
          return;
        }

        const script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.addEventListener("load", () => resolve(sitekey), { once: true });
        script.addEventListener("error", () => reject(new Error("Falha ao carregar Turnstile")), { once: true });
        document.head.appendChild(script);
      }))
      .then((sitekey) => {
        turnstileWidgetId = target.turnstile.render("#turnstileWidget", {
          sitekey,
          language: "pt-BR",
          theme: "light",
          appearance: "interaction-only",
          callback(token) {
            turnstileToken = token;
            setTurnstileStatus("Verificação de segurança concluída.");
          },
          "expired-callback"() {
            turnstileToken = "";
            setTurnstileStatus("A verificação expirou e será renovada.");
          },
          "error-callback"() {
            turnstileToken = "";
            setTurnstileStatus("Não foi possível concluir a verificação. Tente novamente.");
          },
        });
        setTurnstileStatus("Verificação de segurança em andamento…");
      })
      .catch(() => {
        turnstileLoadPromise = null;
        setTurnstileStatus("A verificação de segurança está indisponível. Recarregue a página.");
      });

    return turnstileLoadPromise;
  }

  function initialize() {
    if (!leadForm) return;

    const turnstileObserver = "IntersectionObserver" in target
      ? new target.IntersectionObserver((entries, observer) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        loadTurnstile();
      }, { rootMargin: "500px 0px" })
      : null;

    if (turnstileObserver) turnstileObserver.observe(leadForm);
    else loadTurnstile();

    leadForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(leadForm);
      const name = String(formData.get("name") || "");
      const email = String(formData.get("email") || "");
      const phone = String(formData.get("phone") || "");
      const company = String(formData.get("company") || "");
      const volume = String(formData.get("volume") || "");
      const challenge = String(formData.get("challenge") || "");
      const website = String(formData.get("website") || "");
      const submissionId = target.crypto?.randomUUID?.() || `lead_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      formFeedback.classList.remove("visible", "error");
      formFeedback.textContent = "";
      formFeedback.setAttribute("role", "status");
      leadSubmit.disabled = true;
      leadSubmitLabel.textContent = "Enviando solicitação…";
      leadForm.setAttribute("aria-busy", "true");

      try {
        await loadTurnstile();
        if (!turnstileToken) {
          throw new Error("Aguarde a verificação de segurança e envie novamente.");
        }
        const response = await fetchImpl(leadForm.action, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, phone, company, volume, challenge, website, submissionId, turnstileToken, "cf-turnstile-response": turnstileToken }),
        });
        const result = await response.json().catch(() => null);

        if (!response.ok || !result?.ok) {
          throw new Error(result?.message || "Não foi possível enviar agora. Tente novamente em instantes.");
        }

        formFeedback.textContent = result.message;
        formFeedback.classList.add("visible");
        target.DespachoCertoAnalytics?.trackLeadSuccess?.();
        leadForm.reset();
        target.location.assign("/obrigado");
      } catch (error) {
        formFeedback.textContent = error instanceof Error
          ? error.message
          : "Não foi possível enviar agora. Tente novamente em instantes.";
        formFeedback.setAttribute("role", "alert");
        formFeedback.classList.add("visible", "error");
        turnstileToken = "";
        if (target.turnstile && turnstileWidgetId !== null) target.turnstile.reset(turnstileWidgetId);
      } finally {
        leadSubmit.disabled = false;
        leadSubmitLabel.textContent = "Preparar minha demonstração";
        leadForm.removeAttribute("aria-busy");
        formFeedback.focus({ preventScroll: true });
      }
    });
  }

  return Object.freeze({ initialize, loadTurnstile });
});
