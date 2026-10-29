/* ==========================================================================
   MULTI-STEP REGISTRATION & ONBOARDING CONTROLLER
   ========================================================================== */

import { registerStudentWithPassword, validateStudentEmail } from "./auth.js";
import { UNISPORT_AVATARS } from "./avatars.js";

if (window.lucide) {
  lucide.createIcons();
}

let step = 1;
let selectedAvatarId = "bodybuilder";

const emailInp = document.getElementById("reg-email");
const passwordInp = document.getElementById("reg-password");
const togglePasswordBtn = document.getElementById("toggle-password");
const iconEye = document.getElementById("icon-eye");
const iconEyeOff = document.getElementById("icon-eye-off");
const nameInp = document.getElementById("reg-name");
const errBox = document.getElementById("reg-error");
const sportOtherBtn = document.getElementById("btn-sport-other");
const sportOtherContainer = document.getElementById("sport-other-container");
const sportOtherInput = document.getElementById("inp-sport-other");

if (togglePasswordBtn) {
  togglePasswordBtn.addEventListener("click", () => {
    const isPassword = passwordInp.type === "password";
    passwordInp.type = isPassword ? "text" : "password";
    iconEye.classList.toggle("hidden", isPassword);
    iconEyeOff.classList.toggle("hidden", !isPassword);
  });
}

function showError(msg) {
  errBox.textContent = msg;
  errBox.classList.remove("hidden");
}

function clearError() {
  errBox.classList.add("hidden");
}

/* --- Avatar Selection Grid --- */
const avatarGrid = document.getElementById("avatar-grid");
if (avatarGrid) {
  UNISPORT_AVATARS.forEach(av => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.id = av.id;
    btn.className = `avatar-btn group relative flex flex-col items-center gap-1.5 p-2 rounded-2xl border-2 transition-all ${av.id === selectedAvatarId ? "selected border-brand-orange bg-orange-500/10" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"}`;
    btn.innerHTML = `
      <div class="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-tr ${av.bg} p-0.5 shadow-md flex items-center justify-center">
        <div class="w-full h-full rounded-full overflow-hidden bg-zinc-950 flex items-center justify-center">
          ${av.svg}
        </div>
      </div>
      <span class="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate w-full text-center">${av.name}</span>
    `;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".avatar-btn").forEach(b => {
        b.classList.remove("selected", "border-brand-orange", "bg-orange-500/10");
        b.classList.add("border-zinc-200", "dark:border-zinc-800");
      });
      btn.classList.add("selected", "border-brand-orange", "bg-orange-500/10");
      btn.classList.remove("border-zinc-200", "dark:border-zinc-800");
      selectedAvatarId = av.id;
    });
    avatarGrid.appendChild(btn);
  });
}

/* --- Multi-Select Preference Chips --- */
function setupChipGroup(groupId) {
  const container = document.getElementById(groupId);
  if (!container) return;
  container.querySelectorAll(".chip-select").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("selected");
    });
  });
}

if (sportOtherBtn) {
  sportOtherBtn.addEventListener("click", () => {
    if (sportOtherBtn.classList.contains("selected")) {
      sportOtherContainer.classList.remove("hidden");
      sportOtherInput.focus();
    } else {
      sportOtherContainer.classList.add("hidden");
      sportOtherInput.value = "";
    }
  });
}

function getSelectedChips(groupId) {
  const container = document.getElementById(groupId);
  if (!container) return [];
  const selected = [];
  container.querySelectorAll(".chip-select.selected").forEach(btn => {
    if (btn.dataset.val !== "Other") {
      selected.push(btn.dataset.val);
    }
  });
  return selected;
}

setupChipGroup("group-sports");
setupChipGroup("group-social");
setupChipGroup("group-intensity");
setupChipGroup("group-schedule");
setupChipGroup("group-locations");

/* --- Step Navigation & Form Submission --- */
function updateStepUI(newStep) {
  step = newStep;
  clearError();

  document.getElementById("step-1").classList.toggle("hidden", step !== 1);
  document.getElementById("step-2").classList.toggle("hidden", step !== 2);
  document.getElementById("step-3").classList.toggle("hidden", step !== 3);

  const activeBar = "h-1 flex-1 rounded-full bg-zinc-950 dark:bg-white transition-all";
  const inactiveBar = "h-1 flex-1 rounded-full bg-zinc-200 dark:bg-zinc-800 transition-all";

  document.getElementById("bar-1").className = step >= 1 ? activeBar : inactiveBar;
  document.getElementById("bar-2").className = step >= 2 ? activeBar : inactiveBar;
  document.getElementById("bar-3").className = step >= 3 ? activeBar : inactiveBar;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.getElementById("btn-step1").addEventListener("click", () => {
  const email = emailInp.value.trim();
  const val = validateStudentEmail(email);
  if (!val.isValid) {
    showError(val.error);
    return;
  }
  const pwd = passwordInp.value;
  if (!pwd || pwd.length < 6) {
    showError("Please enter a password with at least 6 characters.");
    return;
  }
  updateStepUI(2);
});

document.getElementById("btn-back-step2").addEventListener("click", () => updateStepUI(1));
document.getElementById("btn-step2").addEventListener("click", () => {
  const name = nameInp.value.trim();
  if (!name || name.length < 2) {
    showError("Please enter your name.");
    return;
  }
  updateStepUI(3);
});

document.getElementById("btn-back-step3").addEventListener("click", () => updateStepUI(2));
document.getElementById("btn-finish").addEventListener("click", async () => {
  const sports = getSelectedChips("group-sports");
  const customSport = sportOtherInput.value.trim();
  if (customSport) {
    sports.push(customSport);
  }

  const social = getSelectedChips("group-social");
  const intensity = getSelectedChips("group-intensity");
  const schedule = getSelectedChips("group-schedule");
  const locations = getSelectedChips("group-locations");

  if (sports.length === 0) {
    showError("Please select at least one sport or type your other sport.");
    return;
  }

  const btn = document.getElementById("btn-finish");
  btn.disabled = true;
  btn.textContent = "Creating account...";

  const email = emailInp.value.trim();
  const password = passwordInp.value;
  const fullName = nameInp.value.trim();

  try {
    const res = await registerStudentWithPassword({
      email,
      password,
      fullName,
      avatarId: selectedAvatarId,
      sports,
      socialPreference: social,
      intensityPreference: intensity,
      schedulePreference: schedule,
      preferredLocations: locations
    });

    if (res.success) {
      window.location.href = "./welcome.html";
    } else {
      showError(res.error || "Unable to create account.");
      btn.disabled = false;
      btn.textContent = "Create Account";
    }
  } catch (err) {
    showError(err.message || "An unexpected error occurred.");
    btn.disabled = false;
    btn.textContent = "Create Account";
  }
});
