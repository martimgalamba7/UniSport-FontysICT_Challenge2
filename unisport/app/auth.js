// UniSport Authentication Engine: Standard Secure Email + Password
import { 
  app, 
  auth, 
  db, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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
const ACTIVE_SESSION_KEY = "unisport_active_session";

export function sanitize(str) {
  if (typeof str !== "string") return "";
  return str.trim().replace(/[<>'"`;]/g, "").slice(0, 300);
}

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
      error: "Only @student.fontys.nl and @student.tue.nl student accounts are allowed." 
    };
  }

  return { isValid: true, email: cleanEmail };
}

/**
 * Register a student with Email + Password + Profile Data
 */
export async function registerStudentWithPassword({ email, password, fullName, avatarId, sports, socialPreference, intensityPreference, schedulePreference, preferredLocations }) {
  const emailVal = validateStudentEmail(email);
  if (!emailVal.isValid) {
    return { success: false, error: emailVal.error };
  }

  if (!password || password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  const cleanName = sanitize(fullName);
  if (!cleanName || cleanName.length < 2) {
    return { success: false, error: "Please enter your name (at least 2 characters)." };
  }

  const university = emailVal.email.endsWith("@student.tue.nl") ? "TU Eindhoven" : "Fontys UAS";

  try {
    const cred = await createUserWithEmailAndPassword(auth, emailVal.email, password);
    const user = cred.user;

    await updateProfile(user, { displayName: cleanName });

    const firestoreData = {
      uid: user.uid,
      email: emailVal.email,
      displayName: cleanName,
      university: university,
      avatarId: avatarId || "bolt",
      sport: sports && sports.length > 0 ? sports[0] : "Football",
      sports: sports || ["Football"],
      socialPreference: socialPreference || [],
      intensityPreference: intensityPreference || [],
      schedulePreference: schedulePreference || [],
      preferredLocations: preferredLocations || [],
      createdAt: serverTimestamp()
    };

    // Save profile to Cloud Firestore
    try {
      console.log("Writing user to Firestore...", user.uid, firestoreData);
      await setDoc(doc(db, "users", user.uid), firestoreData, { merge: true });
      console.log("Firestore user profile created successfully!");
    } catch (fsErr) {
      console.error("Firestore user creation error:", fsErr);
    }

    const sessionUser = {
      uid: user.uid,
      email: emailVal.email,
      displayName: cleanName,
      university: university,
      avatarId: avatarId || "bolt",
      sport: sports && sports.length > 0 ? sports[0] : "Football",
      sports: sports || ["Football"],
      socialPreference: socialPreference || [],
      intensityPreference: intensityPreference || [],
      schedulePreference: schedulePreference || [],
      preferredLocations: preferredLocations || [],
      createdAt: Date.now()
    };

    setActiveSession(sessionUser);
    return { success: true, user: sessionUser };
  } catch (error) {
    console.error("Firebase SignUp error:", error);
    let msg = error.message;
    if (error.code === "auth/email-already-in-use") {
      msg = "This student email is already registered. Please sign in.";
    } else if (error.code === "auth/weak-password") {
      msg = "Password is too weak. Please use at least 6 characters.";
    } else if (error.code === "auth/invalid-email") {
      msg = "Invalid email format.";
    }
    return { success: false, error: msg };
  }
}

/**
 * Sign In with Email + Password
 */
export async function loginStudentWithPassword(email, password) {
  const emailVal = validateStudentEmail(email);
  if (!emailVal.isValid) {
    return { success: false, error: emailVal.error };
  }

  if (!password) {
    return { success: false, error: "Please enter your password." };
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, emailVal.email, password);
    const user = cred.user;

    // Fetch profile from Firestore
    let profile = null;
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        profile = snap.data();
      } else {
        // If user document does not exist yet in Firestore, create it now!
        const newProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || emailVal.email.split("@")[0],
          university: emailVal.email.endsWith("@student.tue.nl") ? "TU Eindhoven" : "Fontys UAS",
          avatarId: "bodybuilder",
          sport: "Football",
          sports: ["Football"],
          socialPreference: ["Casual"],
          intensityPreference: ["Medium"],
          schedulePreference: ["Evenings"],
          preferredLocations: ["SSC Eindhoven"]
        };
        await setDoc(doc(db, "users", user.uid), newProfile, { merge: true });
        profile = newProfile;
      }
    } catch (e) {
      console.warn("Firestore profile fetch/write notice:", e);
    }

    const sessionUser = profile || {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || emailVal.email.split("@")[0],
      university: emailVal.email.endsWith("@student.tue.nl") ? "TU Eindhoven" : "Fontys UAS",
      avatarId: "bodybuilder",
      sport: "Football"
    };

    setActiveSession(sessionUser);
    return { success: true, user: sessionUser };
  } catch (error) {
    console.error("Firebase SignIn error:", error);
    let msg = "Invalid email or password.";
    if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
      msg = "Incorrect student email or password.";
    } else if (error.code === "auth/too-many-requests") {
      msg = "Too many failed attempts. Please wait a moment and try again.";
    }
    return { success: false, error: msg };
  }
}

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

export async function signOutStudent() {
  try {
    await signOut(auth);
  } catch {}
  setActiveSession(null);
}

export async function getStudentProfile(uid) {
  const session = getActiveSession();
  if (session && session.uid === uid) return session;

  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) return snap.data();
  } catch {}

  return session;
}

export async function updateStudentProfile(uid, profileData) {
  const session = getActiveSession() || {};
  const updated = { ...session, ...profileData, updatedAt: Date.now() };
  setActiveSession(updated);

  try {
    await setDoc(doc(db, "users", uid), profileData, { merge: true });
  } catch {}

  return { success: true };
}
