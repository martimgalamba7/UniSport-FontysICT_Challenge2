// UniSport Authentication & Security Module
import { 
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
  serverTimestamp
} from "./firebase-config.js";

// Allowed student email domains
const ALLOWED_DOMAINS = ["student.fontys.nl", "student.tue.nl"];

/**
 * Sanitizes string input to prevent injection attacks & unexpected control chars
 * @param {string} str 
 * @returns {string}
 */
export function sanitize(str) {
  if (typeof str !== "string") return "";
  return str
    .trim()
    .replace(/[<>'"`;]/g, "") // remove potential html/injection tokens
    .slice(0, 200); // enforce maximum reasonable length
}

/**
 * Validates if an email is a legitimate student email from Fontys or TU/e
 * @param {string} email 
 * @returns {{isValid: boolean, error?: string}}
 */
export function validateStudentEmail(email) {
  const cleanEmail = (email || "").trim().toLowerCase();
  
  // RFC 5322 simplified email regex pattern
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    return { isValid: false, error: "Please enter a valid email format." };
  }

  const parts = cleanEmail.split("@");
  if (parts.length !== 2) {
    return { isValid: false, error: "Invalid email structure." };
  }

  const domain = parts[1];
  if (!ALLOWED_DOMAINS.includes(domain)) {
    return { 
      isValid: false, 
      error: "Only student accounts from @student.fontys.nl or @student.tue.nl are allowed." 
    };
  }

  return { isValid: true, email: cleanEmail };
}

/**
 * Validates password strength
 * @param {string} password 
 * @returns {{isValid: boolean, error?: string}}
 */
export function validatePassword(password) {
  if (!password || password.length < 6) {
    return { isValid: false, error: "Password must be at least 6 characters long." };
  }
  return { isValid: true };
}

/**
 * Signs up a new student account
 * @param {string} email 
 * @param {string} password 
 * @param {string} fullName 
 * @returns {Promise<{success: boolean, user?: any, error?: string}>}
 */
export async function signUpStudent(email, password, fullName) {
  const emailVal = validateStudentEmail(email);
  if (!emailVal.isValid) {
    return { success: false, error: emailVal.error };
  }

  const passVal = validatePassword(password);
  if (!passVal.isValid) {
    return { success: false, error: passVal.error };
  }

  const cleanName = sanitize(fullName);
  if (!cleanName || cleanName.length < 2) {
    return { success: false, error: "Please provide your full name (at least 2 characters)." };
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, emailVal.email, password);
    const user = cred.user;

    // Set display name in Firebase Auth
    await updateProfile(user, { displayName: cleanName });

    // Determine university affiliation
    const university = emailVal.email.endsWith("@student.tue.nl") ? "TU Eindhoven" : "Fontys UAS";

    // Create user profile document in Firestore
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: emailVal.email,
      displayName: cleanName,
      university: university,
      sports: ["Gym", "Running"],
      skillLevel: "Intermediate",
      bio: "Eindhoven student active on UniSport",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    return { success: true, user };
  } catch (err) {
    console.error("SignUp error:", err);
    let message = "Registration failed. Please check your credentials.";
    if (err.code === "auth/email-already-in-use") {
      message = "This email is already registered. Please sign in instead.";
    } else if (err.code === "auth/weak-password") {
      message = "Password is too weak. Please use a stronger password.";
    } else if (err.code === "auth/invalid-email") {
      message = "Invalid email format.";
    }
    return { success: false, error: message };
  }
}

/**
 * Signs in an existing student
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{success: boolean, user?: any, error?: string}>}
 */
export async function signInStudent(email, password) {
  const emailVal = validateStudentEmail(email);
  if (!emailVal.isValid) {
    return { success: false, error: emailVal.error };
  }

  if (!password) {
    return { success: false, error: "Please enter your password." };
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, emailVal.email, password);
    return { success: true, user: cred.user };
  } catch (err) {
    console.error("SignIn error:", err);
    let message = "Invalid email or password.";
    if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
      message = "Incorrect email or password.";
    } else if (err.code === "auth/too-many-requests") {
      message = "Too many failed attempts. Please try again later.";
    }
    return { success: false, error: message };
  }
}

/**
 * Signs out the current student
 * @returns {Promise<void>}
 */
export async function signOutStudent() {
  await signOut(auth);
}

/**
 * Gets or loads student profile from Firestore (with local fallback if offline/rules block)
 * @param {string} uid 
 * @returns {Promise<any>}
 */
export async function getStudentProfile(uid) {
  try {
    const docRef = doc(db, "users", uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (e) {
    console.warn("Could not fetch remote profile, using cached/session state:", e);
  }
  return null;
}

/**
 * Updates student profile
 * @param {string} uid 
 * @param {object} profileData 
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateStudentProfile(uid, profileData) {
  try {
    const docRef = doc(db, "users", uid);
    await setDoc(docRef, {
      ...profileData,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (e) {
    console.error("Profile update error:", e);
    return { success: false, error: e.message };
  }
}
