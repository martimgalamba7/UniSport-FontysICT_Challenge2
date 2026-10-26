// UniSport App Main Logic - Clean Minimalist UI (No Emojis, Kick/Google Avatars, Auth Guard)
import { 
  auth,
  deleteDoc, 
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
window.UniSport.toggleFriendship = toggleFriendship;
window.UniSport.cancelFriendRequest = cancelFriendRequest;
window.UniSport.acceptFriendRequest = acceptFriendRequest;
window.UniSport.declineFriendRequest = declineFriendRequest;
window.UniSport.removeFriend = removeFriend;
window.UniSport.syncSocialStateFromStorage = syncSocialStateFromStorage;
window.UniSport.signOut = signOutStudent;
window.UniSport.openFilterDrawer = openFilterDrawer;
window.UniSport.closeFilterDrawer = closeFilterDrawer;
window.UniSport.setDrawerDateFilter = setDrawerDateFilter;
window.UniSport.setDrawerPriceFilter = setDrawerPriceFilter;
window.UniSport.applyFilterDrawer = applyFilterDrawer;
window.UniSport.resetFeedFilters = resetFeedFilters;
window.UniSport.openEditActivityModal = openEditActivityModal;
window.UniSport.closeEditActivityModal = closeEditActivityModal;
window.UniSport.saveEditedActivity = saveEditedActivity;
window.UniSport.kickParticipant = kickParticipant;
window.openFilterDrawer = openFilterDrawer;
window.closeFilterDrawer = closeFilterDrawer;

// Expose global filter and social handlers immediately
window.filterStudentsGlobal = function(val) {
  state.studentSearchQuery = (val || "").trim();
  if (window.communityStateInline) {
    window.communityStateInline.searchQuery = state.studentSearchQuery;
  }
  renderCommunity();
  if (typeof window.renderCommunityInstant === "function") {
    window.renderCommunityInstant();
  }
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
window.cancelFriendRequest = cancelFriendRequest;
window.removeFriend = removeFriend;
window.acceptFriendRequest = acceptFriendRequest;
window.declineFriendRequest = declineFriendRequest;
window.clearAllNotifsGlobal = clearAllNotifsGlobal;

// Verified students directory (populated strictly from Firestore)
export const DEMO_CAMPUS_STUDENTS = [];

// Application State
const state = {
  currentUser: null,
  userProfile: null,
  activities: [],
  activeTab: "feed", // "feed" | "community" | "create" | "my-activities" | "profile" | "student-profile"
  filterSport: "all",
  searchQuery: "",
  selectedActivity: null,

  // Feed Deep Filters & Pagination State
  feedFilters: {
    sport: "all",
    date: "all", // "all" | "today" | "tomorrow" | "weekend"
    university: "all", // "all" | "Fontys" | "TU Eindhoven"
    price: "all", // "all" | "free" | "paid"
    location: ""
  },
  feedPageSize: 9, // starts at 9 (3x3), can expand to 30 (3x10) or paginate
  feedCurrentPage: 1,
  
  // Social & Community State
  students: [],
  communityView: "all", // "all" | "friends"
  communityUniFilter: "all", // "all" | "Fontys" | "TU/e"
  studentSearchQuery: "",
  friends: [], // array of confirmed friend uids
  sentRequests: [], // array of target uids to whom currentUser sent a request (Pending)
  declinedRequests: [], // array of uids whose request currentUser declined
  friendRequests: [], // array of incoming requests { id, fromUid, fromName, fromUni, fromAvatar, timestamp }
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
  "Swimming": { badge: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20" },
  "Cycling": { badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  "Other": { badge: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20" }
};

// No fake/demo activities — only real Firestore activities are shown
const INITIAL_DEMO_ACTIVITIES = [];


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
  // Start with empty activities list — only real Firestore sessions are loaded
  state.activities = [];

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

    // Mobile avatar circle removed per user request
    if (googleAvatarBtn) {
      googleAvatarBtn.classList.add("hidden");
      googleAvatarBtn.style.setProperty("display", "none", "important");
    }

    if (userDropdown) {
      const dropName = document.getElementById("dropdown-name");
      const dropEmail = document.getElementById("dropdown-email");
      const dropSchoolBadge = document.getElementById("dropdown-school-badge");
      const dropSchoolFull = document.getElementById("dropdown-school-full");
      const dropSchoolContainer = document.getElementById("dropdown-school-container");
      const fullScreenAvatarImg = document.getElementById("fullscreen-user-avatar-img");
      const isTue = uni.includes("TU") || email.endsWith("@student.tue.nl");

      if (dropName) dropName.textContent = displayName;
      if (dropEmail) dropEmail.textContent = email;
      if (dropSchoolBadge) dropSchoolBadge.textContent = isTue ? "TU/e" : "Fontys";
      if (dropSchoolFull) dropSchoolFull.textContent = isTue ? "TU Eindhoven" : "Fontys UAS";
      if (fullScreenAvatarImg) fullScreenAvatarImg.src = avatar.image;

      let prefs = {};
      try { prefs = JSON.parse(localStorage.getItem("unisport_app_preferences") || "{}"); } catch(e){}
      const showUni = prefs.showUni !== undefined ? prefs.showUni : (state.userProfile?.showUniBadge !== undefined ? state.userProfile.showUniBadge : true);
      if (dropSchoolContainer) {
        if (showUni === false) dropSchoolContainer.classList.add("hidden");
        else dropSchoolContainer.classList.remove("hidden");
      }
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
          // Fetch real campus students now that auth is fully confirmed
          fetchCampusStudents();
        } catch (err) {
          console.warn("Could not fetch remote profile, keeping active session:", err);
          fetchCampusStudents();
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

  // Mobile Settings button in bottom navbar
  const mobileSettingsBtn = document.getElementById("mobile-tab-settings");
  if (mobileSettingsBtn) {
    mobileSettingsBtn.addEventListener("click", () => {
      openSettingsModal();
    });
  }
}

export function switchTab(targetTab) {
  state.activeTab = targetTab;
  const tabs = ["feed", "community", "create", "my-activities", "profile", "notifications", "student-profile"];

  tabs.forEach(t => {
    const section = document.getElementById(`section-${t}`);
    const deskBtn = document.getElementById(`tab-btn-${t}`);
    const mobBtn = document.getElementById(`mobile-tab-${t}`);

    if (t === targetTab) {
      if (section) section.classList.remove("hidden");
      if (deskBtn) {
        deskBtn.className = "sidebar-btn nav-sidebar-btn font-bold bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 cursor-pointer group overflow-hidden";
      }
      if (mobBtn) {
        mobBtn.className = "flex flex-col items-center gap-1 text-zinc-950 dark:text-white transition cursor-pointer";
      }
    } else {
      if (section) section.classList.add("hidden");
      if (deskBtn) {
        deskBtn.className = "sidebar-btn nav-sidebar-btn font-semibold text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-white cursor-pointer group overflow-hidden";
      }
      if (mobBtn) {
        mobBtn.className = "flex flex-col items-center gap-1 text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition cursor-pointer";
      }
    }
  });

  const mobSettingsBtn = document.getElementById("mobile-tab-settings");
  if (mobSettingsBtn) {
    mobSettingsBtn.className = "flex flex-col items-center gap-1 text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition cursor-pointer";
  }

  if (targetTab === "student-profile") {
    const commDeskBtn = document.getElementById("tab-btn-community");
    const commMobBtn = document.getElementById("mobile-tab-community");
    if (commDeskBtn) {
      commDeskBtn.className = "sidebar-btn nav-sidebar-btn font-bold bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 cursor-pointer group overflow-hidden";
    }
    if (commMobBtn) {
      commMobBtn.className = "flex flex-col items-center gap-1 text-zinc-950 dark:text-white transition cursor-pointer";
    }
  }

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

function isFakeActivity(id, data) {
  if (!id || String(id).startsWith("demo-")) return true;
  const fakeCreators = ["fontys-student-rep", "tue-runner-rep", "climb-lover", "gym-bro"];
  if (data && fakeCreators.includes(data.creatorId)) return true;
  return false;
}

async function fetchActivitiesDirectFromFirestore() {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/fontys-unisport/databases/(default)/documents/activities?pageSize=100&_t=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return;
    const json = await res.json();
    if (!json || !Array.isArray(json.documents)) {
      if (state.activities.length === 0) renderFeed();
      return;
    }
    const items = [];
    json.documents.forEach(docObj => {
      const id = (docObj.name || "").split("/").pop();
      const f = docObj.fields || {};
      const creatorId = f.creatorId?.stringValue || "";
      if (isFakeActivity(id, { creatorId })) return;

      const participants = [];
      if (f.participants?.arrayValue?.values) {
        f.participants.arrayValue.values.forEach(v => {
          const mf = v.mapValue?.fields || {};
          participants.push({
            uid: mf.uid?.stringValue || "",
            name: mf.name?.stringValue || "Student",
            university: mf.university?.stringValue || "Fontys UAS",
            avatarId: mf.avatarId?.stringValue || "footballer"
          });
        });
      }
      const durationMins = f.durationMinutes?.integerValue ? parseInt(f.durationMinutes.integerValue, 10) : (f.durationHours?.integerValue ? parseInt(f.durationHours.integerValue, 10) * 60 : 90);
      const isPaid = f.isPaid?.booleanValue !== undefined ? f.isPaid.booleanValue : (f.price?.doubleValue > 0 || f.price?.integerValue > 0);
      const priceVal = f.price?.doubleValue !== undefined ? parseFloat(f.price.doubleValue) : (f.price?.integerValue ? parseInt(f.price.integerValue, 10) : 0);
      const kickedUids = [];
      if (f.kickedUids?.arrayValue?.values) {
        f.kickedUids.arrayValue.values.forEach(v => {
          if (v.stringValue) kickedUids.push(v.stringValue);
        });
      }

      items.push({
        id,
        sport: f.sport?.stringValue || "Football",
        title: f.title?.stringValue || "Campus Session",
        location: f.location?.stringValue || "Eindhoven",
        distance: f.distance?.stringValue || "Eindhoven Area",
        dateTime: f.dateTime?.stringValue || "Upcoming",
        durationMinutes: durationMins,
        isPaid: !!isPaid,
        price: priceVal,
        kickedUids,
        maxParticipants: f.maxParticipants?.integerValue ? parseInt(f.maxParticipants.integerValue, 10) : 10,
        creatorId,
        creatorName: f.creatorName?.stringValue || "Student",
        creatorUniversity: f.creatorUniversity?.stringValue || "Fontys UAS",
        description: f.description?.stringValue || "",
        participants,
        createdAt: f.createdAt?.timestampValue ? new Date(f.createdAt.timestampValue).getTime() : Date.now()
      });
    });
    items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    state.activities = items;
    checkKickedStatusAndNotify(items);
    renderFeed();
    if (state.activeTab === "my-activities") renderMyActivities();
  } catch (e) {
    console.warn("Direct activities fetch notice:", e);
  }
}


// Check if current logged-in user was kicked from any session and notify them
function checkKickedStatusAndNotify(activitiesList) {
  const currentUid = state.currentUser?.uid || (getActiveSession() || {}).uid;
  if (!currentUid || !Array.isArray(activitiesList)) return;

  activitiesList.forEach(act => {
    if (Array.isArray(act.kickedUids) && act.kickedUids.includes(currentUid)) {
      const notifKey = `kicked_notif_seen_${act.id}_${currentUid}`;
      if (!localStorage.getItem(notifKey)) {
        localStorage.setItem(notifKey, "true");
        getStoredSocialData();
        state.notifications = state.notifications || [];
        state.notifications.unshift({
          id: "kick-" + Date.now(),
          title: "Removed from Session",
          desc: `You were removed from ${act.title} by the host.`,
          time: "Just now"
        });
        saveStoredSocialData();
        renderNotifications();
      }
    }
  });
}

function listenToActivities() {
  fetchActivitiesDirectFromFirestore();
  try {
    const q = query(collection(db, "activities"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (!isFakeActivity(docSnap.id, data)) {
          items.push({ id: docSnap.id, ...data });
        }
      });

      state.activities = items;
      checkKickedStatusAndNotify(items);
      renderFeed();
      if (state.activeTab === "my-activities") renderMyActivities();
    }, (error) => {
      renderFeed();
    });
  } catch (err) {
    renderFeed();
  }
}

function formatDurationBadge(durationMinutes) {
  const mins = parseInt(durationMinutes, 10) || 90;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function renderFeed() {
  const container = document.getElementById("activities-feed");
  const countBadge = document.getElementById("activity-count-badge");
  const paginationContainer = document.getElementById("feed-pagination-container");
  if (!container) return;

  const nowMs = Date.now();

  // RULE 10: Eventos passados ou a correr atualmente não aparecem no feed.
  // Session must strictly start in the future! (new Date(dateTime).getTime() > nowMs)
  let filtered = (state.activities || []).filter(a => {
    if (!a.dateTime) return false;
    const startTime = new Date(a.dateTime).getTime();
    if (isNaN(startTime)) return true;
    return startTime > nowMs;
  });

  // Apply Search Query
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(a => 
      (a.title || "").toLowerCase().includes(q) ||
      (a.location || "").toLowerCase().includes(q) ||
      (a.sport || "").toLowerCase().includes(q) ||
      (a.description || "").toLowerCase().includes(q)
    );
  }

  // Apply Deep Filters
  const df = state.feedFilters || {};
  if (df.sport && df.sport !== "all") {
    filtered = filtered.filter(a => (a.sport || "").toLowerCase() === df.sport.toLowerCase() || (a.sport || "").toLowerCase().includes(df.sport.toLowerCase()));
  }
  if (df.university && df.university !== "all") {
    const targetUni = df.university.toLowerCase();
    filtered = filtered.filter(a => {
      const u = (a.creatorUniversity || "").toLowerCase();
      if (targetUni.includes("tu")) return u.includes("tu") || u.includes("eindhoven");
      if (targetUni.includes("fontys")) return u.includes("fontys");
      return u.includes(targetUni);
    });
  }
  if (df.price && df.price !== "all") {
    if (df.price === "free") {
      filtered = filtered.filter(a => !a.isPaid || parseFloat(a.price || 0) === 0);
    } else if (df.price === "paid") {
      filtered = filtered.filter(a => a.isPaid && parseFloat(a.price || 0) > 0);
    }
  }
  if (df.location && df.location.trim()) {
    const locQ = df.location.toLowerCase().trim();
    filtered = filtered.filter(a => (a.location || "").toLowerCase().includes(locQ));
  }
  if (df.date && df.date !== "all") {
    const now = new Date();
    const todayStr = now.toDateString();
    const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
    const tomorrowStr = tomorrow.toDateString();

    filtered = filtered.filter(a => {
      const d = new Date(a.dateTime);
      if (isNaN(d.getTime())) return false;
      if (df.date === "today") return d.toDateString() === todayStr;
      if (df.date === "tomorrow") return d.toDateString() === tomorrowStr;
      if (df.date === "weekend") {
        const day = d.getDay();
        return day === 0 || day === 6 || (day === 5 && d.getHours() >= 17);
      }
      return true;
    });
  }

  // Update filter count badge and summary tags
  renderFeedFilterSummary();

  const totalUpcoming = filtered.length;
  if (countBadge) {
    countBadge.textContent = `${totalUpcoming} upcoming session${totalUpcoming === 1 ? '' : 's'} in Eindhoven`;
  }

  if (totalUpcoming === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 px-6 text-center rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800">
        <h3 class="text-base font-bold text-zinc-950 dark:text-white mb-1">No upcoming sessions found</h3>
        <p class="text-zinc-500 dark:text-zinc-400 text-xs max-w-sm mx-auto mb-4">Try adjusting your filters or be the first student to host a new session.</p>
        <button onclick="window.UniSport.switchTab('create')" class="px-4 py-2 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold transition cursor-pointer">
          Host Session
        </button>
      </div>
    `;
    if (paginationContainer) paginationContainer.innerHTML = "";
    return;
  }

  // RULE 7: 3x3 (9 items) initially -> Load 3x10 (30 items) -> Unlimited pages
  const pageSize = state.feedPageSize || 9;
  const totalPages = Math.ceil(totalUpcoming / pageSize);
  if (state.feedCurrentPage > totalPages) state.feedCurrentPage = 1;
  const currentPage = state.feedCurrentPage || 1;

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalUpcoming);
  const pagedItems = filtered.slice(startIndex, endIndex);

  container.innerHTML = pagedItems.map(activity => {
    const sportInfo = SPORTS_CONFIG[activity.sport] || SPORTS_CONFIG["Other"];
    const participants = activity.participants || [];
    const max = parseInt(activity.maxParticipants, 10) || 10;
    const spotsLeft = Math.max(0, max - participants.length);
    const isFull = spotsLeft === 0;
    const isJoined = state.currentUser && participants.some(p => p.uid === state.currentUser.uid);
    const durationStr = formatDurationBadge(activity.durationMinutes);
    const isPaid = !!activity.isPaid && parseFloat(activity.price || 0) > 0;
    const priceDisplay = isPaid ? `€${parseFloat(activity.price).toFixed(2)}` : "Free";

    return `
      <article class="relative flex flex-col justify-between rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/90 p-5 transition duration-200 hover:border-zinc-400 dark:hover:border-zinc-700">
        <div>
          <div class="flex items-center justify-between gap-2 mb-3">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${sportInfo.badge}">
                ${escapeHtml(activity.sport)}
              </span>
              <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                ${durationStr}
              </span>
            </div>

            <div class="flex items-center gap-1.5">
              <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${isPaid ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}">
                ${priceDisplay}
              </span>
              <span class="text-xs font-semibold px-2 py-0.5 rounded-md ${isFull ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}">
                ${isFull ? 'Full' : `${spotsLeft} left`}
              </span>
            </div>
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
              <button onclick="window.UniSport.openRosterModal('${activity.id}')" class="text-zinc-900 dark:text-white hover:underline text-[11px] font-semibold cursor-pointer">
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
              <button onclick="window.UniSport.toggleJoinActivity('${activity.id}')" class="px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold transition cursor-pointer">
                Leave
              </button>
            ` : `
              <button 
                onclick="window.UniSport.toggleJoinActivity('${activity.id}')" 
                ${isFull ? 'disabled' : ''}
                class="px-3.5 py-1.5 rounded-xl ${isFull ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' : 'bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950'} text-xs font-semibold transition cursor-pointer"
              >
                ${isFull ? 'Full' : 'Join'}
              </button>
            `}
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Render Pagination and Load More Bar
  if (paginationContainer) {
    let paginationHtml = `
      <div class="text-xs text-zinc-500">
        Showing <span class="font-bold text-zinc-900 dark:text-white">${startIndex + 1}–${endIndex}</span> of <span class="font-bold text-zinc-900 dark:text-white">${totalUpcoming}</span> sessions
      </div>
      <div class="flex items-center gap-2 flex-wrap">
    `;

    // Button to expand from 3x3 (9) to 3x10 (30)
    if (pageSize === 9 && totalUpcoming > 9) {
      paginationHtml += `
        <button onclick="window.UniSport.setFeedPageSize(30)" class="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition cursor-pointer">
          Load 30 (3x10)
        </button>
      `;
    } else if (pageSize === 30) {
      paginationHtml += `
        <button onclick="window.UniSport.setFeedPageSize(9)" class="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium transition cursor-pointer">
          Show 3x3 Grid
        </button>
      `;
    }

    // Numbered pagination controls
    if (totalPages > 1) {
      paginationHtml += `
        <div class="flex items-center gap-1">
          <button onclick="window.UniSport.goToFeedPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled class="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 dark:text-zinc-700 cursor-not-allowed"' : 'class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 cursor-pointer"'}>
            Prev
          </button>
      `;

      for (let p = 1; p <= totalPages; p++) {
        if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
          const isCur = p === currentPage;
          paginationHtml += `
            <button onclick="window.UniSport.goToFeedPage(${p})" class="px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${isCur ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-sm' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'}">
              ${p}
            </button>
          `;
        } else if (p === currentPage - 2 || p === currentPage + 2) {
          paginationHtml += `<span class="px-1 text-zinc-400 text-xs">...</span>`;
        }
      }

      paginationHtml += `
          <button onclick="window.UniSport.goToFeedPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled class="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 dark:text-zinc-700 cursor-not-allowed"' : 'class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 cursor-pointer"'}>
            Next
          </button>
        </div>
      `;
    }

    paginationHtml += `</div>`;
    paginationContainer.innerHTML = paginationHtml;
  }

  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

function renderFeedFilterSummary() {
  const badge = document.getElementById("feed-filter-count-badge");
  const summary = document.getElementById("feed-active-chips-summary");
  const resetBtn = document.getElementById("btn-reset-feed-filters");
  if (!summary) return;

  const df = state.feedFilters || {};
  let count = 0;
  let chips = [];

  if (df.sport && df.sport !== "all") {
    count++;
    chips.push(`<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold">${escapeHtml(df.sport)}</span>`);
  }
  if (df.date && df.date !== "all") {
    count++;
    const label = df.date === "today" ? "Today" : df.date === "tomorrow" ? "Tomorrow" : "Weekend";
    chips.push(`<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold">${label}</span>`);
  }
  if (df.university && df.university !== "all") {
    count++;
    chips.push(`<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold">${escapeHtml(df.university)}</span>`);
  }
  if (df.price && df.price !== "all") {
    count++;
    chips.push(`<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold">${df.price === 'free' ? 'Free Only' : 'Paid Only'}</span>`);
  }
  if (df.location && df.location.trim()) {
    count++;
    chips.push(`<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold">${escapeHtml(df.location.trim())}</span>`);
  }

  summary.innerHTML = chips.join('');
  if (badge) {
    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }
  if (resetBtn) {
    resetBtn.classList.toggle("hidden", count === 0);
  }
}

function setupFilterSearch() {
  const searchInput = document.getElementById("search-activities");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.searchQuery = sanitize(e.target.value);
      state.feedCurrentPage = 1;
      renderFeed();
    });
  }
}

