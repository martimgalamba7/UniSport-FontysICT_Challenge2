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
     DOM INJECTION & MINIMAL HORIZONTAL RECTANGLE LAYOUT
     ========================================================================== */

  function injectBannerDOM() {
    if (document.getElementById("unisport-cookie-notice")) return;

    const banner = document.createElement("aside");
    banner.id = "unisport-cookie-notice";
    banner.setAttribute("aria-label", "Cookie and Local Storage Preferences");
    banner.className =
      "bg-white/95 dark:bg-black/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:px-5 sm:py-3.5 shadow-2xl text-zinc-900 dark:text-zinc-100 font-sans transition-all";

    banner.innerHTML = `
      <div class="space-y-3">
        <!-- Main Horizontal Row -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
          
          <!-- Left: Bare Icon + Minimal Text (No background on icon, no badges) -->
          <div class="flex items-center gap-2.5 min-w-0 flex-1">
            <svg class="w-4 h-4 text-brand-orange shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path>
              <path d="M8.5 8.5v.01"></path>
              <path d="M16 15.5v.01"></path>
              <path d="M12 12v.01"></path>
              <path d="M11 17v.01"></path>
              <path d="M7 13v.01"></path>
            </svg>

            <p class="text-xs text-zinc-600 dark:text-zinc-400 leading-normal">
              <strong class="font-bold text-zinc-950 dark:text-white mr-1">Cookies & Storage:</strong>
              We use local storage and essential cookies for authentication, theme preferences, and offline caching. No ad tracking.
            </p>
          </div>

          <!-- Right: Clean Minimal Buttons -->
          <div class="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
            <button type="button" id="cookie-btn-toggle-details" class="px-2.5 py-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition cursor-pointer">
              <span id="cookie-details-label">Preferences</span>
            </button>

            <button type="button" id="cookie-btn-necessary" class="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition cursor-pointer">
              Necessary
            </button>

            <button type="button" id="cookie-btn-accept" class="px-4 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-bold transition cursor-pointer shadow-sm">
              Accept All
            </button>
          </div>

        </div>

        <!-- Clean Minimal Details (No cards, simple clean rows with hairline dividers) -->
        <div id="unisport-cookie-details" class="pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2.5">
          <div class="divide-y divide-zinc-100 dark:divide-zinc-800/70 text-xs">
            
            <div class="py-2 flex items-center justify-between gap-4">
              <div>
                <p class="font-bold text-zinc-950 dark:text-white text-xs">Strictly Necessary</p>
                <p class="text-[11px] text-zinc-500 dark:text-zinc-400">Firebase student session tokens and university verification.</p>
              </div>
              <span class="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 shrink-0">Always Active</span>
            </div>

            <div class="py-2 flex items-center justify-between gap-4">
              <div>
                <p class="font-bold text-zinc-950 dark:text-white text-xs">Functional & Theme</p>
                <p class="text-[11px] text-zinc-500 dark:text-zinc-400">Light/Dark theme, audio/haptic cues, and distance units.</p>
              </div>
              <label class="cookie-switch">
                <input type="checkbox" id="cookie-toggle-functional" checked />
                <span class="cookie-slider"></span>
              </label>
            </div>

            <div class="py-2 flex items-center justify-between gap-4">
              <div>
                <p class="font-bold text-zinc-950 dark:text-white text-xs">Cache & Performance</p>
                <p class="text-[11px] text-zinc-500 dark:text-zinc-400">Local cache of match feeds and student rosters for fast load.</p>
              </div>
              <label class="cookie-switch">
                <input type="checkbox" id="cookie-toggle-performance" checked />
                <span class="cookie-slider"></span>
              </label>
            </div>

          </div>

          <div class="flex items-center justify-end gap-3 pt-1">
            <button type="button" id="cookie-btn-collapse-details" class="text-xs font-semibold text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer">
              Cancel
            </button>
            <button type="button" id="cookie-btn-save-custom" class="px-4 py-1.5 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-bold transition shadow-sm cursor-pointer">
              Save Preferences
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
    const collapseDetailsBtn = document.getElementById("cookie-btn-collapse-details");
    const label = document.getElementById("cookie-details-label");
    const saveCustomBtn = document.getElementById("cookie-btn-save-custom");
    const toggleFunctional = document.getElementById("cookie-toggle-functional");
    const togglePerformance = document.getElementById("cookie-toggle-performance");

    function hideBanner() {
      banner.classList.remove("is-visible");
    }

    function toggleDetails(forceState) {
      const open = typeof forceState === "boolean" ? forceState : !details.classList.contains("is-open");
      details.classList.toggle("is-open", open);
      if (label) label.textContent = open ? "Hide" : "Preferences";
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

    toggleDetailsBtn.addEventListener("click", () => toggleDetails());
    if (collapseDetailsBtn) collapseDetailsBtn.addEventListener("click", () => toggleDetails(false));

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
      const label = document.getElementById("cookie-details-label");
      if (details) details.classList.add("is-open");
      if (label) label.textContent = "Hide";
    }

    requestAnimationFrame(() => {
      banner.classList.add("is-visible");
    });
  }

  function init() {
    injectBannerDOM();
    const consent = getStoredConsent();
    if (!consent) {
      setTimeout(() => {
        showBanner(false);
      }, 500);
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
