// ==========================================
// ADMIN COMMON
// Authentication + Navigation
// =========================================
const uid = localStorage.getItem("uid");

if (!uid) {
    window.location.replace("../../pages/auth/loginindex.html");
}

auth.onAuthStateChanged(function(user){

    if(!user){
        localStorage.clear();
        window.location.replace("../../pages/auth/loginindex.html");
        return;
    }

    db.collection("users")
    .doc(user.uid)
    .get()
    .then((doc)=>{

      if (!doc.exists) {
    logout();
    return;
}

        const data = doc.data();

        if(data.active === false){
            alert("Your account has been deactivated.");
            logout();
            return;
        }

        if(data.role !== "admin"){
            alert("Access Denied");
            window.location.replace("../../pages/auth/loginindex.html");
            return;
        }
        if (typeof initializePage === "function") {
        initializePage(data);
        }

    })
    .catch((error)=>{
    console.error("ADMIN ERROR:", error);
    alert(error.message);
    // logout();   // Temporarily comment this out
});

});

// ---------------- Navigation ----------------

function showDashboard(){

    window.location.href="../../pages/admin/admin.html";

}

function showRegions(){

    window.location.href="../../pages/admin/region.html";

}

function showItemCodes(){

    window.location.href="../../pages/admin/item.html";

}

function showLeaders(){

    window.location.href= "../../pages/admin/leader-management.html";

}
function showAssignItems() {

    window.location.href =
        "../../pages/admin/assignItems.html";

}
function showReports(){

    window.location.href="../../pages/admin/reports.html";

}

// ---------------- Logout ----------------

function logout(){

    auth.signOut()

    .then(()=>{

        localStorage.clear();

        window.location.replace("../../pages/auth/loginindex.html");

    });

}