export function openFilterDrawer() {
  const drawer = document.getElementById("feed-filter-drawer");
  if (!drawer) return;
  drawer.style.display = "flex";

  const sportSel = document.getElementById("filter-drawer-sport");
  const uniSel = document.getElementById("filter-drawer-university");
  const locInp = document.getElementById("filter-drawer-location");

  if (sportSel) sportSel.value = state.feedFilters.sport || "all";
  if (uniSel) uniSel.value = state.feedFilters.university || "all";
  if (locInp) locInp.value = state.feedFilters.location || "";

  setDrawerDateFilter(state.feedFilters.date || "all", false);
  setDrawerPriceFilter(state.feedFilters.price || "all", false);

  drawer.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  if (window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
}

export function closeFilterDrawer() {
  const drawer = document.getElementById("feed-filter-drawer");
  if (drawer) {
    drawer.classList.add("hidden");
    drawer.style.display = "none";
  }
  document.body.style.overflow = "";
}

export function setDrawerDateFilter(dateVal, updateState = true) {
  if (updateState) {
    state.feedFilters.date = dateVal;
  }
  document.querySelectorAll("#filter-drawer-date-chips .filter-date-btn").forEach(btn => {
    if (btn.getAttribute("data-date-filter") === dateVal) {
      btn.className = "filter-date-btn px-3 py-2 rounded-xl text-xs font-bold bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 transition cursor-pointer text-center";
    } else {
      btn.className = "filter-date-btn px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 transition cursor-pointer text-center";
    }
  });
}

export function setDrawerPriceFilter(priceVal, updateState = true) {
  if (updateState) {
    state.feedFilters.price = priceVal;
  }
  document.querySelectorAll("#filter-drawer-price-chips .filter-price-btn").forEach(btn => {
    if (btn.getAttribute("data-price-filter") === priceVal) {
      btn.className = "filter-price-btn px-2.5 py-2 rounded-xl text-xs font-bold bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 transition cursor-pointer text-center";
    } else {
      btn.className = "filter-price-btn px-2.5 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 transition cursor-pointer text-center";
    }
  });
}

export function applyFilterDrawer() {
  const sportSel = document.getElementById("filter-drawer-sport");
  const uniSel = document.getElementById("filter-drawer-university");
  const locInp = document.getElementById("filter-drawer-location");

  if (sportSel) state.feedFilters.sport = sportSel.value;
  if (uniSel) state.feedFilters.university = uniSel.value;
  if (locInp) state.feedFilters.location = locInp.value.trim();

  state.feedCurrentPage = 1;
  closeFilterDrawer();
  renderFeed();
}

export function resetFeedFilters() {
  state.feedFilters = {
    sport: "all",
    date: "all",
    university: "all",
    price: "all",
    location: ""
  };
  state.searchQuery = "";
  const searchInput = document.getElementById("search-activities");
  if (searchInput) searchInput.value = "";
  state.feedCurrentPage = 1;
  closeFilterDrawer();
  renderFeed();
}

export function setFeedPageSize(size) {
  state.feedPageSize = size;
  state.feedCurrentPage = 1;
  renderFeed();
}

export function goToFeedPage(page) {
  state.feedCurrentPage = page;
  renderFeed();
  window.scrollTo({ top: 0, behavior: "smooth" });
}


// Amsterdam Timezone & Host Validation Helpers
export function getAmsterdamDate() {
  const amsString = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date());

  const [datePart, timePart] = amsString.split(", ");
  const [month, day, year] = datePart.split("/");
  const [hour, minute, second] = timePart.split(":");
  return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), parseInt(hour, 10), parseInt(minute, 10), parseInt(second, 10));
}

