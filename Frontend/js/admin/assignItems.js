// =====================================================
// ADMIN - ASSIGN ITEMS TO LEADER
// =====================================================

let adminData = {};

let leaders = {};

let itemMap = {};


// =====================================================
// CHECK ADMIN LOGIN
// =====================================================

auth.onAuthStateChanged(async (user) => {

    if (!user) {

        location =
            "../../pages/auth/loginindex.html";

        return;

    }


    try {

        // ---------------------------------------------
        // Load logged-in user
        // ---------------------------------------------

        const adminDoc =
            await db.collection("users")
                .doc(user.uid)
                .get();


        if (!adminDoc.exists) {

            alert("User record not found.");

            return;

        }


        adminData =
            adminDoc.data();


        console.log(
            "Admin Data:",
            adminData
        );


        // ---------------------------------------------
        // Check role
        // ---------------------------------------------

        if (
            adminData.role !== "admin"
        ) {

            alert(
                "Access denied. Admin only."
            );

            return;

        }


        // ---------------------------------------------
        // Load leaders
        // ---------------------------------------------

        await loadLeaders();


        // ---------------------------------------------
        // Load items
        // ---------------------------------------------

        await loadItems();


    }

    catch (error) {

        console.error(
            "Admin initialization error:",
            error
        );

        alert(
            "Unable to load assignment page."
        );

    }

});


// =====================================================
// LOAD LEADERS
// =====================================================

async function loadLeaders() {

    const select =
        document.getElementById(
            "leaderSelect"
        );


    try {

        const snapshot =
            await db.collection("users")
                .where(
                    "role",
                    "==",
                    "leader"
                )
                .get();


        select.innerHTML = `

            <option value="">
                Select Leader
            </option>

        `;


        leaders = {};


        snapshot.forEach(doc => {

            const leader =
                doc.data();


            // Store leader data

            leaders[doc.id] =
                leader;


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                doc.id;


            option.textContent =
                `${leader.name || "Unknown"} - ${leader.region || "No Region"}`;


            select.appendChild(
                option
            );

        });


        console.log(
            "Leaders loaded:",
            leaders
        );

    }

    catch (error) {

        console.error(
            "Error loading leaders:",
            error
        );

        alert(
            "Unable to load leaders."
        );

    }

}


// =====================================================
// LOAD ACTIVE ITEM CODES
// =====================================================

async function loadItems() {

    const container =
        document.getElementById(
            "itemContainer"
        );


    try {

        const snapshot =
            await db.collection("itemcodes")
                .where(
                    "active",
                    "==",
                    true
                )
                .get();


        itemMap = {};


        snapshot.forEach(doc => {

            const item =
                doc.data();


            const itemCode =
                item.itemCode || doc.id;


            itemMap[itemCode] = {

                description:
                    item.description || "-",

                billingAmount:
                    Number(
                        item.billingAmount
                    ) || 0

            };

        });


        console.log(
            "Items loaded:",
            itemMap
        );


    }

    catch (error) {

        console.error(
            "Error loading items:",
            error
        );

        alert(
            "Unable to load item codes."
        );

    }

}


// =====================================================
// LOAD EXISTING ASSIGNMENTS
// =====================================================

