import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// ADD THIS LINE BELOW:
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBpomp7JYIQYXDYejz4niUXVjQcTSvhjs",
  authDomain: "fideloops-ce17e.firebaseapp.com",
  projectId: "fideloops-ce17e",
  storageBucket: "fideloops-ce17e.firebasestorage.app",
  messagingSenderId: "1002005456580",
  appId: "1:1002005456580:web:fd3caef18e0ab97b48b91",
  measurementId: "G-KQHF9DSQT9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// This will now turn blue/yellow because of the import at the top
export const db = getFirestore(app);