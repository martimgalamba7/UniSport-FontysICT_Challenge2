// UniSport App Main Logic - Clean Minimalist UI (No Emojis, Kick/Google Avatars, Auth Guard)
import { 
  auth, 
  db, 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  onAuthStateChanged 
} from "./firebase-config.js";

import { 
  signOutStudent, 
  getStudentProfile, 
  updateStudentProfile,
  getActiveSession,
  setActiveSession,
  sanitize 
} from "./auth.js";

import { getAvatarById } from "./avatars.js";

// Application State
const state = {
  currentUser: null,
  userProfile: null,
  activities: [],
  activeTab: "feed", // "feed" | "create" | "my-activities" | "profile"
  filterSport: "all",
  searchQuery: "",
  selectedActivity: null
};

// Sports list styling without emojis
export const SPORTS_CONFIG = {
  "Football": { badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  "Gym": { badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  "Gym & Fitness": { badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  "Running": { badge: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20" },
  "Basketball": { badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
  "Bouldering": { badge: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20" },
  "Padel": { badge: "bg-lime-500/10 text-lime-700 dark:text-lime-400 border-lime-500/20" },
  "Padel / Tennis": { badge: "bg-lime-500/10 text-lime-700 dark:text-lime-400 border-lime-500/20" },
  "Volleyball": { badge: "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20" },
  "Other": { badge: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20" }
};

// Seed activities for Eindhoven student community
const INITIAL_DEMO_ACTIVITIES = [
  {
    id: "demo-1",
    sport: "Football",
    title: "Casual 5v5 Match at SSC Field 1",
    location: "Student Sports Centre (SSC) Eindhoven",
    distance: "On Campus (Fontys / TU/e)",
    dateTime: "Tomorrow, 18:30",
    maxParticipants: 10,
    creatorId: "fontys-student-rep",
    creatorName: "Thomas van Dijk",
    creatorUniversity: "Fontys UAS",
    description: "Looking for 10 players for a fun, relaxed game after lectures. All skill levels welcome! Bring white or dark shirts.",
    participants: [
      { uid: "fontys-student-rep", name: "Thomas van Dijk", university: "Fontys UAS", avatarId: "footballer" },
      { uid: "demo-p1", name: "Sara Martins", university: "TU Eindhoven", avatarId: "runner" },
      { uid: "demo-p2", name: "Lars Bakker", university: "Fontys UAS", avatarId: "bodybuilder" },
      { uid: "demo-p3", name: "Elena Costa", university: "Fontys UAS", avatarId: "runner" }
    ],
    createdAt: Date.now() - 3600000
  },
  {
    id: "demo-2",
    sport: "Running",
    title: "5km Sunset Run along Dommel",
    location: "Genneper Parken (Meet at Entrance)",
    distance: "1.2 km from Fontys Rachelsmolen",
    dateTime: "Thursday, 19:00",
    maxParticipants: 8,
    creatorId: "tue-runner-rep",
    creatorName: "Sophie de Vries",
    creatorUniversity: "TU Eindhoven",
    description: "Pace around 5:30 min/km. Great way to de-stress before exam week. Coffee afterwards at Strijp-S!",
    participants: [
      { uid: "tue-runner-rep", name: "Sophie de Vries", university: "TU Eindhoven", avatarId: "runner" },
      { uid: "demo-p4", name: "Ruben V.", university: "Fontys UAS", avatarId: "footballer" },
      { uid: "demo-p5", name: "Noor Janssen", university: "TU Eindhoven", avatarId: "bodybuilder" }
    ],
    createdAt: Date.now() - 7200000
  },
  {
    id: "demo-3",
    sport: "Bouldering",
    title: "Evening Session @ Monk Bouldergym",
    location: "Monk Bouldergym (Strijp-S)",
    distance: "2.1 km from Fontys Rachelsmolen",
    dateTime: "Friday, 17:45",
    maxParticipants: 6,
    creatorId: "climb-lover",
    creatorName: "Matas K.",
    creatorUniversity: "Fontys UAS",
    description: "Working on 5C-6B circuits. Beginners welcome to tag along! We can share tips and chalk.",
    participants: [
      { uid: "climb-lover", name: "Matas K.", university: "Fontys UAS", avatarId: "bodybuilder" },
      { uid: "demo-p6", name: "Anouk S.", university: "TU Eindhoven", avatarId: "runner" }
    ],
    createdAt: Date.now() - 10800000
  },
  {
    id: "demo-4",
    sport: "Gym & Fitness",
    title: "Upper Body & Bench Press Partner Needed",
    location: "Basic-Fit Eindhoven Centrum",
    distance: "0.8 km from Station",
    dateTime: "Wednesday, 16:30",
    maxParticipants: 2,
    creatorId: "gym-bro",
    creatorName: "Liam O'Connor",
    creatorUniversity: "Fontys UAS",
    description: "Need someone to spot heavy sets and push each other. Chest and back day focus.",
    participants: [
      { uid: "gym-bro", name: "Liam O'Connor", university: "Fontys UAS", avatarId: "bodybuilder" }
    ],
    createdAt: Date.now() - 14400000
  }
];

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return "Upcoming";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today at ${time}`;
    return `${d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at ${time}`;
  } catch {
    return dateStr;
  }
}

/**
 * Initializes App
 */
export function initApp() {
  // Pre-seed activities so feed renders instantly
  state.activities = INITIAL_DEMO_ACTIVITIES;

  // REQUIRE LOGIN: If not logged in, redirect directly to login page
  const session = getActiveSession();
  if (!session) {
    window.location.href = "./login.html";
    return;
  }

  // IMMEDIATELY update UI with session data before anything else
  updateAuthUI(session, session);

  try { setupNavigation(); } catch (e) { console.error("setupNav:", e); }
  try { setupRosterModal(); } catch (e) { console.error("setupRoster:", e); }
  try { setupCreateForm(); } catch (e) { console.error("setupCreate:", e); }
  try { setupProfileForm(); } catch (e) { console.error("setupProfile:", e); }
  try { setupFilterSearch(); } catch (e) { console.error("setupFilter:", e); }
  try { renderFeed(); } catch (e) { console.error("renderFeed:", e); }

  listenToAuthChanges();
  listenToActivities();
}

/**
 * Updates UI with Google-style avatar in the top right
 */
function updateAuthUI(user, profile) {
  state.currentUser = user;
  state.userProfile = profile || user;

  const authStatusPill = document.getElementById("auth-status-pill");
  const navAuthBtn = document.getElementById("nav-auth-btn");
  const googleAvatarBtn = document.getElementById("google-avatar-btn");
  const avatarInner = document.getElementById("google-avatar-inner");
  const userDropdown = document.getElementById("user-dropdown");

  if (user) {
    const email = user.email || state.userProfile?.email || "";
    const displayName = state.userProfile?.displayName || user.displayName || (email ? email.split("@")[0] : "Student");
    const uni = state.userProfile?.university || (email.endsWith("@student.tue.nl") ? "TU Eindhoven" : "Fontys UAS");
    const avatarId = state.userProfile?.avatarId || user.avatarId || "bodybuilder";
    const avatar = getAvatarById(avatarId);

    // Force hide Sign in button
    if (navAuthBtn) {
      navAuthBtn.classList.add("hidden");
      navAuthBtn.style.setProperty("display", "none", "important");
    }

    // Force show Google-style circular avatar in top right
    if (googleAvatarBtn && avatarInner) {
      avatarInner.className = `w-full h-full rounded-full overflow-hidden bg-gradient-to-tr ${avatar.bg} flex items-center justify-center text-white`;
      avatarInner.innerHTML = avatar.svg;
      googleAvatarBtn.classList.remove("hidden");
      googleAvatarBtn.style.setProperty("display", "inline-flex", "important");
    }

    if (userDropdown) {
      const dropName = document.getElementById("dropdown-name");
      const dropEmail = document.getElementById("dropdown-email");
      if (dropName) dropName.textContent = displayName;
      if (dropEmail) dropEmail.textContent = email;
    }

    if (authStatusPill) {
      authStatusPill.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="font-medium text-zinc-900 dark:text-white">${escapeHtml(displayName)}</span>
        <span class="text-[10px] uppercase font-bold text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800">${uni.includes("TU") ? "TU/e" : "Fontys"}</span>
      `;
      authStatusPill.classList.remove("hidden");
      authStatusPill.style.setProperty("display", "inline-flex", "important");
    }

    try {
      populateProfileTab();
    } catch (e) {
      console.warn("populateProfile error:", e);
    }
  } else {
    // If auth is completely lost, redirect to login
    window.location.href = "./login.html";
  }
}

function listenToAuthChanges() {
  const activeSession = getActiveSession();
  if (!activeSession) {
    window.location.href = "./login.html";
    return;
  }

  try {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profile = await getStudentProfile(user.uid);
          const merged = { ...activeSession, ...profile, uid: user.uid, email: user.email };
          setActiveSession(merged);
          updateAuthUI(merged, merged);
        } catch (err) {
          console.warn("Could not fetch remote profile, keeping active session:", err);
        }
      }
    });
  } catch (e) {
    console.warn("onAuthStateChanged error:", e);
  }
}

function setupNavigation() {
  const tabs = ["feed", "create", "my-activities", "profile"];
  
  tabs.forEach(tabId => {
    const btn = document.getElementById(`tab-btn-${tabId}`);
    const mobileBtn = document.getElementById(`mobile-tab-${tabId}`);
    
    const clickHandler = () => switchTab(tabId);
    if (btn) btn.addEventListener("click", clickHandler);
    if (mobileBtn) mobileBtn.addEventListener("click", clickHandler);
  });

  // Google avatar dropdown toggle
  const avatarBtn = document.getElementById("google-avatar-btn");
  const dropdown = document.getElementById("user-dropdown");
  if (avatarBtn && dropdown) {
    avatarBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", () => {
      dropdown.classList.add("hidden");
    });
  }
}