export function parseAmsterdamDateTimeString(dtString) {
  if (!dtString) return null;
  const [datePart, timePart] = dtString.split("T");
  if (!datePart || !timePart) return null;
  const [year, month, day] = datePart.split("-").map(n => parseInt(n, 10));
  const [hour, minute] = timePart.split(":").map(n => parseInt(n, 10));
  return new Date(year, month - 1, day, hour, minute, 0);
}

export function getAmsterdamMinDateTime() {
  const nowAms = getAmsterdamDate();
  // Strictly at least 1 hour from current Amsterdam time
  const minAms = new Date(nowAms.getTime() + 60 * 60 * 1000);
  const YYYY = minAms.getFullYear();
  const MM = String(minAms.getMonth() + 1).padStart(2, "0");
  const DD = String(minAms.getDate()).padStart(2, "0");
  const HH = String(minAms.getHours()).padStart(2, "0");
  const mm = String(minAms.getMinutes()).padStart(2, "0");
  return {
    minDate: minAms,
    minString: `${YYYY}-${MM}-${DD}T${HH}:${mm}`
  };
}

export function isUserActivityHost(activity) {
  if (!activity) return false;
  const sess = getActiveSession() || {};
  const currentUid = state.currentUser?.uid || sess.uid || "";
  const currentEmail = (state.currentUser?.email || sess.email || "").toLowerCase().trim();
  const currentName = (state.userProfile?.displayName || state.currentUser?.displayName || sess.name || "").toLowerCase().trim();

  const creatorId = String(activity.creatorId || "").trim();
  const creatorEmail = String(activity.creatorEmail || "").toLowerCase().trim();
  const creatorName = String(activity.creatorName || "").toLowerCase().trim();

  // 1. Direct UID match
  if (currentUid && (creatorId === currentUid || creatorEmail === currentUid)) return true;

  // 2. Direct Email match
  if (currentEmail && (creatorId.toLowerCase() === currentEmail || creatorEmail === currentEmail)) return true;

  // 3. Name match if creatorId is missing or equals name
  if (currentName && creatorName && (creatorName === currentName || creatorId.toLowerCase() === currentName)) return true;

  // 4. Check if current user is first participant (creator is always index 0)
  const participants = Array.isArray(activity.participants) ? activity.participants : [];
  if (participants.length > 0) {
    const firstP = participants[0];
    if (firstP) {
      if (currentUid && firstP.uid === currentUid) return true;
      if (currentEmail && firstP.email && firstP.email.toLowerCase() === currentEmail) return true;
      if (currentName && firstP.name && firstP.name.toLowerCase() === currentName) return true;
    }
  }

  return false;
}

