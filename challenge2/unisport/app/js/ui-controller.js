/* ==========================================================================
   PRE-RENDER SESSION HYDRATION & FILTER DRAWER HELPERS
   ========================================================================== */

(function() {
  try {
    var raw = localStorage.getItem("unisport_active_session");
    if (raw) {
      var user = JSON.parse(raw);
      if (user && (user.email || user.uid)) {
        window.__PRELOADED_USER__ = user;
      }
    }
  } catch (e) {}
})();

window.UniSport = window.UniSport || {};

window.openFilterDrawer = function() {
  var d = document.getElementById("feed-filter-drawer");
  if (d) {
    d.classList.remove("hidden");
    d.style.display = "flex";
    document.body.style.overflow = "hidden";
  }
};

window.closeFilterDrawer = function() {
  var d = document.getElementById("feed-filter-drawer");
  if (d) {
    d.classList.add("hidden");
    d.style.display = "none";
    document.body.style.overflow = "";
  }
};

window.UniSport.openFilterDrawer = window.openFilterDrawer;
window.UniSport.closeFilterDrawer = window.closeFilterDrawer;

function hydratePreloadedNavigation() {
  try {
    var user = window.__PRELOADED_USER__;
    if (!user) {
      var raw = localStorage.getItem("unisport_active_session");
      if (raw) user = JSON.parse(raw);
    }
    if (user && (user.email || user.uid)) {
      var navAuthBtn = document.getElementById("nav-auth-btn");
      var dropName = document.getElementById("dropdown-name");
      var dropEmail = document.getElementById("dropdown-email");
      var dropSchoolFull = document.getElementById("dropdown-school-full");

      if (navAuthBtn) {
        navAuthBtn.style.setProperty("display", "none", "important");
        navAuthBtn.classList.add("hidden");
      }
      var avId = user.avatarId || "footballer";
      if (avId === "bolt" || avId === "flame" || avId === "cyber") avId = "footballer";
      var avSrc = "./assets/avatars/" + avId + ".png";
      var uni = user.university || (user.email && user.email.includes("tue.nl") ? "TU Eindhoven" : "Fontys UAS");
      var isTue = uni.indexOf("TU") !== -1 || (user.email && user.email.includes("tue.nl"));
      if (dropName) dropName.textContent = user.displayName || user.email || "Student";
      if (dropEmail) dropEmail.textContent = user.email || "";
      if (dropSchoolFull) dropSchoolFull.textContent = isTue ? "TU Eindhoven" : "Fontys UAS";

      var sidebarAvatar = document.getElementById("sidebar-profile-avatar-inner");
      var sidebarName = document.getElementById("sidebar-profile-name");
      if (sidebarAvatar) {
        sidebarAvatar.innerHTML = '<img src="' + avSrc + '" alt="Avatar" class="w-full h-full object-cover rounded-full" onerror="this.src=\'./assets/avatars/footballer.png\'" />';
      }
      if (sidebarName) {
        sidebarName.textContent = user.displayName || (user.email ? user.email.split("@")[0] : "Profile");
      }
    }
  } catch (err) {}
}

hydratePreloadedNavigation();

/* ==========================================================================
   GLOBAL TAB NAVIGATION & DRAWER CONTROLLER
   ========================================================================== */

