// Auto Logout after 5 minutes of inactivity

let logoutTimer;

// Reset timer whenever user interacts
function resetLogoutTimer() {

    clearTimeout(logoutTimer);

    logoutTimer = setTimeout(() => {

        auth.signOut()

         .then(() => {

        localStorage.clear();

        alert("Session expired. Please login again.");

        window.location.replace("../../pages/auth/loginindex.html");


        });

    }, 3 * 60 * 1000); // 3 minutes

}

// User activity events
document.addEventListener("click", resetLogoutTimer);
document.addEventListener("keydown", resetLogoutTimer);
document.addEventListener("mousemove", resetLogoutTimer);
document.addEventListener("touchstart", resetLogoutTimer);

// Start timer immediately
resetLogoutTimer();