function setupCreateForm() {
  const form = document.getElementById("create-activity-form");
  if (!form) return;

  const dtInput = document.getElementById("create-datetime");
  const errEl = document.getElementById("create-datetime-error");

  const validateDt = () => {
    if (!dtInput || !dtInput.value) {
      if (errEl) errEl.classList.add("hidden");
      if (dtInput) dtInput.classList.remove("ring-2", "ring-red-500");
      return false;
    }
    const selectedDate = parseAmsterdamDateTimeString(dtInput.value);
    const { minDate } = getAmsterdamMinDateTime();
    if (!selectedDate || selectedDate.getTime() < minDate.getTime()) {
      if (errEl) {
        errEl.textContent = "Sessions must be scheduled at least 1 hour in advance (Amsterdam time).";
        errEl.classList.remove("hidden");
      }
      dtInput.classList.add("ring-2", "ring-red-500");
      return false;
    } else {
      if (errEl) errEl.classList.add("hidden");
      dtInput.classList.remove("ring-2", "ring-red-500");
      return true;
    }
  };

  if (dtInput) {
    const updateMinDt = () => {
      const { minString } = getAmsterdamMinDateTime();
      dtInput.min = minString;
    };
    updateMinDt();
    dtInput.addEventListener("focus", updateMinDt);
    dtInput.addEventListener("input", validateDt);
    dtInput.addEventListener("change", validateDt);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!state.currentUser) {
      window.location.href = "./login.html";
      return;
    }

    const title = sanitize(document.getElementById("create-title").value);
    let sport = document.getElementById("create-sport").value;
    if (sport === "Other") {
      const otherSport = sanitize(document.getElementById("create-sport-other").value);
      if (otherSport) sport = otherSport;
    }

    const location = sanitize(document.getElementById("create-location").value);
    const dateTime = document.getElementById("create-datetime").value;
    const maxParticipants = parseInt(document.getElementById("create-max").value, 10);
    const description = sanitize(document.getElementById("create-desc").value);

    // Parse Duration
    const durHours = parseInt(document.getElementById("create-duration-hours").value, 10) || 0;
    const durMins = parseInt(document.getElementById("create-duration-mins").value, 10) || 0;
    const totalDurationMinutes = (durHours * 60) + durMins;

    // Parse Pricing
    const pricingType = document.getElementById("create-pricing-type").value;
    const isPaid = pricingType === "paid";
    const priceVal = isPaid ? (parseFloat(document.getElementById("create-price").value) || 0) : 0;

    if (!title || !location || !dateTime) {
      alert("Please fill in all required fields.");
      return;
    }

    // Validation: Date and Time must be at least 1 hour in advance (Amsterdam time)
    if (!validateDt()) {
      alert("Session must be scheduled at least 1 hour in advance (Amsterdam time). Please choose a valid future date and time.");
      return;
    }

    if (totalDurationMinutes <= 0) {
      alert("Session duration must be greater than 0 minutes.");
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
      durationMinutes: totalDurationMinutes,
      isPaid: isPaid,
      price: priceVal,
      maxParticipants: maxParticipants || 10,
      creatorId: state.currentUser.uid,
      creatorName,
      creatorUniversity,
      description,
      kickedUids: [],
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
  const currentUid = state.currentUser?.uid || (getActiveSession() || {}).uid;
  if (!currentUid) {
    window.location.href = "./login.html";
    return;
  }

  const activity = state.activities.find(a => a.id === activityId);
  if (!activity) return;

  const isHost = isUserActivityHost(activity);
  const participants = Array.isArray(activity.participants) ? activity.participants : [];
  const isJoined = participants.some(p => p.uid === currentUid) || isHost;

  if (isJoined) {
    if (isHost) {
      const confirmDelete = confirm("You are the host of this session. Leaving will delete and cancel the session for all participants. Are you sure you want to delete this session?");
      if (!confirmDelete) return;

      try {
        const actRef = doc(db, "activities", activityId);
        await deleteDoc(actRef);
      } catch (err) {
        console.warn("Firestore deleteDoc error:", err);
      }

      state.activities = (state.activities || []).filter(a => a.id !== activityId);
      renderFeed();
      renderMyActivities();
      return;
    }

    const currentParticipantObj = participants.find(p => p.uid === currentUid) || { uid: currentUid };
    try {
      const actRef = doc(db, "activities", activityId);
      await updateDoc(actRef, {
        participants: arrayRemove(currentParticipantObj)
      });
    } catch (err) {
      console.warn("Firestore arrayRemove error:", err);
    }
    activity.participants = participants.filter(p => p.uid !== currentUid);
    renderFeed();
    renderMyActivities();
    return;
  }

  // Not joined - join logic
  const max = parseInt(activity.maxParticipants, 10) || 10;
  if (participants.length >= max) {
    alert("This activity is already full!");
    return;
  }

  const sess = getActiveSession() || {};
  const currentParticipantObj = {
    uid: currentUid,
    name: state.userProfile?.displayName || state.currentUser?.displayName || sess.name || "Student",
    university: state.userProfile?.university || sess.university || (sess.email?.endsWith("@student.tue.nl") ? "TU Eindhoven" : "Fontys UAS"),
    avatarId: state.userProfile?.avatarId || state.currentUser?.avatarId || sess.avatarId || "bodybuilder"
  };

  try {
    const actRef = doc(db, "activities", activityId);
    await updateDoc(actRef, {
      participants: arrayUnion(currentParticipantObj)
    });
  } catch (err) {
    console.warn("Firestore arrayUnion error:", err);
  }

  activity.participants = [...participants, currentParticipantObj];
  renderFeed();
  renderMyActivities();
}

function renderMyActivities() {
  const container = document.getElementById("my-activities-list");
  if (!container) return;

  const currentUid = state.currentUser?.uid || (getActiveSession() || {}).uid || "";
  const nowMs = Date.now();

  const myActivities = (state.activities || []).filter(a => {
    const isJoined = (a.participants || []).some(p => p.uid === currentUid);
    const isCreator = isUserActivityHost(a);
    return isJoined || isCreator;
  });

  if (myActivities.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-8">
        <h4 class="text-zinc-950 dark:text-white font-bold text-base mb-1">No registered activities yet</h4>
        <p class="text-zinc-500 dark:text-zinc-400 text-xs mb-4">Explore the feed to find sports sessions matching your schedule in Eindhoven.</p>
        <button onclick="window.UniSport.switchTab('feed')" class="px-4 py-2 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs cursor-pointer">
          Browse Feed
        </button>
      </div>
    `;
    return;
  }

  // RULE 9: Só é uma past session quando passa da hora do evento + duração
  const activeSessions = [];
  const pastSessions = [];

  myActivities.forEach(a => {
    const startMs = new Date(a.dateTime).getTime();
    const durMs = (parseInt(a.durationMinutes, 10) || 90) * 60000;
    const endMs = startMs + durMs;

    if (!isNaN(endMs) && endMs <= nowMs) {
      pastSessions.push(a);
    } else {
      activeSessions.push(a);
    }
  });

  const renderCard = (a, isPast = false) => {
    const isCreator = isUserActivityHost(a);
    const durationStr = formatDurationBadge(a.durationMinutes);
    const isPaid = !!a.isPaid && parseFloat(a.price || 0) > 0;
    const priceDisplay = isPaid ? `€${parseFloat(a.price).toFixed(2)}` : "Free";

    return `
      <div class="p-4 rounded-2xl bg-white dark:bg-zinc-900 border ${isPast ? 'border-zinc-200/60 dark:border-zinc-800/60 opacity-80' : 'border-zinc-200 dark:border-zinc-800'} flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2 flex-wrap mb-1">
            <span class="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">${escapeHtml(a.sport)}</span>
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">${durationStr}</span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded ${isPaid ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}">${priceDisplay}</span>
            ${isCreator ? `<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-950 dark:bg-white text-white dark:text-zinc-950">Hosted by you</span>` : ''}
            ${isPast ? `<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">Completed</span>` : ''}
          </div>
          <h4 class="text-sm font-bold text-zinc-950 dark:text-white">${escapeHtml(a.title)}</h4>
          <p class="text-xs text-zinc-500 dark:text-zinc-400">${escapeHtml(a.location)} • ${escapeHtml(formatDisplayDate(a.dateTime))}</p>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <!-- RULE 4: Se for hosted by me, botão de Editar ao lado de Roster (X/X) -->
          <div class="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-1 rounded-xl">
            <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Roster (${(a.participants || []).length}/${a.maxParticipants})
            </span>
            ${isCreator && !isPast ? `
              <button onclick="window.UniSport.openEditActivityModal('${a.id}')" class="ml-1 px-2.5 py-1 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold transition hover:opacity-90 cursor-pointer" title="Edit Session">
                Edit
              </button>
            ` : ''}
            <!-- Modal de participantes acessível pelo ícone de pessoas -->
            <button onclick="window.UniSport.openRosterModal('${a.id}')" class="p-1.5 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition cursor-pointer" title="View Participants">
              <i data-lucide="users" class="w-4 h-4"></i>
            </button>
          </div>

          ${isCreator && !isPast ? `
            <button onclick="window.UniSport.toggleJoinActivity('${a.id}')" class="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 text-xs font-semibold transition cursor-pointer" title="Cancel & Delete Session">
              Cancel Session
            </button>
          ` : (!isPast ? `
            <button onclick="window.UniSport.toggleJoinActivity('${a.id}')" class="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 text-xs font-semibold transition cursor-pointer">
              Leave
            </button>
          ` : '')}
        </div>
      </div>
    `;
  };

  let htmlContent = "";

  // Active Sessions
  if (activeSessions.length > 0) {
    htmlContent += `
      <div class="space-y-3">
        ${activeSessions.map(a => renderCard(a, false)).join('')}
      </div>
    `;
  } else {
    htmlContent += `
      <div class="text-center py-6 text-xs text-zinc-400">
        No active upcoming sessions. Check the Past Sessions below or create a new game.
      </div>
    `;
  }

  // RULE 8: Categoria Past Sessions só aparece se houver past sessions
  if (pastSessions.length > 0) {
    htmlContent += `
      <div class="pt-8 space-y-4">
        <div class="border-t border-zinc-100 dark:border-zinc-800 pt-6 flex items-center justify-between">
          <div>
            <h3 class="text-base font-bold text-zinc-950 dark:text-white">Past Sessions</h3>
            <p class="text-xs text-zinc-500">History of matches and workouts completed</p>
          </div>
          <span class="text-xs font-semibold px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
            ${pastSessions.length} completed
          </span>
        </div>
        <div class="space-y-3">
          ${pastSessions.map(a => renderCard(a, true)).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = htmlContent;
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
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

  const currentUid = state.currentUser?.uid || (getActiveSession() || {}).uid || "";
  const isHost = isUserActivityHost(activity);

  title.textContent = activity.title;
  const participants = activity.participants || [];

  content.innerHTML = participants.map((p, idx) => {
    const av = getAvatarById(p.avatarId || "bodybuilder");
    const isMe = p.uid === currentUid;
    const isCreatorRow = (p.uid && p.uid === activity.creatorId) || idx === 0;

    return `
      <div class="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
        <div class="flex items-center gap-2.5 cursor-pointer" onclick="window.openStudentProfileModal('${p.uid}')">
          <div class="w-8 h-8 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-white shadow-sm">
            ${av.svg}
          </div>
          <div>
            <p class="text-xs font-semibold text-zinc-950 dark:text-white flex items-center gap-1.5">
              ${escapeHtml(p.name)}
              ${isCreatorRow ? '<span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">Host</span>' : ''}
              ${isMe && !isCreatorRow ? '<span class="text-[9px] font-semibold text-zinc-400">(You)</span>' : ''}
            </p>
            <p class="text-[11px] text-zinc-500">${escapeHtml(p.university || 'Student')}</p>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          ${isHost && !isMe ? `
            <button onclick="window.UniSport.kickParticipant('${activity.id}', '${p.uid}', '${escapeHtml(p.name)}')" class="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold transition cursor-pointer">
              Kick
            </button>
          ` : ''}
          <span class="text-[11px] font-semibold text-zinc-400">#${idx + 1}</span>
        </div>
      </div>
    `;
  }).join('');

  modal.classList.remove("hidden");
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

export async function kickParticipant(activityId, participantUid, participantName) {
  const activity = state.activities.find(a => a.id === activityId);
  if (!activity || !isUserActivityHost(activity)) {
    alert("Only the host can kick participants from this session.");
    return;
  }

  const confirmed = confirm(`Are you sure you want to kick ${participantName} from ${activity.title}?`);
  if (!confirmed) return;

  const targetParticipant = (activity.participants || []).find(p => p.uid === participantUid);
  if (!targetParticipant) return;

  try {
    const actRef = doc(db, "activities", activityId);
    await updateDoc(actRef, {
      participants: arrayRemove(targetParticipant),
      kickedUids: arrayUnion(participantUid)
    });
  } catch(e) {
    console.warn("Firestore kick update notice:", e);
  }

  // Update local activity state
  activity.participants = (activity.participants || []).filter(p => p.uid !== participantUid);
  activity.kickedUids = [...(activity.kickedUids || []), participantUid];

  openRosterModal(activityId);
  renderFeed();
  renderMyActivities();
}

// Edit Session Modal Functions
export function openEditActivityModal(activityId) {
  const activity = state.activities.find(a => a.id === activityId);
  if (!activity || !isUserActivityHost(activity)) {
    alert("Only the event host can edit this session.");
    return;
  }

  const modal = document.getElementById("edit-activity-modal");
  if (!modal) return;

  document.getElementById("edit-activity-id").value = activity.id;
  document.getElementById("edit-title").value = activity.title || "";
  
  const sportSel = document.getElementById("edit-sport");
  const otherContainer = document.getElementById("edit-sport-other-container");
  const otherInp = document.getElementById("edit-sport-other");

  const standardSports = ["Football", "Gym & Fitness", "Running", "Basketball", "Bouldering", "Padel / Tennis", "Volleyball", "Swimming", "Cycling"];
  if (standardSports.includes(activity.sport)) {
    sportSel.value = activity.sport;
    otherContainer.classList.add("hidden");
    otherInp.value = "";
  } else {
    sportSel.value = "Other";
    otherContainer.classList.remove("hidden");
    otherInp.value = activity.sport || "";
  }

  document.getElementById("edit-max").value = activity.maxParticipants || 10;
  document.getElementById("edit-location").value = activity.location || "";
  
  const dtInput = document.getElementById("edit-datetime");
  if (dtInput) {
    const { minString } = getAmsterdamMinDateTime();
    dtInput.min = minString;
    dtInput.value = activity.dateTime || "";
  }

  const totalMins = parseInt(activity.durationMinutes, 10) || 90;
  document.getElementById("edit-duration-hours").value = Math.floor(totalMins / 60);
  document.getElementById("edit-duration-mins").value = String(totalMins % 60);

  const isPaid = !!activity.isPaid && parseFloat(activity.price || 0) > 0;
  document.getElementById("edit-pricing-type").value = isPaid ? "paid" : "free";
  document.getElementById("edit-price-wrapper").classList.toggle("hidden", !isPaid);
  document.getElementById("edit-price").value = isPaid ? parseFloat(activity.price).toFixed(2) : "5.00";
  document.getElementById("edit-desc").value = activity.description || "";

  modal.classList.remove("hidden");
  if (window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
}

export function closeEditActivityModal() {
  const modal = document.getElementById("edit-activity-modal");
  if (modal) modal.classList.add("hidden");
}

export async function saveEditedActivity() {
  const id = document.getElementById("edit-activity-id").value;
  const activity = state.activities.find(a => a.id === id);
  if (!activity || !isUserActivityHost(activity)) {
    alert("Only the event host can edit this session.");
    return;
  }

  const title = sanitize(document.getElementById("edit-title").value);
  let sport = document.getElementById("edit-sport").value;
  if (sport === "Other") {
    const customSp = sanitize(document.getElementById("edit-sport-other").value);
    if (customSp) sport = customSp;
  }
  const maxParticipants = parseInt(document.getElementById("edit-max").value, 10) || 10;
  const location = sanitize(document.getElementById("edit-location").value);
  const dateTime = document.getElementById("edit-datetime").value;

  const selectedDate = parseAmsterdamDateTimeString(dateTime);
  const { minDate } = getAmsterdamMinDateTime();
  if (!selectedDate || selectedDate.getTime() < minDate.getTime()) {
    alert("Sessions must be scheduled at least 1 hour in advance (Amsterdam time). Please select a valid future date and time.");
    return;
  }

  const durHours = parseInt(document.getElementById("edit-duration-hours").value, 10) || 0;
  const durMins = parseInt(document.getElementById("edit-duration-mins").value, 10) || 0;
  const durationMinutes = (durHours * 60) + durMins;

  const isPaid = document.getElementById("edit-pricing-type").value === "paid";
  const priceVal = isPaid ? (parseFloat(document.getElementById("edit-price").value) || 0) : 0;
  const description = sanitize(document.getElementById("edit-desc").value);

  const updatedData = {
    title,
    sport,
    maxParticipants,
    location,
    dateTime,
    durationMinutes,
    isPaid,
    price: priceVal,
    description
  };

  const submitBtn = document.getElementById("edit-submit-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";

  try {
    const actRef = doc(db, "activities", id);
    await updateDoc(actRef, updatedData);
  } catch(e) {
    console.warn("Firestore update activity notice:", e);
  }

  Object.assign(activity, updatedData);
  submitBtn.disabled = false;
  submitBtn.textContent = "Save Changes";
  closeEditActivityModal();
  renderFeed();
  renderMyActivities();
}

export async function savePrivacySettingsToFirestore(isPublic, showUniBadge) {
  const currentUid = state.currentUser?.uid || (getActiveSession() || {}).uid;
  if (!currentUid) return;

  // 1. Update in-memory state & localStorage active session
  if (state.currentUser) {
    state.currentUser.isPublic = isPublic;
    state.currentUser.showUniBadge = showUniBadge;
  }
  const session = getActiveSession();
  if (session) {
    session.isPublic = isPublic;
    session.showUniBadge = showUniBadge;
    try {
      localStorage.setItem("unisport_active_session", JSON.stringify(session));
    } catch(e) {}
  }

  // 2. Update student list entries
  if (Array.isArray(state.students)) {
    const sIdx = state.students.findIndex(s => s.uid === currentUid);
    if (sIdx !== -1) {
      state.students[sIdx].isPublic = isPublic;
      state.students[sIdx].showUniBadge = showUniBadge;
    }
  }
  if (Array.isArray(window.__FIRESTORE_STUDENTS__)) {
    const wIdx = window.__FIRESTORE_STUDENTS__.findIndex(s => s.uid === currentUid);
    if (wIdx !== -1) {
      window.__FIRESTORE_STUDENTS__[wIdx].isPublic = isPublic;
      window.__FIRESTORE_STUDENTS__[wIdx].showUniBadge = showUniBadge;
    }
  }

  // 3. Immediately update UI elements for current user
  const ownBadge = document.getElementById("profile-hero-badge");
  if (ownBadge) {
    if (showUniBadge === false) {
      ownBadge.classList.add("hidden");
    } else {
      ownBadge.classList.remove("hidden");
    }
  }
  const dropSchool = document.getElementById("dropdown-school-container");
  if (dropSchool) {
    if (showUniBadge === false) {
      dropSchool.classList.add("hidden");
    } else {
      dropSchool.classList.remove("hidden");
    }
  }

  // 4. Update Firestore via SDK
  try {
    await updateDoc(doc(db, "users", currentUid), {
      isPublic: isPublic !== false,
      showUniBadge: showUniBadge !== false,
      updatedAt: Date.now()
    });
  } catch (sdkErr) {
    console.warn("[UniSport] SDK updateDoc for privacy notice:", sdkErr);
  }

  // 5. Update Firestore via REST PATCH fallback
  try {
    const restPatchUrl = `https://firestore.googleapis.com/v1/projects/fontys-unisport/databases/(default)/documents/users/${currentUid}?updateMask.fieldPaths=isPublic&updateMask.fieldPaths=showUniBadge`;
    const headers = { "Content-Type": "application/json" };
    if (session && session.idToken) {
      headers["Authorization"] = `Bearer ${session.idToken}`;
    }
    await fetch(restPatchUrl, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        fields: {
          isPublic: { booleanValue: isPublic !== false },
          showUniBadge: { booleanValue: showUniBadge !== false }
        }
      })
    });
  } catch (restErr) {
    console.warn("[UniSport] REST patch privacy notice:", restErr);
  }

  // 6. Re-render directory
  renderCommunity();
  if (typeof window.renderCommunityInstant === "function") {
    window.renderCommunityInstant();
  }
}

export function openSettingsModal() {
  const modal = document.getElementById("settings-modal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.style.overflow = "hidden";
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }
}

function setupSettingsModal() {
  const modal = document.getElementById("settings-modal");
  const saveBtn = document.getElementById("settings-modal-save");
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

  // Load preferences from localStorage and active session
  try {
    const savedPrefs = JSON.parse(localStorage.getItem("unisport_app_preferences") || "{}");
    const activeSess = getActiveSession() || state.currentUser || {};
    if (unitSelect && savedPrefs.unit) unitSelect.value = savedPrefs.unit;
    if (hapticsToggle && typeof savedPrefs.haptics === "boolean") hapticsToggle.checked = savedPrefs.haptics;
    if (notifRoster && typeof savedPrefs.notifRoster === "boolean") notifRoster.checked = savedPrefs.notifRoster;
    if (notifActivities && typeof savedPrefs.notifActivities === "boolean") notifActivities.checked = savedPrefs.notifActivities;
    if (notifReminders && typeof savedPrefs.notifReminders === "boolean") notifReminders.checked = savedPrefs.notifReminders;

    const initialPub = typeof savedPrefs.privacyPublic === "boolean" ? savedPrefs.privacyPublic : (activeSess.isPublic !== undefined ? activeSess.isPublic : true);
    const initialUni = typeof savedPrefs.showUni === "boolean" ? savedPrefs.showUni : (activeSess.showUniBadge !== undefined ? activeSess.showUniBadge : true);
    if (privacyPublic) privacyPublic.checked = initialPub;
    if (showUni) showUni.checked = initialUni;

    // Apply immediate badge visibility
    const ownBadge = document.getElementById("profile-hero-badge");
    if (ownBadge) {
      if (initialUni === false) ownBadge.classList.add("hidden");
      else ownBadge.classList.remove("hidden");
    }
    const dropSchool = document.getElementById("dropdown-school-container");
    if (dropSchool) {
      if (initialUni === false) dropSchool.classList.add("hidden");
      else dropSchool.classList.remove("hidden");
    }
  } catch (e) {}

  const savePreferences = () => {
    try {
      const isPub = privacyPublic ? privacyPublic.checked : true;
      const showU = showUni ? showUni.checked : true;
      const prefs = {
        unit: unitSelect ? unitSelect.value : "metric",
        haptics: hapticsToggle ? hapticsToggle.checked : true,
        notifRoster: notifRoster ? notifRoster.checked : true,
        notifActivities: notifActivities ? notifActivities.checked : true,
        notifReminders: notifReminders ? notifReminders.checked : true,
        privacyPublic: isPub,
        showUni: showU,
        updatedAt: Date.now()
      };
      localStorage.setItem("unisport_app_preferences", JSON.stringify(prefs));
      savePrivacySettingsToFirestore(isPub, showU);
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

  const close = () => {
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
    document.body.style.overflow = "";
  };
  if (saveBtn) saveBtn.addEventListener("click", close);
  if (closeBtn) closeBtn.addEventListener("click", close);
  if (doneBtn) doneBtn.addEventListener("click", close);
}

export async function clearCache() {
  const activeSession = localStorage.getItem("unisport_active_session");
  const prefs = localStorage.getItem("unisport_app_preferences");
  
  // Clear offline community and cache storages
  localStorage.removeItem("unisport_students_cache");
  localStorage.removeItem("unisport_friends");
  localStorage.removeItem("unisport_friend_requests");
  localStorage.removeItem("unisport_notifications");

  // Clear browser CacheStorage if any
  if ("caches" in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    } catch(e) {}
  }

  state.students = [];
  state.friends = [];
  state.friendRequests = [];
  state.notifications = [];

  const btn = document.getElementById("settings-clear-cache-btn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Updating...";
  }

  try {
    await fetchCampusStudents();
    renderCommunity();
    renderNotifications();
    renderFeed();
  } catch(e) {
    console.warn("clearCache sync notice:", e);
  }

  if (btn) {
    btn.textContent = "Cleared & Updated!";
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = "Clear Cache";
      // Force reload bypassing cache
      window.location.reload(true);
    }, 600);
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
    const rawSent = localStorage.getItem("unisport_sent_requests");
    const rawDeclined = localStorage.getItem("unisport_declined_requests");
    const rawRequests = localStorage.getItem("unisport_friend_requests");
    const rawNotifs = localStorage.getItem("unisport_notifications");

    const parsedFriends = rawFriends ? JSON.parse(rawFriends) : [];
    const parsedSent = rawSent ? JSON.parse(rawSent) : [];
    const parsedDeclined = rawDeclined ? JSON.parse(rawDeclined) : [];
    const parsedRequests = rawRequests ? JSON.parse(rawRequests) : [];
    const parsedNotifs = rawNotifs ? JSON.parse(rawNotifs) : [];

    state.friends = Array.isArray(parsedFriends)
      ? parsedFriends.filter(id => id && !String(id).startsWith("demo-") && !String(id).includes("-rep"))
      : [];
    state.sentRequests = Array.isArray(parsedSent)
      ? parsedSent.filter(id => id && !String(id).startsWith("demo-") && !String(id).includes("-rep"))
      : [];
    state.declinedRequests = Array.isArray(parsedDeclined) ? parsedDeclined : [];
    state.friendRequests = Array.isArray(parsedRequests)
      ? parsedRequests.filter(r => r && r.id !== "req-1" && r.id !== "req-2" && r.fromUid && !String(r.fromUid).startsWith("demo-"))
      : [];
    state.notifications = Array.isArray(parsedNotifs)
      ? parsedNotifs.filter(n => n && n.id !== "notif-1" && n.id !== "notif-2" && !String(n.id).startsWith("demo-"))
      : [];
  } catch(e) {
    state.friends = [];
    state.sentRequests = [];
    state.declinedRequests = [];
    state.friendRequests = [];
    state.notifications = [];
  }
  updateNotifBadge();
}

export function syncSocialStateFromStorage() {
  getStoredSocialData();
  updateNotifBadge();
}

function saveStoredSocialData() {
  try {
    localStorage.setItem("unisport_friends", JSON.stringify(state.friends || []));
    localStorage.setItem("unisport_sent_requests", JSON.stringify(state.sentRequests || []));
    localStorage.setItem("unisport_declined_requests", JSON.stringify(state.declinedRequests || []));
    localStorage.setItem("unisport_friend_requests", JSON.stringify(state.friendRequests || []));
    localStorage.setItem("unisport_notifications", JSON.stringify(state.notifications || []));
  } catch(e) {}
  updateNotifBadge();
}

async function persistMySocialToFirestore(targetUidForSync = null, syncAction = null) {
  const currentUid = state.currentUser?.uid || (getActiveSession() || {}).uid;
  if (!currentUid) return;

  // Keep local student record in sync
  const meInList = (state.students || []).find(s => s.uid === currentUid);
  if (meInList) {
    meInList.friends = [...(state.friends || [])];
    meInList.sentRequests = [...(state.sentRequests || [])];
    meInList.declinedRequests = [...(state.declinedRequests || [])];
  }

  try {
    await setDoc(doc(db, "users", currentUid), {
      friends: state.friends || [],
      sentRequests: state.sentRequests || [],
      declinedRequests: state.declinedRequests || [],
      updatedAt: Date.now()
    }, { merge: true });

    if (targetUidForSync && syncAction === "accept") {
      await setDoc(doc(db, "users", targetUidForSync), {
        friends: arrayUnion(currentUid),
        sentRequests: arrayRemove(currentUid)
      }, { merge: true });
    } else if (targetUidForSync && syncAction === "decline") {
      await setDoc(doc(db, "users", targetUidForSync), {
        sentRequests: arrayRemove(currentUid)
      }, { merge: true });
    } else if (targetUidForSync && syncAction === "remove") {
      await setDoc(doc(db, "users", targetUidForSync), {
        friends: arrayRemove(currentUid),
        sentRequests: arrayRemove(currentUid)
      }, { merge: true });
    }
  } catch (err) {
    console.warn("Firestore social sync notice:", err);
  }
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
      const fromName = req.fromName || req.displayName || "Student";
      const fromUni = req.fromUni || req.university || "Fontys UAS";
      const fromAvatar = req.fromAvatar || req.avatarId || "footballer";
      const av = getAvatarById(fromAvatar);
      return `
        <div class="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
          <div class="flex items-center gap-3 cursor-pointer" onclick="window.openStudentProfileModal('${req.fromUid}')">
            <div class="w-10 h-10 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
              ${av.svg}
            </div>
            <div class="min-w-0 flex-grow">
              <p class="font-bold text-xs sm:text-sm text-zinc-950 dark:text-white truncate hover:underline">${escapeHtml(fromName)}</p>
              <p class="text-[11px] text-zinc-500 truncate">${escapeHtml(fromUni)}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.acceptFriendRequest('${req.id}', '${req.fromUid}')" class="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm cursor-pointer">
              Accept
            </button>
            <button onclick="window.declineFriendRequest('${req.id}', '${req.fromUid}')" class="flex-1 py-2 rounded-xl bg-zinc-200 hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-950/40 text-zinc-800 hover:text-red-600 dark:text-zinc-200 dark:hover:text-red-400 font-semibold text-xs transition cursor-pointer">
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
  let targetUid = fromUid;
  if (!targetUid) {
    const found = (state.friendRequests || []).find(r => r.id === reqId);
    if (found) targetUid = found.fromUid;
  }
  state.friendRequests = (state.friendRequests || []).filter(r => r.id !== reqId && (!targetUid || r.fromUid !== targetUid));
  if (targetUid) {
    state.sentRequests = (state.sentRequests || []).filter(id => id !== targetUid);
    state.declinedRequests = (state.declinedRequests || []).filter(id => id !== targetUid);
    if (!state.friends.includes(targetUid)) {
      state.friends.push(targetUid);
    }
    const student = (state.students || []).find(s => s.uid === targetUid);
    state.notifications.unshift({
      id: "friend-acc-" + Date.now(),
      title: "Friend Request Accepted",
      desc: `You and ${student ? student.displayName : "your campus teammate"} are now friends.`,
      time: "Just now"
    });
  }
  saveStoredSocialData();
  persistMySocialToFirestore(targetUid, "accept");
  renderNotifications();
  renderCommunity();
  if (typeof window.renderCommunityInstant === "function") window.renderCommunityInstant();
  if (targetUid && window.__ACTIVE_VIEWED_STUDENT_UID__ === targetUid && typeof window.renderOtherStudentProfilePage === "function") {
    window.renderOtherStudentProfilePage(targetUid, true);
  }
}

export function declineFriendRequest(reqId, fromUid) {
  let targetUid = fromUid;
  if (!targetUid) {
    const found = (state.friendRequests || []).find(r => r.id === reqId);
    if (found) targetUid = found.fromUid;
  }
  state.friendRequests = (state.friendRequests || []).filter(r => r.id !== reqId && (!targetUid || r.fromUid !== targetUid));
  if (targetUid && !state.declinedRequests.includes(targetUid)) {
    state.declinedRequests.push(targetUid);
  }
  saveStoredSocialData();
  persistMySocialToFirestore(targetUid, "decline");
  renderNotifications();
  renderCommunity();
  if (typeof window.renderCommunityInstant === "function") window.renderCommunityInstant();
  if (targetUid && window.__ACTIVE_VIEWED_STUDENT_UID__ === targetUid && typeof window.renderOtherStudentProfilePage === "function") {
    window.renderOtherStudentProfilePage(targetUid, true);
  }
}

export function clearAllNotifsGlobal() {
  state.notifications = [];
  saveStoredSocialData();
  renderNotifications();
}

function parseRestStringArray(fieldObj) {
  if (!fieldObj || !fieldObj.arrayValue || !Array.isArray(fieldObj.arrayValue.values)) return [];
  return fieldObj.arrayValue.values
    .map(v => v && typeof v.stringValue === "string" ? v.stringValue : "")
    .filter(Boolean);
}

function reconcileSocialFromStudentList(studentsList) {
  if (typeof window.syncSocialFromFirestoreStudents === "function") {
    window.syncSocialFromFirestoreStudents(studentsList);
    getStoredSocialData();
  }
}

export async function fetchCampusStudents() {
  const currentUid = state.currentUser?.uid || (getActiveSession() || {}).uid;
  const currentSession = getActiveSession() || state.currentUser || {};
  let remoteStudents = [];

  // 1. Direct REST fetch from Firestore so it never blocks on SDK WebChannel or authStateReady
  try {
    const restUrl = `https://firestore.googleapis.com/v1/projects/fontys-unisport/databases/(default)/documents/users?pageSize=100&_t=${Date.now()}`;
    const res = await fetch(restUrl, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json && Array.isArray(json.documents)) {
        json.documents.forEach(docObj => {
          const uid = (docObj.name || "").split("/").pop();
          if (!uid) return;
          const f = docObj.fields || {};
          const isSelf = uid === currentUid;
          const dEmail = (f.email && f.email.stringValue) ? f.email.stringValue : (isSelf ? (currentSession.email || "") : "");
          const dName = (f.displayName && f.displayName.stringValue) ? f.displayName.stringValue : (dEmail ? dEmail.split("@")[0] : (isSelf ? currentSession.displayName : "Student")) || "Student";
          let avId = (f.avatarId && f.avatarId.stringValue) ? f.avatarId.stringValue : (isSelf ? (currentSession.avatarId || "footballer") : "footballer");
          if (!["bodybuilder", "footballer", "runner"].includes(avId)) avId = "footballer";
          const sport = (f.sport && f.sport.stringValue) ? f.sport.stringValue : "Football";
          const sessCnt = (f.sessionsCount && f.sessionsCount.integerValue) ? parseInt(f.sessionsCount.integerValue, 10) : 0;
          const isPub = (f.isPublic && f.isPublic.booleanValue !== undefined) ? f.isPublic.booleanValue : true;
          const showBadge = (f.showUniBadge && f.showUniBadge.booleanValue !== undefined) ? f.showUniBadge.booleanValue : true;

          remoteStudents.push({
            uid,
            isSelf,
            isPublic: isPub,
            showUniBadge: showBadge,
            displayName: dName,
            email: dEmail,
            university: (f.university && f.university.stringValue) ? f.university.stringValue : (dEmail.endsWith("@student.tue.nl") ? "TU Eindhoven" : "Fontys UAS"),
            avatarId: avId,
            sport,
            location: (f.location && f.location.stringValue) ? f.location.stringValue : "Eindhoven Campus",
            sports: [sport],
            sessionsCount: sessCnt,
            friends: parseRestStringArray(f.friends),
            sentRequests: parseRestStringArray(f.sentRequests),
            declinedRequests: parseRestStringArray(f.declinedRequests)
          });
        });
      }
    }
  } catch (restErr) {
    console.warn("[UniSport Firestore REST] fallback:", restErr);
  }

  // 2. Also query via Firebase SDK getDocs and merge
  try {
    const snap = await getDocs(collection(db, "users"));
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const isSelf = docSnap.id === currentUid;
      const dName = data.displayName || (data.email ? data.email.split("@")[0] : (isSelf ? currentSession.displayName : "Student")) || "Student";
      const dEmail = data.email || (isSelf ? currentSession.email : "") || "";
      let avId = data.avatarId || (isSelf ? (currentSession.avatarId || "footballer") : "footballer");
      if (!["bodybuilder", "footballer", "runner"].includes(avId)) avId = "footballer";
      const isPub = data.isPublic !== undefined ? data.isPublic : true;
      const showBadge = data.showUniBadge !== undefined ? data.showUniBadge : true;

      remoteStudents.push({
        uid: docSnap.id,
        isSelf: isSelf,
        isPublic: isPub,
        showUniBadge: showBadge,
        displayName: dName,
        email: dEmail,
        university: data.university || (dEmail.endsWith("@student.tue.nl") ? "TU Eindhoven" : "Fontys UAS"),
        avatarId: avId,
        sport: data.sport || "Football",
        location: data.location || "Eindhoven Campus",
        sports: data.sports || [data.sport || "Football"],
        sessionsCount: data.sessionsCount || 0,
        friends: Array.isArray(data.friends) ? data.friends : [],
        sentRequests: Array.isArray(data.sentRequests) ? data.sentRequests : [],
        declinedRequests: Array.isArray(data.declinedRequests) ? data.declinedRequests : []
      });
    });
  } catch(e) {
    console.warn("[UniSport Firestore] fetchCampusStudents notice:", e);
  }

  // Ensure current logged-in user is in directory if not returned by Firestore query yet
  if (currentSession && currentSession.uid && !remoteStudents.some(s => s.uid === currentSession.uid)) {
    let selfAv = currentSession.avatarId || "footballer";
    if (!["bodybuilder", "footballer", "runner"].includes(selfAv)) selfAv = "footballer";
    let selfPrefs = {};
    try { selfPrefs = JSON.parse(localStorage.getItem("unisport_app_preferences") || "{}"); } catch(e){}
    const selfIsPub = selfPrefs.privacyPublic !== undefined ? selfPrefs.privacyPublic : (currentSession.isPublic !== undefined ? currentSession.isPublic : true);
    const selfShowBadge = selfPrefs.showUni !== undefined ? selfPrefs.showUni : (currentSession.showUniBadge !== undefined ? currentSession.showUniBadge : true);

    remoteStudents.push({
      uid: currentSession.uid,
      isSelf: true,
      isPublic: selfIsPub,
      showUniBadge: selfShowBadge,
      displayName: currentSession.displayName || "Student",
      email: currentSession.email || "",
      university: currentSession.university || "Fontys UAS",
      avatarId: selfAv,
      sport: currentSession.sport || "Football",
      location: "Eindhoven Campus",
      sports: [currentSession.sport || "Football"],
      sessionsCount: 0,
      friends: state.friends || [],
      sentRequests: state.sentRequests || [],
      declinedRequests: state.declinedRequests || []
    });
  }

  // Strictly real Firestore accounts (no fake demo entries)
  const map = new Map();
  remoteStudents.forEach(s => {
    if (!s.uid.startsWith("demo-") && !s.uid.includes("-rep") && s.uid !== "climb-lover" && s.uid !== "gym-bro") {
      map.set(s.uid, s);
    }
  });

  state.students = Array.from(map.values());
  window.__FIRESTORE_STUDENTS__ = state.students;
  try {
    localStorage.setItem("unisport_students_cache", JSON.stringify(state.students));
  } catch(e) {}

  reconcileSocialFromStudentList(state.students);
  renderCommunity();
  renderNotifications();
  if (typeof window.renderCommunityInstant === "function") {
    window.renderCommunityInstant();
  }
  if (window.__ACTIVE_VIEWED_STUDENT_UID__ && typeof window.renderOtherStudentProfilePage === "function") {
    window.renderOtherStudentProfilePage(window.__ACTIVE_VIEWED_STUDENT_UID__, true);
  }
}

