(function attachNavigation(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory;
    return;
  }
  factory(root, root.document).initialize();
})(typeof window !== "undefined" ? window : globalThis, function createSiteNavigation(target, document) {
  const navigation = document.querySelector(".site-navigation");
  const menuButtons = [...document.querySelectorAll("[data-menu-button]")];
  const mobileButton = document.getElementById("siteMenuButton");
  const mobileMenu = document.getElementById("siteMobileMenu");
  let initialized = false;
  let lastOpenedButton = null;
  let desktopLayout = target.innerWidth > 1020;

  function closeDropdowns(exceptId = "") {
    menuButtons.forEach((button) => {
      const panel = document.getElementById(button.getAttribute("aria-controls"));
      const keepOpen = panel && panel.id === exceptId;
      button.setAttribute("aria-expanded", String(keepOpen));
      if (panel) panel.hidden = !keepOpen;
      if (keepOpen) lastOpenedButton = button;
    });
  }

  function setMobileMenu(open) {
    mobileButton?.setAttribute("aria-expanded", String(open));
    mobileButton?.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    if (mobileMenu) mobileMenu.hidden = !open;
    if (open) lastOpenedButton = mobileButton;
  }

  function closeAll() {
    closeDropdowns();
    setMobileMenu(false);
  }

  function isNavigationOpen() {
    return mobileButton?.getAttribute("aria-expanded") === "true"
      || menuButtons.some((button) => button.getAttribute("aria-expanded") === "true");
  }

  function initialize() {
    if (initialized) return;
    initialized = true;

    menuButtons.forEach((button) => button.addEventListener("click", () => {
      const panelId = button.getAttribute("aria-controls");
      const willOpen = button.getAttribute("aria-expanded") !== "true";
      closeDropdowns(willOpen ? panelId : "");
    }));

    mobileButton?.addEventListener("click", () => {
      const willOpen = mobileButton.getAttribute("aria-expanded") !== "true";
      if (!willOpen) closeDropdowns();
      setMobileMenu(willOpen);
    });

    navigation?.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeAll);
    });

    navigation?.querySelectorAll("[data-site-header-cta]").forEach((link) => {
      link.addEventListener("click", () => {
        target.DespachoCertoAnalytics?.trackCta(
          link.dataset.siteHeaderCta,
          link.getAttribute("href"),
        );
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !isNavigationOpen()) return;
      const focusTarget = mobileButton?.getAttribute("aria-expanded") === "true"
        ? mobileButton
        : lastOpenedButton;
      closeAll();
      focusTarget?.focus();
    });

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".site-navigation")) closeAll();
    });

    target.addEventListener?.("resize", () => {
      const nextDesktopLayout = target.innerWidth > 1020;
      if (nextDesktopLayout === desktopLayout) return;
      desktopLayout = nextDesktopLayout;
      closeAll();
    });
  }

  return Object.freeze({ initialize, closeAll });
});
