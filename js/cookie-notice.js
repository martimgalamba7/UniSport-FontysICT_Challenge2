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
     DOM INJECTION & HORIZONTAL RECTANGLE LAYOUT
     ========================================================================== */

  function injectBannerDOM() {
    if (document.getElementById("unisport-cookie-notice")) return;

    const banner = document.createElement("aside");
    banner.id = "unisport-cookie-notice";
    banner.setAttribute("aria-label", "Cookie and Local Storage Preferences");
    banner.className =
      "bg-white/95 dark:bg-black/90 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7)] text-zinc-900 dark:text-zinc-100 font-sans transition-all";

    banner.innerHTML = `
      <div class="space-y-3.5">
        <!-- Main Horizontal Rectangle Strip -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <!-- Left: Identity & Description -->
          <div class="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
            <div class="w-10 h-10 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/20 text-brand-orange flex items-center justify-center shrink-0 shadow-sm">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path>
                <path d="M8.5 8.5v.01"></path>
                <path d="M16 15.5v.01"></path>
                <path d="M12 12v.01"></path>
                <path d="M11 17v.01"></path>
                <path d="M7 13v.01"></path>
              </svg>
            </div>

            <div class="space-y-0.5 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="text-xs sm:text-sm font-black text-zinc-950 dark:text-white tracking-tight">Privacy & Storage Notice</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">Campus Data</span>
              </div>
              <p class="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
                We use local storage & essential cookies for student authentication, light/dark theme, and roster caching. No advertising or 3rd-party trackers.
              </p>
            </div>
          </div>

          <!-- Right: Action Buttons Group -->
          <div class="flex items-center gap-2 shrink-0 self-end md:self-center w-full md:w-auto justify-end">
            <button type="button" id="cookie-btn-toggle-details" class="px-3 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-1.5 cursor-pointer">
              <span id="cookie-details-label">Customize</span>
              <svg id="cookie-details-chevron" class="w-3.5 h-3.5 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            <button type="button" id="cookie-btn-necessary" class="px-3.5 sm:px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition cursor-pointer">
              Necessary
            </button>

            <button type="button" id="cookie-btn-accept" class="px-4 sm:px-5 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-bold transition cursor-pointer shadow-sm">
              Accept All
            </button>

            <button type="button" id="cookie-btn-dismiss" class="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1.5 rounded-lg transition ml-1" aria-label="Close Notice">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

        </div>

        <!-- Expandable Granular Preferences Grid (Horizontal 3-Column on Desktop) -->
        <div id="unisport-cookie-details" class="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            
            <!-- Category 1: Strictly Necessary -->
            <div class="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80 flex flex-col justify-between gap-2.5">
              <div class="space-y-1">
                <div class="flex items-center justify-between gap-1.5">
                  <span class="text-xs font-bold text-zinc-950 dark:text-white">Strictly Necessary</span>
                  <span class="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">Required</span>
                </div>
                <p class="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                  Firebase student authentication tokens and domain security verification.
                </p>
              </div>
              <label class="cookie-switch self-end">
                <input type="checkbox" checked disabled />
                <span class="cookie-slider"></span>
              </label>
            </div>

            <!-- Category 2: Functional & Display -->
            <div class="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80 flex flex-col justify-between gap-2.5">
              <div class="space-y-1">
                <div class="flex items-center justify-between gap-1.5">
                  <span class="text-xs font-bold text-zinc-950 dark:text-white">Functional</span>
                  <span class="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Settings</span>
                </div>
                <p class="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                  Light/Dark theme, audio/haptic feedback, and distance units (km/mi).
                </p>
              </div>
              <label class="cookie-switch self-end">
                <input type="checkbox" id="cookie-toggle-functional" checked />
                <span class="cookie-slider"></span>
              </label>
            </div>

            <!-- Category 3: Performance & Cache -->
            <div class="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80 flex flex-col justify-between gap-2.5">
              <div class="space-y-1">
                <div class="flex items-center justify-between gap-1.5">
                  <span class="text-xs font-bold text-zinc-950 dark:text-white">Performance</span>
                  <span class="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-orange-500/10 text-brand-orange">Fast Load</span>
                </div>
                <p class="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                  Local caching of Eindhoven match feeds and campus student directories.
                </p>
              </div>
              <label class="cookie-switch self-end">
                <input type="checkbox" id="cookie-toggle-performance" checked />
                <span class="cookie-slider"></span>
              </label>
            </div>

          </div>

          <!-- Bottom Actions inside Details -->
          <div class="flex items-center justify-end gap-2 pt-1">
            <button type="button" id="cookie-btn-collapse-details" class="px-3 py-1.5 text-[11px] font-semibold text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition cursor-pointer">
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
    const chevron = document.getElementById("cookie-details-chevron");
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
      if (chevron) chevron.style.transform = open ? "rotate(180deg)" : "rotate(0deg)";
      if (label) label.textContent = open ? "Hide" : "Customize";
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
      const chevron = document.getElementById("cookie-details-chevron");
      const label = document.getElementById("cookie-details-label");
      if (details) details.classList.add("is-open");
      if (chevron) chevron.style.transform = "rotate(180deg)";
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
