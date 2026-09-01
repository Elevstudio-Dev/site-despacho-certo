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
