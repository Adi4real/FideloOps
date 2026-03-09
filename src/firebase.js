// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBpomo73YTQYDdJYejz4nU2XVjQoT5vhjs",
  authDomain: "fideloops-ce17e.firebaseapp.com",
  projectId: "fideloops-ce17e",
  storageBucket: "fideloops-ce17e.firebasestorage.app",
  messagingSenderId: "1002005456580",
  appId: "1:1002005456580:web:f63dacef18e0a695748b91",
  measurementId: "G-KQHE9DSQT9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);