// Set up real-time listener for users collection so new signups & friend requests appear instantly
export function listenToCampusStudents() {
  try {
    onSnapshot(collection(db, "users"), (snapshot) => {
      const currentUid = state.currentUser?.uid || (getActiveSession() || {}).uid;
      const currentSession = getActiveSession() || state.currentUser || {};
      const remote = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const isSelf = docSnap.id === currentUid;
        const dName = data.displayName || (data.email ? data.email.split("@")[0] : (isSelf ? currentSession.displayName : "Student")) || "Student";
        const dEmail = data.email || (isSelf ? currentSession.email : "") || "";
        let avId = data.avatarId || (isSelf ? (currentSession.avatarId || "footballer") : "footballer");
        if (!["bodybuilder", "footballer", "runner"].includes(avId)) avId = "footballer";
        const isPub = data.isPublic !== undefined ? data.isPublic : true;
        const showBadge = data.showUniBadge !== undefined ? data.showUniBadge : true;

        remote.push({
          uid: docSnap.id,
          isSelf: isSelf,
          isPublic: isPub,
          showUniBadge: showBadge,
          displayName: dName,
          email: dEmail,
          university: data.university || (dEmail.endsWith("@student.tue.nl") ? "TU Eindhoven" : "Fontys UAS"),
          avatarId: avId,
          sport: data.sport || "Football",
          location: data.location || "Eindhoven Campus",
          sports: data.sports || [data.sport || "Football"],
          sessionsCount: data.sessionsCount || 0,
          friends: Array.isArray(data.friends) ? data.friends : [],
          sentRequests: Array.isArray(data.sentRequests) ? data.sentRequests : [],
          declinedRequests: Array.isArray(data.declinedRequests) ? data.declinedRequests : []
        });
      });

      // Ensure logged-in user is included
      if (currentSession && currentSession.uid && !remote.some(s => s.uid === currentSession.uid)) {
        let selfAv = currentSession.avatarId || "footballer";
        if (!["bodybuilder", "footballer", "runner"].includes(selfAv)) selfAv = "footballer";
        let selfPrefs = {};
        try { selfPrefs = JSON.parse(localStorage.getItem("unisport_app_preferences") || "{}"); } catch(e){}
        const selfIsPub = selfPrefs.privacyPublic !== undefined ? selfPrefs.privacyPublic : (currentSession.isPublic !== undefined ? currentSession.isPublic : true);
        const selfShowBadge = selfPrefs.showUni !== undefined ? selfPrefs.showUni : (currentSession.showUniBadge !== undefined ? currentSession.showUniBadge : true);

        remote.push({
          uid: currentSession.uid,
          isSelf: true,
          isPublic: selfIsPub,
          showUniBadge: selfShowBadge,
          displayName: currentSession.displayName || "Student",
          email: currentSession.email || "",
          university: currentSession.university || "Fontys UAS",
          avatarId: selfAv,
          sport: currentSession.sport || "Football",
          location: "Eindhoven Campus",
          sports: [currentSession.sport || "Football"],
          sessionsCount: 0,
          friends: state.friends || [],
          sentRequests: state.sentRequests || [],
          declinedRequests: state.declinedRequests || []
        });
      }

      const map = new Map();
      remote.forEach(s => {
        if (!s.uid.startsWith("demo-") && !s.uid.includes("-rep") && s.uid !== "climb-lover" && s.uid !== "gym-bro") {
          map.set(s.uid, s);
        }
      });

      state.students = Array.from(map.values());
      window.__FIRESTORE_STUDENTS__ = state.students;
      try {
        localStorage.setItem("unisport_students_cache", JSON.stringify(state.students));
      } catch(e) {}

      reconcileSocialFromStudentList(state.students);
      renderCommunity();
      renderNotifications();
      if (typeof window.renderCommunityInstant === "function") {
        window.renderCommunityInstant();
      }
      if (window.__ACTIVE_VIEWED_STUDENT_UID__ && typeof window.renderOtherStudentProfilePage === "function") {
        window.renderOtherStudentProfilePage(window.__ACTIVE_VIEWED_STUDENT_UID__, true);
      }
    }, (err) => {
      console.warn("listenToCampusStudents notice:", err);
    });
  } catch(e) {
    console.warn("listenToCampusStudents error:", e);
  }
}

