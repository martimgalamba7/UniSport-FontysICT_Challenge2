/* ==========================================================================
   404 Error Page Controller
   ========================================================================== */

if (typeof tailwind !== "undefined") {
  tailwind.config = {
    darkMode: "class",
    theme: {
      extend: {
        fontFamily: {
          sans: ['"Plus Jakarta Sans"', "Inter", "system-ui", "sans-serif"]
        }
      }
    }
  };
}

/* --- Theme Initialization --- */
(function () {
  try {
    var saved = localStorage.getItem("unisport_theme") || localStorage.getItem("unisport-theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {}
})();

/* --- Requested Path Display --- */
document.addEventListener("DOMContentLoaded", function () {
  var pill = document.getElementById("requested-url-pill");
  if (pill && window.location && window.location.pathname) {
    pill.textContent = window.location.pathname + (window.location.search || "");
  }
});
