
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Leads Widget is pinned to a single Firebase project to avoid runtime env mismatches.
const firebaseConfig = {
    apiKey: "AIzaSyCXNFoeg1nrYcFHzU9TEKNnDPg1mHU3_tA",
    authDomain: "leads-widget.firebaseapp.com",
    projectId: "leads-widget",
    storageBucket: "leads-widget.firebasestorage.app",
    messagingSenderId: "638272160098",
    appId: "1:638272160098:web:235439322b85e67b9d2c3b"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