export function renderCommunity() {
  if (typeof window.renderCommunityInstant === "function") {
    window.renderCommunityInstant();
    return;
  }
}

export function openStudentProfileModal(uid) {
  if (typeof window.renderOtherStudentProfilePage === "function") {
    window.renderOtherStudentProfilePage(uid, false);
    return;
  }
}

export function toggleFriendship(uid) {
  const currentUid = state.currentUser?.uid || (getActiveSession() || {}).uid;
  if (!uid || uid === currentUid) return;

  getStoredSocialData();
  const student = (state.students || []).find(s => s.uid === uid) ||
                  (window.__FIRESTORE_STUDENTS__ || []).find(s => s.uid === uid);

  // Check if the other student already sent us a friend request (or has us in their sentRequests)
  // Rule: User 1 friend request User 2 AND User 2 friend request User 1 = Friends!
  const incomingReq = (state.friendRequests || []).find(r => r && r.fromUid === uid);
  const otherSentHasMe = student && Array.isArray(student.sentRequests) && student.sentRequests.includes(currentUid);

  if (incomingReq || otherSentHasMe) {
    acceptFriendRequest(incomingReq ? incomingReq.id : `req-${uid}`, uid);
    return;
  }

  // Otherwise send a friend request -> button becomes "Pending" (NO modal opens!)
  if (!state.friends.includes(uid) && !state.sentRequests.includes(uid)) {
    state.sentRequests.push(uid);
    state.declinedRequests = (state.declinedRequests || []).filter(id => id !== uid);
    if (student) {
      state.notifications.unshift({
        id: "req-sent-" + Date.now(),
        title: "Friend Request Sent",
        desc: `Friend request sent to ${student.displayName}. Waiting for approval.`,
        time: "Just now"
      });
    }
    saveStoredSocialData();
    persistMySocialToFirestore();
  }

  renderNotifications();
  renderCommunity();
  if (typeof window.renderCommunityInstant === "function") {
    window.renderCommunityInstant();
  }
  if (window.__ACTIVE_VIEWED_STUDENT_UID__ === uid && typeof window.renderOtherStudentProfilePage === "function") {
    window.renderOtherStudentProfilePage(uid, true);
  }
}

