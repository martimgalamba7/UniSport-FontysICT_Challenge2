/* ==========================================================================
   WELCOME CONFIRMATION & REDIRECT CONTROLLER
   ========================================================================== */

import { getActiveSession } from "./auth.js";
import { getAvatarById } from "./avatars.js";

if (window.lucide) {
  lucide.createIcons();
}

const titleEl = document.getElementById("welcome-title");
const emailEl = document.getElementById("welcome-email");
const avatarInner = document.getElementById("user-avatar-inner");

const session = getActiveSession();

if (session) {
  const name = session.displayName || session.email.split("@")[0];
  titleEl.textContent = `Welcome back, ${name}!`;
  emailEl.textContent = `${session.email} • ${session.university || "Eindhoven"}`;

  const avatar = getAvatarById(session.avatarId || "bolt");
  avatarInner.className = `w-full h-full rounded-full overflow-hidden bg-gradient-to-tr ${avatar.bg} flex items-center justify-center text-white`;
  avatarInner.innerHTML = avatar.svg;

  setTimeout(() => {
    window.location.href = "/challenge2/unisport/app";
  }, 2500);
} else {
  window.location.href = "./login.html";
}
