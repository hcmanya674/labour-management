// -------------------------------
// Login Function
// -------------------------------
function login() {

    const email = document.getElementById("userid").value.trim();
    const password = document.getElementById("password").value.trim();
    const btn = document.getElementById("loginBtn");

    // -------------------------------
    // Input Validation
    // -------------------------------

    if(email === "" && password === ""){
        alert("Please enter your email and password.");
        return;
    }

    if(email === ""){
        alert("Please enter your email address.");
        return;
    }

    if(password === ""){
        alert("Please enter your password.");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = "Logging in...";

    auth.signInWithEmailAndPassword(email, password)

    .then((userCredential) => {

        const uid = userCredential.user.uid;

        localStorage.setItem("uid", uid);

        console.log("UID Saved :", uid);

        return db.collection("users").doc(uid).get();

    })

    .then((doc)=>{

        if(!doc.exists){

        alert("User record not found.");

        auth.signOut();

        btn.disabled = false;
        btn.innerHTML = "Log In";

        return;

        }
        const user = doc.data();

        console.log(user);

        if(user.active === false){

        alert("Your account has been deactivated.\nPlease contact the administrator.");

        auth.signOut();

        btn.disabled = false;

        btn.innerHTML = "Log In";

        return;
        }

        if(user.role==="admin"){

            window.location.href="../../pages/admin/admin.html";

        }

        else if(user.role==="leader"){

            window.location.href="../../pages/leader/leaders.html";

        }

        else{

            alert("Your account role is invalid.\nPlease contact the administrator.");

            auth.signOut();

        }

    })
.catch((error)=>{

    console.error(error);

    try{

        const response = JSON.parse(error.message);

        if(response.error.message === "INVALID_LOGIN_CREDENTIALS"){

            alert("Invalid email or password.");

        }
        else{

            alert("Login failed.");

        }

    }catch{

        if(error.code === "auth/network-request-failed"){

            alert("Please check your internet connection.");

        }
        else{

            alert("Login failed.");

        }

    }

    btn.disabled = false;
    btn.innerHTML = "Log In";

});

}
document.getElementById("loginForm")
.addEventListener("submit", function(event){

    event.preventDefault();

    login();

});
// -------------------------------
// Auto Login
// -------------------------------

auth.onAuthStateChanged(function(user){
    if(!user) return;
    localStorage.setItem("uid", user.uid);
    console.log("AutoLogin UID set:", user.uid); // ✅ Debug log

    db.collection("users").doc(user.uid).get()
    .then((doc)=>{
        if(!doc.exists){
            auth.signOut();
            return;
        }

        const data = doc.data();
        if(data.active === false){
            alert("Your account has been deactivated.");
            auth.signOut();
            return;
        }

        if(data.role==="admin"){
            console.log("AutoLogin redirect: admin.html"); // ✅ Debug log
            window.location.replace("../../pages/admin/admin.html");
        } else if(data.role==="leader"){
            console.log("AutoLogin redirect: leaders.html"); // ✅ Debug log
            window.location.replace("../../pages/leader/leaders.html");
        } else {
            alert("Invalid Role");
            auth.signOut();
        }
    });
});

function exitApp(){
  console.log("ExitApp triggered, clearing UID"); // ✅ Debug log
  auth.signOut();
  localStorage.clear();
  window.location.href = "../../pages/auth/loginindex.html";
}

function logout(){
  console.log("Logout triggered, clearing UID"); // ✅ Debug log
  auth.signOut();
  localStorage.clear();
  window.location.href = "../../pages/auth/loginindex.html";
}
// ------------------------------------
// Forgot Password
// ------------------------------------

document.getElementById("forgotPasswordLink")
.addEventListener("click", function(event){

    event.preventDefault();

    const email =
    document.getElementById("userid")
    .value
    .trim();

    if(email === ""){

        alert("Please enter your registered email address first.");

        return;

    }

    auth.sendPasswordResetEmail(email)

    .then(()=>{

        alert(
            "Password reset link has been sent to your email.\n\nPlease check your inbox."
        );

    })

    .catch((error)=>{

        console.log(error);

        if(error.code==="auth/user-not-found"){

            alert("No account exists with this email.");

        }

        else if(error.code==="auth/invalid-email"){

            alert("Please enter a valid email address.");

        }

        else{

            alert(error.message);

        }

    });

});