async function loadLeaderAssignments() {

    const leaderUid =
        document.getElementById(
            "leaderSelect"
        ).value;


    const container =
        document.getElementById(
            "itemContainer"
        );


    const saveBtn =
        document.getElementById(
            "saveAssignmentBtn"
        );


    if (!leaderUid) {

    container.innerHTML = `
        <div class="empty-message">
            Select a leader to view available items.
        </div>
    `;

    saveBtn.disabled = true;

    document.getElementById("itemCount").textContent =
        "0 Items";

    return;
}


    try {

        // ---------------------------------------------
        // Get existing assignments
        // ---------------------------------------------

        const assignmentSnapshot =
            await db.collection(
                "leaderItemAssignments"
            )
            .where(
                "leaderUid",
                "==",
                leaderUid
            )
            .where(
                "active",
                "==",
                true
            )
            .get();


        const assignedItems = [];


        assignmentSnapshot.forEach(
            doc => {

                const data =
                    doc.data();


                assignedItems.push(
                    data.itemCode
                );

            }
        );


        console.log(
            "Assigned Items:",
            assignedItems
        );


        // ---------------------------------------------
        // Display items
        // ---------------------------------------------

        container.innerHTML = "";


        const itemCodes =
            Object.keys(itemMap)
                .sort();


        if (
            itemCodes.length === 0
        ) {

            container.innerHTML = `

                <p>
                    No active items available.
                </p>

            `;

            saveBtn.disabled = true;

            return;

        }


        itemCodes.forEach(
            itemCode => {

                const item =
                    itemMap[itemCode];


                const wrapper =
                    document.createElement(
                        "div"
                    );


                wrapper.className =
                    "item-option";


                const checked =
                    assignedItems.includes(
                        itemCode
                    )
                    ? "checked"
                    : "";

                wrapper.innerHTML = `

                    <label>

                        <input
                            type="checkbox"
                            name="assignedItem"
                            value="${itemCode}"
                            ${checked}
                        >

                        <div class="item-info">

                            <div class="item-details">

                                <span class="item-code">
                                    ${itemCode}
                                </span>

                                <span class="item-description">
                                    ${item.description}
                                </span>

                            </div>

                            <span class="item-price">
                                ₹${item.billingAmount.toLocaleString("en-IN")}
                            </span>

                        </div>

                    </label>

                `;


                container.appendChild(
                    wrapper
                );

            }
        );


        saveBtn.disabled = false;

        const itemCount =
            document.getElementById("itemCount");

        if (itemCount) {

            itemCount.textContent =
                `${itemCodes.length} Items`;

        }
        document.getElementById(
            "assignmentStatus"
        ).textContent =
            `${assignedItems.length} item(s) currently assigned.`;


    }

    catch (error) {

        console.error(
            "Error loading assignments:",
            error
        );

        alert(
            "Unable to load leader assignments."
        );

    }

}


// =====================================================
// SAVE ASSIGNMENTS
// =====================================================

async function saveAssignments() {

    const leaderUid =
        document.getElementById(
            "leaderSelect"
        ).value;


    const saveBtn =
        document.getElementById(
            "saveAssignmentBtn"
        );


    if (!leaderUid) {

        alert(
            "Please select a leader."
        );

        return;

    }


    const selectedItems =
        Array.from(
            document.querySelectorAll(
                'input[name="assignedItem"]:checked'
            )
        )
        .map(
            checkbox =>
                checkbox.value
        );


    console.log(
        "Selected Items:",
        selectedItems
    );


    saveBtn.disabled = true;

    saveBtn.innerHTML =
        "Saving...";


    try {

        // =================================================
        // FIRST: GET EXISTING ASSIGNMENTS
        // =================================================

        const existingSnapshot =
            await db.collection(
                "leaderItemAssignments"
            )
            .where(
                "leaderUid",
                "==",
                leaderUid
            )
            .get();


        const batch =
            db.batch();


        // =================================================
        // DISABLE OLD ASSIGNMENTS
        // =================================================

        existingSnapshot.forEach(
            doc => {

                batch.update(
                    doc.ref,
                    {
                        active: false
                    }
                );

            }
        );


        // =================================================
        // CREATE NEW ASSIGNMENTS
        // =================================================

        selectedItems.forEach(
            itemCode => {

                const assignmentId =
                    `${leaderUid}_${itemCode}`;


                const ref =
                    db.collection(
                        "leaderItemAssignments"
                    )
                    .doc(assignmentId);


                batch.set(
                    ref,
                    {

                        leaderUid:
                            leaderUid,

                        itemCode:
                            itemCode,

                        active:
                            true,

                        assignedBy:
                            auth.currentUser.uid,

                        assignedAt:
                            firebase.firestore
                            .FieldValue
                            .serverTimestamp()

                    },
                    {
                        merge: true
                    }
                );

            }
        );


        // =================================================
        // SAVE
        // =================================================

        await batch.commit();


        alert(
            "Item assignments saved successfully."
        );


        await loadLeaderAssignments();


    }

    catch (error) {

        console.error(
            "Save assignment error:",
            error
        );

        alert(
            "Unable to save assignments: " +
            error.message
        );

    }

    finally {

        saveBtn.disabled = false;

        saveBtn.innerHTML =
            "Save Assignment";

    }

}


// =====================================================
// NAVIGATION
// =====================================================

function goToAdminDashboard() {

    window.location.href =
        "adminDashboard.html";

}


// =====================================================
// LOGOUT
// =====================================================

function logout() {

    auth.signOut()
        .then(() => {

            window.location.href =
                "../../pages/auth/loginindex.html";

        })
        .catch(error => {

            console.error(
                "Logout error:",
                error
            );

        });

}