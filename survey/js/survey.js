/* ==========================================================================
   UniSport Research Survey Controller
   ========================================================================== */

/* --- Tailwind Configuration --- */
if (typeof tailwind !== "undefined") {
  tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          sans: ["Inter", "sans-serif"]
        },
        colors: {
          brand: {
            indigo: "#4F46E5",
            orange: "#FF6B00",
            fontys: "#5C2D91"
          }
        }
      }
    }
  };
}

const GOOGLE_SHEET_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzqQQK3FfSHxbeP2lW-cf1ql26hnBr7Hp9o4owwUC0l8XXEy0Plg8VHqPoR14LGanol6Q/exec";

/* --- Survey Flow & State Management --- */
document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  let currentStep = 0;
  const totalSteps = 5;

  const screens = [
    document.getElementById("step-0"),
    document.getElementById("step-1"),
    document.getElementById("step-2"),
    document.getElementById("step-3"),
    document.getElementById("step-4"),
    document.getElementById("step-5")
  ];

  const stepIndicator = document.getElementById("step-indicator");
  const progressBarFill = document.getElementById("progress-bar-fill");

  const surveyData = {
    student_status: "",
    sports_frequency: "",
    favorite_sports: [],
    skipped_lack_of_company: "",
    obstacles: [],
    rating_quick_creation: 0,
    rating_geo_feed: 0,
    extra_features_feedback: ""
  };

  /* --- Step Navigation --- */
  function goToStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= screens.length) return;

    screens[currentStep].classList.remove("active");
    currentStep = stepIndex;
    screens[currentStep].classList.add("active");

    const progressPercentage = (currentStep / totalSteps) * 100;
    progressBarFill.style.width = `${progressPercentage}%`;

    const stepNames = [
      "Introduction",
      "Consent",
      "Section 1: Background",
      "Section 2: Problem",
      "Section 3: Features",
      "Completed"
    ];
    if (stepIndicator) {
      stepIndicator.textContent = stepNames[currentStep] || "";
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  document.getElementById("btn-start-survey").addEventListener("click", () => goToStep(1));

  const consentInput = document.getElementById("consent-input");
  const btnConsentNext = document.getElementById("btn-consent-next");

  consentInput.addEventListener("change", (e) => {
    btnConsentNext.disabled = !e.target.checked;
  });

  btnConsentNext.addEventListener("click", () => {
    if (consentInput.checked) goToStep(2);
  });

  /* --- Question Option Selection --- */
  document.querySelectorAll(".option-card").forEach(card => {
    card.addEventListener("click", () => {
      const group = card.getAttribute("data-group");
      const value = card.getAttribute("data-value");

      if (group === "favorite_sports" || group === "obstacles") {
        card.classList.toggle("selected");
        const checkIcon = card.querySelector(".card-check i");
        if (card.classList.contains("selected")) {
          if (checkIcon) checkIcon.classList.remove("opacity-0");
          if (!surveyData[group].includes(value)) surveyData[group].push(value);
        } else {
          if (checkIcon) checkIcon.classList.add("opacity-0");
          surveyData[group] = surveyData[group].filter(v => v !== value);
        }

        if (card.id === "other-sport-card") {
          const otherBox = document.getElementById("other-sport-input-box");
          if (card.classList.contains("selected")) {
            otherBox.classList.remove("hidden");
            document.getElementById("other_sport_text").focus();
          } else {
            otherBox.classList.add("hidden");
          }
        }
      } else {
        document.querySelectorAll(`.option-card[data-group="${group}"]`).forEach(c => {
          c.classList.remove("selected");
          const ic = c.querySelector(".card-check i");
          if (ic) ic.classList.add("opacity-0");
        });

        card.classList.add("selected");
        const checkIcon = card.querySelector(".card-check i");
        if (checkIcon) checkIcon.classList.remove("opacity-0");
        surveyData[group] = value;
      }
    });
  });

  document.querySelectorAll(".rating-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const group = btn.getAttribute("data-group");
      const value = parseInt(btn.getAttribute("data-value"), 10);

      document.querySelectorAll(`.rating-btn[data-group="${group}"]`).forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      surveyData[group] = value;
    });
  });

  /* --- Section Validation & Submission --- */
  document.getElementById("btn-step2-next").addEventListener("click", () => {
    if (!surveyData.student_status) {
      alert("Please answer question 1 regarding your student status.");
      return;
    }
    if (!surveyData.sports_frequency) {
      alert("Please answer question 2 regarding your sports frequency.");
      return;
    }
    if (surveyData.favorite_sports.length === 0) {
      alert("Please select at least one favorite sport in question 3.");
      return;
    }
    goToStep(3);
  });

  document.getElementById("btn-step3-next").addEventListener("click", () => {
    if (!surveyData.skipped_lack_of_company) {
      alert("Please answer question 4 regarding sports participation.");
      return;
    }
    if (surveyData.obstacles.length === 0) {
      alert("Please select at least one obstacle in question 5.");
      return;
    }
    goToStep(4);
  });

  document.getElementById("btn-submit-survey").addEventListener("click", async () => {
    if (!surveyData.rating_quick_creation) {
      alert("Please provide a rating for question 6.");
      return;
    }
    if (!surveyData.rating_geo_feed) {
      alert("Please provide a rating for question 7.");
      return;
    }

    const otherText = document.getElementById("other_sport_text")?.value.trim();
    let formattedSports = [...surveyData.favorite_sports];
    if (formattedSports.includes("Other") && otherText) {
      formattedSports = formattedSports.map(s => s === "Other" ? `Other (${otherText})` : s);
    }

    const responseId = "UNISPORT-" + Math.floor(1000 + Math.random() * 9000);
    const payload = {
      response_id: responseId,
      timestamp: new Date().toISOString(),
      student_status: surveyData.student_status,
      sports_frequency: surveyData.sports_frequency,
      favorite_sports: formattedSports,
      skipped_lack_of_company: surveyData.skipped_lack_of_company,
      obstacles: surveyData.obstacles,
      feature_quick_creation_rating: surveyData.rating_quick_creation,
      feature_geo_feed_rating: surveyData.rating_geo_feed,
      extra_features_feedback: document.getElementById("extra_features_input").value.trim()
    };

    const submitBtn = document.getElementById("btn-submit-survey");
    document.getElementById("submit-text").textContent = "Submitting...";
    submitBtn.disabled = true;

    try {
      if (GOOGLE_SHEET_WEBAPP_URL && GOOGLE_SHEET_WEBAPP_URL.startsWith("https://script.google.com")) {
        fetch(GOOGLE_SHEET_WEBAPP_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload)
        }).catch(e => console.log(e));
      }
      const existing = JSON.parse(localStorage.getItem("unisport_survey_responses") || "[]");
      existing.push(payload);
      localStorage.setItem("unisport_survey_responses", JSON.stringify(existing));
    } catch (err) {
      console.warn(err);
    }

    setTimeout(() => {
      document.getElementById("final-response-id").textContent = `#${responseId}`;
      goToStep(5);
    }, 400);
  });

  document.querySelectorAll(".btn-prev-step").forEach(btn => {
    btn.addEventListener("click", () => {
      goToStep(currentStep - 1);
    });
  });

  document.getElementById("btn-restart-survey").addEventListener("click", () => {
    location.reload();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      if (currentStep === 0) goToStep(1);
      else if (currentStep === 1 && consentInput.checked) goToStep(2);
    }
  });

  /* --- Localization & Language Switcher --- */
  const dropdownTrigger = document.getElementById("lang-dropdown-trigger");
  const dropdownMenu = document.getElementById("lang-dropdown-menu");
  const dropdownChevron = document.getElementById("lang-chevron");
  const currentLangLabel = document.getElementById("current-lang-label");

  function toggleDropdown(show) {
    if (!dropdownMenu) return;
    const isOpen = show !== undefined ? show : !dropdownMenu.classList.contains("open");
    dropdownMenu.classList.toggle("open", isOpen);
    if (dropdownChevron) {
      dropdownChevron.style.transform = isOpen ? "rotate(180deg)" : "rotate(0deg)";
    }
  }

  if (dropdownTrigger && dropdownMenu) {
    dropdownTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDropdown();
    });

    document.addEventListener("click", (e) => {
      if (!document.getElementById("lang-dropdown-wrapper")?.contains(e.target)) {
        toggleDropdown(false);
      }
    });
  }

  const countryToLang = {
    "PT": "pt", "BR": "pt", "AO": "pt", "MZ": "pt", "CV": "pt", "GW": "pt", "ST": "pt", "TL": "pt", "MO": "pt",
    "ES": "es", "MX": "es", "AR": "es", "CO": "es", "CL": "es", "PE": "es", "VE": "es", "EC": "es", "GT": "es", "CU": "es", "BO": "es", "DO": "es", "HN": "es", "PY": "es", "SV": "es", "NI": "es", "CR": "es", "PA": "es", "UY": "es",
    "FR": "fr", "MC": "fr", "SN": "fr", "CI": "fr", "ML": "fr", "CD": "fr", "CG": "fr", "GA": "fr", "GN": "fr", "TG": "fr", "BJ": "fr", "NE": "fr", "BF": "fr", "MG": "fr", "CM": "fr",
    "NL": "nl", "SR": "nl", "CW": "nl", "AW": "nl", "SX": "nl",
    "DE": "de", "AT": "de", "LI": "de",
    "SA": "ar", "AE": "ar", "EG": "ar", "IQ": "ar", "JO": "ar", "KW": "ar", "LB": "ar", "OM": "ar", "QA": "ar", "SY": "ar", "YE": "ar", "BH": "ar", "LY": "ar", "SD": "ar", "DZ": "ar", "MA": "ar", "TN": "ar",
    "RU": "ru", "BY": "ru", "KZ": "ru", "KG": "ru",
    "CN": "zh-CN", "TW": "zh-CN", "HK": "zh-CN", "SG": "zh-CN"
  };

  const supportedLangs = ["pt", "es", "en", "fr", "nl", "de", "ar", "ru", "zh-CN"];

  function setTransCookie(langCode) {
    if (langCode === "en" || !langCode) {
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=" + window.location.hostname + "; path=/;";
      const parts = window.location.hostname.split(".");
      if (parts.length > 1) {
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=." + parts.slice(-2).join(".") + "; path=/;";
      }
    } else {
      document.cookie = `googtrans=/en/${langCode}; path=/;`;
      document.cookie = `googtrans=/en/${langCode}; domain=${window.location.hostname}; path=/;`;
      const parts = window.location.hostname.split(".");
      if (parts.length > 1) {
        document.cookie = `googtrans=/en/${langCode}; domain=.` + parts.slice(-2).join(".") + `; path=/;`;
      }
    }
  }

  function getSyncLanguage() {
    const savedChoice = localStorage.getItem("unisport_user_selected_lang");
    if (savedChoice && supportedLangs.includes(savedChoice)) {
      return savedChoice;
    }
    try {
      const navLangs = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || navigator.userLanguage || ""];
      for (const loc of navLangs) {
        if (!loc) continue;
        const code = loc.toLowerCase().trim();
        if (code.startsWith("pt")) return "pt";
        if (code.startsWith("es")) return "es";
        if (code.startsWith("fr")) return "fr";
        if (code.startsWith("nl")) return "nl";
        if (code.startsWith("de")) return "de";
        if (code.startsWith("ar")) return "ar";
        if (code.startsWith("ru")) return "ru";
        if (code.startsWith("zh")) return "zh-CN";
        if (code.startsWith("en")) return "en";
      }
    } catch (e) {}
    return "en";
  }

  async function detectGeoLanguage() {
    const manual = localStorage.getItem("unisport_user_selected_lang");
    if (manual && supportedLangs.includes(manual)) {
      return manual;
    }

    try {
      const res = await fetch("https://api.country.is", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const country = (data && data.country) ? data.country.toUpperCase() : "";
        if (countryToLang[country]) return countryToLang[country];
        if (country === "BE") {
          const bl = (navigator.language || "").toLowerCase();
          return bl.startsWith("fr") ? "fr" : "nl";
        }
        if (country === "CH") {
          const bl = (navigator.language || "").toLowerCase();
          return bl.startsWith("fr") ? "fr" : (bl.startsWith("it") ? "en" : (bl.startsWith("de") ? "de" : "en"));
        }
        if (country === "LU") {
          const bl = (navigator.language || "").toLowerCase();
          return bl.startsWith("de") ? "de" : "fr";
        }
      }
    } catch (err) {
      try {
        const res2 = await fetch("https://get.geojs.io/v1/ip/country.json", { cache: "no-store" });
        if (res2.ok) {
          const data2 = await res2.json();
          const country = (data2 && data2.country) ? data2.country.toUpperCase() : "";
          if (countryToLang[country]) return countryToLang[country];
        }
      } catch (e2) {}
    }

    return getSyncLanguage();
  }

  function formatLangBadge(code) {
    if (!code) return "EN";
    if (code === "zh-CN") return "ZH";
    return code.toUpperCase();
  }

  window.setLanguage = function (langCode, isManual = true) {
    if (isManual) {
      localStorage.setItem("unisport_user_selected_lang", langCode);
    }

    if (currentLangLabel) {
      currentLangLabel.textContent = formatLangBadge(langCode);
    }

    document.querySelectorAll(".lang-option").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === langCode);
    });

    toggleDropdown(false);
    setTransCookie(langCode);

    let attempts = 0;
    const maxAttempts = 35;
    const syncInterval = setInterval(() => {
      attempts++;
      const select = document.querySelector(".goog-te-combo");
      if (select) {
        if (langCode === "en") {
          select.value = "";
          select.dispatchEvent(new Event("change", { bubbles: true }));
        } else {
          select.value = langCode;
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }

        const isTranslated = document.documentElement.classList.contains("translated-ltr") ||
                             document.documentElement.classList.contains("translated-rtl") ||
                             document.body.classList.contains("translated-ltr");

        if ((langCode !== "en" && isTranslated) || (langCode === "en" && !isTranslated) || attempts >= maxAttempts) {
          clearInterval(syncInterval);
        }
      } else if (attempts >= maxAttempts) {
        clearInterval(syncInterval);
      }
    }, 150);
  };

  const initialSyncLang = getSyncLanguage();
  setTransCookie(initialSyncLang);
  if (currentLangLabel) currentLangLabel.textContent = formatLangBadge(initialSyncLang);
  document.querySelectorAll(".lang-option").forEach(b => {
    b.classList.toggle("active", b.getAttribute("data-lang") === initialSyncLang);
  });

  detectGeoLanguage().then(detectedLang => {
    if (detectedLang && (!localStorage.getItem("unisport_user_selected_lang") || localStorage.getItem("unisport_user_selected_lang") === detectedLang)) {
      window.setLanguage(detectedLang, false);
    }
  });

  document.querySelectorAll(".lang-option").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const lang = btn.getAttribute("data-lang");
      window.setLanguage(lang, true);
    });
  });
});

/* --- Google Translate Initialization --- */
window.googleTranslateElementInit = function () {
  new google.translate.TranslateElement({
    pageLanguage: "en",
    includedLanguages: "pt,es,en,fr,nl,de,ar,ru,zh-CN",
    autoDisplay: false
  }, "google_translate_element");

  setTimeout(() => {
    const activeOption = document.querySelector(".lang-option.active");
    const lang = activeOption ? activeOption.getAttribute("data-lang") : "en";
    if (lang && lang !== "en" && typeof window.setLanguage === "function") {
      window.setLanguage(lang, false);
    }
  }, 250);
};