export function switchTab(targetTab) {
  state.activeTab = targetTab;
  const tabs = ["feed", "create", "my-activities", "profile"];

  tabs.forEach(t => {
    const section = document.getElementById(`section-${t}`);
    const deskBtn = document.getElementById(`tab-btn-${t}`);
    const mobBtn = document.getElementById(`mobile-tab-${t}`);

    if (t === targetTab) {
      if (section) section.classList.remove("hidden");
      if (deskBtn) {
        deskBtn.classList.add("bg-zinc-950", "text-white", "dark:bg-white", "dark:text-zinc-950");
        deskBtn.classList.remove("text-zinc-600", "dark:text-zinc-400");
      }
      if (mobBtn) {
        mobBtn.classList.add("text-zinc-950", "dark:text-white");
        mobBtn.classList.remove("text-zinc-400");
      }
    } else {
      if (section) section.classList.add("hidden");
      if (deskBtn) {
        deskBtn.classList.remove("bg-zinc-950", "text-white", "dark:bg-white", "dark:text-zinc-950");
        deskBtn.classList.add("text-zinc-600", "dark:text-zinc-400");
      }
      if (mobBtn) {
        mobBtn.classList.remove("text-zinc-950", "dark:text-white");
        mobBtn.classList.add("text-zinc-400");
      }
    }
  });

  if (targetTab === "my-activities") {
    renderMyActivities();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function listenToActivities() {
  try {
    const q = query(collection(db, "activities"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });

      if (items.length > 0) {
        state.activities = items;
      } else {
        state.activities = INITIAL_DEMO_ACTIVITIES;
      }
      renderFeed();
    }, (error) => {
      state.activities = INITIAL_DEMO_ACTIVITIES;
      renderFeed();
    });
  } catch (err) {
    state.activities = INITIAL_DEMO_ACTIVITIES;
    renderFeed();
  }
}

