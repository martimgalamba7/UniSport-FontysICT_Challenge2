// UniSport App Main Logic - Geo Feed, Activity Creation, Rosters & Live Listeners
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
  signUpStudent, 
  signInStudent, 
  signOutStudent, 
  getStudentProfile, 
  updateStudentProfile,
  sanitize 
} from "./auth.js";

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

// Sports list with badges and visual icons
export const SPORTS_CONFIG = {
  "Football": { icon: "⚽", badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  "Gym": { icon: "🏋️", badge: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  "Running": { icon: "🏃", badge: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  "Basketball": { icon: "🏀", badge: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  "Bouldering": { icon: "🧗", badge: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  "Padel": { icon: "🎾", badge: "bg-lime-500/20 text-lime-400 border-lime-500/30" },
  "Volleyball": { icon: "🏐", badge: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
  "Other": { icon: "⚡", badge: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30" }
};

// Sample seed data if Firestore collection is initially empty
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
      { uid: "fontys-student-rep", name: "Thomas van Dijk", university: "Fontys UAS" },
      { uid: "demo-p1", name: "Sara Martins", university: "TU Eindhoven" },
      { uid: "demo-p2", name: "Lars Bakker", university: "Fontys UAS" },
      { uid: "demo-p3", name: "Elena Costa", university: "Fontys UAS" }
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
      { uid: "tue-runner-rep", name: "Sophie de Vries", university: "TU Eindhoven" },
      { uid: "demo-p4", name: "Ruben V.", university: "Fontys UAS" },
      { uid: "demo-p5", name: "Noor Janssen", university: "TU Eindhoven" }
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
      { uid: "climb-lover", name: "Matas K.", university: "Fontys UAS" },
      { uid: "demo-p6", name: "Anouk S.", university: "TU Eindhoven" }
    ],
    createdAt: Date.now() - 10800000
  },
  {
    id: "demo-4",
    sport: "Gym",
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
      { uid: "gym-bro", name: "Liam O'Connor", university: "Fontys UAS" }
    ],
    createdAt: Date.now() - 14400000
  }
];

// Helper to escape HTML characters in templates (Prevents XSS)
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Format relative dates nicely
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
 * Initializes App event handlers and listeners
 */
export function initApp() {
  setupNavigation();
  setupAuthModals();
  setupCreateForm();
  setupProfileForm();
  setupFilterSearch();
  listenToAuthChanges();
  listenToActivities();
}

/**
 * Listen to Firebase Auth state
 */
function listenToAuthChanges() {
  onAuthStateChanged(auth, async (user) => {
    state.currentUser = user;
    const authStatusPill = document.getElementById("auth-status-pill");
    const navAuthBtn = document.getElementById("nav-auth-btn");
    const userMenuBtn = document.getElementById("user-menu-btn");
    const userNameSpan = document.getElementById("user-display-name");
    const userUniBadge = document.getElementById("user-university-badge");

    if (user) {
      // User is logged in
      const profile = await getStudentProfile(user.uid);
      state.userProfile = profile || {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split("@")[0],
        university: user.email.endsWith("@student.tue.nl") ? "TU Eindhoven" : "Fontys UAS",
        sports: ["Football", "Gym"],
        skillLevel: "Intermediate"
      };

      if (authStatusPill) {
        authStatusPill.innerHTML = `
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span class="font-medium text-white">${escapeHtml(state.userProfile.displayName || user.email)}</span>
          <span class="text-[10px] uppercase font-bold text-brand-orange px-1.5 py-0.5 rounded bg-brand-orange/10 border border-brand-orange/20">${state.userProfile.university.includes("TU") ? "TU/e" : "Fontys"}</span>
        `;
        authStatusPill.classList.remove("hidden");
      }

      if (navAuthBtn) navAuthBtn.classList.add("hidden");
      if (userMenuBtn) userMenuBtn.classList.remove("hidden");
      if (userNameSpan) userNameSpan.textContent = state.userProfile.displayName;
      if (userUniBadge) userUniBadge.textContent = state.userProfile.university;

      // Fill profile view fields
      populateProfileTab();
    } else {
      // Signed out
      state.userProfile = null;
      if (authStatusPill) authStatusPill.classList.add("hidden");
      if (navAuthBtn) navAuthBtn.classList.remove("hidden");
      if (userMenuBtn) userMenuBtn.classList.add("hidden");
    }

    renderFeed();
  });
}

/**
 * Sets up Tab navigation
 */
function setupNavigation() {
  const tabs = ["feed", "create", "my-activities", "profile"];
  
  tabs.forEach(tabId => {
    const btn = document.getElementById(`tab-btn-${tabId}`);
    const mobileBtn = document.getElementById(`mobile-tab-${tabId}`);
    
    const clickHandler = () => switchTab(tabId);
    if (btn) btn.addEventListener("click", clickHandler);
    if (mobileBtn) mobileBtn.addEventListener("click", clickHandler);
  });

  const backToFeedBtn = document.getElementById("back-to-feed-btn");
  if (backToFeedBtn) {
    backToFeedBtn.addEventListener("click", () => switchTab("feed"));
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
        deskBtn.classList.add("bg-brand-orange", "text-white");
        deskBtn.classList.remove("text-zinc-400", "hover:text-white");
      }
      if (mobBtn) {
        mobBtn.classList.add("text-brand-orange");
        mobBtn.classList.remove("text-zinc-400");
      }
    } else {
      if (section) section.classList.add("hidden");
      if (deskBtn) {
        deskBtn.classList.remove("bg-brand-orange", "text-white");
        deskBtn.classList.add("text-zinc-400", "hover:text-white");
      }
      if (mobBtn) {
        mobBtn.classList.remove("text-brand-orange");
        mobBtn.classList.add("text-zinc-400");
      }
    }
  });

  if (targetTab === "my-activities") {
    renderMyActivities();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Real-time activities listener from Firestore (with sample fallback)
 */
function listenToActivities() {
  const feedContainer = document.getElementById("activities-feed");
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
        // Use seed activities if collection hasn't been populated yet
        state.activities = INITIAL_DEMO_ACTIVITIES;
      }
      renderFeed();
    }, (error) => {
      console.warn("Firestore live stream warning (fallback to local state):", error);
      state.activities = INITIAL_DEMO_ACTIVITIES;
      renderFeed();
    });
  } catch (err) {
    console.warn("Could not attach snapshot, using offline sample data:", err);
    state.activities = INITIAL_DEMO_ACTIVITIES;
    renderFeed();
  }
}

