// firebase.js (CORRECT VERSION FOR YOUR PROJECT)

const firebaseConfig = {
  apiKey: "AIzaSyDs1kyGN2-Vyp7MDJvrLHJLzhFliblT6R4",
  authDomain: "labour-management-28ed0.firebaseapp.com",
  projectId: "labour-management-28ed0",
  storageBucket: "labour-management-28ed0.appspot.com",
  messagingSenderId: "707231581452",
  appId: "1:707231581452:web:242f583a8a9828137f3529"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase Authentication
const auth = firebase.auth();
// Cloud Firestore
const db = firebase.firestore();

// users to stay logged in even after closing the browser
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
.catch((error) => {
    console.error(error);
});