export function renderFeed() {
  const container = document.getElementById("activities-feed");
  const countBadge = document.getElementById("activity-count-badge");
  if (!container) return;

  let filtered = [...state.activities];

  if (state.filterSport && state.filterSport !== "all") {
    filtered = filtered.filter(a => (a.sport || "").toLowerCase().includes(state.filterSport.toLowerCase()));
  }

  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(a => 
      (a.title || "").toLowerCase().includes(q) ||
      (a.location || "").toLowerCase().includes(q) ||
      (a.sport || "").toLowerCase().includes(q) ||
      (a.description || "").toLowerCase().includes(q)
    );
  }

  if (countBadge) {
    countBadge.textContent = `${filtered.length} active sessions in Eindhoven`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 px-6 text-center rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800">
        <h3 class="text-base font-bold text-zinc-950 dark:text-white mb-1">No sports sessions found</h3>
        <p class="text-zinc-500 dark:text-zinc-400 text-xs max-w-sm mx-auto mb-4">Be the first student to create a session in Eindhoven.</p>
        <button onclick="window.UniSport.switchTab('create')" class="px-4 py-2 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold transition">
          Create Session
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(activity => {
    const sportInfo = SPORTS_CONFIG[activity.sport] || SPORTS_CONFIG["Other"];
    const participants = activity.participants || [];
    const max = parseInt(activity.maxParticipants, 10) || 10;
    const spotsLeft = Math.max(0, max - participants.length);
    const isFull = spotsLeft === 0;
    const isJoined = state.currentUser && participants.some(p => p.uid === state.currentUser.uid);

    return `
      <article class="relative flex flex-col justify-between rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/90 p-5 transition duration-200 hover:border-zinc-400 dark:hover:border-zinc-700">
        <div>
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${sportInfo.badge}">
              ${escapeHtml(activity.sport)}
            </span>

            <span class="text-xs font-semibold px-2 py-0.5 rounded-md ${isFull ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}">
              ${isFull ? 'Full' : `${spotsLeft} spots left`}
            </span>
          </div>

          <h3 class="text-base font-bold text-zinc-950 dark:text-white mb-2 leading-snug">
            ${escapeHtml(activity.title)}
          </h3>

          <div class="space-y-1 text-xs text-zinc-500 dark:text-zinc-400 mb-3">
            <div class="flex items-center gap-1.5 truncate">
              <span class="font-medium text-zinc-700 dark:text-zinc-300">${escapeHtml(activity.location)}</span>
              ${activity.distance ? `<span class="text-zinc-400 text-[11px]">(${escapeHtml(activity.distance)})</span>` : ''}
            </div>
            <div>
              <span>${escapeHtml(formatDisplayDate(activity.dateTime))}</span>
            </div>
          </div>

          ${activity.description ? `
            <p class="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-4">
              ${escapeHtml(activity.description)}
            </p>
          ` : ''}

          <!-- Roster Avatars (Google / Kick Style Icons) -->
          <div class="mb-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <div class="flex items-center justify-between text-xs mb-2">
              <span class="font-semibold text-zinc-500">Roster (${participants.length}/${max})</span>
              <button onclick="window.UniSport.openRosterModal('${activity.id}')" class="text-zinc-900 dark:text-white hover:underline text-[11px] font-semibold">
                View names &rarr;
              </button>
            </div>
            <div class="flex -space-x-1.5 overflow-hidden items-center">
              ${participants.slice(0, 5).map(p => {
                const av = getAvatarById(p.avatarId || "bolt");
                return `
                  <div class="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-tr ${av.bg} border-2 border-white dark:border-zinc-900 text-white flex items-center justify-center shadow-sm" title="${escapeHtml(p.name)} (${escapeHtml(p.university || 'Student')})">
                    ${av.svg}
                  </div>
                `;
              }).join('')}
              ${participants.length > 5 ? `
                <div class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                  +${participants.length - 5}
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
          <div class="text-[11px] text-zinc-500">
            Host: <span class="font-medium text-zinc-800 dark:text-zinc-200">${escapeHtml(activity.creatorName || "Student")}</span>
          </div>

          <div>
            ${isJoined ? `
              <button onclick="window.UniSport.toggleJoinActivity('${activity.id}')" class="px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold transition">
                Leave
              </button>
            ` : `
              <button 
                onclick="window.UniSport.toggleJoinActivity('${activity.id}')" 
                ${isFull ? 'disabled' : ''}
                class="px-3.5 py-1.5 rounded-xl ${isFull ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' : 'bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950'} text-xs font-semibold transition"
              >
                ${isFull ? 'Full' : 'Join'}
              </button>
            `}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function setupFilterSearch() {
  const searchInput = document.getElementById("search-activities");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.searchQuery = sanitize(e.target.value);
      renderFeed();
    });
  }

  const chips = document.querySelectorAll(".sport-filter-chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => {
        c.className = "sport-filter-chip px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-xs font-semibold whitespace-nowrap hover:text-zinc-950 dark:hover:text-white transition";
      });

      chip.className = "sport-filter-chip px-3 py-1.5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold whitespace-nowrap transition";
      state.filterSport = chip.dataset.sport;
      renderFeed();
    });
  });
}

