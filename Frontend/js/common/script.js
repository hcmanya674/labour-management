// =====================================================
// LABOUR MANAGEMENT SYSTEM
// LOGIN + PWA
// =====================================================


// =====================================================
// GLOBAL PWA VARIABLE
// =====================================================

let deferredPrompt = null;


// =====================================================
// LOGIN FUNCTION
// =====================================================

function login() {

    const email =
        document.getElementById("userid").value.trim();

    const password =
        document.getElementById("password").value.trim();

    const btn =
        document.getElementById("loginBtn");


    // ---------------------------------------------
    // VALIDATION
    // ---------------------------------------------

    if (email === "" && password === "") {

        alert(
            "Please enter your email and password."
        );

        return;
    }


    if (email === "") {

        alert(
            "Please enter your email address."
        );

        return;
    }


    if (password === "") {

        alert(
            "Please enter your password."
        );

        return;
    }


    btn.disabled = true;

    btn.innerHTML = "Logging in...";


    // ---------------------------------------------
    // FIREBASE LOGIN
    // ---------------------------------------------

    auth.signInWithEmailAndPassword(
        email,
        password
    )

    .then((userCredential) => {

        const uid =
            userCredential.user.uid;


        localStorage.setItem(
            "uid",
            uid
        );


        console.log(
            "UID Saved:",
            uid
        );


        return db
            .collection("users")
            .doc(uid)
            .get();

    })


    .then((doc) => {

        if (!doc.exists) {

            alert(
                "User record not found."
            );

            auth.signOut();

            btn.disabled = false;

            btn.innerHTML = "Log In";

            return;
        }


        const user =
            doc.data();


        console.log(
            "User:",
            user
        );


        // -----------------------------------------
        // CHECK ACTIVE STATUS
        // -----------------------------------------

        if (user.active === false) {

            alert(
                "Your account has been deactivated.\n" +
                "Please contact the administrator."
            );

            auth.signOut();

            btn.disabled = false;

            btn.innerHTML = "Log In";

            return;
        }


        // -----------------------------------------
        // ADMIN
        // -----------------------------------------

        if (user.role === "admin") {

            window.location.href =
                "/pages/admin/admin.html";

        }


        // -----------------------------------------
        // LEADER
        // -----------------------------------------

        else if (user.role === "leader") {

            window.location.href =
                "/pages/leader/leaders.html";

        }


        // -----------------------------------------
        // INVALID ROLE
        // -----------------------------------------

        else {

            alert(
                "Your account role is invalid.\n" +
                "Please contact the administrator."
            );

            auth.signOut();

            btn.disabled = false;

            btn.innerHTML = "Log In";
        }

    })


    .catch((error) => {

        console.error(
            "Login error:",
            error
        );


        if (
            error.code ===
            "auth/network-request-failed"
        ) {

            alert(
                "Please check your internet connection."
            );

        }

        else if (
            error.code ===
            "auth/invalid-credential"
        ) {

            alert(
                "Invalid email or password."
            );

        }

        else if (
            error.code ===
            "auth/user-not-found"
        ) {

            alert(
                "Invalid email or password."
            );

        }

        else if (
            error.code ===
            "auth/wrong-password"
        ) {

            alert(
                "Invalid email or password."
            );

        }

        else {

            alert(
                "Login failed."
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

auth.onAuthStateChanged(
    function (user) {

        if (!user) {

            return;
        }


        localStorage.setItem(
            "uid",
            user.uid
        );


        console.log(
            "AutoLogin UID:",
            user.uid
        );


        db.collection("users")
            .doc(user.uid)
            .get()

            .then((doc) => {

                if (!doc.exists) {

                    auth.signOut();

                    return;
                }


                const data =
                    doc.data();


                // ---------------------------------
                // CHECK ACTIVE
                // ---------------------------------

                if (data.active === false) {

                    alert(
                        "Your account has been deactivated."
                    );

                    auth.signOut();

                    return;
                }


                // ---------------------------------
                // ADMIN
                // ---------------------------------

                if (data.role === "admin") {

                    console.log(
                        "AutoLogin → Admin"
                    );


                    window.location.replace(
                        "pages/admin/admin.html"
                    );

                }


                // ---------------------------------
                // LEADER
                // ---------------------------------

                else if (data.role === "leader") {

                    console.log(
                        "AutoLogin → Leader"
                    );


                    window.location.replace(
                        "pages/leader/leaders.html"
                    );

                }


                else {

                    alert(
                        "Invalid Role"
                    );

                    auth.signOut();

                }

            })

            .catch((error) => {

                console.error(
                    "Auto login error:",
                    error
                );

            });

    }
);


function exitApp() {

    console.log("ExitApp triggered");

    auth.signOut().finally(() => {

        localStorage.removeItem("uid");

        window.location.replace(
            "/pages/auth/loginindex.html"
        );

    });

}


function logout() {

    console.log("Logout triggered");

    auth.signOut().finally(() => {

        localStorage.removeItem("uid");

        window.location.replace(
            "/pages/auth/loginindex.html"
        );

    });

}

// =====================================================
// FORGOT PASSWORD
// =====================================================

const forgotPasswordLink =
    document.getElementById(
        "forgotPasswordLink"
    );


if (forgotPasswordLink) {

    forgotPasswordLink.addEventListener(
        "click",
        function (event) {

            event.preventDefault();


            const email =
                document
                    .getElementById("userid")
                    .value
                    .trim();


            if (email === "") {

                alert(
                    "Please enter your registered email address first."
                );

                return;
            }


            auth.sendPasswordResetEmail(
                email
            )

            .then(() => {

                alert(
                    "Password reset link has been sent to your email.\n\n" +
                    "Please check your inbox."
                );

            })

            .catch((error) => {

                console.error(
                    error
                );


                if (
                    error.code ===
                    "auth/user-not-found"
                ) {

                    alert(
                        "No account exists with this email."
                    );

                }

                else if (
                    error.code ===
                    "auth/invalid-email"
                ) {

                    alert(
                        "Please enter a valid email address."
                    );

                }

                else {

                    alert(
                        error.message
                    );

                }

            });

        }
    );

}



// =====================================================
// ================= PWA SECTION =======================
// =====================================================


// =====================================================
// CHECK IF APP IS INSTALLED
// =====================================================

function isAppInstalled() {

    // ---------------------------------------------
    // Android / Chrome / Edge
    // ---------------------------------------------

    if (
        window.matchMedia(
            "(display-mode: standalone)"
        ).matches
    ) {

        return true;

    }


    // ---------------------------------------------
    // iOS Safari
    // ---------------------------------------------

    if (
        window.navigator.standalone === true
    ) {

        return true;

    }


    // ---------------------------------------------
    // Previously confirmed installation
    // ---------------------------------------------

    if (
        localStorage.getItem(
            "labourAppInstalled"
        ) === "true"
    ) {

        return true;

    }


    return false;

}



// =====================================================
// HIDE INSTALL BANNER
// =====================================================

function hideInstallBanner() {

    const banner =
        document.getElementById(
            "installBanner"
        );


    if (banner) {

        banner.style.display =
            "none";

    }

}



// =====================================================
// SHOW INSTALL BANNER
// =====================================================

function showInstallBanner() {

    const banner =
        document.getElementById(
            "installBanner"
        );


    if (!banner) {

        return;

    }


    // ---------------------------------------------
    // NEVER SHOW IF ALREADY INSTALLED
    // ---------------------------------------------

    if (isAppInstalled()) {

        hideInstallBanner();

        return;

    }


    // ---------------------------------------------
    // Show banner
    // ---------------------------------------------

    banner.style.display =
        "flex";


    console.log(
        "Install banner shown."
    );

}



// =====================================================
// BEFORE INSTALL PROMPT
// =====================================================

window.addEventListener(
    "beforeinstallprompt",
    function (event) {

        console.log(
            "PWA installation available."
        );


        // Stop browser's automatic prompt
        event.preventDefault();


        // Save prompt
        deferredPrompt =
            event;


        // Show our custom banner
        showInstallBanner();

    }
);



// =====================================================
// INSTALL BUTTON
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const installBtn =
            document.getElementById(
                "installBtn"
            );


        if (!installBtn) {

            return;

        }


        installBtn.addEventListener(
            "click",
            async function () {

                // ---------------------------------
                // Already installed
                // ---------------------------------

                if (isAppInstalled()) {

                    hideInstallBanner();

                    return;

                }


                // ---------------------------------
                // Prompt unavailable
                // ---------------------------------

                if (!deferredPrompt) {

                    console.log(
                        "Install prompt unavailable."
                    );

                    return;

                }


                installBtn.disabled =
                    true;


                installBtn.textContent =
                    "Installing...";


                try {

                    // Show browser installation
                    // dialog

                    deferredPrompt.prompt();


                    const choice =
                        await deferredPrompt.userChoice;


                    console.log(
                        "Installation result:",
                        choice.outcome
                    );


                    // --------------------------------
                    // ACCEPTED
                    // --------------------------------

                    if (
                        choice.outcome ===
                        "accepted"
                    ) {

                        console.log(
                            "User accepted installation."
                        );


                        // Wait for appinstalled
                        // event to confirm installation

                    }


                    // --------------------------------
                    // CANCELLED
                    // --------------------------------

                    else {

                        console.log(
                            "User cancelled installation."
                        );


                        installBtn.disabled =
                            false;


                        installBtn.textContent =
                            "Install";

                    }

                }

                catch (error) {

                    console.error(
                        "Installation error:",
                        error
                    );


                    installBtn.disabled =
                        false;


                    installBtn.textContent =
                        "Install";

                }


                // Prompt cannot be reused

                deferredPrompt =
                    null;

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


        // ---------------------------------------------
        // Remember installation
        // ---------------------------------------------

        localStorage.setItem(
            "labourAppInstalled",
            "true"
        );


        // ---------------------------------------------
        // Hide banner
        // ---------------------------------------------

        hideInstallBanner();


        // ---------------------------------------------
        // Remove prompt
        // ---------------------------------------------

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


        // ---------------------------------------------
        // APP ALREADY INSTALLED
        // ---------------------------------------------

        if (isAppInstalled()) {

            console.log(
                "App already installed."
            );


            hideInstallBanner();

        }

        else {

            // Keep hidden until
            // beforeinstallprompt fires

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


        // ---------------------------------------------
        // Keep splash for 2 seconds
        // ---------------------------------------------

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