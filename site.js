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

const criticalRows = [...document.querySelectorAll("#criticalList .critical-row")];
let criticalIndex = 0;
window.setInterval(() => {
  criticalRows[criticalIndex].classList.remove("is-live");
  criticalIndex = (criticalIndex + 1) % criticalRows.length;
  criticalRows[criticalIndex].classList.add("is-live");
}, 2400);

document.getElementById("currentYear").textContent = String(new Date().getFullYear());
