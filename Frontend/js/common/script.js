// =====================================================
// LABOUR MANAGEMENT SYSTEM
// LOGIN + PWA
// =====================================================


// =====================================================
// GLOBAL PWA VARIABLE
// =====================================================

let deferredPrompt = null;



// =====================================================
// LEADER INTERNAL EMAIL
// =====================================================
//
// IMPORTANT:
//
// Leaders never see or enter this email.
//
// Firebase Authentication requires an identifier.
// We generate one internally from the phone number.
//
// Example:
//
// 9876543210
//
// becomes:
//
// 9876543210@leader.labour.local
//
// =====================================================

function getLeaderInternalEmail(phone) {

    return phone + "@leader.labour.local";

}


// =====================================================
// LOGIN FUNCTION
// =====================================================

function login() {

    const userid =
        document.getElementById("userid").value.trim();

    const password =
        document.getElementById("password").value.trim();

    const btn =
        document.getElementById("loginBtn");


    // =================================================
    // VALIDATION
    // =================================================

    if (userid === "" && password === "") {

        alert(
            "Please enter your Email/Mobile Number and Password."
        );

        return;
    }


    if (userid === "") {

        alert(
            "Please enter Admin Email or Leader Mobile Number."
        );

        return;
    }


    if (password === "") {

        alert(
            "Please enter your password."
        );

        return;
    }


    // =================================================
    // DETERMINE LOGIN TYPE
    // =================================================

    const isEmail =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userid);


    const isPhone =
        /^[0-9]{10}$/.test(userid);


    // =================================================
    // INVALID LOGIN ID
    // =================================================

    if (!isEmail && !isPhone) {

        alert(
            "Please enter a valid Admin Email or 10-digit Leader Mobile Number."
        );

        return;
    }


    // =================================================
    // FIREBASE EMAIL USED FOR LOGIN
    // =================================================

    let firebaseEmail;


    if (isEmail) {

        // ---------------------------------------------
        // ADMIN LOGIN
        // ---------------------------------------------

        firebaseEmail = userid;

    }

    else {

        // ---------------------------------------------
        // LEADER LOGIN
        // ---------------------------------------------

        firebaseEmail =
            userid + "@leader.labour.local";

    }


    // =================================================
    // DISABLE BUTTON
    // =================================================

    btn.disabled = true;

    btn.innerHTML = "Logging in...";


    // =================================================
    // FIREBASE LOGIN
    // =================================================

    auth.signInWithEmailAndPassword(
        firebaseEmail,
        password
    )

    .then((userCredential) => {

        const uid =
            userCredential.user.uid;


        // ---------------------------------------------
        // SAVE UID
        // ---------------------------------------------

        localStorage.setItem(
            "uid",
            uid
        );


        console.log(
            "Login successful. UID:",
            uid
        );


        // ---------------------------------------------
        // GET USER PROFILE
        // ---------------------------------------------

        return db
            .collection("users")
            .doc(uid)
            .get();

    })


    .then((doc) => {

        // =================================================
        // USER DOCUMENT NOT FOUND
        // =================================================

        if (!doc.exists) {

            alert(
                "User record not found. Please contact administrator."
            );

            auth.signOut();

            localStorage.removeItem("uid");

            btn.disabled = false;

            btn.innerHTML = "Log In";

            return;
        }


        const user =
            doc.data();


        console.log(
            "Logged in user:",
            user
        );


        // =================================================
        // CHECK ACTIVE STATUS
        // =================================================

        if (user.active === false) {

            alert(
                "Your account has been deactivated.\n\n" +
                "Please contact the administrator."
            );

            auth.signOut();

            localStorage.removeItem("uid");

            btn.disabled = false;

            btn.innerHTML = "Log In";

            return;
        }


        // =================================================
        // ADMIN LOGIN
        // =================================================

        if (user.role === "admin") {

            console.log(
                "Admin login successful."
            );


            window.location.replace(
                "../../pages/admin/admin.html"
            );

            return;
        }


        // =================================================
        // LEADER LOGIN
        // =================================================

        if (user.role === "leader") {

            console.log(
                "Leader login successful."
            );


            // ---------------------------------------------
            // IMPORTANT:
            // Make sure the entered number belongs to
            // this leader.
            // ---------------------------------------------

            if (
                user.phone &&
                user.phone !== userid
            ) {

                alert(
                    "Mobile number does not match the leader account."
                );

                auth.signOut();

                localStorage.removeItem("uid");

                btn.disabled = false;

                btn.innerHTML = "Log In";

                return;
            }


            window.location.replace(
                "../../pages/leader/leaders.html"
            );

            return;
        }


        // =================================================
        // INVALID ROLE
        // =================================================

        alert(
            "Invalid user role.\n\n" +
            "Please contact the administrator."
        );


        auth.signOut();

        localStorage.removeItem("uid");

        btn.disabled = false;

        btn.innerHTML = "Log In";

    })


    .catch((error) => {

        console.error(
            "Login error:",
            error
        );


        console.error(
            "Firebase error code:",
            error.code
        );


        // =================================================
        // NETWORK ERROR
        // =================================================

        if (
            error.code ===
            "auth/network-request-failed"
        ) {

            alert(
                "Please check your internet connection."
            );

        }


        // =================================================
        // WRONG EMAIL / PASSWORD
        // =================================================

        else if (
            error.code ===
            "auth/invalid-credential"
        ) {

            alert(
                "Invalid Email/Mobile Number or Password."
            );

        }


        else if (
            error.code ===
            "auth/user-not-found"
        ) {

            alert(
                "Invalid Email/Mobile Number or Password."
            );

        }


        else if (
            error.code ===
            "auth/wrong-password"
        ) {

            alert(
                "Invalid Email/Mobile Number or Password."
            );

        }


        else if (
            error.code ===
            "auth/invalid-email"
        ) {

            alert(
                "Invalid login details."
            );

        }


        else {

            alert(
                "Login failed.\n\n" +
                error.message
            );

        }


        btn.disabled = false;

        btn.innerHTML = "Log In";

    });

}



