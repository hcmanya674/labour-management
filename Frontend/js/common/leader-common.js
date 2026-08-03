// ===========================================
// LEADER COMMON
// ===========================================

// Logged in user
const uid = localStorage.getItem("uid");

// Check Local Storage
if (!uid) {
    window.location.replace("../../pages/auth/loginindex.html");
}

// Verify Firebase Login
auth.onAuthStateChanged(function(user){

    if(!user){
        localStorage.clear();
        window.location.replace("../../pages/auth/loginindex.html");
        return;
    }

    // Verify Leader
    db.collection("users")
    .doc(user.uid)
    .get()
    .then((doc)=>{

        if(!doc.exists){
            logout();
            return;
        }

        const data = doc.data();

        // Account Active?
        if(data.active === false){
            alert("Your account has been deactivated.");
            logout();
            return;
        }

        // Leader Only
        if(data.role !== "leader"){
            alert("Access Denied");
            window.location.replace("../../pages/admin/admin.html");
            return;
        }

    })
    .catch((error)=>{

        console.error(error);

        logout();

    });

});

// ===========================================
// Navigation
// ===========================================

function showDashboard(){

    window.location.href = "../../pages/leader/leaders.html";

}

function showCreateRO(){

    window.location.href = "../../pages/leader/createRO.html";

}

function showRepairOrders(){

    window.location.href = "../../pages/leader/repairOrders.html";

}

// ===========================================
// Logout
// ===========================================

function logout(){

    auth.signOut()

    .then(()=>{

        localStorage.clear();

        window.location.replace("../../pages/auth/loginindex.html");

    });

}