function setupCreateForm() {
  const form = document.getElementById("create-activity-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!state.currentUser) {
      window.location.href = "./login.html";
      return;
    }

    const title = sanitize(document.getElementById("create-title").value);
    const sport = document.getElementById("create-sport").value;
    const location = sanitize(document.getElementById("create-location").value);
    const dateTime = document.getElementById("create-datetime").value;
    const maxParticipants = parseInt(document.getElementById("create-max").value, 10);
    const description = sanitize(document.getElementById("create-desc").value);

    if (!title || !location || !dateTime) {
      alert("Please fill in all required fields.");
      return;
    }

    const creatorName = state.userProfile?.displayName || state.currentUser.displayName || "Student";
    const creatorUniversity = state.userProfile?.university || (state.currentUser.email.endsWith("@student.tue.nl") ? "TU Eindhoven" : "Fontys UAS");
    const avatarId = state.userProfile?.avatarId || state.currentUser.avatarId || "bodybuilder";

    const newActivity = {
      sport,
      title,
      location,
      distance: "Eindhoven Area",
      dateTime,
      maxParticipants: maxParticipants || 10,
      creatorId: state.currentUser.uid,
      creatorName,
      creatorUniversity,
      description,
      participants: [
        {
          uid: state.currentUser.uid,
          name: creatorName,
          university: creatorUniversity,
          avatarId: avatarId
        }
      ],
      createdAt: serverTimestamp()
    };

    const submitBtn = document.getElementById("create-submit-btn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Publishing...";

    try {
      await addDoc(collection(db, "activities"), newActivity);
      form.reset();
      switchTab("feed");
    } catch (err) {
      newActivity.id = "local-" + Date.now();
      newActivity.createdAt = Date.now();
      state.activities.unshift(newActivity);
      form.reset();
      switchTab("feed");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Publish Activity";
    }
  });
}