// =====================================================
// LOGIN FORM
// =====================================================

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            login();

        }
    );

}



// =====================================================
// AUTO LOGIN
// =====================================================

auth.onAuthStateChanged(function(user) {

    // ---------------------------------------------
    // No authenticated user
    // ---------------------------------------------

    if (!user) {

        return;

    }


    console.log(
        "Firebase authenticated user:",
        user.uid
    );


    localStorage.setItem(
        "uid",
        user.uid
    );


    // =================================================
    // GET USER PROFILE
    // =================================================

    db.collection("users")
        .doc(user.uid)
        .get()

        .then(function(doc) {

            if (!doc.exists) {

                console.error(
                    "User record not found."
                );

                auth.signOut();

                localStorage.removeItem("uid");

                return;
            }


            const data =
                doc.data();


            console.log(
                "AutoLogin user:",
                data
            );


            // =================================================
            // CHECK ACTIVE STATUS
            // =================================================

            if (data.active === false) {

                alert(
                    "Your account has been deactivated."
                );

                auth.signOut();

                localStorage.removeItem("uid");

                return;
            }


            // =================================================
            // ADMIN
            // =================================================

            if (
                data.role === "admin"
            ) {

                console.log(
                    "AutoLogin → Admin"
                );


                window.location.replace(
                    "../../pages/admin/admin.html"
                );

                return;
            }


            // =================================================
            // LEADER
            // =================================================

            if (
                data.role === "leader"
            ) {

                console.log(
                    "AutoLogin → Leader"
                );


                window.location.replace(
                    "../../pages/leader/leaders.html"
                );

                return;
            }


            // =================================================
            // INVALID ROLE
            // =================================================

            console.error(
                "Invalid user role."
            );


            auth.signOut();

            localStorage.removeItem("uid");

        })


        .catch(function(error) {

            console.error(
                "Auto login error:",
                error
            );

        });

});



// =====================================================
// LOGOUT
// =====================================================

function logout() {

    console.log(
        "Logout triggered"
    );


    auth.signOut()

        .finally(() => {

            localStorage.removeItem(
                "uid"
            );


            window.location.replace(
                "../../pages/auth/loginindex.html"
            );

        });

}



// =====================================================
// EXIT APP
// =====================================================

function exitApp() {

    console.log(
        "ExitApp triggered"
    );


    auth.signOut()

        .finally(() => {

            localStorage.removeItem(
                "uid"
            );


            window.location.replace(
                "../../pages/auth/loginindex.html"
            );

        });
}


// =====================================================
// LOGIN FUNCTION
// =====================================================

