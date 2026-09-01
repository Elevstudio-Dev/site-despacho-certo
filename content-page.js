const iconOptions = { "stroke-width": 1.8 };

function iconComponentName(name) {
  return name.replace(/(^|[-_\s])(\w)/g, (_match, _separator, letter) => letter.toUpperCase());
}

function createIconNode(definition) {
  const [tag, attributes = {}, children = []] = definition;
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, String(value)));
  children.forEach((child) => node.appendChild(createIconNode(child)));
  return node;
}

function hydrateIcons(root = document) {
  root.querySelectorAll("[data-lucide]").forEach((element) => {
    const name = element.getAttribute("data-lucide");
    const definition = window.lucide?.icons?.[iconComponentName(name)];
    if (!definition) return;
    const original = Object.fromEntries([...element.attributes].map(({ name: key, value }) => [key, value]));
    const size = original.size;
    delete original.size;
    const [tag, attributes, children] = definition;
    const svg = createIconNode([
      tag,
      {
        ...attributes,
        ...iconOptions,
        ...original,
        ...(size ? { width: size, height: size } : {}),
        class: ["lucide", `lucide-${name}`, original.class].filter(Boolean).join(" "),
      },
      children,
    ]);
    element.replaceWith(svg);
  });
}

hydrateIcons();

document.querySelectorAll("[data-current-year]").forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

document.querySelectorAll("[data-cta]:not([data-site-header-cta])").forEach((link) => {
  link.addEventListener("click", () => {
    window.DespachoCertoAnalytics?.trackCta(link.dataset.cta, link.getAttribute("href"));
  });
});

function nextProductModuleIndex(event, currentIndex, itemCount) {
  if (event.key === "Home") return 0;
  if (event.key === "End") return itemCount - 1;
  if (["ArrowDown", "ArrowRight"].includes(event.key)) return (currentIndex + 1) % itemCount;
  if (["ArrowUp", "ArrowLeft"].includes(event.key)) return (currentIndex - 1 + itemCount) % itemCount;
  return null;
}

document.querySelectorAll(".product-map").forEach((map) => {
  const modules = [...map.querySelectorAll("[data-product-module]")];
  const panels = [...map.querySelectorAll("[data-product-panel]")];
  const tablist = map.querySelector('[role="tablist"]');
  if (!modules.length || !panels.length) return;

  const horizontalLayout = window.matchMedia?.("(min-width: 641px) and (max-width: 960px)");
  function syncProductMapOrientation(media = horizontalLayout) {
    tablist?.setAttribute("aria-orientation", media?.matches ? "horizontal" : "vertical");
  }
  syncProductMapOrientation();
  horizontalLayout?.addEventListener?.("change", syncProductMapOrientation);

  function productModuleFromHash() {
    return modules.find((module) => `#${module.id}` === window.location.hash);
  }

  function syncProductModuleUrl(module) {
    const nextHash = `#${module.id}`;
    if (window.location.hash === nextHash) return;
    window.history?.replaceState(window.history.state, "", nextHash);
  }

  function activateProductModule(name, { focus = false, syncUrl = false } = {}) {
    const activeModule = modules.find((module) => module.dataset.productModule === name);
    if (!activeModule) return;

    modules.forEach((module) => {
      const active = module === activeModule;
      module.setAttribute("aria-selected", String(active));
      module.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.productPanel !== name;
    });
    if (focus) activeModule.focus();
    if (syncUrl) syncProductModuleUrl(activeModule);
  }

  modules.forEach((module, index) => {
    module.addEventListener("click", () => {
      activateProductModule(module.dataset.productModule, { syncUrl: true });
    });
    module.addEventListener("keydown", (event) => {
      const nextIndex = nextProductModuleIndex(event, index, modules.length);
      if (nextIndex === null) return;
      event.preventDefault();
      activateProductModule(modules[nextIndex].dataset.productModule, { focus: true, syncUrl: true });
    });
  });

  window.addEventListener?.("hashchange", () => {
    const hashTarget = productModuleFromHash();
    if (hashTarget) activateProductModule(hashTarget.dataset.productModule);
  });

  const hashTarget = productModuleFromHash();
  const selected = hashTarget || modules.find((module) => module.getAttribute("aria-selected") === "true") || modules[0];
  activateProductModule(selected.dataset.productModule);
});

function nextOsEventIndex(event, currentIndex, itemCount) {
  if (event.key === "Home") return 0;
  if (event.key === "End") return itemCount - 1;
  if (["ArrowDown", "ArrowRight"].includes(event.key)) return (currentIndex + 1) % itemCount;
  if (["ArrowUp", "ArrowLeft"].includes(event.key)) return (currentIndex - 1 + itemCount) % itemCount;
  return null;
}

document.querySelectorAll(".os-timeline").forEach((timeline) => {
  const events = [...timeline.querySelectorAll("[data-os-event]")];
  const detail = timeline.querySelector(".os-event-detail");
  if (!events.length || !detail) return;

  const fields = Object.fromEntries(
    ["title", "date", "summary", "responsible", "status", "next"].map((name) => [
      name,
      detail.querySelector(`[data-os-detail="${name}"]`),
    ]),
  );

  function activateOsEvent(activeEvent, { focus = false } = {}) {
    events.forEach((event) => {
      const active = event === activeEvent;
      if (active) event.setAttribute("aria-current", "step");
      else event.removeAttribute("aria-current");
      event.tabIndex = active ? 0 : -1;
    });

    Object.entries(fields).forEach(([name, field]) => {
      if (field) field.textContent = activeEvent.dataset[`os${name[0].toUpperCase()}${name.slice(1)}`] || "";
    });
    fields.status?.setAttribute("data-status", activeEvent.dataset.osStatusTone || "active");
    if (focus) activeEvent.focus();
  }

  events.forEach((event, index) => {
    event.addEventListener("click", () => activateOsEvent(event));
    event.addEventListener("keydown", (keyboardEvent) => {
      const nextIndex = nextOsEventIndex(keyboardEvent, index, events.length);
      if (nextIndex === null) return;
      keyboardEvent.preventDefault();
      activateOsEvent(events[nextIndex], { focus: true });
    });
  });

  const selected = events.find((event) => event.getAttribute("aria-current") === "step") || events[0];
  activateOsEvent(selected);
});