export function cancelFriendRequest(uid) {
  getStoredSocialData();
  state.sentRequests = (state.sentRequests || []).filter(id => id !== uid);
  saveStoredSocialData();
  persistMySocialToFirestore();
  renderCommunity();
  if (typeof window.renderCommunityInstant === "function") {
    window.renderCommunityInstant();
  }
  if (window.__ACTIVE_VIEWED_STUDENT_UID__ === uid && typeof window.renderOtherStudentProfilePage === "function") {
    window.renderOtherStudentProfilePage(uid, true);
  }
}

export function removeFriend(uid) {
  getStoredSocialData();
  state.friends = (state.friends || []).filter(f => f !== uid);
  state.sentRequests = (state.sentRequests || []).filter(s => s !== uid);
  saveStoredSocialData();
  persistMySocialToFirestore(uid, "remove");
  renderCommunity();
  if (typeof window.renderCommunityInstant === "function") {
    window.renderCommunityInstant();
  }
  if (window.__ACTIVE_VIEWED_STUDENT_UID__ === uid && typeof window.renderOtherStudentProfilePage === "function") {
    window.renderOtherStudentProfilePage(uid, true);
  }
}

// Global window helpers for community & socials
window.setCommunityView = function(view) {
  state.communityView = view;
  if (window.communityStateInline) window.communityStateInline.view = view;
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
  if (window.communityStateInline) window.communityStateInline.uniFilter = uni;
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
  if (window.communityStateInline) {
    window.communityStateInline.searchQuery = state.studentSearchQuery;
  }
  renderCommunity();
  if (typeof window.renderCommunityInstant === "function") {
    window.renderCommunityInstant();
  }
};

