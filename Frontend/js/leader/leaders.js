console.log("Leader Dashboard Loaded");

if (!uid) {
    window.location.href = "../../pages/auth/loginindex.html";
}

db.collection("users")
.doc(uid)
.get()
.then((doc) => {

    if (!doc.exists) {
        alert("Leader not found.");
        logout();
        return;
    }

    const user = doc.data();

    document.getElementById("leaderName").innerHTML =
        "Welcome, " + user.name;

    loadRegion(user.region);

    loadTodayRepairOrders(user.uid);

})
.catch(error => {

    console.log(error);

});


function loadRegion(regionId){

    db.collection("regions")
    .doc(regionId)
    .get()
    .then((doc)=>{

        if(doc.exists){

            document.getElementById("leaderRegion").innerHTML =
                "Region : " + doc.data().regionName;

        }

    });

}
function loadTodayRepairOrders(uid){

    let today = new Date();

    today.setHours(0,0,0,0);

    db.collection("repairorders")
    .where("leaderUid","==",uid)
    .get()
    .then((snapshot)=>{

        let todayCount = 0;

        snapshot.forEach((doc)=>{

            const ro = doc.data();

            if(ro.createdAt){

                const createdDate = ro.createdAt.toDate();

                if(createdDate >= today){

                    todayCount++;

                }

            }

        });

        document.getElementById("todayCount").innerHTML = todayCount;

    });

}