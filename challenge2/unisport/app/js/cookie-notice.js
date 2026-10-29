/* ==========================================================================
   COOKIE & LOCAL STORAGE CONSENT CONTROLLER
   ========================================================================== */

(function () {
  const CONSENT_KEY = "unisport_cookie_consent";

  const DEFAULT_CONSENT = {
    necessary: true,
    functional: true,
    performance: true,
    timestamp: null
  };

  function getStoredConsent() {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveConsent(consent) {
    try {
      const payload = {
        necessary: true,
        functional: Boolean(consent.functional),
        performance: Boolean(consent.performance),
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
      return payload;
    } catch (e) {
      return consent;
    }
  }

  /* ==========================================================================
     DOM INJECTION & UI RENDERING
     ========================================================================== */

  function injectBannerDOM() {
    if (document.getElementById("unisport-cookie-notice")) return;

    const banner = document.createElement("aside");
    banner.id = "unisport-cookie-notice";
    banner.setAttribute("aria-label", "Cookie and Local Storage Preferences");
    banner.className =
      "bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border border-zinc-200/90 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-zinc-900 dark:text-zinc-100 font-sans";

    banner.innerHTML = `
      <div class="space-y-4">
        <!-- Header -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-orange-500/10 text-brand-orange flex items-center justify-center shrink-0">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path>
                <path d="M8.5 8.5v.01"></path>
                <path d="M16 15.5v.01"></path>
                <path d="M12 12v.01"></path>
                <path d="M11 17v.01"></path>
                <path d="M7 13v.01"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-bold text-zinc-950 dark:text-white tracking-tight">Cookie & Storage Notice</h3>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400">Your privacy & data rights</p>
            </div>
          </div>
          <button type="button" id="cookie-btn-dismiss" class="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded-lg transition" aria-label="Close Notice">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Description -->
        <p class="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          UniSport uses local storage and essential cookies to authenticate student credentials, preserve theme & match filters, and cache rosters for high performance. We do not use third-party advertising or marketing trackers.
        </p>

        <!-- Granular Details Accordion -->
        <div id="unisport-cookie-details" class="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <!-- Item 1: Necessary -->
          <div class="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/60">
            <div class="pr-2">
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-bold text-zinc-950 dark:text-white">Strictly Necessary</span>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">Required</span>
              </div>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Firebase Auth tokens and university student domain verification.</p>
            </div>
            <label class="cookie-switch">
              <input type="checkbox" checked disabled />
              <span class="cookie-slider"></span>
            </label>
          </div>

          <!-- Item 2: Functional -->
          <div class="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/60">
            <div class="pr-2">
              <span class="text-xs font-bold text-zinc-950 dark:text-white">Functional & Preferences</span>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Dark/Light theme persistence, haptics, and Eindhoven distance units.</p>
            </div>
            <label class="cookie-switch">
              <input type="checkbox" id="cookie-toggle-functional" checked />
              <span class="cookie-slider"></span>
            </label>
          </div>

          <!-- Item 3: Performance -->
          <div class="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/60">
            <div class="pr-2">
              <span class="text-xs font-bold text-zinc-950 dark:text-white">Cache & Performance</span>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Local caching of student rosters and match feeds for instant loading.</p>
            </div>
            <label class="cookie-switch">
              <input type="checkbox" id="cookie-toggle-performance" checked />
              <span class="cookie-slider"></span>
            </label>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="pt-2 flex flex-col gap-2">
          <div class="grid grid-cols-2 gap-2">
            <button type="button" id="cookie-btn-necessary" class="w-full py-2.5 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer text-center">
              Necessary Only
            </button>
            <button type="button" id="cookie-btn-accept" class="w-full py-2.5 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-bold transition cursor-pointer text-center shadow-sm">
              Accept All
            </button>
          </div>

          <div class="flex items-center justify-between pt-1">
            <button type="button" id="cookie-btn-toggle-details" class="text-[11px] font-semibold text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition flex items-center gap-1 cursor-pointer">
              <span id="cookie-details-label">Customize Preferences</span>
              <svg id="cookie-details-chevron" class="w-3.5 h-3.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <button type="button" id="cookie-btn-save-custom" class="hidden text-[11px] font-bold text-brand-orange hover:underline cursor-pointer">
              Save Choices
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(banner);
    bindBannerEvents(banner);
  }

  /* ==========================================================================
     EVENT HANDLERS & PUBLIC API
     ========================================================================== */

  function bindBannerEvents(banner) {
    const details = document.getElementById("unisport-cookie-details");
    const toggleDetailsBtn = document.getElementById("cookie-btn-toggle-details");
    const chevron = document.getElementById("cookie-details-chevron");
    const label = document.getElementById("cookie-details-label");
    const saveCustomBtn = document.getElementById("cookie-btn-save-custom");
    const toggleFunctional = document.getElementById("cookie-toggle-functional");
    const togglePerformance = document.getElementById("cookie-toggle-performance");

    function hideBanner() {
      banner.classList.remove("is-visible");
    }

    document.getElementById("cookie-btn-accept").addEventListener("click", () => {
      saveConsent({ functional: true, performance: true });
      hideBanner();
    });

    document.getElementById("cookie-btn-necessary").addEventListener("click", () => {
      saveConsent({ functional: false, performance: false });
      if (toggleFunctional) toggleFunctional.checked = false;
      if (togglePerformance) togglePerformance.checked = false;
      hideBanner();
    });

    document.getElementById("cookie-btn-dismiss").addEventListener("click", () => {
      if (!getStoredConsent()) {
        saveConsent({ functional: true, performance: true });
      }
      hideBanner();
    });

    toggleDetailsBtn.addEventListener("click", () => {
      const isOpen = details.classList.toggle("is-open");
      chevron.style.transform = isOpen ? "rotate(180deg)" : "rotate(0deg)";
      label.textContent = isOpen ? "Hide Preferences" : "Customize Preferences";
      saveCustomBtn.classList.toggle("hidden", !isOpen);
    });

    saveCustomBtn.addEventListener("click", () => {
      saveConsent({
        functional: toggleFunctional ? toggleFunctional.checked : true,
        performance: togglePerformance ? togglePerformance.checked : true
      });
      hideBanner();
    });
  }

  function showBanner(forceOpenDetails = false) {
    injectBannerDOM();
    const banner = document.getElementById("unisport-cookie-notice");
    if (!banner) return;

    const stored = getStoredConsent();
    const toggleFunctional = document.getElementById("cookie-toggle-functional");
    const togglePerformance = document.getElementById("cookie-toggle-performance");

    if (stored) {
      if (toggleFunctional) toggleFunctional.checked = stored.functional !== false;
      if (togglePerformance) togglePerformance.checked = stored.performance !== false;
    }

    if (forceOpenDetails) {
      const details = document.getElementById("unisport-cookie-details");
      const chevron = document.getElementById("cookie-details-chevron");
      const label = document.getElementById("cookie-details-label");
      const saveCustomBtn = document.getElementById("cookie-btn-save-custom");
      if (details) details.classList.add("is-open");
      if (chevron) chevron.style.transform = "rotate(180deg)";
      if (label) label.textContent = "Hide Preferences";
      if (saveCustomBtn) saveCustomBtn.classList.remove("hidden");
    }

    requestAnimationFrame(() => {
      banner.classList.add("is-visible");
    });
  }

  // Auto initialize on DOM ready
  function init() {
    injectBannerDOM();
    const consent = getStoredConsent();
    if (!consent) {
      setTimeout(() => {
        showBanner(false);
      }, 600);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Global hooks
  window.openCookieNotice = function () {
    showBanner(true);
  };

  window.closeCookieNotice = function () {
    const banner = document.getElementById("unisport-cookie-notice");
    if (banner) banner.classList.remove("is-visible");
  };

  window.getCookieConsent = function () {
    return getStoredConsent() || DEFAULT_CONSENT;
  };
})();