function login() {

    const useridElement =
        document.getElementById("userid");

    const passwordElement =
        document.getElementById("password");

    const btn =
        document.getElementById("loginBtn");


    if (!useridElement || !passwordElement || !btn) {

        console.error(
            "Login elements not found."
        );

        return;

    }


    const userid =
        useridElement.value.trim();

    const password =
        passwordElement.value.trim();


    // =================================================
    // VALIDATION
    // =================================================

    if (userid === "") {

        alert(
            "Please enter your email or mobile number."
        );

        return;

    }


    if (password === "") {

        alert(
            "Please enter your password."
        );

        return;

    }


    // =================================================
    // DETERMINE LOGIN TYPE
    // =================================================

    let firebaseEmail = "";


    // -------------------------------------------------
    // ADMIN LOGIN
    // -------------------------------------------------

    if (userid.includes("@")) {

        firebaseEmail =
            userid.toLowerCase();

        console.log(
            "Login type: ADMIN / EMAIL"
        );

    }


    // -------------------------------------------------
    // LEADER LOGIN
    // -------------------------------------------------

    else {

        const phone =
            userid.replace(/\D/g, "");


        if (!/^[0-9]{10}$/.test(phone)) {

            alert(
                "Leader mobile number must contain exactly 10 digits."
            );

            return;

        }


        firebaseEmail =
            getLeaderInternalEmail(phone);


        console.log(
            "Login type: LEADER / MOBILE"
        );

    }


    // =================================================
    // DISABLE LOGIN BUTTON
    // =================================================

    btn.disabled = true;

    btn.innerHTML =
        "Logging in...";


    // =================================================
    // FIREBASE LOGIN
    // =================================================

    auth
        .signInWithEmailAndPassword(
            firebaseEmail,
            password
        )

        .then(function(userCredential) {

            const firebaseUser =
                userCredential.user;


            const uid =
                firebaseUser.uid;


            console.log(
                "Firebase Login Successful"
            );

            console.log(
                "UID:",
                uid
            );


            localStorage.setItem(
                "uid",
                uid
            );


            // =========================================
            // LOAD USER PROFILE
            // =========================================

            return db
                .collection("users")
                .doc(uid)
                .get();

        })


        .then(function(doc) {

            // =========================================
            // USER PROFILE NOT FOUND
            // =========================================

            if (!doc.exists) {

                alert(
                    "User profile not found. Please contact administrator."
                );


                return auth.signOut();

            }


            const user =
                doc.data();


            console.log(
                "Logged in user:",
                user
            );


            // =========================================
            // CHECK ACTIVE STATUS
            // =========================================

            if (user.active === false) {

                alert(
                    "Your account has been deactivated.\n\n" +
                    "Please contact the administrator."
                );


                return auth.signOut();

            }


            // =========================================
            // ADMIN
            // =========================================

            if (user.role === "admin") {

                console.log(
                    "Redirecting to Admin Dashboard"
                );


                window.location.replace(
                    "../../pages/admin/admin.html"
                );


                return;

            }


            // =========================================
            // LEADER
            // =========================================

            if (user.role === "leader") {

                console.log(
                    "Redirecting to Leader Dashboard"
                );


                window.location.replace(
                    "../../pages/leader/leaders.html"
                );


                return;

            }


            // =========================================
            // INVALID ROLE
            // =========================================

            alert(
                "Invalid user role.\n\n" +
                "Please contact the administrator."
            );


            return auth.signOut();

        })


        .catch(function(error) {

            console.error(
                "Login Error:",
                error
            );


            // =========================================
            // ERROR HANDLING
            // =========================================

            if (
                error.code ===
                "auth/network-request-failed"
            ) {

                alert(
                    "Network error.\n\n" +
                    "Please check your internet connection."
                );

            }

            else if (
                error.code ===
                "auth/invalid-email"
            ) {

                alert(
                    "Invalid login ID."
                );

            }

            else if (
                error.code ===
                "auth/user-not-found"
            ) {

                alert(
                    "Invalid mobile number/email or password."
                );

            }

            else if (
                error.code ===
                "auth/wrong-password"
            ) {

                alert(
                    "Invalid mobile number/email or password."
                );

            }

            else if (
                error.code ===
                "auth/invalid-credential"
            ) {

                alert(
                    "Invalid mobile number/email or password."
                );

            }

            else {

                alert(
                    "Login failed.\n\n" +
                    error.message
                );

            }

        })


        .finally(function() {

            btn.disabled = false;

            btn.innerHTML =
                "Log In";

        });

}


// =====================================================
// LOGIN FORM
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const loginForm =
            document.getElementById("loginForm");


        if (!loginForm) {

            return;

        }


        loginForm.addEventListener(
            "submit",
            function(event) {

                event.preventDefault();

                login();

            }
        );

    }
);



// =====================================================
// APP INSTALLED
// =====================================================

window.addEventListener(
    "appinstalled",
    function () {


        console.log(
            "Labour Management App installed."
        );


        localStorage.setItem(
            "labourAppInstalled",
            "true"
        );


        hideInstallBanner();


        deferredPrompt =
            null;

    }
);



// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {


        const banner =
            document.getElementById(
                "installBanner"
            );


        if (!banner) {

            return;

        }


        if (isAppInstalled()) {


            console.log(
                "App already installed."
            );


            hideInstallBanner();

        }


        else {


            banner.style.display =
                "none";

        }


    }
);



// =====================================================
// SERVICE WORKER
// =====================================================

if (
    "serviceWorker" in navigator
) {


    window.addEventListener(
        "load",
        function () {


            navigator.serviceWorker
                .register(
                    "../../service_worker.js"
                )


                .then(
                    function (registration) {


                        console.log(
                            "Service Worker registered:",
                            registration.scope
                        );


                    }
                )


                .catch(
                    function (error) {


                        console.error(
                            "Service Worker registration failed:",
                            error
                        );


                    }
                );


        }
    );

}



// =====================================================
// SPLASH SCREEN
// =====================================================

window.addEventListener(
    "load",
    function () {


        const splash =
            document.getElementById(
                "splashScreen"
            );


        const loginPage =
            document.getElementById(
                "loginPage"
            );


        if (!splash) {

            return;

        }


        setTimeout(
            function () {


                splash.style.display =
                    "none";


                if (loginPage) {

                    loginPage.style.display =
                        "flex";

                }


            },
            2000
        );


    }
);