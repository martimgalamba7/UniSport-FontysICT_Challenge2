/* ==========================================================================
   WELCOME CONFIRMATION & REDIRECT CONTROLLER
   UniSport • Eindhoven Student Sports Community
   ========================================================================== */

import { getActiveSession, signOutStudent } from "./auth.js";
import { getAvatarById } from "./avatars.js";

if (window.lucide && typeof window.lucide.createIcons === "function") {
  window.lucide.createIcons();
}

const titleEl = document.getElementById("welcome-title");
const subtitleEl = document.getElementById("welcome-subtitle");
const avatarInner = document.getElementById("user-avatar-inner");
const switchAccountBtn = document.getElementById("btn-switch-account");
const gotoBtn = document.getElementById("btn-goto-app");
const gotoBtnText = document.getElementById("btn-goto-text");
const redirectMsg = document.getElementById("welcome-redirect-msg");

function getTargetAppUrl() {
  const p = window.location.pathname || "";
  if (p.includes("/challenge2/app")) {
    return "/challenge2/app";
  }
  if (window.location.protocol === "file:") {
    return "./index.html";
  }
  return "/challenge2/unisport/app";
}

function navigateToLogin() {
  if (window.location.protocol === "file:") {
    window.location.href = "./login.html";
    return;
  }
  const p = window.location.pathname || "";
  if (p.includes("/challenge2/app")) {
    window.location.href = "/challenge2/app/login";
  } else if (p.includes("/challenge2/unisport/app")) {
    window.location.href = "/challenge2/unisport/app/login";
  } else if (p.includes("/unisport/app")) {
    window.location.href = "/unisport/app/login";
  } else {
    window.location.href = "/challenge2/app/login";
  }
}

if (switchAccountBtn) {
  switchAccountBtn.addEventListener("click", async () => {
    try {
      await signOutStudent();
    } catch {}
    navigateToLogin();
  });
}

const session = getActiveSession();

if (!session || !session.email) {
  navigateToLogin();
} else {
  const urlParams = new URLSearchParams(window.location.search);
  let isNewRegistration = urlParams.get("mode") === "new";
  try {
    if (sessionStorage.getItem("unisport_just_registered") === "true") {
      isNewRegistration = true;
      sessionStorage.removeItem("unisport_just_registered");
    }
  } catch (e) {}

  const rawName = session.displayName || session.name || session.email.split("@")[0];
  const firstName = rawName.split(" ")[0];
  const uni = session.university || (session.email.endsWith("@student.tue.nl") ? "TU Eindhoven" : "Fontys UAS");

  if (isNewRegistration) {
    if (titleEl) titleEl.textContent = `Welcome to UniSport, ${firstName}!`;
    if (subtitleEl) {
      subtitleEl.innerHTML = `
        <span class="block font-medium text-zinc-900 dark:text-zinc-100">Your account has been created.</span>
        <span class="block text-zinc-500 dark:text-zinc-400 mt-0.5">${session.email} • ${uni}</span>
      `;
    }
    if (gotoBtnText) gotoBtnText.textContent = "Get Started";
    if (redirectMsg) redirectMsg.textContent = "Taking you to Eindhoven sports sessions in a moment...";
  } else {
    if (titleEl) titleEl.textContent = `Welcome back, ${firstName}!`;
    if (subtitleEl) subtitleEl.textContent = `${session.email} • ${uni}`;
    if (gotoBtnText) gotoBtnText.textContent = "Open Web App";
    if (redirectMsg) redirectMsg.textContent = "Redirecting automatically in a moment...";
  }

  const avatar = getAvatarById(session.avatarId || "bodybuilder");
  if (avatarInner && avatar) {
    avatarInner.className = "w-full h-full rounded-full overflow-hidden flex items-center justify-center";
    avatarInner.innerHTML = avatar.svg;
  }

  const targetAppUrl = getTargetAppUrl();
  if (gotoBtn) gotoBtn.href = targetAppUrl;

  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }

  // Smooth automatic redirect to app
  setTimeout(() => {
    window.location.href = targetAppUrl;
  }, 2200);
}
