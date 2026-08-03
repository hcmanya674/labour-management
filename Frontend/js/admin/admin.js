loadAdminLayout("Dashboard",`

<div class="cards">

<div class="card">

<h2 id="regionCount">0</h2>

<p>Regions</p>

</div>

<div class="card">

<h2 id="leaderCount">0</h2>

<p>Leaders</p>

</div>

<div class="card">

<h2 id="itemCount">0</h2>

<p>Item Codes</p>

</div>

</div>

`);



function initializePage(){

    loadDashboardCounts();

}
loadDashboardCounts();
// ===========================================
// LOAD dashboardcount
// ===========================================
function loadDashboardCounts(){

// Regions

db.collection("regions")
    .where("active", "==", true)
    .get()
    .then((snapshot) => {

        document.getElementById("regionCount").innerHTML =
            snapshot.size;

    });
// Leaders


    db.collection("users")
    .where("role", "==", "leader")
    .where("active", "==", true)
    .get()
    .then((snapshot) => {

        document.getElementById("leaderCount").innerHTML =
            snapshot.size;

    });

// Item Codes

   db.collection("itemcodes")
    .where("active", "==", true)
    .get()
    .then((snapshot) => {

        document.getElementById("itemCount").innerHTML =
            snapshot.size;

    });


}    