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
  if (!modules.length || !panels.length) return;

  function activateProductModule(name, focus = false) {
    modules.forEach((module) => {
      const active = module.dataset.productModule === name;
      module.setAttribute("aria-selected", String(active));
      module.tabIndex = active ? 0 : -1;
      if (active && focus) module.focus();
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.productPanel !== name;
    });
  }

  modules.forEach((module, index) => {
    module.addEventListener("click", () => activateProductModule(module.dataset.productModule));
    module.addEventListener("keydown", (event) => {
      const nextIndex = nextProductModuleIndex(event, index, modules.length);
      if (nextIndex === null) return;
      event.preventDefault();
      activateProductModule(modules[nextIndex].dataset.productModule, true);
    });
  });

  const hashTarget = modules.find((module) => `#${module.id}` === window.location.hash);
  const selected = hashTarget || modules.find((module) => module.getAttribute("aria-selected") === "true") || modules[0];
  activateProductModule(selected.dataset.productModule);
});