window.switchTabGlobal = function(tabId) {
  var settModal = document.getElementById("settings-modal");
  if (settModal && !settModal.classList.contains("hidden")) {
    settModal.classList.add("hidden");
    settModal.classList.remove("flex");
    document.body.style.overflow = "";
  }
  var settTab = document.getElementById("mobile-tab-settings");
  if (settTab) {
    settTab.className = "flex flex-col items-center gap-1 text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition cursor-pointer";
  }
  var deskSettBtn = document.getElementById("sidebar-btn-settings");
  if (deskSettBtn) {
    deskSettBtn.classList.remove("bg-zinc-100", "dark:bg-zinc-900", "text-zinc-950", "dark:text-white");
  }

  var drawer = document.getElementById("notifications-desktop-drawer");
  if (drawer && tabId !== "notifications") {
    drawer.classList.add("-translate-x-full");
  }

  var tabs = ["feed", "community", "create", "my-activities", "profile", "notifications", "student-profile"];
  for (var i = 0; i < tabs.length; i++) {
    var t = tabs[i];
    var sec = document.getElementById("section-" + t);
    var deskBtn = document.getElementById("tab-btn-" + t);
    var mobBtn = document.getElementById("mobile-tab-" + t);

    if (t === tabId) {
      if (sec) sec.classList.remove("hidden");
      if (deskBtn) {
        deskBtn.className = "sidebar-btn nav-sidebar-btn font-bold bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 cursor-pointer group overflow-hidden";
      }
      if (mobBtn) {
        mobBtn.className = "flex flex-col items-center gap-1 text-zinc-950 dark:text-white transition cursor-pointer";
      }
    } else {
      if (sec) sec.classList.add("hidden");
      if (deskBtn) {
        deskBtn.className = "sidebar-btn nav-sidebar-btn font-semibold text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-white cursor-pointer group overflow-hidden";
      }
      if (mobBtn) {
        mobBtn.className = "flex flex-col items-center gap-1 text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition cursor-pointer";
      }
    }
  }

  if (tabId === "student-profile") {
    var commDeskBtn = document.getElementById("tab-btn-community");
    var commMobBtn = document.getElementById("mobile-tab-community");
    if (commDeskBtn) {
      commDeskBtn.className = "sidebar-btn nav-sidebar-btn font-bold bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 cursor-pointer group overflow-hidden";
    }
    if (commMobBtn) {
      commMobBtn.className = "flex flex-col items-center gap-1 text-zinc-950 dark:text-white transition cursor-pointer";
    }
  }

  if (tabId === "profile") {
    try {
      var raw = localStorage.getItem("unisport_active_session");
      if (raw) {
        var u = JSON.parse(raw);
        var hName = document.getElementById("profile-hero-name");
        var hEmail = document.getElementById("profile-hero-email");
        var hSchool = document.getElementById("profile-hero-school");
        var hBadge = document.getElementById("profile-hero-badge");
        var hInner = document.getElementById("profile-hero-avatar-inner");
        var pName = document.getElementById("profile-name");
        var pEmail = document.getElementById("profile-email");
        var pUni = document.getElementById("profile-university");
        var pSport = document.getElementById("profile-sport");

        var dName = u.displayName || (u.email ? u.email.split("@")[0] : "Student");
        var isTue = (u.university && u.university.indexOf("TU") !== -1) || (u.email && u.email.indexOf("tue.nl") !== -1);
        var avId = u.avatarId || "footballer";

        var prefs = JSON.parse(localStorage.getItem("unisport_app_preferences") || "{}");
        var showU = prefs.showUni !== undefined ? prefs.showUni : (u.showUniBadge !== undefined ? u.showUniBadge : true);

        if (hName) hName.textContent = dName;
        if (hEmail) hEmail.textContent = u.email || "";
        if (hSchool) hSchool.textContent = isTue ? "TU Eindhoven" : "Fontys UAS";
        if (hBadge) {
          if (showU) hBadge.classList.remove("hidden");
          else hBadge.classList.add("hidden");
        }
        if (hInner) hInner.innerHTML = '<img src="./assets/avatars/' + avId + '.png" class="w-full h-full object-cover rounded-full" onerror="this.src=\'./assets/avatars/footballer.png\'" />';
        if (pName) pName.value = dName;
        if (pEmail) pEmail.value = u.email || "";
        if (pUni) pUni.value = isTue ? "TU Eindhoven" : "Fontys UAS";
        if (pSport && u.sport) pSport.value = u.sport;
      }
    } catch (e) {}
  }

  if (tabId === "community") {
    if (typeof window.renderCommunityInstant === "function") {
      window.renderCommunityInstant();
    }
    if (typeof window.fetchStudentsDirectFromFirestore === "function") {
      window.fetchStudentsDirectFromFirestore();
    }
    if (window.UniSport && typeof window.UniSport.fetchCampusStudents === "function") {
      window.UniSport.fetchCampusStudents();
    } else if (window.UniSport && typeof window.UniSport.renderCommunity === "function") {
      window.UniSport.renderCommunity();
    }
  }
  if (tabId === "notifications" && window.UniSport && typeof window.UniSport.renderNotifications === "function") {
    window.UniSport.renderNotifications();
  }

  if (window.UniSport && typeof window.UniSport.switchTab === "function") {
    window.UniSport.switchTab(tabId);
  }
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.toggleNotificationsGlobal = function(e) {
  if (e) e.stopPropagation();
  var userDd = document.getElementById("user-dropdown");
  if (userDd) userDd.classList.add("hidden");

  if (window.innerWidth < 768) {
    window.switchTabGlobal("notifications");
  } else {
    var drawer = document.getElementById("notifications-desktop-drawer");
    if (drawer) {
      drawer.classList.toggle("-translate-x-full");
    }
  }

  if (window.UniSport && typeof window.UniSport.renderNotifications === "function") {
    window.UniSport.renderNotifications();
  }
};

window.closeNotificationsDrawer = function() {
  var drawer = document.getElementById("notifications-desktop-drawer");
  if (drawer) {
    drawer.classList.add("-translate-x-full");
  }
};

window.closeStudentProfileModal = function() {
  var m = document.getElementById("student-profile-modal");
  if (m) m.classList.add("hidden");
};

/* ==========================================================================
   LOCAL CACHE SANITIZATION & FIRESTORE REST DIRECTORY SYNC
   ========================================================================== */

try {
  var rawCacheCheck = localStorage.getItem("unisport_students_cache");
  if (rawCacheCheck) {
    var parsedCacheCheck = JSON.parse(rawCacheCheck);
    if (Array.isArray(parsedCacheCheck)) {
      var cleanCache = parsedCacheCheck.filter(function(cs) {
        return cs && cs.uid && !cs.uid.startsWith("demo-") && !cs.uid.includes("-rep") && cs.uid !== "climb-lover" && cs.uid !== "gym-bro";
      });
      localStorage.setItem("unisport_students_cache", JSON.stringify(cleanCache));
    }
  }
  var rawFr = localStorage.getItem("unisport_friends");
  if (rawFr) {
    var parsedFr = JSON.parse(rawFr);
    if (Array.isArray(parsedFr)) {
      localStorage.setItem("unisport_friends", JSON.stringify(parsedFr.filter(function(id) {
        return id && !String(id).startsWith("demo-") && !String(id).includes("-rep");
      })));
    }
  }
  var rawReq = localStorage.getItem("unisport_friend_requests");
  if (rawReq) {
    var parsedReq = JSON.parse(rawReq);
    if (Array.isArray(parsedReq)) {
      localStorage.setItem("unisport_friend_requests", JSON.stringify(parsedReq.filter(function(r) {
        return r && r.id !== "req-1" && r.id !== "req-2" && r.fromUid && !String(r.fromUid).startsWith("demo-");
      })));
    }
  }
  var rawNotif = localStorage.getItem("unisport_notifications");
  if (rawNotif) {
    var parsedNotif = JSON.parse(rawNotif);
    if (Array.isArray(parsedNotif)) {
      localStorage.setItem("unisport_notifications", JSON.stringify(parsedNotif.filter(function(n) {
        return n && n.id !== "notif-1" && n.id !== "notif-2" && !String(n.id).startsWith("demo-");
      })));
    }
  }
} catch (e) {}

window.CAMPUS_STUDENTS_SEED = [];
window.__FIRESTORE_STUDENTS__ = [];
window.__ACTIVE_VIEWED_STUDENT_UID__ = null;

window.communityStateInline = {
  searchQuery: "",
  uniFilter: "all",
  view: "all"
};

function parseFirestoreStringArray(fieldObj) {
  if (!fieldObj || !fieldObj.arrayValue || !Array.isArray(fieldObj.arrayValue.values)) return [];
  var out = [];
  for (var i = 0; i < fieldObj.arrayValue.values.length; i++) {
    var v = fieldObj.arrayValue.values[i];
    if (v && typeof v.stringValue === "string" && v.stringValue) {
      out.push(v.stringValue);
    }
  }
  return out;
}

window.syncSocialFromFirestoreStudents = function(remoteStudents) {
  if (!Array.isArray(remoteStudents) || remoteStudents.length === 0) return;
  var currentUid = null;
  try {
    var rawSess = localStorage.getItem("unisport_active_session");
    if (rawSess) currentUid = JSON.parse(rawSess).uid;
  } catch (e) {}
  if (!currentUid) return;

  var meDoc = null;
  for (var i = 0; i < remoteStudents.length; i++) {
    if (remoteStudents[i].uid === currentUid) {
      meDoc = remoteStudents[i];
      break;
    }
  }

  var localFriends = [];
  var localSent = [];
  var localDeclined = [];
  try {
    localFriends = JSON.parse(localStorage.getItem("unisport_friends") || "[]").filter(function(x) { return x && !String(x).startsWith("demo-"); });
    localSent = JSON.parse(localStorage.getItem("unisport_sent_requests") || "[]").filter(function(x) { return x && !String(x).startsWith("demo-"); });
    localDeclined = JSON.parse(localStorage.getItem("unisport_declined_requests") || "[]");
  } catch (e) {}

  var myRemoteFriends = (meDoc && Array.isArray(meDoc.friends)) ? meDoc.friends : [];
  var myRemoteSent = (meDoc && Array.isArray(meDoc.sentRequests)) ? meDoc.sentRequests : [];
  var myRemoteDeclined = (meDoc && Array.isArray(meDoc.declinedRequests)) ? meDoc.declinedRequests : [];

  var mergedSentSet = {};
  myRemoteSent.concat(localSent).forEach(function(id) { if (id && id !== currentUid) mergedSentSet[id] = true; });
  var mergedDeclinedSet = {};
  myRemoteDeclined.concat(localDeclined).forEach(function(id) { if (id) mergedDeclinedSet[id] = true; });
  var mergedFriendsSet = {};
  myRemoteFriends.concat(localFriends).forEach(function(id) { if (id && id !== currentUid && !String(id).startsWith("demo-")) mergedFriendsSet[id] = true; });

  var incomingRequests = [];

  for (var j = 0; j < remoteStudents.length; j++) {
    var other = remoteStudents[j];
    if (!other || !other.uid || other.uid === currentUid) continue;
    var otherFriends = Array.isArray(other.friends) ? other.friends : [];
    var otherSent = Array.isArray(other.sentRequests) ? other.sentRequests : [];
    var otherDeclined = Array.isArray(other.declinedRequests) ? other.declinedRequests : [];

    if (otherDeclined.indexOf(currentUid) !== -1 && mergedSentSet[other.uid]) {
      delete mergedSentSet[other.uid];
    }

    var iRequestedOther = !!mergedSentSet[other.uid];
    var otherRequestedMe = otherSent.indexOf(currentUid) !== -1;
    var otherHasMeAsFriend = otherFriends.indexOf(currentUid) !== -1;

    if ((iRequestedOther && otherRequestedMe) || (iRequestedOther && otherHasMeAsFriend) || (mergedFriendsSet[other.uid] && otherHasMeAsFriend)) {
      mergedFriendsSet[other.uid] = true;
      delete mergedSentSet[other.uid];
      delete mergedDeclinedSet[other.uid];
    } else if (otherRequestedMe && !mergedFriendsSet[other.uid] && !mergedDeclinedSet[other.uid]) {
      incomingRequests.push({
        id: "req-" + other.uid,
        fromUid: other.uid,
        displayName: other.displayName || "Student",
        university: other.university || "Fontys UAS",
        sport: other.sport || "Football",
        avatarId: other.avatarId || "footballer",
        timeAgo: "Pending request"
      });
    }
  }

  Object.keys(mergedFriendsSet).forEach(function(fUid) {
    delete mergedSentSet[fUid];
  });

  var finalFriends = Object.keys(mergedFriendsSet);
  var finalSent = Object.keys(mergedSentSet);
  var finalDeclined = Object.keys(mergedDeclinedSet);

  try {
    localStorage.setItem("unisport_friends", JSON.stringify(finalFriends));
    localStorage.setItem("unisport_sent_requests", JSON.stringify(finalSent));
    localStorage.setItem("unisport_declined_requests", JSON.stringify(finalDeclined));
    localStorage.setItem("unisport_friend_requests", JSON.stringify(incomingRequests));
  } catch (e) {}

  if (window.UniSport && typeof window.UniSport.syncSocialStateFromStorage === "function") {
    try { window.UniSport.syncSocialStateFromStorage(); } catch (e) {}
  }
};

window.fetchStudentsDirectFromFirestore = async function() {
  try {
    var url = "https://firestore.googleapis.com/v1/projects/fontys-unisport/databases/(default)/documents/users?pageSize=100&_t=" + Date.now();
    var res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return;
    var data = await res.json();
    if (!data || !Array.isArray(data.documents)) return;

    var currentUid = null;
    try {
      var rawSess = localStorage.getItem("unisport_active_session");
      if (rawSess) currentUid = JSON.parse(rawSess).uid;
    } catch (e) {}

    var remoteStudents = [];
    for (var i = 0; i < data.documents.length; i++) {
      var doc = data.documents[i];
      var uid = (doc.name || "").split("/").pop();
      if (!uid || uid.startsWith("demo-") || uid.includes("-rep") || uid === "climb-lover" || uid === "gym-bro") continue;

      var f = doc.fields || {};
      var email = (f.email && f.email.stringValue) ? f.email.stringValue : "";
      var displayName = (f.displayName && f.displayName.stringValue) ? f.displayName.stringValue : (email ? email.split("@")[0] : "Student");
      var university = (f.university && f.university.stringValue) ? f.university.stringValue : (email.indexOf("tue.nl") !== -1 ? "TU Eindhoven" : "Fontys UAS");
      var avId = (f.avatarId && f.avatarId.stringValue) ? f.avatarId.stringValue : "footballer";
      if (avId !== "bodybuilder" && avId !== "footballer" && avId !== "runner") {
        avId = "footballer";
      }
      var sport = (f.sport && f.sport.stringValue) ? f.sport.stringValue : "Football";
      var location = (f.location && f.location.stringValue) ? f.location.stringValue : "Eindhoven Campus";
      var sessionsCount = (f.sessionsCount && f.sessionsCount.integerValue) ? parseInt(f.sessionsCount.integerValue, 10) : 0;

      var friendsArr = parseFirestoreStringArray(f.friends);
      var sentRequestsArr = parseFirestoreStringArray(f.sentRequests);
      var declinedRequestsArr = parseFirestoreStringArray(f.declinedRequests);

      var isPublic = true;
      if (f.isPublic && f.isPublic.booleanValue !== undefined) {
        isPublic = f.isPublic.booleanValue;
      } else if (f.isPublicProfile && f.isPublicProfile.booleanValue !== undefined) {
        isPublic = f.isPublicProfile.booleanValue;
      }

      var showUniBadge = true;
      if (f.showUniBadge && f.showUniBadge.booleanValue !== undefined) {
        showUniBadge = f.showUniBadge.booleanValue;
      }

      remoteStudents.push({
        uid: uid,
        isSelf: uid === currentUid,
        displayName: displayName,
        email: email,
        university: university,
        avatarId: avId,
        sport: sport,
        location: location,
        sports: [sport],
        sessionsCount: sessionsCount,
        friends: friendsArr,
        sentRequests: sentRequestsArr,
        declinedRequests: declinedRequestsArr,
        isPublic: isPublic,
        showUniBadge: showUniBadge
      });
    }

    if (remoteStudents.length > 0) {
      window.__FIRESTORE_STUDENTS__ = remoteStudents;
      try {
        localStorage.setItem("unisport_students_cache", JSON.stringify(remoteStudents));
      } catch (e) {}
      window.syncSocialFromFirestoreStudents(remoteStudents);
      if (typeof window.renderCommunityInstant === "function") {
        window.renderCommunityInstant();
      }
      if (window.__ACTIVE_VIEWED_STUDENT_UID__ && typeof window.renderOtherStudentProfilePage === "function") {
        window.renderOtherStudentProfilePage(window.__ACTIVE_VIEWED_STUDENT_UID__, true);
      }
      if (window.UniSport && typeof window.UniSport.renderCommunity === "function") {
        try { window.UniSport.renderCommunity(); } catch (e) {}
      }
      if (window.UniSport && typeof window.UniSport.renderNotifications === "function") {
        try { window.UniSport.renderNotifications(); } catch (e) {}
      }
    }
  } catch (err) {
    console.warn("Direct Firestore student fetch error:", err);
  }
};

window.getAllKnownStudentsList = function() {
  var currentUid = null;
  var currentSession = null;
  try {
    var rawSess = localStorage.getItem("unisport_active_session");
    if (rawSess) {
      currentSession = JSON.parse(rawSess);
      currentUid = currentSession.uid;
    }
  } catch (e) {}

  var myPrefs = {};
  try { myPrefs = JSON.parse(localStorage.getItem("unisport_app_preferences") || "{}"); } catch (e) {}
  var myIsPublic = myPrefs.privacyPublic !== undefined ? myPrefs.privacyPublic : (currentSession && currentSession.isPublic !== undefined ? currentSession.isPublic : true);
  var myShowUni = myPrefs.showUni !== undefined ? myPrefs.showUni : (currentSession && currentSession.showUniBadge !== undefined ? currentSession.showUniBadge : true);

  var list = [];
  var seenUids = {};

  if (Array.isArray(window.__FIRESTORE_STUDENTS__)) {
    window.__FIRESTORE_STUDENTS__.forEach(function(cs) {
      if (cs && cs.uid && !seenUids[cs.uid] && !cs.uid.startsWith("demo-") && !cs.uid.includes("-rep") && cs.uid !== "climb-lover" && cs.uid !== "gym-bro") {
        var itemSelf = cs.uid === currentUid;
        list.push(Object.assign({}, cs, {
          isSelf: itemSelf,
          isPublic: itemSelf ? myIsPublic : (cs.isPublic !== undefined ? cs.isPublic : true),
          showUniBadge: itemSelf ? myShowUni : (cs.showUniBadge !== undefined ? cs.showUniBadge : true)
        }));
        seenUids[cs.uid] = true;
      }
    });
  }

  try {
    var rawCache = localStorage.getItem("unisport_students_cache");
    if (rawCache) {
      var parsedCache = JSON.parse(rawCache);
      if (Array.isArray(parsedCache)) {
        parsedCache.forEach(function(cs) {
          if (cs && cs.uid && !seenUids[cs.uid] && !cs.uid.startsWith("demo-") && !cs.uid.includes("-rep") && cs.uid !== "climb-lover" && cs.uid !== "gym-bro") {
            var itemSelf = cs.uid === currentUid;
            list.push(Object.assign({}, cs, {
              isSelf: itemSelf,
              isPublic: itemSelf ? myIsPublic : (cs.isPublic !== undefined ? cs.isPublic : true),
              showUniBadge: itemSelf ? myShowUni : (cs.showUniBadge !== undefined ? cs.showUniBadge : true)
            }));
            seenUids[cs.uid] = true;
          }
        });
      }
    }
  } catch (e) {}

  if (currentSession && currentSession.uid) {
    var sessAv = currentSession.avatarId || "footballer";
    if (sessAv !== "bodybuilder" && sessAv !== "footballer" && sessAv !== "runner") sessAv = "footballer";
    if (!seenUids[currentSession.uid]) {
      list.push({
        uid: currentSession.uid,
        isSelf: true,
        displayName: currentSession.displayName || "Student",
        email: currentSession.email || "",
        university: currentSession.university || "Fontys UAS",
        avatarId: sessAv,
        sport: currentSession.sport || "Football",
        location: "Eindhoven Campus",
        sports: [currentSession.sport || "Football"],
        sessionsCount: 0,
        isPublic: myIsPublic,
        showUniBadge: myShowUni
      });
      seenUids[currentSession.uid] = true;
    } else {
      list.forEach(function(item) {
        if (item.uid === currentSession.uid) {
          if (currentSession.email) item.email = currentSession.email;
          if (currentSession.displayName) item.displayName = currentSession.displayName;
          if (currentSession.university) item.university = currentSession.university;
          if (currentSession.avatarId) item.avatarId = sessAv;
          item.isPublic = myIsPublic;
          item.showUniBadge = myShowUni;
        }
      });
    }
  }
  return list;
};

/* ==========================================================================
   INSTANT STUDENT DIRECTORY & PROFILE RENDERERS
   ========================================================================== */

window.renderCommunityInstant = function() {
  var container = document.getElementById("students-grid");
  if (!container) return;

  var currentUid = null;
  try {
    var rawSess = localStorage.getItem("unisport_active_session");
    if (rawSess) currentUid = JSON.parse(rawSess).uid;
  } catch (e) {}

  var myPrefs = {};
  try { myPrefs = JSON.parse(localStorage.getItem("unisport_app_preferences") || "{}"); } catch (e) {}

  var friends = [];
  var sentRequests = [];
  var incomingRequests = [];
  try {
    var rawFriends = localStorage.getItem("unisport_friends");
    if (rawFriends) friends = JSON.parse(rawFriends);
    var rawSent = localStorage.getItem("unisport_sent_requests");
    if (rawSent) sentRequests = JSON.parse(rawSent);
    var rawInc = localStorage.getItem("unisport_friend_requests");
    if (rawInc) incomingRequests = JSON.parse(rawInc);
  } catch (e) {}

  var countFriends = document.getElementById("community-friends-count");
  if (countFriends) countFriends.textContent = friends.length;

  var list = window.getAllKnownStudentsList();

  var statStudents = document.getElementById("community-stat-students");
  if (statStudents) statStudents.textContent = list.length + "+";

  if (window.communityStateInline.view === "friends") {
    list = list.filter(function(s) { return friends.indexOf(s.uid) !== -1; });
  }

  if (window.communityStateInline.uniFilter && window.communityStateInline.uniFilter !== "all") {
    var targetUni = window.communityStateInline.uniFilter.toLowerCase();
    list = list.filter(function(s) {
      var u = (s.university || "").toLowerCase();
      var em = (s.email || "").toLowerCase();
      if (targetUni.indexOf("tu") !== -1) {
        return u.indexOf("tu") !== -1 || u.indexOf("eindhoven") !== -1 || em.indexOf("tue.nl") !== -1;
      }
      if (targetUni.indexOf("fontys") !== -1) {
        return u.indexOf("fontys") !== -1 || em.indexOf("fontys.nl") !== -1;
      }
      return u.indexOf(targetUni) !== -1;
    });
  }

  if (window.communityStateInline.searchQuery) {
    var q = window.communityStateInline.searchQuery.toLowerCase();
    list = list.filter(function(s) {
      var nameMatch = (s.displayName || "").toLowerCase().indexOf(q) !== -1;
      var emailMatch = (s.email || "").toLowerCase().indexOf(q) !== -1;
      var uniMatch = (s.university || "").toLowerCase().indexOf(q) !== -1;
      var sportMatch = (s.sport || "").toLowerCase().indexOf(q) !== -1;
      var sportsMatch = (s.sports || []).some(function(sp) { return sp.toLowerCase().indexOf(q) !== -1; });
      return nameMatch || emailMatch || uniMatch || sportMatch || sportsMatch;
    });
  }

  if (list.length === 0) {
    container.innerHTML = '<div class="col-span-full py-12 px-6 text-center rounded-3xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center">' +
      '<img src="./assets/mascot-students.png" onerror="this.src=\'/challenge2/unisport/app/assets/mascot-students.png\'" alt="UniSport Mascot" class="w-36 h-36 sm:w-44 sm:h-44 object-contain drop-shadow-md mb-2 select-none" />' +
      '<h3 class="text-base sm:text-lg font-extrabold text-zinc-950 dark:text-white mb-1">No campus students found</h3>' +
      '<p class="text-zinc-500 dark:text-zinc-400 text-xs max-w-sm mx-auto mb-5 leading-relaxed">' +
        (window.communityStateInline.view === "friends" ? "You haven't connected with any teammates yet. Explore all Fontys & TU/e students to build your squad!" : "Try searching for a different student name, university campus, or sport.") +
      '</p>' +
      (window.communityStateInline.view === "friends" ? '<button onclick="window.setCommunityView(\'all\')" class="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-bold shadow-sm transition cursor-pointer">Explore All Students</button>' : '') +
    '</div>';
    return;
  }

  var html = "";
  for (var i = 0; i < list.length; i++) {
    var student = list[i];
    var isSelf = student.isSelf || student.uid === currentUid;
    var isFriend = friends.indexOf(student.uid) !== -1;
    var isPending = !isFriend && sentRequests.indexOf(student.uid) !== -1;
    var incomingReqObj = null;
    if (!isFriend) {
      for (var rIdx = 0; rIdx < incomingRequests.length; rIdx++) {
        if (incomingRequests[rIdx] && incomingRequests[rIdx].fromUid === student.uid) {
          incomingReqObj = incomingRequests[rIdx];
          break;
        }
      }
    }
    var isTue = (student.university || "").indexOf("TU") !== -1 || (student.email || "").indexOf("tue.nl") !== -1;
    var sports = student.sports || [student.sport || "Football"];
    var avId = student.avatarId || "footballer";
    if (avId !== "bodybuilder" && avId !== "footballer" && avId !== "runner") {
      avId = "footballer";
    }

    var isProfilePublic = isSelf ? true : (student.isPublic !== undefined ? student.isPublic : true);
    var showBadge = isSelf
      ? (myPrefs.showUni !== undefined ? myPrefs.showUni : (student.showUniBadge !== undefined ? student.showUniBadge : true))
      : (student.showUniBadge !== undefined ? student.showUniBadge : true);

    var actionButtonsHtml = "";
    if (isSelf) {
      actionButtonsHtml = '<button onclick="window.switchTabGlobal(\'profile\')" class="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs transition cursor-pointer shadow-sm">Edit</button>';
    } else if (isFriend) {
      actionButtonsHtml = '<button onclick="window.removeFriend(\'' + student.uid + '\')" class="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-xs font-bold text-red-600 dark:text-red-400 transition cursor-pointer" title="Remove Friend">Remove</button>';
    } else if (incomingReqObj) {
      actionButtonsHtml =
        '<button onclick="window.acceptFriendRequest(\'' + incomingReqObj.id + '\', \'' + student.uid + '\')" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-sm">Accept</button>' +
        '<button onclick="window.declineFriendRequest(\'' + incomingReqObj.id + '\', \'' + student.uid + '\')" class="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-950/40 text-zinc-600 hover:text-red-600 dark:text-zinc-300 dark:hover:text-red-400 font-bold text-xs transition cursor-pointer">Decline</button>';
    } else if (isPending) {
      actionButtonsHtml = '<button onclick="window.cancelFriendRequest(\'' + student.uid + '\')" class="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-xs transition cursor-pointer flex items-center gap-1.5" title="Click to cancel request"><i data-lucide="clock" class="w-3.5 h-3.5"></i><span>Pending</span></button>';
    } else {
      actionButtonsHtml = '<button onclick="window.toggleFriendship(\'' + student.uid + '\')" class="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs transition cursor-pointer shadow-sm">Connect</button>';
    }

    var avatarContainerHtml = "";
    if (isProfilePublic) {
      avatarContainerHtml = '<div class="relative shrink-0 cursor-pointer" onclick="window.openStudentProfileModal(\'' + student.uid + '\')">';
    } else {
      avatarContainerHtml = '<div class="relative shrink-0">';
    }
    avatarContainerHtml += '<div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-white shadow-sm">' +
      '<img src="./assets/avatars/' + avId + '.png" class="w-full h-full object-cover" onerror="this.onerror=null;this.src=\'/challenge2/unisport/app/assets/avatars/' + avId + '.png\'" />' +
    '</div>' +
    '<span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 shadow-sm" title="Active Verified Student"></span>' +
    '</div>';

    var nameHeadingHtml = "";
    if (isProfilePublic) {
      nameHeadingHtml = '<h3 class="font-extrabold text-sm sm:text-base text-zinc-950 dark:text-white truncate cursor-pointer hover:underline" onclick="window.openStudentProfileModal(\'' + student.uid + '\')">' + student.displayName + '</h3>';
    } else {
      nameHeadingHtml = '<h3 class="font-extrabold text-sm sm:text-base text-zinc-950 dark:text-white truncate">' + student.displayName + '</h3>';
    }

    var uniBadgeHtml = "";
    if (showBadge) {
      uniBadgeHtml = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ' + (isTue ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" : "bg-orange-500/10 text-brand-orange border border-orange-500/20") + '">' +
        '<i data-lucide="graduation-cap" class="w-3 h-3"></i>' +
        (isTue ? "TU Eindhoven" : "Fontys UAS") +
      '</span>';
    }

    var profileBtnHtml = "";
    if (isProfilePublic && !isSelf) {
      profileBtnHtml = '<button onclick="window.openStudentProfileModal(\'' + student.uid + '\')" class="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-900 dark:text-white transition cursor-pointer">Profile</button>';
    }

    html += '<div class="p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 transition hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">' +
      '<div class="flex items-center gap-4 min-w-0">' +
        avatarContainerHtml +
        '<div class="min-w-0 flex-grow space-y-1">' +
          '<div class="flex items-center gap-2 flex-wrap">' +
            nameHeadingHtml +
            (isSelf ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">You</span>' : '') +
            uniBadgeHtml +
            (isFriend ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"><i data-lucide="check" class="w-3 h-3"></i>Friend</span>' : '') +
            (isPending ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"><i data-lucide="clock" class="w-3 h-3"></i>Request Pending</span>' : '') +
            (incomingReqObj ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-orange/15 text-brand-orange border border-brand-orange/30">Sent you a request</span>' : '') +
          '</div>' +
          '<div class="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 truncate">' +
            '<span class="font-medium truncate text-zinc-700 dark:text-zinc-300">' + (student.email || "campus.student@fontys.nl") + '</span>' +
            '<span>•</span>' +
            '<span class="truncate">' + (student.location || "Eindhoven Campus") + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="hidden lg:flex items-center gap-1.5 shrink-0">';

    for (var sIdx = 0; sIdx < Math.min(sports.length, 3); sIdx++) {
      html += '<span class="px-3 py-1 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700/50">' + sports[sIdx] + '</span>';
    }
    if (sports.length > 3) {
      html += '<span class="px-2 py-1 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-400">+' + (sports.length - 3) + '</span>';
    }

    html += '</div>' +
      '<div class="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800/60">' +
        '<div class="text-left md:text-right pr-2">' +
          '<span class="block text-xs font-extrabold text-zinc-950 dark:text-white">' + (student.sessionsCount || 0) + ' matches</span>' +
          '<span class="block text-[10px] text-zinc-400 uppercase font-semibold">Attendance</span>' +
        '</div>' +
        '<div class="flex items-center gap-2">' +
          profileBtnHtml +
          actionButtonsHtml +
        '</div>' +
      '</div>' +
    '</div>';
  }

  container.innerHTML = html;
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
};

window.renderOtherStudentProfilePage = function(uid, skipTabSwitch) {
  var modal = document.getElementById("student-profile-modal");
  if (modal) modal.classList.add("hidden");

  var currentUid = null;
  try {
    var rawSess = localStorage.getItem("unisport_active_session");
    if (rawSess) currentUid = JSON.parse(rawSess).uid;
  } catch (e) {}

  if (uid && currentUid && uid === currentUid) {
    window.switchTabGlobal("profile");
    return;
  }

  var list = window.getAllKnownStudentsList();
  var student = null;
  for (var i = 0; i < list.length; i++) {
    if (list[i] && list[i].uid === uid) {
      student = list[i];
      break;
    }
  }
  if (!student || student.isPublic === false) return;

  window.__ACTIVE_VIEWED_STUDENT_UID__ = uid;

  var avId = student.avatarId || "footballer";
  if (avId !== "bodybuilder" && avId !== "footballer" && avId !== "runner") avId = "footballer";
  var isTue = (student.university || "").indexOf("TU") !== -1 || (student.email || "").indexOf("tue.nl") !== -1;
  var uniLabel = isTue ? "TU Eindhoven" : "Fontys UAS";
  var sportLabel = student.sport || (student.sports && student.sports[0]) || "Football";
  var dName = student.displayName || "Student";
  var showBadge = student.showUniBadge !== undefined ? student.showUniBadge : true;

  var bannerName = document.getElementById("other-profile-banner-name");
  var heroName = document.getElementById("other-profile-hero-name");
  var heroEmail = document.getElementById("other-profile-hero-email");
  var heroLoc = document.getElementById("other-profile-hero-location");
  var heroSchool = document.getElementById("other-profile-hero-school");
  var heroBadge = document.getElementById("other-profile-hero-badge");
  var heroAvatarInner = document.getElementById("other-profile-hero-avatar-inner");
  var statActivities = document.getElementById("other-profile-stat-activities");
  var statSport = document.getElementById("other-profile-stat-sport");

  if (bannerName) bannerName.textContent = dName;
  if (heroName) heroName.textContent = dName;
  if (heroEmail) heroEmail.textContent = student.email || "campus.student@fontys.nl";
  if (heroLoc) heroLoc.textContent = student.location || "Eindhoven Campus";
  if (heroSchool) heroSchool.textContent = uniLabel;
  if (heroBadge) {
    if (showBadge) {
      heroBadge.classList.remove("hidden");
      heroBadge.style.display = "";
    } else {
      heroBadge.classList.add("hidden");
      heroBadge.style.display = "none";
    }
  }
  if (heroAvatarInner) {
    heroAvatarInner.innerHTML = '<img src="./assets/avatars/' + avId + '.png" class="w-full h-full object-cover rounded-full" onerror="this.onerror=null;this.src=\'/challenge2/unisport/app/assets/avatars/' + avId + '.png\'" />';
  }
  if (statActivities) statActivities.textContent = String(student.sessionsCount || 0);
  if (statSport) statSport.textContent = sportLabel;

  var actionsEl = document.getElementById("other-profile-social-actions");
  if (actionsEl) {
    var friends = [];
    var sentRequests = [];
    var incomingRequests = [];
    try {
      friends = JSON.parse(localStorage.getItem("unisport_friends") || "[]");
      sentRequests = JSON.parse(localStorage.getItem("unisport_sent_requests") || "[]");
      incomingRequests = JSON.parse(localStorage.getItem("unisport_friend_requests") || "[]");
    } catch (e) {}

    var isFriend = friends.indexOf(uid) !== -1;
    var isPending = !isFriend && sentRequests.indexOf(uid) !== -1;
    var incomingReqObj = null;
    if (!isFriend) {
      for (var rIdx = 0; rIdx < incomingRequests.length; rIdx++) {
        if (incomingRequests[rIdx] && incomingRequests[rIdx].fromUid === uid) {
          incomingReqObj = incomingRequests[rIdx];
          break;
        }
      }
    }

    if (isFriend) {
      actionsEl.innerHTML =
        '<span class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs">' +
          '<i data-lucide="user-check" class="w-4 h-4"></i><span>Friends</span>' +
        '</span>' +
        '<button onclick="window.removeFriend(\'' + uid + '\')" class="px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 font-bold text-xs transition cursor-pointer">' +
          'Remove Friend' +
        '</button>';
    } else if (incomingReqObj) {
      actionsEl.innerHTML =
        '<button onclick="window.acceptFriendRequest(\'' + incomingReqObj.id + '\', \'' + uid + '\')" class="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs transition cursor-pointer shadow-sm flex items-center gap-2">' +
          '<i data-lucide="check" class="w-4 h-4"></i><span>Accept Friend Request</span>' +
        '</button>' +
        '<button onclick="window.declineFriendRequest(\'' + incomingReqObj.id + '\', \'' + uid + '\')" class="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-red-500/30 border border-white/15 text-white font-bold text-xs transition cursor-pointer">' +
          'Decline' +
        '</button>';
    } else if (isPending) {
      actionsEl.innerHTML =
        '<button onclick="window.cancelFriendRequest(\'' + uid + '\')" class="px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-bold text-xs transition cursor-pointer flex items-center gap-2" title="Click to cancel request">' +
          '<i data-lucide="clock" class="w-4 h-4"></i><span>Pending</span>' +
        '</button>';
    } else {
      actionsEl.innerHTML =
        '<button onclick="window.toggleFriendship(\'' + uid + '\')" class="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-orange-500 text-white font-bold text-xs transition cursor-pointer shadow-sm flex items-center gap-2">' +
          '<i data-lucide="user-plus" class="w-4 h-4"></i><span>Connect</span>' +
        '</button>';
    }
  }

  if (!skipTabSwitch) {
    window.switchTabGlobal("student-profile");
  } else if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
};

window.fetchStudentsDirectFromFirestore();

window.openStudentProfileModal = function(uid) {
  var currentUid = null;
  try {
    var rawSess = localStorage.getItem("unisport_active_session");
    if (rawSess) currentUid = JSON.parse(rawSess).uid;
  } catch (e) {}
  if (uid && currentUid && uid === currentUid) {
    window.switchTabGlobal("profile");
    return;
  }

  var list = window.getAllKnownStudentsList();
  var student = null;
  for (var i = 0; i < list.length; i++) {
    if (list[i] && list[i].uid === uid) {
      student = list[i];
      break;
    }
  }
  if (student && student.isPublic === false) return;

  if (window.UniSport && typeof window.UniSport.openStudentProfileModal === "function") {
    window.UniSport.openStudentProfileModal(uid);
    return;
  }
  window.renderOtherStudentProfilePage(uid, false);
};

/* ==========================================================================
   PRIVACY, FRIENDSHIP & SEARCH HANDLERS
   ========================================================================== */

window.onPrivacySettingChanged = async function() {
  var pubInp = document.getElementById("settings-privacy-public");
  var uniInp = document.getElementById("settings-show-uni");
  var isPub = pubInp ? pubInp.checked : true;
  var showU = uniInp ? uniInp.checked : true;

  var prefs = {};
  try { prefs = JSON.parse(localStorage.getItem("unisport_app_preferences") || "{}"); } catch (e) {}
  prefs.privacyPublic = isPub;
  prefs.showUni = showU;
  localStorage.setItem("unisport_app_preferences", JSON.stringify(prefs));

  var rawSess = localStorage.getItem("unisport_active_session");
  var sess = null;
  if (rawSess) {
    try {
      sess = JSON.parse(rawSess);
      sess.isPublic = isPub;
      sess.showUniBadge = showU;
      localStorage.setItem("unisport_active_session", JSON.stringify(sess));
    } catch (e) {}
  }

  if (window.__FIRESTORE_STUDENTS__ && sess && sess.uid) {
    window.__FIRESTORE_STUDENTS__.forEach(function(s) {
      if (s.uid === sess.uid) {
        s.isPublic = isPub;
        s.showUniBadge = showU;
      }
    });
    try { localStorage.setItem("unisport_students_cache", JSON.stringify(window.__FIRESTORE_STUDENTS__)); } catch (e) {}
  }

  var heroBadge = document.getElementById("profile-hero-badge");
  if (heroBadge) {
    if (showU) heroBadge.classList.remove("hidden");
    else heroBadge.classList.add("hidden");
  }
  var dropBadge = document.getElementById("dropdown-school-container");
  if (dropBadge) {
    if (showU) dropBadge.classList.remove("hidden");
    else dropBadge.classList.add("hidden");
  }

  if (typeof window.renderCommunityInstant === "function") {
    window.renderCommunityInstant();
  }

  if (sess && sess.uid && window.UniSport && typeof window.UniSport.savePrivacySettingsToFirestore === "function") {
    await window.UniSport.savePrivacySettingsToFirestore(isPub, showU);
  }
};

window.toggleFriendship = function(uid) {
  if (window.UniSport && typeof window.UniSport.toggleFriendship === "function") {
    window.UniSport.toggleFriendship(uid);
    return;
  }
  try {
    var friends = JSON.parse(localStorage.getItem("unisport_friends") || "[]");
    var sentRequests = JSON.parse(localStorage.getItem("unisport_sent_requests") || "[]");
    var incomingRequests = JSON.parse(localStorage.getItem("unisport_friend_requests") || "[]");

    var hadIncoming = false;
    for (var i = 0; i < incomingRequests.length; i++) {
      if (incomingRequests[i] && incomingRequests[i].fromUid === uid) {
        hadIncoming = true;
        break;
      }
    }
    if (hadIncoming) {
      if (friends.indexOf(uid) === -1) friends.push(uid);
      incomingRequests = incomingRequests.filter(function(r) { return r && r.fromUid !== uid; });
      sentRequests = sentRequests.filter(function(id) { return id !== uid; });
      localStorage.setItem("unisport_friends", JSON.stringify(friends));
      localStorage.setItem("unisport_friend_requests", JSON.stringify(incomingRequests));
      localStorage.setItem("unisport_sent_requests", JSON.stringify(sentRequests));
    } else {
      if (friends.indexOf(uid) === -1 && sentRequests.indexOf(uid) === -1) {
        sentRequests.push(uid);
        localStorage.setItem("unisport_sent_requests", JSON.stringify(sentRequests));
      }
    }
    window.renderCommunityInstant();
    if (window.__ACTIVE_VIEWED_STUDENT_UID__ === uid) {
      window.renderOtherStudentProfilePage(uid, true);
    }
  } catch (e) {}
};

window.cancelFriendRequest = function(uid) {
  if (window.UniSport && typeof window.UniSport.cancelFriendRequest === "function") {
    window.UniSport.cancelFriendRequest(uid);
    return;
  }
  try {
    var sentRequests = JSON.parse(localStorage.getItem("unisport_sent_requests") || "[]");
    sentRequests = sentRequests.filter(function(id) { return id !== uid; });
    localStorage.setItem("unisport_sent_requests", JSON.stringify(sentRequests));
    window.renderCommunityInstant();
    if (window.__ACTIVE_VIEWED_STUDENT_UID__ === uid) {
      window.renderOtherStudentProfilePage(uid, true);
    }
  } catch (e) {}
};

window.acceptFriendRequest = function(reqId, fromUid) {
  if (window.UniSport && typeof window.UniSport.acceptFriendRequest === "function") {
    window.UniSport.acceptFriendRequest(reqId, fromUid);
    return;
  }
  try {
    var friends = JSON.parse(localStorage.getItem("unisport_friends") || "[]");
    var sentRequests = JSON.parse(localStorage.getItem("unisport_sent_requests") || "[]");
    var incomingRequests = JSON.parse(localStorage.getItem("unisport_friend_requests") || "[]");
    if (fromUid && friends.indexOf(fromUid) === -1) friends.push(fromUid);
    sentRequests = sentRequests.filter(function(id) { return id !== fromUid; });
    incomingRequests = incomingRequests.filter(function(r) { return r && r.id !== reqId && r.fromUid !== fromUid; });
    localStorage.setItem("unisport_friends", JSON.stringify(friends));
    localStorage.setItem("unisport_sent_requests", JSON.stringify(sentRequests));
    localStorage.setItem("unisport_friend_requests", JSON.stringify(incomingRequests));
    window.renderCommunityInstant();
    if (window.__ACTIVE_VIEWED_STUDENT_UID__ === fromUid) {
      window.renderOtherStudentProfilePage(fromUid, true);
    }
  } catch (e) {}
};

window.declineFriendRequest = function(reqId, fromUid) {
  if (window.UniSport && typeof window.UniSport.declineFriendRequest === "function") {
    window.UniSport.declineFriendRequest(reqId, fromUid);
    return;
  }
  try {
    var incomingRequests = JSON.parse(localStorage.getItem("unisport_friend_requests") || "[]");
    var declined = JSON.parse(localStorage.getItem("unisport_declined_requests") || "[]");
    var targetUid = fromUid;
    incomingRequests.forEach(function(r) {
      if (r && r.id === reqId && !targetUid) targetUid = r.fromUid;
    });
    if (targetUid && declined.indexOf(targetUid) === -1) declined.push(targetUid);
    incomingRequests = incomingRequests.filter(function(r) { return r && r.id !== reqId && (!targetUid || r.fromUid !== targetUid); });
    localStorage.setItem("unisport_friend_requests", JSON.stringify(incomingRequests));
    localStorage.setItem("unisport_declined_requests", JSON.stringify(declined));
    window.renderCommunityInstant();
    if (targetUid && window.__ACTIVE_VIEWED_STUDENT_UID__ === targetUid) {
      window.renderOtherStudentProfilePage(targetUid, true);
    }
  } catch (e) {}
};

window.removeFriend = function(uid) {
  if (window.UniSport && typeof window.UniSport.removeFriend === "function") {
    window.UniSport.removeFriend(uid);
    return;
  }
  try {
    var friends = JSON.parse(localStorage.getItem("unisport_friends") || "[]");
    var sentRequests = JSON.parse(localStorage.getItem("unisport_sent_requests") || "[]");
    friends = friends.filter(function(f) { return f !== uid; });
    sentRequests = sentRequests.filter(function(s) { return s !== uid; });
    localStorage.setItem("unisport_friends", JSON.stringify(friends));
    localStorage.setItem("unisport_sent_requests", JSON.stringify(sentRequests));
    window.renderCommunityInstant();
    if (window.__ACTIVE_VIEWED_STUDENT_UID__ === uid) {
      window.renderOtherStudentProfilePage(uid, true);
    }
  } catch (e) {}
};

window.filterStudentsGlobal = function(val) {
  window.communityStateInline.searchQuery = (val || "").trim();
  window.renderCommunityInstant();
  if (window.UniSport && typeof window.UniSport.renderCommunity === "function") {
    try { window.UniSport.renderCommunity(); } catch (e) {}
  }
};

window.executeStudentSearch = function() {
  var inp = document.getElementById("search-students");
  var val = inp ? inp.value : "";
  window.filterStudentsGlobal(val);
  if (typeof window.fetchStudentsDirectFromFirestore === "function") {
    window.fetchStudentsDirectFromFirestore();
  }
  if (window.UniSport && typeof window.UniSport.fetchCampusStudents === "function") {
    try { window.UniSport.fetchCampusStudents(); } catch (e) {}
  }
};

window.filterStudentsByUni = function(uni) {
  window.communityStateInline.uniFilter = uni;
  document.querySelectorAll(".student-uni-chip").forEach(function(chip) {
    var chipVal = chip.getAttribute("data-uni-filter");
    var isMatch = chipVal === uni || (uni === "TU Eindhoven" && (chipVal === "TU/e" || chipVal === "TU Eindhoven")) || (uni === "TU/e" && (chipVal === "TU/e" || chipVal === "TU Eindhoven"));
    if (isMatch) {
      chip.className = "student-uni-chip px-3.5 py-2 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold whitespace-nowrap transition cursor-pointer";
    } else {
      chip.className = "student-uni-chip px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold whitespace-nowrap hover:text-zinc-950 dark:hover:text-white transition cursor-pointer";
    }
  });
  window.renderCommunityInstant();
  if (window.UniSport && typeof window.UniSport.renderCommunity === "function") {
    try { window.UniSport.renderCommunity(); } catch (e) {}
  }
};

window.setCommunityView = function(view) {
  window.communityStateInline.view = view;
  var btnAll = document.getElementById("community-tab-all");
  var btnFriends = document.getElementById("community-tab-friends");
  var activeCls = "px-4 py-2 rounded-lg text-xs font-bold bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 transition cursor-pointer flex items-center gap-2";
  var inactiveCls = "px-4 py-2 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition cursor-pointer flex items-center gap-2";
  if (view === "all") {
    if (btnAll) btnAll.className = activeCls;
    if (btnFriends) btnFriends.className = inactiveCls;
  } else {
    if (btnFriends) btnFriends.className = activeCls;
    if (btnAll) btnAll.className = inactiveCls;
  }
  window.renderCommunityInstant();
  if (window.UniSport && typeof window.UniSport.renderCommunity === "function") {
    try { window.UniSport.renderCommunity(); } catch (e) {}
  }
};

/* ==========================================================================
   SETTINGS MODAL, ACCOUNT ACTIONS & AVATAR SELECTION
   ========================================================================== */

document.addEventListener("click", function(e) {
  var notifDd = document.getElementById("notifications-dropdown");
  var notifBtn = document.getElementById("notif-bell-btn");
  var sidebarNotifBtn = document.getElementById("sidebar-notif-btn");
  if (notifDd && !notifDd.classList.contains("hidden")) {
    if (!notifDd.contains(e.target) && (!notifBtn || !notifBtn.contains(e.target)) && (!sidebarNotifBtn || !sidebarNotifBtn.contains(e.target))) {
      notifDd.classList.add("hidden");
    }
  }
});

window.openSettingsGlobal = function() {
  var notifDd = document.getElementById("notifications-dropdown");
  if (notifDd) notifDd.classList.add("hidden");

  var modal = document.getElementById("settings-modal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.style.overflow = "hidden";
  }

  var settTab = document.getElementById("mobile-tab-settings");
  if (settTab) {
    settTab.className = "flex flex-col items-center gap-1 text-zinc-950 dark:text-white transition cursor-pointer font-bold";
  }
  var deskSettBtn = document.getElementById("sidebar-btn-settings");
  if (deskSettBtn) {
    deskSettBtn.classList.add("bg-zinc-100", "dark:bg-zinc-900", "text-zinc-950", "dark:text-white");
  }
  var tabs = ["feed", "community", "create", "my-activities", "profile"];
  for (var i = 0; i < tabs.length; i++) {
    var tb = document.getElementById("mobile-tab-" + tabs[i]);
    if (tb) tb.className = "flex flex-col items-center gap-1 text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition cursor-pointer";
  }

  try {
    var prefs = JSON.parse(localStorage.getItem("unisport_app_preferences") || "{}");
    var rawSess = localStorage.getItem("unisport_active_session");
    var sess = rawSess ? JSON.parse(rawSess) : {};
    var isPub = prefs.privacyPublic !== undefined ? prefs.privacyPublic : (sess.isPublic !== undefined ? sess.isPublic : true);
    var showU = prefs.showUni !== undefined ? prefs.showUni : (sess.showUniBadge !== undefined ? sess.showUniBadge : true);

    var pubInp = document.getElementById("settings-privacy-public");
    var uniInp = document.getElementById("settings-show-uni");
    if (pubInp) pubInp.checked = isPub;
    if (uniInp) uniInp.checked = showU;
  } catch (e) {}

  if (window.UniSport && typeof window.UniSport.openSettingsModal === "function") {
    window.UniSport.openSettingsModal();
  }
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
};

window.closeSettingsGlobal = function() {
  var modal = document.getElementById("settings-modal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
  document.body.style.overflow = "";

  var settTab = document.getElementById("mobile-tab-settings");
  if (settTab) {
    settTab.className = "flex flex-col items-center gap-1 text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition cursor-pointer";
  }
  var deskSettBtn = document.getElementById("sidebar-btn-settings");
  if (deskSettBtn) {
    deskSettBtn.classList.remove("bg-zinc-100", "dark:bg-zinc-900", "text-zinc-950", "dark:text-white");
  }
};

window.handleSignOutGlobal = async function() {
  try {
    localStorage.removeItem("unisport_active_session");
    if (window.UniSport && typeof window.UniSport.signOut === "function") {
      await window.UniSport.signOut();
    }
  } catch (e) {
    console.warn("Sign out fallback:", e);
  }
  window.location.href = "./login.html";
};

window.clearCacheGlobal = async function() {
  if (window.UniSport && typeof window.UniSport.clearCache === "function") {
    window.UniSport.clearCache();
    return;
  }
  try {
    localStorage.removeItem("unisport_students_cache");
    localStorage.removeItem("unisport_friends");
    localStorage.removeItem("unisport_friend_requests");
    localStorage.removeItem("unisport_notifications");

    if ("caches" in window) {
      try {
        var keys = await caches.keys();
        await Promise.all(keys.map(function(k) { return caches.delete(k); }));
      } catch (e) {}
    }

    var btn = document.getElementById("settings-clear-cache-btn");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Updating...";
    }

    setTimeout(function() {
      if (btn) {
        btn.textContent = "Cleared & Updated!";
      }
      setTimeout(function() {
        window.location.reload(true);
      }, 600);
    }, 500);
  } catch (e) {
    console.error("clearCache error:", e);
  }
};

window.deleteAccountGlobal = function() {
  if (window.UniSport && typeof window.UniSport.deleteAccount === "function") {
    window.UniSport.deleteAccount();
    return;
  }
  var confirmed = window.confirm(
    "Are you absolutely sure you want to delete your UniSport account?\n\nThis will permanently delete your student profile, mascot preferences, and match attendance. This cannot be undone."
  );
  if (!confirmed) return;

  var finalWord = window.prompt("To permanently confirm deletion, please type DELETE below:");
  if (finalWord !== "DELETE") {
    alert("Account deletion canceled.");
    return;
  }

  var btn = document.getElementById("settings-delete-account-btn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Deleting...";
  }

  localStorage.removeItem("unisport_active_session");
  localStorage.removeItem("unisport_app_preferences");
  alert("Your UniSport account has been permanently deleted.");
  window.location.href = "./login.html";
};

window.selectAvatarOption = function(avatarId) {
  if (window.UniSport && typeof window.UniSport.selectAvatar === "function") {
    window.UniSport.selectAvatar(avatarId);
    return;
  }
  try {
    var raw = localStorage.getItem("unisport_active_session");
    var user = raw ? JSON.parse(raw) : null;
    if (user) {
      user.avatarId = avatarId;
      localStorage.setItem("unisport_active_session", JSON.stringify(user));

      var hInner = document.getElementById("profile-hero-avatar-inner");
      if (hInner) hInner.innerHTML = '<img src="./assets/avatars/' + avatarId + '.png" class="w-full h-full object-cover rounded-full" onerror="this.src=\'./assets/avatars/footballer.png\'" />';

      var gInner = document.getElementById("google-avatar-inner");
      if (gInner) gInner.innerHTML = '<img src="./assets/avatars/' + avatarId + '.png" class="w-full h-full object-cover rounded-full" onerror="this.src=\'./assets/avatars/footballer.png\'" />';

      var picker = document.getElementById("profile-avatar-picker");
      if (picker) {
        var btns = picker.querySelectorAll(".profile-avatar-option");
        btns.forEach(function(b) {
          var isThis = b.dataset.avatarId === avatarId;
          var pill = b.querySelector(".avatar-status-pill");
          if (isThis) {
            b.className = "profile-avatar-option group relative flex flex-col items-center gap-3 p-4 sm:p-6 rounded-2xl border-2 border-brand-orange bg-orange-500/10 transition-all cursor-pointer shadow-sm hover:scale-[1.01]";
            if (pill) {
              pill.className = "avatar-status-pill text-xs uppercase font-bold text-brand-orange";
              pill.textContent = "Selected";
            }
          } else {
            b.className = "profile-avatar-option group relative flex flex-col items-center gap-3 p-4 sm:p-6 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all cursor-pointer hover:scale-[1.01]";
            if (pill) {
              pill.className = "avatar-status-pill text-xs text-zinc-400 group-hover:text-zinc-600";
              pill.textContent = "Select";
            }
          }
        });
      }
    }
  } catch (e) {}
};

/* ==========================================================================
   INITIALIZATION HOOKS
   ========================================================================== */

if (typeof lucide !== "undefined" && typeof lucide.createIcons === "function") {
  lucide.createIcons();
}

if (typeof window.renderCommunityInstant === "function") {
  window.renderCommunityInstant();
}

document.addEventListener("DOMContentLoaded", function() {
  hydratePreloadedNavigation();
  if (typeof lucide !== "undefined" && typeof lucide.createIcons === "function") {
    lucide.createIcons();
  }
  if (typeof window.renderCommunityInstant === "function") {
    window.renderCommunityInstant();
  }
  if (typeof window.fetchStudentsDirectFromFirestore === "function") {
    window.fetchStudentsDirectFromFirestore();
  }
});
