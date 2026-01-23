// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCdcSHyi1kp8ocNC8IpQ9S1m2JhWPcCBUA",
  authDomain: "xplooreze-web-e6a65.firebaseapp.com",
  projectId: "xplooreze-web-e6a65",
  storageBucket: "xplooreze-web-e6a65.firebasestorage.app",
  messagingSenderId: "1040575786267",
  appId: "1:1040575786267:web:1bf5d6145f8865ad9177be",
  measurementId: "G-CBTD3VZE7J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firestore instance
const db = getFirestore(app);

export { db };