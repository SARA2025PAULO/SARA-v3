import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

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
  apiKey: "YOUR_API_KEY", // 👈 REPLACE THIS with your Firebase project's API Key
  authDomain: "YOUR_AUTH_DOMAIN", // 👈 REPLACE THIS with your Firebase project's Auth Domain
  projectId: "YOUR_PROJECT_ID", // 👈 REPLACE THIS with your Firebase project's Project ID
  storageBucket: "YOUR_STORAGE_BUCKET", // 👈 REPLACE THIS with your Firebase project's Storage Bucket
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // 👈 REPLACE THIS with your Firebase project's Messaging Sender ID
  appId: "YOUR_APP_ID", // 👈 REPLACE THIS with your Firebase project's App ID
};
// =====================================================================================
// END OF CRITICAL CONFIGURATION SECTION. ENSURE THE VALUES ABOVE ARE CORRECT.
// =====================================================================================


let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (typeof window !== 'undefined' && !getApps().length) {
  // IMPORTANT: If firebaseConfig above is not correctly filled with your
  // actual project details, the following line `initializeApp(firebaseConfig)`
  // will likely cause errors, such as the 'auth/api-key-not-valid' error you might be seeing.
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else if (typeof window !== 'undefined') {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  // Handle server-side case if needed, though Firebase client SDK is primarily for client
  // For now, these will be undefined on server, which is fine if only used client-side
}


export { app, auth, db };
