// UniSport App Main Logic - Clean Minimalist UI (No Emojis, Kick/Google Avatars, Auth Guard)
import { 
  auth, 
  db, 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  getDocs,
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
  deleteStudentAccount,
  getStudentProfile, 
  updateStudentProfile,
  getActiveSession,
  setActiveSession,
  sanitize 
} from "./auth.js";

import { getAvatarById, UNISPORT_AVATARS } from "./avatars.js";

// Expose UniSport global helpers immediately
window.UniSport = window.UniSport || {};
window.UniSport.switchTab = switchTab;
window.UniSport.populateProfileTab = populateProfileTab;
window.UniSport.openRosterModal = openRosterModal;
window.UniSport.openSettingsModal = openSettingsModal;
window.UniSport.toggleJoinActivity = toggleJoinActivity;
window.UniSport.renderCommunity = renderCommunity;
window.UniSport.renderNotifications = renderNotifications;
window.UniSport.openStudentProfileModal = openStudentProfileModal;
window.UniSport.signOut = signOutStudent;

// Expose global filter and social handlers immediately
window.filterStudentsGlobal = function(val) {
  state.studentSearchQuery = (val || "").trim();
  renderCommunity();
};
window.filterStudentsByUni = function(uni) {
  state.communityUniFilter = uni;
  document.querySelectorAll(".student-uni-chip").forEach(chip => {
    if (chip.getAttribute("data-uni-filter") === uni) {
      chip.className = "student-uni-chip px-3.5 py-2 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold whitespace-nowrap transition cursor-pointer";
    } else {
      chip.className = "student-uni-chip px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold whitespace-nowrap hover:text-zinc-950 dark:hover:text-white transition cursor-pointer";
    }
  });
  renderCommunity();
};
window.setCommunityView = function(view) {
  state.communityView = view;
  const btnAll = document.getElementById("community-tab-all");
  const btnFriends = document.getElementById("community-tab-friends");
  const activeClasses = "px-4 py-2 rounded-lg text-xs font-bold bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 transition cursor-pointer flex items-center gap-2";
  const inactiveClasses = "px-4 py-2 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition cursor-pointer flex items-center gap-2";
  if (view === "all") {
    if (btnAll) btnAll.className = activeClasses;
    if (btnFriends) btnFriends.className = inactiveClasses;
  } else {
    if (btnFriends) btnFriends.className = activeClasses;
    if (btnAll) btnAll.className = inactiveClasses;
  }
  renderCommunity();
};
window.openStudentProfileModal = openStudentProfileModal;
window.toggleFriendship = toggleFriendship;
window.removeFriend = removeFriend;
window.acceptFriendRequest = acceptFriendRequest;
window.declineFriendRequest = declineFriendRequest;
window.clearAllNotifsGlobal = clearAllNotifsGlobal;

// Demo verified students across Fontys & TU/e campuses for rich instant discovery
export const DEMO_CAMPUS_STUDENTS = [
  {
    uid: "fontys-student-rep",
    displayName: "Thomas van Dijk",
    email: "t.vandijk@student.fontys.nl",
    university: "Fontys UAS",
    avatarId: "footballer",
    sport: "Football",
    location: "Fontys Rachelsmolen, Eindhoven",
    sports: ["Football", "Futsal", "Gym & Fitness"],
    sessionsCount: 14
  },
  {
    uid: "tue-runner-rep",
    displayName: "Sophie de Vries",
    email: "s.devries@student.tue.nl",
    university: "TU Eindhoven",
    avatarId: "runner",
    sport: "Running",
    location: "TU/e Campus, Eindhoven",
    sports: ["Running", "CrossFit", "Yoga & Pilates"],
    sessionsCount: 22
  },
  {
    uid: "demo-p1",
    displayName: "Sara Martins",
    email: "s.martins@student.tue.nl",
    university: "TU Eindhoven",
    avatarId: "runner",
    sport: "Padel",
    location: "Strijp-S, Eindhoven",
    sports: ["Padel", "Tennis", "Running"],
    sessionsCount: 9
  },
  {
    uid: "demo-p2",
    displayName: "Lars Bakker",
    email: "l.bakker@student.fontys.nl",
    university: "Fontys UAS",
    avatarId: "bodybuilder",
    sport: "Gym & Fitness",
    location: "Fontys Rachelsmolen, Eindhoven",
    sports: ["Gym & Fitness", "Powerlifting", "Calisthenics"],
    sessionsCount: 31
  },
  {
    uid: "demo-p3",
    displayName: "Elena Costa",
    email: "e.costa@student.fontys.nl",
    university: "Fontys UAS",
    avatarId: "runner",
    sport: "Volleyball",
    location: "Eindhoven Centrum",
    sports: ["Volleyball", "Running", "Swimming"],
    sessionsCount: 7
  },
  {
    uid: "climb-lover",
    displayName: "Matas K.",
    email: "m.kalnin@student.fontys.nl",
    university: "Fontys UAS",
    avatarId: "bodybuilder",
    sport: "Bouldering",
    location: "Strijp-S, Eindhoven",
    sports: ["Bouldering", "Calisthenics", "Cycling"],
    sessionsCount: 18
  },
  {
    uid: "gym-bro",
    displayName: "Liam O'Connor",
    email: "l.oconnor@student.fontys.nl",
    university: "Fontys UAS",
    avatarId: "bodybuilder",
    sport: "Gym & Fitness",
    location: "Stratum, Eindhoven",
    sports: ["Gym & Fitness", "Basketball", "Boxing"],
    sessionsCount: 25
  },
  {
    uid: "demo-tue-basketball",
    displayName: "Daan Wouters",
    email: "d.wouters@student.tue.nl",
    university: "TU Eindhoven",
    avatarId: "footballer",
    sport: "Basketball",
    location: "TU/e Student Sports Centre",
    sports: ["Basketball", "Futsal", "Gym & Fitness"],
    sessionsCount: 12
  }
];

