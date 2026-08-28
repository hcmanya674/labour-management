// =====================================================
// firebase.js
// LABOUR MANAGEMENT SYSTEM
// =====================================================

const firebaseConfig = {

    apiKey: "AIzaSyDs1kyGN2-Vyp7MDJvrLHJLzhFliblT6R4",

    authDomain: "labour-management-28ed0.firebaseapp.com",

    projectId: "labour-management-28ed0",

    storageBucket: "labour-management-28ed0.appspot.com",

    messagingSenderId: "707231581452",

    appId: "1:707231581452:web:242f583a8a9828137f3529"

};


// =====================================================
// INITIALIZE FIREBASE
// =====================================================

if (!firebase.apps.length) {

    firebase.initializeApp(firebaseConfig);

}


// =====================================================
// FIREBASE AUTHENTICATION
// =====================================================

const auth = firebase.auth();


// =====================================================
// FIRESTORE
// =====================================================

const db = firebase.firestore();


// =====================================================
// FIRESTORE CONNECTION FIX
// =====================================================
// This helps when WebChannel connections fail,
// especially on localhost / some networks.
// =====================================================

try {

    db.settings({

        experimentalForceLongPolling: true,

        useFetchStreams: false

    });

    console.log(
        "Firestore long-polling enabled."
    );

}

catch (error) {

    console.warn(
        "Firestore settings already initialized:",
        error
    );

}


// =====================================================
// AUTH PERSISTENCE
// =====================================================

auth.setPersistence(
    firebase.auth.Auth.Persistence.LOCAL
)
.catch(error => {

    console.error(
        "Auth persistence error:",
        error
    );

});