// =====================================================
// LEADER DASHBOARD
// =====================================================

const uid = localStorage.getItem("uid");

console.log("Leader Dashboard Loaded");
console.log("Leader UID:", uid);


// =====================================================
// CHECK LOGIN
// =====================================================

if (!uid) {

    window.location.href =
        "../../pages/auth/loginindex.html";

}


// =====================================================
// LOAD LEADER PROFILE
// =====================================================

db.collection("users")
    .doc(uid)
    .get()

    .then((doc) => {

        // ---------------------------------------------
        // USER NOT FOUND
        // ---------------------------------------------

        if (!doc.exists) {

            alert("Leader not found.");

            logout();

            return;

        }


        const user = doc.data();


        // ---------------------------------------------
        // CHECK ROLE
        // ---------------------------------------------

        if (user.role !== "leader") {

            alert("Access denied.");

            logout();

            return;

        }


        // ---------------------------------------------
        // CHECK ACTIVE STATUS
        // ---------------------------------------------

        if (user.active !== true) {

            alert(
                "Your account has been deactivated. " +
                "Please contact the administrator."
            );

            logout();

            return;

        }


        // ---------------------------------------------
        // DISPLAY LEADER NAME
        // ---------------------------------------------

        document.getElementById("leaderName").innerHTML =
            "Welcome, " + (user.name || "Leader");


        // ---------------------------------------------
        // LOAD REGION
        // ---------------------------------------------

        loadRegion(user.region);


        // ---------------------------------------------
        // LOAD TODAY'S RO

        // ---------------------------------------------

        loadTodayRepairOrders(user.uid);

    })

    .catch(error => {

        console.error(
            "Error loading leader profile:",
            error
        );

        alert(
            "Unable to load leader information."
        );

    });


// =====================================================
// LOAD REGION
// =====================================================

function loadRegion(regionId) {

    if (!regionId) {

        document.getElementById(
            "leaderRegion"
        ).innerHTML = "Region : Not Assigned";

        return;

    }


    db.collection("regions")
        .doc(regionId)
        .get()

        .then((doc) => {

            if (doc.exists) {

                document.getElementById(
                    "leaderRegion"
                ).innerHTML =
                    "Region : " +
                    doc.data().regionName;

            }

            else {

                document.getElementById(
                    "leaderRegion"
                ).innerHTML =
                    "Region : Not Found";

            }

        })

        .catch(error => {

            console.error(
                "Region loading error:",
                error
            );

        });

}


// =====================================================
// LOAD TODAY'S REPAIR ORDERS
// =====================================================

function loadTodayRepairOrders(uid) {

    let today = new Date();

    today.setHours(0, 0, 0, 0);


    db.collection("repairorders")
        .where("leaderUid", "==", uid)
        .get()

        .then((snapshot) => {

            let todayCount = 0;


            snapshot.forEach((doc) => {

                const ro = doc.data();


                if (ro.createdAt) {

                    const createdDate =
                        ro.createdAt.toDate();


                    if (createdDate >= today) {

                        todayCount++;

                    }

                }

            });


            document.getElementById(
                "todayCount"
            ).innerHTML = todayCount;

        })

        .catch(error => {

            console.error(
                "Repair order loading error:",
                error
            );

        });

}