const iconOptions = { "stroke-width": 1.8 };

function getIconComponentName(name) {
  return name.replace(/(^|[-_\s])(\w)/g, (_match, _separator, letter) => letter.toUpperCase());
}

function createIconNode(definition) {
  const [tag, attributes = {}, children = []] = definition;
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, String(value)));
  children.forEach((child) => node.appendChild(createIconNode(child)));
  return node;
}

function hydrateIcon(element) {
  if (!window.lucide || !element?.isConnected) return;
  const name = element.getAttribute("data-lucide");
  const definition = window.lucide.icons?.[getIconComponentName(name)];
  if (!definition) return;

  const originalAttributes = Object.fromEntries(
    [...element.attributes].map((attribute) => [attribute.name, attribute.value]),
  );
  const size = originalAttributes.size;
  delete originalAttributes.size;
  const [tag, attributes, children] = definition;
  const svg = createIconNode([
    tag,
    {
      ...attributes,
      ...iconOptions,
      ...originalAttributes,
      ...(size ? { width: size, height: size } : {}),
      class: ["lucide", `lucide-${name}`, originalAttributes.class].filter(Boolean).join(" "),
    },
    children,
  ]);
  element.replaceWith(svg);
}

function getIcons(root) {
  const icons = root?.matches?.("[data-lucide]") ? [root] : [];
  return root?.querySelectorAll ? [...icons, ...root.querySelectorAll("[data-lucide]")] : icons;
}

function hydrateIcons(root) {
  getIcons(root).forEach(hydrateIcon);
}

const iconObserver = "IntersectionObserver" in window
  ? new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        iconObserver.unobserve(entry.target);
        hydrateIcon(entry.target);
      });
    },
    { rootMargin: "300px 0px" },
  )
  : null;

function observeDeferredIcons(root) {
  getIcons(root).forEach((icon) => {
    if (iconObserver) iconObserver.observe(icon);
    else hydrateIcon(icon);
  });
}

[
  document.querySelector(".site-navigation"),
  document.querySelector(".hero"),
  document.getElementById("privacyChoicePanel"),
  document.getElementById("privacyPreferencesDialog"),
].filter(Boolean).forEach(hydrateIcons);
observeDeferredIcons(document);

const siteAnalytics = window.DespachoCertoAnalytics;
document.querySelectorAll("[data-cta]:not([data-site-header-cta])").forEach((link) => {
  link.addEventListener("click", () => {
    siteAnalytics?.trackCta(link.dataset.cta, link.getAttribute("href"));
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -30px" },
);

document.querySelectorAll(".reveal").forEach((item) => revealObserver.observe(item));

const tourTabs = [...document.querySelectorAll(".tour-tab")];
const tourPanels = [...document.querySelectorAll(".tour-panel")];

function getNextTabIndex(event, currentIndex, itemCount) {
  if (event.key === "Home") return 0;
  if (event.key === "End") return itemCount - 1;
  if (["ArrowDown", "ArrowRight"].includes(event.key)) return (currentIndex + 1) % itemCount;
  if (["ArrowUp", "ArrowLeft"].includes(event.key)) return (currentIndex - 1 + itemCount) % itemCount;
  return null;
}

function activateTour(name, focus = false) {
  tourTabs.forEach((tab) => {
    const active = tab.dataset.tour === name;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && focus) tab.focus();
  });
  tourPanels.forEach((panel) => {
    const active = panel.dataset.panel === name;
    panel.classList.toggle("active", active);
    panel.hidden = !active;
    if (active) hydrateIcons(panel);
  });
}

tourTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateTour(tab.dataset.tour));
  tab.addEventListener("keydown", (event) => {
    const nextIndex = getNextTabIndex(event, index, tourTabs.length);
    if (nextIndex === null) return;
    event.preventDefault();
    activateTour(tourTabs[nextIndex].dataset.tour, true);
  });
});

const workflowData = [
  { status: "Em análise", owner: "Ana Paula", payment: "Aguardando", title: "OS criada", text: "Cliente, veículo e serviço vinculados ao processo.", next: "Conferir documentos necessários para iniciar.", headline: "Cadastro completo.", detail: "A equipe já sabe quem conduz a próxima etapa." },
  { status: "Aguardando documento", owner: "Ana Paula", payment: "Aguardando", title: "Checklist conferido", text: "Três documentos recebidos e ATPV-e ainda pendente.", next: "Solicitar ATPV-e assinada pelo WhatsApp.", headline: "Pendência visível.", detail: "O processo não avança sem o documento obrigatório." },
  { status: "Em andamento", owner: "Rafael Lima", payment: "Parcial", title: "Execução iniciada", text: "Responsável alterado e processo enviado para análise.", next: "Acompanhar retorno do órgão e atualizar a OS.", headline: "Responsabilidade definida.", detail: "Qualquer pessoa autorizada entende o andamento." },
  { status: "Concluído", owner: "Rafael Lima", payment: "Pago", title: "Pagamento confirmado", text: "Recebimento e custos registrados na ordem de serviço.", next: "Entregar o documento final ao cliente.", headline: "Resultado calculado.", detail: "Valor, custo e lucro permanecem ligados à OS." },
  { status: "Finalizado", owner: "Rafael Lima", payment: "Pago", title: "Processo entregue", text: "Cliente avisado, documento anexado e OS arquivada.", next: "Histórico disponível para futuras consultas.", headline: "Processo preservado.", detail: "A ficha do cliente mantém toda a memória do atendimento." },
];

