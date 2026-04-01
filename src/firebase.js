import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, where, orderBy } from "firebase/firestore";

// TODO: Substitua pelos dados do seu Console do Firebase (firebase.google.com)
const firebaseConfig = {
  apiKey: "AIzaSyC9-3flNhLog1OGvfvJdlaK2GRUDFRXPhQ",
  authDomain: "voice-notes-app-3b5d7.firebaseapp.com",
  projectId: "voice-notes-app-3b5d7",
  storageBucket: "voice-notes-app-3b5d7.firebasestorage.app",
  messagingSenderId: "879028812746",
  appId: "1:879028812746:web:1ad62dca3cf44568a36d33",
  measurementId: "G-7TW1Z5VL49"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);