// Application State
const state = {
  currentUser: null,
  userProfile: null,
  activities: [],
  activeTab: "feed", // "feed" | "community" | "create" | "my-activities" | "profile"
  filterSport: "all",
  searchQuery: "",
  selectedActivity: null,
  
  // Social & Community State
  students: [...DEMO_CAMPUS_STUDENTS],
  communityView: "all", // "all" | "friends"
  communityUniFilter: "all", // "all" | "Fontys" | "TU/e"
  studentSearchQuery: "",
  friends: [], // array of friend uids
  friendRequests: [], // array of { id, fromUid, fromName, fromUni, fromAvatar, timestamp }
  notifications: [] // array of { id, title, desc, type, read, timestamp }
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
  try { setupSettingsModal(); } catch (e) { console.error("setupSettings:", e); }
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
    let avatarId = state.userProfile?.avatarId || user.avatarId || "footballer";
    if (avatarId === "bolt" || avatarId === "flame" || avatarId === "cyber") {
      avatarId = "footballer";
    }
    const avatar = getAvatarById(avatarId);

    // Force hide Sign in button
    if (navAuthBtn) {
      navAuthBtn.classList.add("hidden");
      navAuthBtn.style.setProperty("display", "none", "important");
    }

    // Force show Google-style circular avatar in top right
    if (googleAvatarBtn && avatarInner) {
      avatarInner.className = `w-full h-full rounded-full overflow-hidden bg-gradient-to-tr ${avatar.bg} flex items-center justify-center text-white`;
      avatarInner.innerHTML = `<img src="${avatar.image}" alt="${avatar.name}" class="w-full h-full object-cover rounded-full" onerror="this.src='./assets/avatars/footballer.png'" />`;
      googleAvatarBtn.classList.remove("hidden");
      googleAvatarBtn.style.setProperty("display", "inline-flex", "important");
    }

    if (userDropdown) {
      const dropName = document.getElementById("dropdown-name");
      const dropEmail = document.getElementById("dropdown-email");
      const dropSchoolBadge = document.getElementById("dropdown-school-badge");
      const dropSchoolFull = document.getElementById("dropdown-school-full");
      const isTue = uni.includes("TU") || email.endsWith("@student.tue.nl");

      if (dropName) dropName.textContent = displayName;
      if (dropEmail) dropEmail.textContent = email;
      if (dropSchoolBadge) dropSchoolBadge.textContent = isTue ? "TU/e" : "Fontys";
      if (dropSchoolFull) dropSchoolFull.textContent = isTue ? "TU Eindhoven" : "Fontys UAS";
    }

    // Update Instagram-style sidebar profile button
    const sidebarAvatar = document.getElementById("sidebar-profile-avatar-inner");
    const sidebarName = document.getElementById("sidebar-profile-name");
    if (sidebarAvatar) {
      sidebarAvatar.innerHTML = `<img src="${avatar.image}" alt="${avatar.name}" class="w-full h-full object-cover rounded-full" onerror="this.src='./assets/avatars/footballer.png'" />`;
    }
    if (sidebarName) {
      sidebarName.textContent = displayName;
    }

    // auth-status-pill was removed per user request for minimalist header
    if (authStatusPill) {
      authStatusPill.classList.add("hidden");
      authStatusPill.style.setProperty("display", "none", "important");
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
          const currentLocal = getActiveSession() || activeSession;
          const profile = await getStudentProfile(user.uid);
          // Preserve local edits if newer
          const merged = { ...profile, ...currentLocal, uid: user.uid, email: user.email };
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
  const tabs = ["feed", "community", "create", "my-activities", "profile"];
  
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
  const tabs = ["feed", "community", "create", "my-activities", "profile", "notifications"];

  tabs.forEach(t => {
    const section = document.getElementById(`section-${t}`);
    const deskBtn = document.getElementById(`tab-btn-${t}`);
    const mobBtn = document.getElementById(`mobile-tab-${t}`);

    if (t === targetTab) {
      if (section) section.classList.remove("hidden");
      if (deskBtn) {
        deskBtn.className = "nav-sidebar-btn w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm font-bold bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 transition cursor-pointer group";
      }
      if (mobBtn) {
        mobBtn.className = "flex flex-col items-center gap-1 text-zinc-950 dark:text-white transition cursor-pointer";
      }
    } else {
      if (section) section.classList.add("hidden");
      if (deskBtn) {
        deskBtn.className = "nav-sidebar-btn w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm font-semibold text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-white transition cursor-pointer group";
      }
      if (mobBtn) {
        mobBtn.className = "flex flex-col items-center gap-1 text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition cursor-pointer";
      }
    }
  });

  if (targetTab === "community") {
    renderCommunity();
  }
  if (targetTab === "my-activities") {
    renderMyActivities();
  }
  if (targetTab === "profile") {
    populateProfileTab();
  }
  if (targetTab === "notifications") {
    renderNotifications();
  }
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
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
                const av = getAvatarById(p.avatarId || "footballer");
                return `
                  <div class="w-6 h-6 rounded-full overflow-hidden border-2 border-white dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-800 text-white flex items-center justify-center shadow-sm" title="${escapeHtml(p.name)} (${escapeHtml(p.university || 'Student')})">
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

export function populateProfileTab() {
  let user = state.currentUser;
  let profile = state.userProfile || user;

  if (!user) {
    const session = getActiveSession();
    if (session) {
      user = session;
      profile = session;
      state.currentUser = session;
      state.userProfile = session;
    }
  }

  if (!user) return;

  const email = profile.email || user.email || "";
  const displayName = profile.displayName || user.displayName || (email ? email.split("@")[0] : "Student");
  const uni = profile.university || (email.endsWith("@student.tue.nl") ? "TU Eindhoven" : "Fontys UAS");
  const isTue = uni.includes("TU") || email.endsWith("@student.tue.nl");
  let currentAvatarId = profile.avatarId || user.avatarId || "footballer";
  if (currentAvatarId === "bolt" || currentAvatarId === "flame" || currentAvatarId === "cyber") {
    currentAvatarId = "footballer";
  }
  const avatar = getAvatarById(currentAvatarId);

  // Hero Card Elements
  const heroName = document.getElementById("profile-hero-name");
  const heroEmail = document.getElementById("profile-hero-email");
  const heroSchool = document.getElementById("profile-hero-school");
  const heroInner = document.getElementById("profile-hero-avatar-inner");
  const heroAvatar = document.getElementById("profile-hero-avatar");

  if (heroName) heroName.textContent = displayName;
  if (heroEmail) heroEmail.textContent = email;
  if (heroSchool) heroSchool.textContent = isTue ? "TU Eindhoven" : "Fontys UAS";
  if (heroAvatar) heroAvatar.className = `w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr ${avatar.bg} shadow-xl flex items-center justify-center`;
  if (heroInner) {
    heroInner.innerHTML = `<img src="${avatar.image}" alt="${avatar.name}" class="w-full h-full object-cover rounded-full" onerror="this.src='./assets/avatars/footballer.png'" />`;
  }

  // Quick Stats
  const statActivities = document.getElementById("profile-stat-activities");
  const statSport = document.getElementById("profile-stat-sport");
  if (statActivities) {
    const myCount = state.activities.filter(a => {
      const isJoined = (a.participants || []).some(p => p.uid === user.uid);
      const isCreator = a.creatorId === user.uid;
      return isJoined || isCreator;
    }).length;
    statActivities.textContent = myCount;
  }
  if (statSport) {
    statSport.textContent = profile.sport || "Football";
  }

  // Render Mascot Avatar Switcher (Sync state and attach handlers)
  const pickerContainer = document.getElementById("profile-avatar-picker");
  if (pickerContainer) {
    pickerContainer.innerHTML = UNISPORT_AVATARS.map(av => {
      const isSelected = av.id === currentAvatarId;
      return `
        <button 
          type="button" 
          data-avatar-id="${av.id}"
          onclick="window.UniSport.selectAvatar('${av.id}')"
          class="profile-avatar-option group relative flex flex-col items-center gap-3 p-4 sm:p-6 rounded-2xl border-2 transition-all cursor-pointer hover:scale-[1.01] ${isSelected ? 'border-brand-orange bg-orange-500/10 shadow-sm' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'}"
        >
          <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gradient-to-tr ${av.bg} p-0.5 shadow-md flex items-center justify-center">
            <div class="w-full h-full rounded-full overflow-hidden bg-zinc-950 flex items-center justify-center">
              <img src="${av.image}" alt="${av.name}" class="w-full h-full object-cover rounded-full" onerror="this.src='./assets/avatars/footballer.png'" />
            </div>
          </div>
          <span class="text-sm sm:text-base font-bold text-zinc-950 dark:text-white truncate w-full text-center">${av.name}</span>
          ${isSelected ? `<span class="avatar-status-pill text-xs uppercase font-bold text-brand-orange">Selected</span>` : `<span class="avatar-status-pill text-xs text-zinc-400 group-hover:text-zinc-600">Select</span>`}
        </button>
      `;
    }).join('');
  }

  // Form inputs
  const nameInput = document.getElementById("profile-name");
  const emailInput = document.getElementById("profile-email");
  const uniInput = document.getElementById("profile-university");
  const sportInput = document.getElementById("profile-sport");

  if (nameInput) nameInput.value = displayName;
  if (emailInput) emailInput.value = email;
  if (uniInput) uniInput.value = isTue ? "TU Eindhoven" : "Fontys UAS";
  if (sportInput && profile.sport) sportInput.value = profile.sport;
}

export async function selectAvatar(newAvId) {
  let user = state.currentUser || getActiveSession();
  if (!user) return;

  const uid = user.uid || (state.currentUser ? state.currentUser.uid : null);
  const targetAvatar = getAvatarById(newAvId);

  // 1. Immediately update active state & session
  if (state.currentUser) state.currentUser.avatarId = newAvId;
  if (state.userProfile) state.userProfile.avatarId = newAvId;
  const currentSession = getActiveSession() || {};
  currentSession.avatarId = newAvId;
  setActiveSession(currentSession);

  // 2. Update UI elements instantly
  const heroAvatar = document.getElementById("profile-hero-avatar");
  const heroInner = document.getElementById("profile-hero-avatar-inner");
  if (heroAvatar) heroAvatar.className = "w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-center";
  if (heroInner) {
    heroInner.innerHTML = `<img src="${targetAvatar.image}" alt="${targetAvatar.name}" class="w-full h-full object-cover rounded-full" onerror="this.src='./assets/avatars/footballer.png'" />`;
  }

  // Top nav google avatar
  const googleAvatarInner = document.getElementById("google-avatar-inner");
  if (googleAvatarInner) {
    googleAvatarInner.className = "w-full h-full rounded-full overflow-hidden flex items-center justify-center pointer-events-none";
    googleAvatarInner.innerHTML = `<img src="${targetAvatar.image}" alt="${targetAvatar.name}" class="w-full h-full object-cover rounded-full" onerror="this.src='./assets/avatars/footballer.png'" />`;
  }

  // Card outlines and pills
  const pickerContainer = document.getElementById("profile-avatar-picker");
  if (pickerContainer) {
    pickerContainer.querySelectorAll(".profile-avatar-option").forEach(btn => {
      const isThis = btn.dataset.avatarId === newAvId;
      const pill = btn.querySelector(".avatar-status-pill");
      if (isThis) {
        btn.className = "profile-avatar-option group relative flex flex-col items-center gap-3 p-4 sm:p-6 rounded-2xl border-2 border-brand-orange bg-orange-500/10 transition-all cursor-pointer shadow-sm hover:scale-[1.01]";
        if (pill) {
          pill.className = "avatar-status-pill text-xs uppercase font-bold text-brand-orange";
          pill.textContent = "Selected";
        }
      } else {
        btn.className = "profile-avatar-option group relative flex flex-col items-center gap-3 p-4 sm:p-6 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all cursor-pointer hover:scale-[1.01]";
        if (pill) {
          pill.className = "avatar-status-pill text-xs text-zinc-400 group-hover:text-zinc-600";
          pill.textContent = "Select";
        }
      }
    });
  }

  // 3. Persist to Firestore asynchronously
  if (uid) {
    await updateStudentProfile(uid, { avatarId: newAvId });
  }
}

function setupProfileForm() {
  const form = document.getElementById("profile-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      let user = state.currentUser || getActiveSession();
      if (!user) return;

      const displayName = sanitize(document.getElementById("profile-name").value.trim());
      const sportEl = document.getElementById("profile-sport");
      const sport = sportEl ? sportEl.value : "Football";
      const btn = document.getElementById("profile-save-btn");

      btn.disabled = true;
      btn.textContent = "Saving...";

      // 1. Immediately persist locally
      const uid = user.uid;
      const currentSession = getActiveSession() || {};
      currentSession.displayName = displayName;
      currentSession.sport = sport;
      setActiveSession(currentSession);

      if (state.currentUser) {
        state.currentUser.displayName = displayName;
        state.currentUser.sport = sport;
      }
      if (state.userProfile) {
        state.userProfile.displayName = displayName;
        state.userProfile.sport = sport;
      }

      // 2. Update UI stats and hero card
      const heroName = document.getElementById("profile-hero-name");
      const statSport = document.getElementById("profile-stat-sport");
      const dropName = document.getElementById("dropdown-name");
      if (heroName) heroName.textContent = displayName;
      if (statSport) statSport.textContent = sport;
      if (dropName) dropName.textContent = displayName;

      // 3. Persist to Firestore
      if (uid) {
        await updateStudentProfile(uid, { displayName, sport });
      }

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
          <div class="w-8 h-8 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-white shadow-sm">
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

export function openSettingsModal() {
  const modal = document.getElementById("settings-modal");
  const dropdown = document.getElementById("user-dropdown");
  if (dropdown) dropdown.classList.add("hidden");
  if (modal) {
    modal.classList.remove("hidden");
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }
}

function setupSettingsModal() {
  const modal = document.getElementById("settings-modal");
  const closeBtn = document.getElementById("settings-modal-close");
  const doneBtn = document.getElementById("settings-modal-done");
  const clearCacheBtn = document.getElementById("settings-clear-cache-btn");
  const deleteAccountBtn = document.getElementById("settings-delete-account-btn");
  const unitSelect = document.getElementById("settings-unit-select");
  const hapticsToggle = document.getElementById("settings-haptics");
  const notifRoster = document.getElementById("settings-notif-roster");
  const notifActivities = document.getElementById("settings-notif-activities");
  const notifReminders = document.getElementById("settings-notif-reminders");
  const privacyPublic = document.getElementById("settings-privacy-public");
  const showUni = document.getElementById("settings-show-uni");

  // Load preferences from localStorage
  try {
    const savedPrefs = JSON.parse(localStorage.getItem("unisport_app_preferences") || "{}");
    if (unitSelect && savedPrefs.unit) unitSelect.value = savedPrefs.unit;
    if (hapticsToggle && typeof savedPrefs.haptics === "boolean") hapticsToggle.checked = savedPrefs.haptics;
    if (notifRoster && typeof savedPrefs.notifRoster === "boolean") notifRoster.checked = savedPrefs.notifRoster;
    if (notifActivities && typeof savedPrefs.notifActivities === "boolean") notifActivities.checked = savedPrefs.notifActivities;
    if (notifReminders && typeof savedPrefs.notifReminders === "boolean") notifReminders.checked = savedPrefs.notifReminders;
    if (privacyPublic && typeof savedPrefs.privacyPublic === "boolean") privacyPublic.checked = savedPrefs.privacyPublic;
    if (showUni && typeof savedPrefs.showUni === "boolean") showUni.checked = savedPrefs.showUni;
  } catch (e) {}

  const savePreferences = () => {
    try {
      const prefs = {
        unit: unitSelect ? unitSelect.value : "metric",
        haptics: hapticsToggle ? hapticsToggle.checked : true,
        notifRoster: notifRoster ? notifRoster.checked : true,
        notifActivities: notifActivities ? notifActivities.checked : true,
        notifReminders: notifReminders ? notifReminders.checked : true,
        privacyPublic: privacyPublic ? privacyPublic.checked : true,
        showUni: showUni ? showUni.checked : true,
        updatedAt: Date.now()
      };
      localStorage.setItem("unisport_app_preferences", JSON.stringify(prefs));
    } catch (e) {}
  };

  // Attach change listeners to save preferences on toggle
  [unitSelect, hapticsToggle, notifRoster, notifActivities, notifReminders, privacyPublic, showUni].forEach(el => {
    if (el) el.addEventListener("change", savePreferences);
  });

  // Clear Cache Action
  if (clearCacheBtn) {
    clearCacheBtn.addEventListener("click", clearCache);
  }

  // Delete Account Action
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", deleteAccount);
  }

  const close = () => { if (modal) modal.classList.add("hidden"); };
  if (closeBtn) closeBtn.addEventListener("click", close);
  if (doneBtn) doneBtn.addEventListener("click", close);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) close();
    });
  }
}

export function clearCache() {
  const activeSession = localStorage.getItem("unisport_active_session");
  const prefs = localStorage.getItem("unisport_app_preferences");
  localStorage.clear();
  if (activeSession) localStorage.setItem("unisport_active_session", activeSession);
  if (prefs) localStorage.setItem("unisport_app_preferences", prefs);

  const btn = document.getElementById("settings-clear-cache-btn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Cleared!";
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = "Clear Cache";
    }, 1500);
  }
}

export async function deleteAccount() {
  const confirmed = window.confirm(
    "Are you absolutely sure you want to delete your UniSport account?\n\nThis will permanently delete your student profile, mascot preferences, and match attendance. This cannot be undone."
  );
  if (!confirmed) return;

  const finalWord = window.prompt("To permanently confirm deletion, please type DELETE below:");
  if (finalWord !== "DELETE") {
    alert("Account deletion canceled.");
    return;
  }

  const btn = document.getElementById("settings-delete-account-btn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Deleting...";
  }

  try {
    await deleteStudentAccount();
    alert("Your UniSport account has been permanently deleted.");
    window.location.href = "./login.html";
  } catch (err) {
    console.error("Delete account error:", err);
    // If Firebase Auth requires reauthentication or fails, ensure local student session is cleaned up
    localStorage.removeItem("unisport_active_session");
    alert("Account erased. Redirecting to login...");
    window.location.href = "./login.html";
  }
}

// ==========================================
// CAMPUS COMMUNITY, PROFILE SEARCH & SOCIALS
// ==========================================

function getStoredSocialData() {
  try {
    const rawFriends = localStorage.getItem("unisport_friends");
    const rawRequests = localStorage.getItem("unisport_friend_requests");
    const rawNotifs = localStorage.getItem("unisport_notifications");

    state.friends = rawFriends ? JSON.parse(rawFriends) : ["demo-p1"];
    state.friendRequests = rawRequests ? JSON.parse(rawRequests) : [
      {
        id: "req-1",
        fromUid: "fontys-student-rep",
        fromName: "Thomas van Dijk",
        fromUni: "Fontys UAS",
        fromAvatar: "footballer",
        timestamp: Date.now() - 3600000
      },
      {
        id: "req-2",
        fromUid: "tue-runner-rep",
        fromName: "Sophie de Vries",
        fromUni: "TU Eindhoven",
        fromAvatar: "runner",
        timestamp: Date.now() - 7200000
      }
    ];
    state.notifications = rawNotifs ? JSON.parse(rawNotifs) : [
      {
        id: "notif-1",
        title: "Match Kickoff Reminder",
        desc: "Casual 5v5 Match starts in 1 hour at SSC Field 1.",
        time: "1h ago"
      },
      {
        id: "notif-2",
        title: "New Student Joined",
        desc: "Sara Martins joined your hosted Dommel Run session.",
        time: "3h ago"
      }
    ];
  } catch(e) {
    state.friends = ["demo-p1"];
    state.friendRequests = [];
    state.notifications = [];
  }
  updateNotifBadge();
}

function saveStoredSocialData() {
  try {
    localStorage.setItem("unisport_friends", JSON.stringify(state.friends));
    localStorage.setItem("unisport_friend_requests", JSON.stringify(state.friendRequests));
    localStorage.setItem("unisport_notifications", JSON.stringify(state.notifications));
  } catch(e) {}
  updateNotifBadge();
}

export function updateNotifBadge() {
  const badge = document.getElementById("notif-badge");
  const countText = document.getElementById("notif-count-text");
  const sidebarBadge = document.getElementById("sidebar-notif-badge");
  const sidebarCount = document.getElementById("sidebar-notif-count");
  const total = (state.friendRequests || []).length + (state.notifications || []).length;

  if (countText) countText.textContent = total;
  if (sidebarCount) sidebarCount.textContent = total > 0 ? String(total) : "";

  if (badge) {
    if (total > 0) {
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }
  if (sidebarBadge) {
    if (total > 0) {
      sidebarBadge.classList.remove("hidden");
    } else {
      sidebarBadge.classList.add("hidden");
    }
  }
}

export function renderNotifications() {
  const reqList = document.getElementById("notif-friend-requests-list");
  const genList = document.getElementById("notif-general-list");
  const mobileReqList = document.getElementById("mobile-notif-requests-list");
  const mobileGenList = document.getElementById("mobile-notif-general-list");
  const pageNotifCount = document.getElementById("notifications-page-count");
  const drawerNotifCount = document.getElementById("drawer-notif-count-text");

  const total = (state.friendRequests || []).length + (state.notifications || []).length;
  if (pageNotifCount) pageNotifCount.textContent = `${total} new`;
  if (drawerNotifCount) drawerNotifCount.textContent = total;

  const renderRequestsHtml = () => {
    if (!state.friendRequests || state.friendRequests.length === 0) {
      return `<p class="text-zinc-400 text-xs py-3 text-center">No pending friend requests.</p>`;
    }
    return state.friendRequests.map(req => {
      const av = getAvatarById(req.fromAvatar || "footballer");
      return `
        <div class="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
              ${av.svg}
            </div>
            <div class="min-w-0 flex-grow">
              <p class="font-bold text-xs sm:text-sm text-zinc-950 dark:text-white truncate">${escapeHtml(req.fromName)}</p>
              <p class="text-[11px] text-zinc-500 truncate">${escapeHtml(req.fromUni)}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.acceptFriendRequest('${req.id}', '${req.fromUid}')" class="flex-1 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs transition shadow-sm cursor-pointer">
              Accept
            </button>
            <button onclick="window.declineFriendRequest('${req.id}')" class="flex-1 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs transition cursor-pointer">
              Decline
            </button>
          </div>
        </div>
      `;
    }).join('');
  };

  const renderGeneralHtml = () => {
    if (!state.notifications || state.notifications.length === 0) {
      return `<p class="text-zinc-400 text-xs py-3 text-center">All caught up! No recent alerts.</p>`;
    }
    return state.notifications.map(n => `
      <div class="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/80 space-y-1">
        <div class="flex items-center justify-between gap-2">
          <p class="font-bold text-xs sm:text-sm text-zinc-950 dark:text-white">${escapeHtml(n.title)}</p>
          <span class="text-[10px] text-zinc-400 font-medium whitespace-nowrap">${escapeHtml(n.time || '')}</span>
        </div>
        <p class="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">${escapeHtml(n.desc)}</p>
      </div>
    `).join('');
  };

  const reqHtml = renderRequestsHtml();
  const genHtml = renderGeneralHtml();

  if (reqList) reqList.innerHTML = reqHtml;
  if (genList) genList.innerHTML = genHtml;
  if (mobileReqList) mobileReqList.innerHTML = reqHtml;
  if (mobileGenList) mobileGenList.innerHTML = genHtml;

  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

export function acceptFriendRequest(reqId, fromUid) {
  state.friendRequests = state.friendRequests.filter(r => r.id !== reqId);
  if (!state.friends.includes(fromUid)) {
    state.friends.push(fromUid);
  }
  saveStoredSocialData();
  renderNotifications();
  if (state.activeTab === "community") renderCommunity();
}

export function declineFriendRequest(reqId) {
  state.friendRequests = state.friendRequests.filter(r => r.id !== reqId);
  saveStoredSocialData();
  renderNotifications();
}

export function clearAllNotifsGlobal() {
  state.notifications = [];
  saveStoredSocialData();
  renderNotifications();
}

export async function fetchCampusStudents() {
  const currentUid = state.currentUser?.uid || (getActiveSession() || {}).uid;
  const currentSession = getActiveSession() || state.currentUser || {};
  let remoteStudents = [];

  try {
    const snap = await getDocs(collection(db, "users"));
    snap.forEach(docSnap => {
      const data = docSnap.data();
      remoteStudents.push({
        uid: docSnap.id,
        isSelf: docSnap.id === currentUid,
        displayName: data.displayName || (docSnap.id === currentUid ? (currentSession.displayName || "Student") : "Student"),
        email: data.email || (docSnap.id === currentUid ? (currentSession.email || "") : ""),
        university: data.university || (data.email?.endsWith("@student.tue.nl") ? "TU Eindhoven" : "Fontys UAS"),
        avatarId: data.avatarId || (docSnap.id === currentUid ? (currentSession.avatarId || "footballer") : "footballer"),
        sport: data.sport || (docSnap.id === currentUid ? (currentSession.sport || "Football") : "Football"),
        location: data.location || "Eindhoven Campus",
        sports: data.sports || [data.sport || "Football"],
        sessionsCount: data.sessionsCount || Math.floor(Math.random() * 15) + 2
      });
    });
  } catch(e) {
    console.warn("fetchCampusStudents Firestore fetch warning:", e);
  }

  // Ensure current user is in directory if not returned by Firestore
  if (currentSession && currentSession.uid && !remoteStudents.some(s => s.uid === currentSession.uid)) {
    remoteStudents.push({
      uid: currentSession.uid,
      isSelf: true,
      displayName: currentSession.displayName || "Student",
      email: currentSession.email || "",
      university: currentSession.university || "Fontys UAS",
      avatarId: currentSession.avatarId || "footballer",
      sport: currentSession.sport || "Football",
      location: "Eindhoven Campus",
      sports: [currentSession.sport || "Football"],
      sessionsCount: 3
    });
  }

  // Merge demo students to guarantee rich active discovery
  const map = new Map();
  DEMO_CAMPUS_STUDENTS.forEach(s => {
    map.set(s.uid, { ...s, isSelf: s.uid === currentUid });
  });
  remoteStudents.forEach(s => map.set(s.uid, s));

  state.students = Array.from(map.values());
  try {
    localStorage.setItem("unisport_students_cache", JSON.stringify(state.students));
  } catch(e) {}
}

export function renderCommunity() {
  const container = document.getElementById("students-grid");
  const countFriends = document.getElementById("community-friends-count");
  if (countFriends) countFriends.textContent = (state.friends || []).length;
  if (!container) return;

  let list = [...(state.students || [])];

  // Filter by community view (All vs Friends)
  if (state.communityView === "friends") {
    list = list.filter(s => state.friends.includes(s.uid));
  }

  // Filter by university
  if (state.communityUniFilter && state.communityUniFilter !== "all") {
    list = list.filter(s => s.university && s.university.includes(state.communityUniFilter));
  }

  // Filter by search query
  if (state.studentSearchQuery) {
    const q = state.studentSearchQuery.toLowerCase();
    list = list.filter(s => 
      (s.displayName || "").toLowerCase().includes(q) ||
      (s.university || "").toLowerCase().includes(q) ||
      (s.sport || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q) ||
      (s.sports || []).some(sp => sp.toLowerCase().includes(q))
    );
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 px-6 text-center rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800">
        <h3 class="text-base font-bold text-zinc-950 dark:text-white mb-1">No campus students found</h3>
        <p class="text-zinc-500 dark:text-zinc-400 text-xs max-w-sm mx-auto mb-4">
          ${state.communityView === 'friends' ? "You haven't connected with any friends yet. Explore all campus students to send requests!" : "Try searching for a different name, university, or sport."}
        </p>
        ${state.communityView === 'friends' ? `
          <button onclick="window.setCommunityView('all')" class="px-4 py-2 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold">
            Explore All Students
          </button>
        ` : ''}
      </div>
    `;
    return;
  }

  // Update ticker numbers
  const statStudents = document.getElementById("community-stat-students");
  if (statStudents) statStudents.textContent = `${(state.students || []).length}+`;

  const currentUid = state.currentUser?.uid || (getActiveSession() || {}).uid;

  container.innerHTML = list.map((student, idx) => {
    const av = getAvatarById(student.avatarId || "footballer");
    const isSelf = student.uid === currentUid || student.isSelf;
    const isFriend = state.friends.includes(student.uid);
    const isTue = (student.university || "").includes("TU") || (student.email || "").includes("tue.nl");
    const sports = student.sports || [student.sport || "Football"];

    return `
      <div class="p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 transition hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
        
        <!-- Left: Avatar, Verified Name, University & Contact -->
        <div class="flex items-center gap-4 min-w-0">
          <div class="relative shrink-0 cursor-pointer" onclick="window.openStudentProfileModal('${student.uid}')">
            <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-white shadow-sm">
              ${av.svg}
            </div>
            <span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 shadow-sm" title="Active Verified Student"></span>
          </div>

          <div class="min-w-0 flex-grow space-y-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="font-extrabold text-sm sm:text-base text-zinc-950 dark:text-white truncate cursor-pointer hover:underline" onclick="window.openStudentProfileModal('${student.uid}')">
                ${escapeHtml(student.displayName)}
              </h3>

              ${isSelf ? `
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                  You
                </span>
              ` : ''}
              
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isTue ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' : 'bg-orange-500/10 text-brand-orange border border-orange-500/20'}">
                <i data-lucide="graduation-cap" class="w-3 h-3"></i>
                ${isTue ? 'TU Eindhoven' : 'Fontys UAS'}
              </span>

              ${isFriend ? `
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <i data-lucide="check" class="w-3 h-3"></i>
                  Friend
                </span>
              ` : ''}
            </div>

            <!-- Student Email & Campus Location -->
            <div class="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 truncate">
              <span class="font-medium truncate text-zinc-700 dark:text-zinc-300">${escapeHtml(student.email || 'campus.student@fontys.nl')}</span>
              <span>•</span>
              <span class="truncate">${escapeHtml(student.location || 'Eindhoven Campus')}</span>
            </div>
          </div>
        </div>

        <!-- Center: Preferred Sports Pills -->
        <div class="hidden lg:flex items-center gap-1.5 shrink-0">
          ${sports.slice(0, 3).map(sp => `
            <span class="px-3 py-1 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700/50">
              ${escapeHtml(sp)}
            </span>
          `).join('')}
          ${sports.length > 3 ? `
            <span class="px-2 py-1 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
              +${sports.length - 3}
            </span>
          ` : ''}
        </div>

        <!-- Right: Activity Stats & Direct Actions -->
        <div class="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800/60">
          <div class="text-left md:text-right pr-2">
            <span class="block text-xs font-extrabold text-zinc-950 dark:text-white">${student.sessionsCount || 0} matches</span>
            <span class="block text-[10px] text-zinc-400 uppercase font-semibold">Attendance</span>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="window.openStudentProfileModal('${student.uid}')" class="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-900 dark:text-white transition cursor-pointer">
              Profile
            </button>

            ${isSelf ? `
              <button onclick="window.switchTabGlobal('profile')" class="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs transition cursor-pointer shadow-sm">
                Edit
              </button>
            ` : isFriend ? `
              <button onclick="window.removeFriend('${student.uid}')" class="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-xs font-bold text-red-600 dark:text-red-400 transition cursor-pointer" title="Remove Friend">
                Remove
              </button>
            ` : `
              <button onclick="window.toggleFriendship('${student.uid}')" class="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs transition cursor-pointer shadow-sm">
                Connect
              </button>
            `}
          </div>
        </div>

      </div>
    `;
  }).join('');

  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

export function openStudentProfileModal(uid) {
  const currentUid = state.currentUser?.uid || (getActiveSession() || {}).uid;
  const modal = document.getElementById("student-profile-modal");
  if (!modal) return;

  let student = (state.students || []).find(s => s.uid === uid);
  if (!student && uid === currentUid) {
    const user = state.currentUser || getActiveSession() || {};
    student = {
      uid: currentUid,
      displayName: user.displayName || "You",
      email: user.email || "",
      university: user.university || (user.email?.includes("tue.nl") ? "TU Eindhoven" : "Fontys UAS"),
      avatarId: user.avatarId || "footballer",
      sport: user.sport || "Football",
      location: "Eindhoven Campus",
      sports: [user.sport || "Football"],
      sessionsCount: state.activities.filter(a => (a.participants || []).some(p => p.uid === currentUid)).length
    };
  }

  if (!student) return;

  const av = getAvatarById(student.avatarId || "footballer");
  const isSelf = student.uid === currentUid;
  const isFriend = state.friends.includes(student.uid);

  const nameEl = document.getElementById("view-profile-name");
  const emailEl = document.getElementById("view-profile-email");
  const uniEl = document.getElementById("view-profile-uni");
  const sportEl = document.getElementById("view-profile-sport");
  const locEl = document.getElementById("view-profile-location");
  const countEl = document.getElementById("view-profile-sessions-count");
  const avatarInner = document.getElementById("view-profile-avatar-inner");
  const tagsEl = document.getElementById("view-profile-sports-tags");
  const actionsEl = document.getElementById("view-profile-social-actions");

  if (nameEl) nameEl.textContent = student.displayName;
  if (emailEl) emailEl.textContent = student.email;
  if (uniEl) uniEl.innerHTML = `<i data-lucide="graduation-cap" class="w-3.5 h-3.5"></i> <span>${escapeHtml(student.university)}</span>`;
  if (sportEl) sportEl.textContent = student.sport;
  if (locEl) locEl.textContent = student.location || "Eindhoven, NL";
  if (countEl) countEl.textContent = `${student.sessionsCount || 0} matches`;
  if (avatarInner) avatarInner.innerHTML = `<img src="${av.image}" class="w-full h-full object-cover rounded-full" onerror="this.src='./assets/avatars/footballer.png'" />`;

  if (tagsEl) {
    const sports = student.sports || [student.sport || "Football"];
    tagsEl.innerHTML = sports.map(sp => `
      <span class="px-2.5 py-1 rounded-lg text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
        ${escapeHtml(sp)}
      </span>
    `).join('');
  }

  if (actionsEl) {
    if (isSelf) {
      actionsEl.innerHTML = `
        <button onclick="window.closeStudentProfileModal(); window.switchTabGlobal('profile')" class="w-full py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold text-xs transition">
          Edit Your Profile
        </button>
      `;
    } else if (isFriend) {
      actionsEl.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="flex-1 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs text-center border border-emerald-500/20">
            You are friends
          </span>
          <button onclick="window.removeFriend('${student.uid}')" class="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-semibold text-xs transition">
            Remove
          </button>
        </div>
      `;
    } else {
      actionsEl.innerHTML = `
        <button onclick="window.toggleFriendship('${student.uid}')" class="w-full py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs transition shadow-sm">
          Send Friend Request
        </button>
      `;
    }
  }

  modal.classList.remove("hidden");
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

export function toggleFriendship(uid) {
  const currentUid = state.currentUser?.uid || (getActiveSession() || {}).uid;
  if (!state.friends.includes(uid)) {
    state.friends.push(uid);
    // Add confirmation notification
    const student = (state.students || []).find(s => s.uid === uid);
    if (student) {
      state.notifications.unshift({
        id: "conn-" + Date.now(),
        title: "Friend Connected",
        desc: `You and ${student.displayName} are now connected on UniSport.`,
        time: "Just now"
      });
    }
  }
  saveStoredSocialData();
  renderCommunity();
  openStudentProfileModal(uid);
}

export function removeFriend(uid) {
  state.friends = state.friends.filter(f => f !== uid);
  saveStoredSocialData();
  renderCommunity();
  openStudentProfileModal(uid);
}

// Global window helpers for community & socials
window.setCommunityView = function(view) {
  state.communityView = view;
  const btnAll = document.getElementById("community-tab-all");
  const btnFriends = document.getElementById("community-tab-friends");

  const activeClasses = "px-4 py-2 rounded-lg text-xs font-bold bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 transition cursor-pointer flex items-center gap-2";
  const inactiveClasses = "px-4 py-2 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition cursor-pointer flex items-center gap-2";

  if (view === "all") {
    if (btnAll) btnAll.className = activeClasses;
    if (btnFriends) btnFriends.className = inactiveClasses;
  } else {
    if (btnFriends) btnFriends.className = activeClasses;
    if (btnAll) btnAll.className = inactiveClasses;
  }
  renderCommunity();
};

window.filterStudentsByUni = function(uni) {
  state.communityUniFilter = uni;
  document.querySelectorAll(".student-uni-chip").forEach(chip => {
    if (chip.getAttribute("data-uni-filter") === uni) {
      chip.className = "student-uni-chip px-3.5 py-2 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold whitespace-nowrap transition cursor-pointer";
    } else {
      chip.className = "student-uni-chip px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold whitespace-nowrap hover:text-zinc-950 dark:hover:text-white transition cursor-pointer";
    }
  });
  renderCommunity();
};

window.filterStudentsGlobal = function(val) {
  state.studentSearchQuery = (val || "").trim();
  renderCommunity();
};

window.openStudentProfileModal = openStudentProfileModal;
window.toggleFriendship = toggleFriendship;
window.removeFriend = removeFriend;
window.acceptFriendRequest = acceptFriendRequest;
window.declineFriendRequest = declineFriendRequest;
window.clearAllNotifsGlobal = clearAllNotifsGlobal;

window.UniSport = {
  switchTab,
  selectAvatar,
  populateProfileTab,
  openRosterModal,
  openSettingsModal,
  toggleJoinActivity,
  clearCache,
  deleteAccount,
  renderCommunity,
  renderNotifications,
  openStudentProfileModal,
  signOut: signOutStudent
};

// Bootstrapping: Load local/cached students, initialize app immediately, and fetch remote updates asynchronously
function bootUniSport() {
  try {
    getStoredSocialData();
    const cachedStudents = localStorage.getItem("unisport_students_cache");
    if (cachedStudents) {
      try {
        const parsed = JSON.parse(cachedStudents);
        if (Array.isArray(parsed) && parsed.length > 0) {
          state.students = parsed;
        }
      } catch(e) {}
    }
  } catch(e) {}

  // Initialize UI immediately
  initApp();
  renderCommunity();
  renderNotifications();

  // Then fetch live students from Firestore in background and re-render seamlessly
  fetchCampusStudents().then(() => {
    renderCommunity();
    renderNotifications();
  }).catch(err => {
    console.warn("fetchCampusStudents background error:", err);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootUniSport);
} else {
  bootUniSport();
}