/**
 * Renders Geo Feed with filters and dynamic rosters
 */
export function renderFeed() {
  const container = document.getElementById("activities-feed");
  const countBadge = document.getElementById("activity-count-badge");
  if (!container) return;

  let filtered = [...state.activities];

  // Sport Filter
  if (state.filterSport && state.filterSport !== "all") {
    filtered = filtered.filter(a => (a.sport || "").toLowerCase() === state.filterSport.toLowerCase());
  }

  // Search Filter
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
      <div class="col-span-full py-16 px-6 text-center rounded-3xl bg-zinc-900/40 border border-zinc-800/80">
        <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-zinc-800/60 flex items-center justify-center text-2xl">
          🔍
        </div>
        <h3 class="text-xl font-bold text-white mb-2">No matching sports sessions found</h3>
        <p class="text-zinc-400 text-sm max-w-sm mx-auto mb-6">Be the first student to create a session in Eindhoven or adjust your filters.</p>
        <button onclick="window.UniSport.switchTab('create')" class="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white text-sm font-semibold transition">
          + Create Session
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
    const isCreator = state.currentUser && activity.creatorId === state.currentUser.uid;

    return `
      <article class="relative flex flex-col justify-between rounded-3xl bg-zinc-900/60 border border-zinc-800/90 hover:border-zinc-700 p-6 transition duration-300 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
        <div>
          <!-- Header: Sport badge + spots -->
          <div class="flex items-center justify-between gap-2 mb-4">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${sportInfo.badge}">
              <span>${sportInfo.icon}</span>
              <span>${escapeHtml(activity.sport)}</span>
            </span>

            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full ${isFull ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}">
                ${isFull ? 'Session Full' : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`}
              </span>
            </div>
          </div>

          <!-- Title -->
          <h3 class="text-lg sm:text-xl font-bold text-white mb-2 leading-snug">
            ${escapeHtml(activity.title)}
          </h3>

          <!-- Details: Location & Date -->
          <div class="space-y-1.5 text-xs text-zinc-300 mb-4">
            <div class="flex items-center gap-2">
              <span class="text-brand-orange font-semibold">📍</span>
              <span class="truncate">${escapeHtml(activity.location)}</span>
              ${activity.distance ? `<span class="text-zinc-500 text-[11px]">(${escapeHtml(activity.distance)})</span>` : ''}
            </div>
            <div class="flex items-center gap-2">
              <span class="text-brand-orange font-semibold">⏰</span>
              <span>${escapeHtml(formatDisplayDate(activity.dateTime))}</span>
            </div>
          </div>

          <!-- Description -->
          ${activity.description ? `
            <p class="text-xs sm:text-sm text-zinc-400 line-clamp-2 mb-5">
              ${escapeHtml(activity.description)}
            </p>
          ` : ''}

          <!-- Roster Avatars -->
          <div class="mb-5 pt-3 border-t border-zinc-800/80">
            <div class="flex items-center justify-between text-xs mb-2">
              <span class="font-semibold text-zinc-400">Roster (${participants.length}/${max})</span>
              <button onclick="window.UniSport.openRosterModal('${activity.id}')" class="text-brand-orange hover:underline text-[11px] font-medium">
                View names &rarr;
              </button>
            </div>
            <div class="flex -space-x-2 overflow-hidden items-center">
              ${participants.slice(0, 5).map(p => `
                <div class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-800 border-2 border-zinc-900 text-[10px] font-bold text-white" title="${escapeHtml(p.name)} (${escapeHtml(p.university || 'Student')})">
                  ${escapeHtml((p.name || 'S').charAt(0).toUpperCase())}
                </div>
              `).join('')}
              ${participants.length > 5 ? `
                <div class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-800 border-2 border-zinc-900 text-[10px] font-bold text-zinc-400">
                  +${participants.length - 5}
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-3">
          <div class="text-[11px] text-zinc-400">
            Host: <span class="font-medium text-zinc-300">${escapeHtml(activity.creatorName || "Student")}</span>
          </div>

          <div>
            ${isJoined ? `
              <button onclick="window.UniSport.toggleJoinActivity('${activity.id}')" class="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-red-950/60 hover:text-red-300 text-xs font-semibold text-zinc-200 transition border border-zinc-700">
                Leave Spot
              </button>
            ` : `
              <button 
                onclick="window.UniSport.toggleJoinActivity('${activity.id}')" 
                ${isFull ? 'disabled' : ''}
                class="px-4 py-2 rounded-xl ${isFull ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-brand-orange hover:bg-brand-orange-hover text-white shadow-[0_4px_12px_rgba(255,77,0,0.3)]'} text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>${isFull ? 'Full' : 'Join Session'}</span>
              </button>
            `}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/**
 * Filter & Search Handlers
 */
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
      chips.forEach(c => c.classList.remove("bg-brand-orange", "text-white", "border-brand-orange"));
      chips.forEach(c => c.classList.add("bg-zinc-900", "text-zinc-400", "border-zinc-800"));

      chip.classList.remove("bg-zinc-900", "text-zinc-400", "border-zinc-800");
      chip.classList.add("bg-brand-orange", "text-white", "border-brand-orange");

      state.filterSport = chip.dataset.sport;
      renderFeed();
    });
  });
}

/**
 * Quick Activity Creation
 */
function setupCreateForm() {
  const form = document.getElementById("create-activity-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!state.currentUser) {
      openAuthModal("signin");
      alert("Please sign in with your student email to create an activity.");
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
          university: creatorUniversity
        }
      ],
      createdAt: serverTimestamp()
    };

    const submitBtn = document.getElementById("create-submit-btn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Publishing...";

    try {
      const docRef = await addDoc(collection(db, "activities"), newActivity);
      form.reset();
      switchTab("feed");
    } catch (err) {
      console.warn("Could not save to Firestore collection, updating local state:", err);
      // Fallback local update
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

/**
 * Join or Leave Activity
 */
export async function toggleJoinActivity(activityId) {
  if (!state.currentUser) {
    openAuthModal("signin");
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
    university: state.userProfile?.university || (state.currentUser.email.endsWith("@student.tue.nl") ? "TU Eindhoven" : "Fontys UAS")
  };

  try {
    const actRef = doc(db, "activities", activityId);
    if (isJoined) {
      // Find item to remove
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
    console.warn("Firestore write failed, updating local state:", err);
    // Local fallback
    if (isJoined) {
      activity.participants = participants.filter(p => p.uid !== state.currentUser.uid);
    } else {
      activity.participants.push(currentParticipantObj);
    }
    renderFeed();
  }
}

/**
 * Renders user's joined and hosted activities
 */
function renderMyActivities() {
  const container = document.getElementById("my-activities-list");
  if (!container) return;

  if (!state.currentUser) {
    container.innerHTML = `
      <div class="text-center py-12 rounded-3xl bg-zinc-900/40 border border-zinc-800 p-8">
        <p class="text-zinc-400 mb-4">Sign in with your student credentials to view your registered matches.</p>
        <button onclick="window.UniSport.openAuthModal('signin')" class="px-5 py-2.5 rounded-xl bg-brand-orange text-white font-bold text-sm">
          Sign In
        </button>
      </div>
    `;
    return;
  }

  const myActivities = state.activities.filter(a => {
    const isJoined = (a.participants || []).some(p => p.uid === state.currentUser.uid);
    const isCreator = a.creatorId === state.currentUser.uid;
    return isJoined || isCreator;
  });

  if (myActivities.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 rounded-3xl bg-zinc-900/40 border border-zinc-800 p-8">
        <h4 class="text-white font-bold text-lg mb-2">You haven't joined any activities yet</h4>
        <p class="text-zinc-400 text-sm mb-6">Explore the Geo Feed to find sports sessions matching your schedule in Eindhoven.</p>
        <button onclick="window.UniSport.switchTab('feed')" class="px-5 py-2.5 rounded-xl bg-brand-orange text-white font-bold text-sm">
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
      <div class="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-sm">${sportInfo.icon}</span>
            <span class="text-xs font-bold text-zinc-400 uppercase tracking-wider">${escapeHtml(a.sport)}</span>
            ${isCreator ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-orange/20 text-brand-orange border border-brand-orange/30">Hosted by You</span>` : ''}
          </div>
          <h4 class="text-base font-bold text-white mb-1">${escapeHtml(a.title)}</h4>
          <p class="text-xs text-zinc-400">📍 ${escapeHtml(a.location)} &bull; ⏰ ${escapeHtml(formatDisplayDate(a.dateTime))}</p>
        </div>
        <div class="flex items-center gap-3">
          <button onclick="window.UniSport.openRosterModal('${a.id}')" class="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition">
            View Roster (${(a.participants || []).length}/${a.maxParticipants})
          </button>
          <button onclick="window.UniSport.toggleJoinActivity('${a.id}')" class="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-950 text-red-300 text-xs font-semibold transition border border-red-900/50">
            Leave
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Profile tab data population and update handler
 */