export async function toggleJoinActivity(activityId) {
  if (!state.currentUser) {
    window.location.href = "./login.html";
    return;
  }

  const activity = state.activities.find(a => a.id === activityId);
  if (!activity) return;

  const participants = activity.participants || [];
  const isJoined = participants.some(p => p.uid === state.currentUser.uid);
  const max = parseInt(activity.maxParticipants, 10) || 10;

  if (!isJoined && participants.length >= max) {
    alert("This activity is already full!");
    return;
  }

  const currentParticipantObj = {
    uid: state.currentUser.uid,
    name: state.userProfile?.displayName || state.currentUser.displayName || "Student",
    university: state.userProfile?.university || (state.currentUser.email.endsWith("@student.tue.nl") ? "TU Eindhoven" : "Fontys UAS"),
    avatarId: state.userProfile?.avatarId || state.currentUser.avatarId || "bodybuilder"
  };

  try {
    const actRef = doc(db, "activities", activityId);
    if (isJoined) {
      const itemToRemove = participants.find(p => p.uid === state.currentUser.uid) || currentParticipantObj;
      await updateDoc(actRef, {
        participants: arrayRemove(itemToRemove)
      });
    } else {
      await updateDoc(actRef, {
        participants: arrayUnion(currentParticipantObj)
      });
    }
  } catch (err) {
    if (isJoined) {
      activity.participants = participants.filter(p => p.uid !== state.currentUser.uid);
    } else {
      activity.participants.push(currentParticipantObj);
    }
    renderFeed();
  }
}

