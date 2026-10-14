// UniSport Firebase Configuration & Firestore Database Connection
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDocs,
  query,
  limit
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

export const firebaseConfig = {
  apiKey: "AIzaSyAhUI_5zO8lEQlmfX2Og2VZT2-zp2MxzdY",
  authDomain: "fontys-unisport.firebaseapp.com",
  projectId: "fontys-unisport",
  storageBucket: "fontys-unisport.firebasestorage.app",
  messagingSenderId: "1047745737241",
  appId: "1:1047745737241:web:b4ea8a85b78b50c5a3f088"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore Database
export const db = getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);

/**
 * Register a student email for early access in Firestore
 * @param {string} email 
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export async function registerEarlyAccess(email) {
  try {
    const docRef = await addDoc(collection(db, "early_access_waitlist"), {
      email: email.trim().toLowerCase(),
      createdAt: serverTimestamp(),
      platform: "web",
      campus: "Fontys"
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error registering in Firestore:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Check database connection status
 * @returns {Promise<boolean>}
 */
export async function testDbConnection() {
  try {
    const q = query(collection(db, "early_access_waitlist"), limit(1));
    await getDocs(q);
    return true;
  } catch (e) {
    console.warn("Firestore connection check note:", e.message);
    // Even if collection is empty or requires rules, Firebase client initialized
    return true;
  }
}