function populateProfileTab() {
  if (!state.userProfile && !state.currentUser) return;
  const nameInput = document.getElementById("profile-name");
  const emailInput = document.getElementById("profile-email");
  const uniInput = document.getElementById("profile-university");
  const skillSelect = document.getElementById("profile-skill");

  if (nameInput) nameInput.value = state.userProfile?.displayName || "";
  if (emailInput) emailInput.value = state.currentUser?.email || "";
  if (uniInput) uniInput.value = state.userProfile?.university || "";
  if (skillSelect && state.userProfile?.skillLevel) skillSelect.value = state.userProfile.skillLevel;
}

function setupProfileForm() {
  const form = document.getElementById("profile-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!state.currentUser) return;

    const displayName = sanitize(document.getElementById("profile-name").value);
    const skillLevel = document.getElementById("profile-skill").value;

    const btn = document.getElementById("profile-save-btn");
    btn.disabled = true;
    btn.textContent = "Saving...";

    const res = await updateStudentProfile(state.currentUser.uid, {
      displayName,
      skillLevel
    });

    btn.disabled = false;
    btn.textContent = "Save Profile";

    if (res.success) {
      state.userProfile.displayName = displayName;
      state.userProfile.skillLevel = skillLevel;
      document.getElementById("user-display-name").textContent = displayName;
      alert("Profile updated successfully!");
    } else {
      alert("Failed to save profile: " + (res.error || "Unknown error"));
    }
  });

  const signOutBtn = document.getElementById("profile-signout-btn");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", async () => {
      await signOutStudent();
      switchTab("feed");
    });
  }
}