const workflowSteps = [...document.querySelectorAll(".workflow-step")];
const progressItems = [...document.querySelectorAll(".os-progress-item")];
const workflowPanel = document.getElementById("workflowPanel");

function activateWorkflow(index, focus = false) {
  const data = workflowData[index];
  workflowSteps.forEach((step, stepIndex) => {
    const active = stepIndex === index;
    step.classList.toggle("active", active);
    step.setAttribute("aria-selected", String(active));
    step.tabIndex = active ? 0 : -1;
    if (active && focus) step.focus();
  });
  workflowPanel.setAttribute("aria-labelledby", workflowSteps[index].id);
  progressItems.forEach((item, itemIndex) => {
    item.classList.toggle("complete", itemIndex < index);
    item.classList.toggle("current", itemIndex === index);
  });
  document.getElementById("workflowStatus").textContent = data.status;
  document.getElementById("workflowOwner").textContent = data.owner;
  document.getElementById("workflowPayment").textContent = data.payment;
  document.getElementById("eventTitle").textContent = data.title;
  document.getElementById("eventText").textContent = data.text;
  document.getElementById("nextStepText").textContent = data.next;
  document.getElementById("workflowHeadline").textContent = data.headline;
  document.getElementById("workflowDetail").textContent = data.detail;
}

workflowSteps.forEach((step, index) => {
  step.addEventListener("click", () => activateWorkflow(Number(step.dataset.step)));
  step.addEventListener("keydown", (event) => {
    const nextIndex = getNextTabIndex(event, index, workflowSteps.length);
    if (nextIndex === null) return;
    event.preventDefault();
    activateWorkflow(nextIndex, true);
  });
});

const roleData = {
  dono: {
    label: "Dono do escritório",
    title: "Controle sem depender de perguntar para todo mundo.",
    description: "Abra o dia sabendo quantas OS estão abertas, onde existem pendências, o que falta receber e como está o resultado do período.",
    points: ["Prioridades operacionais em uma única visão", "Faturamento, custos, lucro e contas a receber", "Responsáveis e produtividade por processo"],
    visualTitle: "Visão administrativa",
    visualCaption: "Hoje · Todos os responsáveis",
    insights: [["OS que pedem atenção", "10", "6 documentos, 4 pagamentos", 3], ["Lucro bruto do mês", "R$ 16,4 mil", "Resultado calculado a partir das OS", 4], ["Operação por responsável", "28 OS abertas", "Ana 12 · Rafael 9 · Camila 7", 0]],
  },
  equipe: {
    label: "Equipe operacional",
    title: "A próxima tarefa aparece sem precisar procurar contexto.",
    description: "Cada pessoa encontra suas OS, pendências, lembretes, documentos e mensagens prontas para manter o atendimento em movimento.",
    points: ["Fila por responsável e status", "Checklist de documentos por serviço", "Histórico para continuar qualquer atendimento"],
    visualTitle: "Minha operação",
    visualCaption: "Ana Paula · 12 OS abertas",
    insights: [["Lembretes de hoje", "4", "2 retornos, 2 documentos", 2], ["OS em andamento", "7", "3 aguardando órgão", 3], ["Próximas entregas", "3 esta semana", "Prazos e pendências visíveis", 0]],
  },
  financeiro: {
    label: "Financeiro",
    title: "O fechamento começa dentro de cada ordem de serviço.",
    description: "Pagamentos, custos, saldos e lançamentos ficam relacionados ao trabalho que gerou cada valor, com visão consolidada do período.",
    points: ["Pagamentos totais ou parciais", "Custos e lucro bruto por OS", "Contas a receber e serviços com melhor margem"],
    visualTitle: "Controle financeiro",
    visualCaption: "Agosto de 2026 · Regime operacional",
    insights: [["Faturamento", "R$ 42,8 mil", "Recebimentos e OS do período", 4], ["A receber", "R$ 7,2 mil", "9 clientes com saldo", 2], ["Margem média", "38,4%", "Resultado por serviço e responsável", 0]],
  },
};

const roleButtons = [...document.querySelectorAll(".benefit-control")];
const benefitPanel = document.getElementById("benefitPanel");

