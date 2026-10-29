/* ==========================================================================
   TAILWIND THEME CONFIGURATION
   ========================================================================== */

if (typeof tailwind !== "undefined") {
  tailwind.config = {
    darkMode: "class",
    theme: {
      extend: {
        fontFamily: {
          sans: ["Plus Jakarta Sans", "-apple-system", "BlinkMacSystemFont", "sans-serif"]
        },
        colors: {
          brand: {
            orange: "#FF4D00",
            "orange-hover": "#EA4500"
          }
        }
      }
    }
  };
}

/* ==========================================================================
   LIGHT / DARK THEME MANAGER
   ========================================================================== */

(function() {
  const THEME_KEY = "unisport_theme";

  function getStoredTheme() {
    return localStorage.getItem(THEME_KEY) || "light";
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(THEME_KEY, theme);
    updateThemeToggleIcons(theme);
  }

  function updateThemeToggleIcons(theme) {
    const toggleBtns = document.querySelectorAll(".theme-toggle-btn");
    toggleBtns.forEach(btn => {
      const sunIcon = btn.querySelector(".icon-sun");
      const moonIcon = btn.querySelector(".icon-moon");
      const textLabel = btn.querySelector(".theme-label");

      if (theme === "dark") {
        if (sunIcon) sunIcon.classList.remove("hidden");
        if (moonIcon) moonIcon.classList.add("hidden");
        if (textLabel) textLabel.textContent = "Light";
      } else {
        if (sunIcon) sunIcon.classList.add("hidden");
        if (moonIcon) moonIcon.classList.remove("hidden");
        if (textLabel) textLabel.textContent = "Dark";
      }
    });
  }

  applyTheme(getStoredTheme());

  document.addEventListener("DOMContentLoaded", () => {
    updateThemeToggleIcons(getStoredTheme());

    document.querySelectorAll(".theme-toggle-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const current = getStoredTheme();
        const next = current === "dark" ? "light" : "dark";
        applyTheme(next);
      });
    });
  });

  window.UniSportTheme = {
    apply: applyTheme,
    get: getStoredTheme
  };
})();