/**
 * Authentication Modal Handlers
 */
function setupAuthModals() {
  const modal = document.getElementById("auth-modal");
  const closeBtn = document.getElementById("auth-modal-close");
  const toggleAuthModeBtn = document.getElementById("toggle-auth-mode");
  const authForm = document.getElementById("auth-form");
  const navAuthBtn = document.getElementById("nav-auth-btn");

  if (closeBtn) closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
  if (navAuthBtn) navAuthBtn.addEventListener("click", () => openAuthModal("signin"));

  // Toggle between signin and signup
  if (toggleAuthModeBtn) {
    toggleAuthModeBtn.addEventListener("click", () => {
      const mode = modal.dataset.mode === "signin" ? "signup" : "signin";
      openAuthModal(mode);
    });
  }

  // Handle Auth submission
  if (authForm) {
    authForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const mode = modal.dataset.mode;
      const email = document.getElementById("auth-email").value;
      const password = document.getElementById("auth-password").value;
      const name = document.getElementById("auth-name") ? document.getElementById("auth-name").value : "";
      const errorMsg = document.getElementById("auth-error");
      const submitBtn = document.getElementById("auth-submit-btn");

      errorMsg.classList.add("hidden");
      submitBtn.disabled = true;
      submitBtn.textContent = mode === "signin" ? "Signing In..." : "Registering...";

      let result;
      if (mode === "signup") {
        result = await signUpStudent(email, password, name);
      } else {
        result = await signInStudent(email, password);
      }

      submitBtn.disabled = false;
      submitBtn.textContent = mode === "signin" ? "Sign In" : "Create Student Account";

      if (result.success) {
        modal.classList.add("hidden");
        authForm.reset();
      } else {
        errorMsg.textContent = result.error || "An error occurred";
        errorMsg.classList.remove("hidden");
      }
    });
  }

  // Close roster modal
  const closeRosterBtn = document.getElementById("roster-modal-close");
  if (closeRosterBtn) {
    closeRosterBtn.addEventListener("click", () => {
      document.getElementById("roster-modal").classList.add("hidden");
    });
  }
}

