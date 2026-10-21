// UniSport Passwordless Magic Link & Student Identity Engine
import { 
  app, 
  auth, 
  db, 
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut, 
  onAuthStateChanged,
  updateProfile,
  doc, 
  setDoc, 
  getDoc,
  collection,
  addDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "./firebase-config.js";

// Allowed student email domains
const ALLOWED_DOMAINS = ["student.fontys.nl", "student.tue.nl"];

// Local Storage Keys
const EMAIL_FOR_SIGN_IN_KEY = "unisport_email_for_sign_in";
const PENDING_PROFILE_KEY = "unisport_pending_profile";
const ACTIVE_SESSION_KEY = "unisport_active_session";
const LOCAL_USERS_KEY = "unisport_students_db";

/**
 * Sanitizes string input
 */
export function sanitize(str) {
  if (typeof str !== "string") return "";
  return str.trim().replace(/[<>'"`;]/g, "").slice(0, 300);
}

/**
 * Validates student email format and university domain
 */
export function validateStudentEmail(email) {
  const cleanEmail = (email || "").trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    return { isValid: false, error: "Please enter a valid email address." };
  }

  const domain = cleanEmail.split("@")[1];
  if (!ALLOWED_DOMAINS.includes(domain)) {
    return { 
      isValid: false, 
      error: "Only @student.fontys.nl and @student.tue.nl student emails are allowed." 
    };
  }

  return { isValid: true, email: cleanEmail };
}

/**
 * Action Code Settings for Firebase Email Link Sign-in
 */
function getActionCodeSettings() {
  const origin = window.location.origin;
  // Always redirect to login page where email link confirmation is handled
  const url = `${origin}/challenge2/unisport/login`;
  
  return {
    url: url,
    handleCodeInApp: true
  };
}

/**
 * Sends a passwordless sign-in Magic Link to the student's email
 * @param {string} email 
 * @param {object} optionalProfileData (Used when signing up with sport, name, avatar)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendStudentMagicLink(email, optionalProfileData = null) {
  const val = validateStudentEmail(email);
  if (!val.isValid) {
    return { success: false, error: val.error };
  }

  const actionCodeSettings = getActionCodeSettings();

  try {
    await sendSignInLinkToEmail(auth, val.email, actionCodeSettings);

    // Save email locally so student doesn't need to retype when clicking the email link
    window.localStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, val.email);

    if (optionalProfileData) {
      window.localStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify(optionalProfileData));
    }

    return { success: true };
  } catch (error) {
    console.warn("Firebase sendSignInLinkToEmail note:", error);

    // Fallback simulate instant direct login for local testing / development
    window.localStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, val.email);
    if (optionalProfileData) {
      window.localStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify(optionalProfileData));
    }

    let msg = error.message;
    if (error.code === "auth/invalid-email") msg = "Invalid email address.";
    if (error.code === "auth/unauthorized-continue-uri") {
      msg = "Please add your domain to Authorized Domains in Firebase Console.";
    }

    return { success: false, error: msg, fallbackReady: true };
  }
}

/**
 * Completes sign in when student clicks the link from their email
 * Checks isSignInWithEmailLink(auth, window.location.href)
 * @returns {Promise<{success: boolean, user?: any, isMagicLink: boolean, error?: string}>}
 */
export async function handleIncomingEmailLink() {
  if (!isSignInWithEmailLink(auth, window.location.href)) {
    return { success: false, isMagicLink: false };
  }

  let email = window.localStorage.getItem(EMAIL_FOR_SIGN_IN_KEY);
  if (!email) {
    // If opened on another device/browser, prompt student for email
    email = window.prompt("Please confirm your student email (@student.fontys.nl or @student.tue.nl):");
  }

  const val = validateStudentEmail(email);
  if (!val.isValid) {
    return { success: false, isMagicLink: true, error: val.error };
  }

  try {
    const result = await signInWithEmailLink(auth, val.email, window.location.href);
    window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);

    const user = result.user;
    
    // Check if there was pending profile data from registration steps
    let pendingProfile = null;
    try {
      const p = window.localStorage.getItem(PENDING_PROFILE_KEY);
      if (p) pendingProfile = JSON.parse(p);
    } catch {}

    const university = val.email.endsWith("@student.tue.nl") ? "TU Eindhoven" : "Fontys UAS";
    const displayName = pendingProfile?.fullName || user.displayName || val.email.split("@")[0];

    const sessionUser = {
      uid: user.uid,
      email: val.email,
      displayName: displayName,
      university: university,
      sport: pendingProfile?.sport || "Football",
      skillLevel: pendingProfile?.skillLevel || "Intermediate",
      avatar: pendingProfile?.avatar || "⚽"
    };

    if (pendingProfile?.fullName) {
      await updateProfile(user, { displayName });
    }

    // Save profile to Firestore
    try {
      await setDoc(doc(db, "users", user.uid), {
        ...sessionUser,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn("Firestore sync deferred:", e);
    }

    setActiveSession(sessionUser);
    window.localStorage.removeItem(PENDING_PROFILE_KEY);

    return { success: true, isMagicLink: true, user: sessionUser };
  } catch (error) {
    console.error("Error signing in with email link:", error);
    return { success: false, isMagicLink: true, error: error.message };
  }
}

/**
 * Instant local session manager
 */
export function getActiveSession() {
  try {
    const s = localStorage.getItem(ACTIVE_SESSION_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function setActiveSession(user) {
  if (user) {
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  }
}

/**
 * Student Sign Out
 */
export async function signOutStudent() {
  try {
    await signOut(auth);
  } catch {}
  setActiveSession(null);
}

/**
 * Get profile
 */
export async function getStudentProfile(uid) {
  const session = getActiveSession();
  if (session && session.uid === uid) return session;

  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) return snap.data();
  } catch {}

  return session;
}

/**
 * Update profile
 */
export async function updateStudentProfile(uid, profileData) {
  const session = getActiveSession() || {};
  const updated = { ...session, ...profileData, updatedAt: Date.now() };
  setActiveSession(updated);

  try {
    await setDoc(doc(db, "users", uid), profileData, { merge: true });
  } catch {}

  return { success: true };
}
