/* ==========================================================================
   WELCOME CONFIRMATION & REDIRECT CONTROLLER
   UniSport • Eindhoven Student Sports Community
   ========================================================================== */

import { getActiveSession, signOutStudent } from "./auth.js";
import { getAvatarById } from "./avatars.js";

// Initialize Lucide Icons
function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}
refreshIcons();

const titleEl = document.getElementById("welcome-title");
const subtitleEl = document.getElementById("welcome-subtitle");
const badgeTextEl = document.getElementById("welcome-badge-text");
const avatarInner = document.getElementById("user-avatar-inner");
const uniTextEl = document.getElementById("chip-uni-text");
const sportTextEl = document.getElementById("chip-sport-text");
const progressBar = document.getElementById("welcome-progress-bar");
const progressPct = document.getElementById("welcome-progress-pct");
const syncText = document.getElementById("welcome-sync-text");
const switchAccountBtn = document.getElementById("btn-switch-account");

// Wire Switch Account / Sign Out
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
  // No active session found, redirect to login
  window.location.href = "./login.html";
} else {
  // Determine if this is a first-time registration or returning login
  const urlParams = new URLSearchParams(window.location.search);
  const isNewRegistration = urlParams.get("mode") === "new";

  const rawName = session.displayName || session.name || session.email.split("@")[0];
  const firstName = rawName.split(" ")[0];

  if (isNewRegistration) {
    if (badgeTextEl) badgeTextEl.textContent = "Registration Complete";
    if (titleEl) titleEl.textContent = `Welcome to UniSport, ${firstName}!`;
    if (subtitleEl) subtitleEl.textContent = "Your Eindhoven student sports pass is ready.";
  } else {
    if (badgeTextEl) badgeTextEl.textContent = "Authenticated";
    if (titleEl) titleEl.textContent = `Welcome back, ${firstName}!`;
    if (subtitleEl) subtitleEl.textContent = "Preparing your Eindhoven match feed...";
  }

  // Set University Chip
  const uni = session.university || (session.email.endsWith("@student.tue.nl") ? "TU Eindhoven" : "Fontys UAS");
  if (uniTextEl) uniTextEl.textContent = uni;

  // Set Sport Chip
  const sport = session.sport || (Array.isArray(session.sports) && session.sports.length > 0 ? session.sports[0] : "Football");
  if (sportTextEl) sportTextEl.textContent = sport;

  // Set Avatar
  const avatar = getAvatarById(session.avatarId || "bodybuilder");
  if (avatarInner) {
    avatarInner.className = `w-full h-full rounded-full overflow-hidden bg-gradient-to-tr ${avatar.bg || "from-zinc-800 to-zinc-950"} flex items-center justify-center text-white`;
    avatarInner.innerHTML = avatar.svg;
  }

  refreshIcons();

  // Progress Bar Simulation & Smooth Redirect (2.4s total)
  let progress = 0;
  const targetDuration = 2200; // ms
  const interval = 50; // ms
  const step = 100 / (targetDuration / interval);

  const timer = setInterval(() => {
    progress = Math.min(100, progress + step);
    const rounded = Math.round(progress);

    if (progressBar) progressBar.style.width = `${rounded}%`;
    if (progressPct) progressPct.textContent = `${rounded}%`;

    if (syncText) {
      if (rounded < 35) {
        syncText.textContent = "Connecting to student network...";
      } else if (rounded < 75) {
        syncText.textContent = "Syncing live match rosters...";
      } else if (rounded < 98) {
        syncText.textContent = "Ready! Launching dashboard...";
      } else {
        syncText.textContent = "Entering UniSport...";
      }
    }

    if (progress >= 100) {
      clearInterval(timer);
      setTimeout(() => {
        // Redirect to main web app
        window.location.href = "./index.html";
      }, 250);
    }
  }, interval);
}