export function openAuthModal(mode = "signin") {
  const modal = document.getElementById("auth-modal");
  const title = document.getElementById("auth-modal-title");
  const sub = document.getElementById("auth-modal-sub");
  const nameField = document.getElementById("auth-name-container");
  const submitBtn = document.getElementById("auth-submit-btn");
  const toggleBtn = document.getElementById("toggle-auth-mode");
  const errorMsg = document.getElementById("auth-error");

  errorMsg.classList.add("hidden");
  modal.dataset.mode = mode;

  if (mode === "signup") {
    title.textContent = "Student Registration";
    sub.textContent = "Only @student.fontys.nl and @student.tue.nl accounts permitted.";
    nameField.classList.remove("hidden");
    submitBtn.textContent = "Create Student Account";
    toggleBtn.innerHTML = `Already have an account? <span class="text-brand-orange font-bold">Sign In</span>`;
  } else {
    title.textContent = "Student Sign In";
    sub.textContent = "Sign in with your verified Eindhoven student credentials.";
    nameField.classList.add("hidden");
    submitBtn.textContent = "Sign In";
    toggleBtn.innerHTML = `Don't have an account? <span class="text-brand-orange font-bold">Register</span>`;
  }

  modal.classList.remove("hidden");
}

/**
 * Open Roster View Modal
 */
export function openRosterModal(activityId) {
  const modal = document.getElementById("roster-modal");
  const content = document.getElementById("roster-modal-list");
  const title = document.getElementById("roster-modal-title");
  const activity = state.activities.find(a => a.id === activityId);

  if (!activity || !modal || !content) return;

  title.textContent = activity.title;
  const participants = activity.participants || [];

  content.innerHTML = participants.map((p, idx) => `
    <div class="flex items-center justify-between p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-brand-orange/20 border border-brand-orange/30 text-brand-orange flex items-center justify-center font-bold text-xs">
          ${escapeHtml((p.name || 'S').charAt(0).toUpperCase())}
        </div>
        <div>
          <p class="text-sm font-semibold text-white">${escapeHtml(p.name)}</p>
          <p class="text-xs text-zinc-400">${escapeHtml(p.university || 'Student')}</p>
        </div>
      </div>
      <span class="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">#${idx + 1}</span>
    </div>
  `).join('');

  modal.classList.remove("hidden");
}

// Global attachment for inline onclick calls
window.UniSport = {
  switchTab,
  openAuthModal,
  openRosterModal,
  toggleJoinActivity
};

// Start application upon DOM load
document.addEventListener("DOMContentLoaded", initApp);
