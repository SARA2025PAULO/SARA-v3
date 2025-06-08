import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage"; // Added

// =====================================================================================
// 🔥🔥🔥 CRITICAL FIREBASE CONFIGURATION REQUIRED 🔥🔥🔥
// =====================================================================================
//
// THE VALUES IN `firebaseConfig` BELOW ARE CURRENTLY PLACEHOLDERS.
// YOUR APPLICATION WILL NOT FUNCTION CORRECTLY (ESPECIALLY AUTHENTICATION
// AND DATABASE FEATURES) UNTIL YOU REPLACE THESE PLACEHOLDERS WITH YOUR
// ACTUAL FIREBASE PROJECT'S CONFIGURATION DETAILS.
//
// How to get your Firebase project configuration:
// 1. Go to the Firebase console: https://console.firebase.google.com/
// 2. Select your project.
// 3. In the project overview, click the gear icon (⚙️) to go to "Project settings".
// 4. In the "General" tab, scroll down to the "Your apps" section.
// 5. If you haven't registered a web app, click the web icon (</>) to add one.
// 6. Once your web app is registered, find it in the list and look for the
//    "SDK setup and configuration" section. Select the "Config" option.
// 7. Copy the configuration object provided by Firebase and paste its values
//    into the `firebaseConfig` object below, replacing the placeholders.
//
// Example of what you'll copy from Firebase:
// const firebaseConfig = {
//   apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXX",
//   authDomain: "your-project-id.firebaseapp.com",
//   projectId: "your-project-id",
//   storageBucket: "your-project-id.appspot.com",
//   messagingSenderId: "000000000000",
//   appId: "1:000000000000:web:XXXXXXXXXXXXXXXXXXXXXX"
// };
//
// =====================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyDnS-HE3g4djBAinSGeHwCEupOTY56iouA",
  authDomain: "sara3o.firebaseapp.com",
  projectId: "sara3o",
  storageBucket: "sara3o.firebasestorage.app", // Corrected from your input, typically it's projectId.appspot.com or projectId.firebasestorage.app
  messagingSenderId: "59080776640",
  appId: "1:59080776640:web:a430fc589f5fe211ef8625"
};
// =====================================================================================
// END OF CRITICAL CONFIGURATION SECTION. ENSURE THE VALUES ABOVE ARE CORRECT.
// =====================================================================================


let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage; // Added

if (typeof window !== 'undefined' && !getApps().length) {
  // IMPORTANT: If firebaseConfig above is not correctly filled with your
  // actual project details, the following line `initializeApp(firebaseConfig)`
  // will likely cause errors, such as the 'auth/api-key-not-valid' error you might be seeing.
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app); // Added
  } catch (error) {
    console.error("Firebase initialization error:", error);
    // Potentially display a user-friendly message or fallback
  }
} else if (typeof window !== 'undefined') {
  try {
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app); // Added
  } catch (error) {
    console.error("Firebase getApp error:", error);
     // This might happen if initializeApp failed previously or other issues.
  }
} else {
  // Handle server-side case if needed, though Firebase client SDK is primarily for client
  // For now, these will be undefined on server, which is fine if only used client-side
}


export { app, auth, db, storage }; // Added storage to exports