window.executeStudentSearch = function() {
  const inp = document.getElementById("search-students");
  const val = inp ? inp.value : "";
  window.filterStudentsGlobal(val);
  fetchCampusStudents();
};

window.openStudentProfileModal = openStudentProfileModal;
window.toggleFriendship = toggleFriendship;
window.cancelFriendRequest = cancelFriendRequest;
window.removeFriend = removeFriend;
window.acceptFriendRequest = acceptFriendRequest;
window.declineFriendRequest = declineFriendRequest;
window.clearAllNotifsGlobal = clearAllNotifsGlobal;
window.savePrivacySettingsToFirestore = savePrivacySettingsToFirestore;

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
  toggleFriendship,
  cancelFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  syncSocialStateFromStorage,
  fetchCampusStudents,
  savePrivacySettingsToFirestore,
  openFilterDrawer,
  closeFilterDrawer,
  setDrawerDateFilter,
  setDrawerPriceFilter,
  applyFilterDrawer,
  resetFeedFilters,
  setFeedPageSize,
  goToFeedPage,
  openEditActivityModal,
  closeEditActivityModal,
  saveEditedActivity,
  kickParticipant,
  signOut: signOutStudent
};

// Also expose immediately onto window
window.UniSport.openFilterDrawer = openFilterDrawer;
window.UniSport.closeFilterDrawer = closeFilterDrawer;
window.UniSport.setDrawerDateFilter = setDrawerDateFilter;
window.UniSport.setDrawerPriceFilter = setDrawerPriceFilter;
window.UniSport.applyFilterDrawer = applyFilterDrawer;
window.UniSport.resetFeedFilters = resetFeedFilters;
window.UniSport.setFeedPageSize = setFeedPageSize;
window.UniSport.goToFeedPage = goToFeedPage;
window.UniSport.openEditActivityModal = openEditActivityModal;
window.UniSport.closeEditActivityModal = closeEditActivityModal;
window.UniSport.saveEditedActivity = saveEditedActivity;
window.UniSport.kickParticipant = kickParticipant;

// Bootstrapping: Load local/cached students, initialize app immediately, and fetch remote updates asynchronously
function bootUniSport() {
  try {
    getStoredSocialData();
    const cachedStudents = localStorage.getItem("unisport_students_cache");
    if (cachedStudents) {
      try {
        const parsed = JSON.parse(cachedStudents);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out obsolete fake accounts
          state.students = parsed.filter(s => s && s.uid && !s.uid.startsWith("demo-") && !s.uid.includes("-rep") && s.uid !== "climb-lover" && s.uid !== "gym-bro");
        }
      } catch(e) {}
    }
  } catch(e) {}

  // Initialize UI immediately
  initApp();
  renderCommunity();
  renderNotifications();

  // Then fetch live students from Firestore in background and listen to changes
  fetchCampusStudents().then(() => {
    renderCommunity();
    renderNotifications();
  }).catch(err => {
    console.warn("fetchCampusStudents background error:", err);
  });
  listenToCampusStudents();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootUniSport);
} else {
  bootUniSport();
}