function renderMyActivities() {
  const container = document.getElementById("my-activities-list");
  if (!container) return;

  const myActivities = state.activities.filter(a => {
    const isJoined = (a.participants || []).some(p => p.uid === state.currentUser.uid);
    const isCreator = a.creatorId === state.currentUser.uid;
    return isJoined || isCreator;
  });

  if (myActivities.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-8">
        <h4 class="text-zinc-950 dark:text-white font-bold text-base mb-1">No registered activities yet</h4>
        <p class="text-zinc-500 dark:text-zinc-400 text-xs mb-4">Explore the feed to find sports sessions matching your schedule in Eindhoven.</p>
        <button onclick="window.UniSport.switchTab('feed')" class="px-4 py-2 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs">
          Browse Feed
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = myActivities.map(a => {
    const isCreator = a.creatorId === state.currentUser.uid;
    const sportInfo = SPORTS_CONFIG[a.sport] || SPORTS_CONFIG["Other"];
    return `
      <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-bold text-zinc-500 uppercase tracking-wider">${escapeHtml(a.sport)}</span>
            ${isCreator ? `<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">Hosted by you</span>` : ''}
          </div>
          <h4 class="text-sm font-bold text-zinc-950 dark:text-white mb-0.5">${escapeHtml(a.title)}</h4>
          <p class="text-xs text-zinc-500 dark:text-zinc-400">${escapeHtml(a.location)} • ${escapeHtml(formatDisplayDate(a.dateTime))}</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="window.UniSport.openRosterModal('${a.id}')" class="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-medium text-zinc-900 dark:text-white transition">
            Roster (${(a.participants || []).length}/${a.maxParticipants})
          </button>
          <button onclick="window.UniSport.toggleJoinActivity('${a.id}')" class="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 text-xs font-semibold transition">
            Leave
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function populateProfileTab() {
  if (!state.userProfile && !state.currentUser) return;
  const nameInput = document.getElementById("profile-name");
  const emailInput = document.getElementById("profile-email");
  const uniInput = document.getElementById("profile-university");

  if (nameInput) nameInput.value = state.userProfile?.displayName || "";
  if (emailInput) emailInput.value = state.currentUser?.email || "";
  if (uniInput) uniInput.value = state.userProfile?.university || "";
}

function setupProfileForm() {
  const form = document.getElementById("profile-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!state.currentUser) return;

      const displayName = sanitize(document.getElementById("profile-name").value);
      const btn = document.getElementById("profile-save-btn");
      btn.disabled = true;
      btn.textContent = "Saving...";

      await updateStudentProfile(state.currentUser.uid, { displayName });
      btn.disabled = false;
      btn.textContent = "Save Profile";
      alert("Profile updated successfully!");
    });
  }

  const signOutBtn = document.getElementById("profile-signout-btn");
  const dropdownSignOut = document.getElementById("dropdown-signout-btn");

  const handleSignOut = async () => {
    await signOutStudent();
    window.location.href = "./login.html";
  };

  if (signOutBtn) signOutBtn.addEventListener("click", handleSignOut);
  if (dropdownSignOut) dropdownSignOut.addEventListener("click", handleSignOut);
}

function setupRosterModal() {
  const closeRosterBtn = document.getElementById("roster-modal-close");
  if (closeRosterBtn) {
    closeRosterBtn.addEventListener("click", () => {
      document.getElementById("roster-modal").classList.add("hidden");
    });
  }
}

export function openRosterModal(activityId) {
  const modal = document.getElementById("roster-modal");
  const content = document.getElementById("roster-modal-list");
  const title = document.getElementById("roster-modal-title");
  const activity = state.activities.find(a => a.id === activityId);

  if (!activity || !modal || !content) return;

  title.textContent = activity.title;
  const participants = activity.participants || [];

  content.innerHTML = participants.map((p, idx) => {
    const av = getAvatarById(p.avatarId || "bodybuilder");
    return `
      <div class="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-tr ${av.bg} flex items-center justify-center text-white shadow-sm">
            ${av.svg}
          </div>
          <div>
            <p class="text-xs font-semibold text-zinc-950 dark:text-white">${escapeHtml(p.name)}</p>
            <p class="text-[11px] text-zinc-500">${escapeHtml(p.university || 'Student')}</p>
          </div>
        </div>
        <span class="text-[11px] font-semibold text-zinc-400">#${idx + 1}</span>
      </div>
    `;
  }).join('');

  modal.classList.remove("hidden");
}

window.UniSport = {
  switchTab,
  openRosterModal,
  toggleJoinActivity
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
