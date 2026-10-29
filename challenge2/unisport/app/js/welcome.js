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

if (switchAccountBtn) {
  switchAccountBtn.addEventListener("click", async () => {
    try {
      await signOutStudent();
    } catch {}
    window.location.href = "./login.html";
  });
}

const session = getActiveSession();

if (!session || !session.email) {
  window.location.href = "./login.html";
} else {
  const urlParams = new URLSearchParams(window.location.search);
  const isNewRegistration = urlParams.get("mode") === "new";

  const rawName = session.displayName || session.name || session.email.split("@")[0];
  const firstName = rawName.split(" ")[0];
  const uni = session.university || (session.email.endsWith("@student.tue.nl") ? "TU Eindhoven" : "Fontys UAS");

  if (isNewRegistration) {
    if (titleEl) titleEl.textContent = `Welcome, ${firstName}!`;
    if (subtitleEl) subtitleEl.textContent = `${session.email} • ${uni}`;
  } else {
    if (titleEl) titleEl.textContent = `Welcome back, ${firstName}!`;
    if (subtitleEl) subtitleEl.textContent = `${session.email} • ${uni}`;
  }

  const avatar = getAvatarById(session.avatarId || "bodybuilder");
  if (avatarInner && avatar) {
    avatarInner.className = "w-full h-full rounded-full overflow-hidden flex items-center justify-center";
    avatarInner.innerHTML = avatar.svg;
  }

  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }

  // Smooth automatic redirect to app
  setTimeout(() => {
    window.location.href = "/challenge2/unisport/app";
  }, 2000);
}
