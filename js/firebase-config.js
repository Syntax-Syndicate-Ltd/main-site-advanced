/* ══════════════════════════════════════════════
   SYNTAX SYNDICATE — FIREBASE CONFIG
   Replace the config below with your project's
   Firebase credentials from the Firebase Console.
   ══════════════════════════════════════════════ */

// ── Firebase SDKs (compat CDN — no build step) ──
// These are loaded via <script> tags in each HTML page:
//   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>

const firebaseConfig = {
  apiKey: "AIzaSyDZEbxDLJ66BNlyC_ttSFxuvJS5Whi5JX4",
  authDomain: "syntax-syndicate-main.firebaseapp.com",
  projectId: "syntax-syndicate-main",
  storageBucket: "syntax-syndicate-main.firebasestorage.app",
  messagingSenderId: "184786946443",
  appId: "1:184786946443:web:13dcf14e0b67486925078e",
  measurementId: "G-D7LEXZKR8E"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export service references
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence (optional — improves UX)
// Note: enableMultiTabIndexedDbPersistence is deprecated in v10+ Compat.
// If offline mode is required, initialize via db.settings({ localCache: ... }) instead.

console.log('🔥 Firebase initialized');