function activateRole(name, focus = false) {
  const data = roleData[name];
  roleButtons.forEach((button) => {
    const active = button.dataset.role === name;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
    if (active && focus) button.focus();
  });
  const activeButton = roleButtons.find((button) => button.dataset.role === name);
  benefitPanel.setAttribute("aria-labelledby", activeButton.id);
  const pointMarkup = data.points.map((point) => `<span class="benefit-point"><i data-lucide="check-circle-2" size="18"></i>${point}</span>`).join("");
  document.getElementById("benefitCopy").innerHTML = `<span class="role-label">${data.label}</span><h3>${data.title}</h3><p>${data.description}</p><div class="benefit-points">${pointMarkup}</div>`;
  document.getElementById("roleVisualTitle").textContent = data.visualTitle;
  document.getElementById("roleVisualCaption").textContent = data.visualCaption;
  document.getElementById("roleVisual").setAttribute("aria-label", `Exemplo de visão para ${data.label}`);
  document.getElementById("roleVisualBody").innerHTML = data.insights.map((item, index) => {
    const queue = item[3] ? `<div class="role-queue">${[0, 1, 2, 3, 4].map((bar) => `<i class="${bar < item[3] ? "active" : ""}"></i>`).join("")}</div>` : "";
    return `<div class="role-insight ${index === 2 ? "wide" : ""}"><span>${item[0]}</span><strong>${item[1]}</strong><p>${item[2]}</p>${queue}</div>`;
  }).join("");
  hydrateIcons(benefitPanel);
}

roleButtons.forEach((button, index) => {
  button.addEventListener("click", () => activateRole(button.dataset.role));
  button.addEventListener("keydown", (event) => {
    const nextIndex = getNextTabIndex(event, index, roleButtons.length);
    if (nextIndex === null) return;
    event.preventDefault();
    activateRole(roleButtons[nextIndex].dataset.role, true);
  });
});

const criticalRows = [...document.querySelectorAll("#criticalList .critical-row")];
let criticalIndex = 0;
window.setInterval(() => {
  criticalRows[criticalIndex].classList.remove("is-live");
  criticalIndex = (criticalIndex + 1) % criticalRows.length;
  criticalRows[criticalIndex].classList.add("is-live");
}, 2400);

const leadForm = document.getElementById("leadForm");
const leadSubmit = document.getElementById("leadSubmit");
const leadSubmitLabel = document.getElementById("leadSubmitLabel");
const formFeedback = document.getElementById("formFeedback");
const turnstileStatus = document.getElementById("turnstileStatus");
let turnstileToken = "";
let turnstileWidgetId = null;
let turnstileLoadPromise = null;

function setTurnstileStatus(message) {
  turnstileStatus.textContent = message;
}

function loadTurnstile() {
  if (turnstileLoadPromise) return turnstileLoadPromise;

  turnstileLoadPromise = fetch("/api/public-config", {
    headers: { Accept: "application/json" },
  })
    .then(async (response) => {
      const config = await response.json().catch(() => null);
      if (!response.ok || !config?.turnstileSiteKey) throw new Error("Turnstile indisponível");
      return config.turnstileSiteKey;
    })
    .then((sitekey) => new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", () => resolve(sitekey), { once: true });
      script.addEventListener("error", () => reject(new Error("Falha ao carregar Turnstile")), { once: true });
      document.head.appendChild(script);
    }))
    .then((sitekey) => {
      turnstileWidgetId = window.turnstile.render("#turnstileWidget", {
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
      setTurnstileStatus("Verificação de segurança em andamento...");
    })
    .catch(() => {
      turnstileLoadPromise = null;
      setTurnstileStatus("A verificação de segurança está indisponível. Recarregue a página.");
    });

  return turnstileLoadPromise;
}

const turnstileObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries, observer) => {
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
  const submissionId = window.crypto?.randomUUID?.() || `lead_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  formFeedback.classList.remove("visible", "error");
  formFeedback.textContent = "";
  formFeedback.setAttribute("role", "status");
  leadSubmit.disabled = true;
  leadSubmitLabel.textContent = "Enviando solicitação...";
  leadForm.setAttribute("aria-busy", "true");

  try {
    await loadTurnstile();
    if (!turnstileToken) {
      throw new Error("Aguarde a verificação de segurança e envie novamente.");
    }
    const response = await fetch(leadForm.action, {
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
    siteAnalytics?.trackLead();
    leadForm.reset();
    window.location.assign("/obrigado");
  } catch (error) {
    formFeedback.textContent = error instanceof Error
      ? error.message
      : "Não foi possível enviar agora. Tente novamente em instantes.";
    formFeedback.setAttribute("role", "alert");
    formFeedback.classList.add("visible", "error");
    turnstileToken = "";
    if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);
  } finally {
    leadSubmit.disabled = false;
    leadSubmitLabel.textContent = "Quero conhecer o DespachoCerto";
    leadForm.removeAttribute("aria-busy");
    formFeedback.focus({ preventScroll: true });
  }
});

document.getElementById("currentYear").textContent = String(new Date().getFullYear());
