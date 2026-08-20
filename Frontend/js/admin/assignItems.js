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
         // ---------------------------------------------
         // Load assignment overview
        // ---------------------------------------------
        await loadAssignmentOverview();


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

    // Refresh active items from Firestore
    await loadItems();


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
        document.getElementById("leaderSelect").value;

    const saveBtn =
        document.getElementById("saveAssignmentBtn");

    if (!leaderUid) {

        alert("Please select a leader.");
        return;

    }

    const selectedItems =
        Array.from(
            document.querySelectorAll(
                'input[name="assignedItem"]:checked'
            )
        ).map(
            checkbox => checkbox.value
        );

    console.log(
        "Selected Items:",
        selectedItems
    );

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    try {

        // =================================================
        // GET EXISTING ASSIGNMENTS
        // =================================================

        const existingSnapshot =
            await db.collection("leaderItemAssignments")
                .where(
                    "leaderUid",
                    "==",
                    leaderUid
                )
                .get();


        // =================================================
        // CREATE BATCH
        // =================================================

        const batch = db.batch();


        // =================================================
        // DISABLE ALL OLD ASSIGNMENTS
        // =================================================

        existingSnapshot.forEach(doc => {

            batch.update(
                doc.ref,
                {
                    active: false
                }
            );

        });


        // =================================================
        // CREATE / REACTIVATE SELECTED ASSIGNMENTS
        // =================================================

        selectedItems.forEach(itemCode => {

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

        });


        // =================================================
        // COMMIT
        // =================================================

        await batch.commit();


        console.log(
            "Assignments successfully saved."
        );


        // =================================================
        // SUCCESS MESSAGE
        // =================================================

        alert(
            "Item assignments saved successfully."
        );


        // =================================================
        // IMPORTANT:
        // REFRESH SELECTED LEADER ASSIGNMENTS
        // =================================================

        await loadLeaderAssignments();


        // =================================================
        // IMPORTANT:
        // REFRESH ASSIGNMENT OVERVIEW
        // =================================================

        await loadAssignmentOverview();


        // =================================================
        // UPDATE STATUS
        // =================================================

        const status =
            document.getElementById(
                "assignmentStatus"
            );

        if (status) {

            status.textContent =
                `${selectedItems.length} item(s) currently assigned.`;

        }


    }

    catch (error) {

        console.error(
            "Save assignment error:",
            error
        );

        alert(
            "Unable to save assignments:\n" +
            error.message
        );

    }

    finally {

        saveBtn.disabled = false;

        saveBtn.textContent =
            "Save Assignment";

    }

}


// =====================================================
// NAVIGATION
// =====================================================

function goToAdminDashboard() {

    window.location.href =
        "admin.html";

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

// =====================================================
// LOAD ASSIGNMENT OVERVIEW
// =====================================================

async function loadAssignmentOverview() {

    const overview =
        document.getElementById(
            "assignmentOverview"
        );

    const summary =
        document.getElementById(
            "assignmentOverviewSummary"
        );


    if (!overview) {

        console.error(
            "Assignment overview container not found."
        );

        return;

    }


    overview.innerHTML = `
        <div class="assignment-loading">
            Loading assignments...
        </div>
    `;


    try {

        // =================================================
        // GET ACTIVE ASSIGNMENTS
        // =================================================

        const snapshot =
            await db
                .collection("leaderItemAssignments")
                .where(
                    "active",
                    "==",
                    true
                )
                .get();


        // =================================================
        // GROUP ITEMS BY LEADER
        // =================================================

        const assignmentsByLeader = {};


        snapshot.forEach(
            doc => {

                const data =
                    doc.data();


                const leaderUid =
                    data.leaderUid;


                const itemCode =
                    data.itemCode;


                if (!leaderUid) {

                    return;

                }


                if (
                    !assignmentsByLeader[
                        leaderUid
                    ]
                ) {

                    assignmentsByLeader[
                        leaderUid
                    ] = [];

                }


                assignmentsByLeader[
                    leaderUid
                ].push(itemCode);

            }
        );


        // =================================================
        // CLEAR OVERVIEW
        // =================================================

        overview.innerHTML = "";


        // =================================================
        // NO ACTIVE ASSIGNMENTS
        // =================================================

        const leaderIds =
            Object.keys(
                assignmentsByLeader
            );


        if (
            leaderIds.length === 0
        ) {

            overview.innerHTML = `

                <div class="empty-message">

                    No active item assignments found.

                </div>

            `;


            if (summary) {

                summary.textContent =
                    "0 leaders have items assigned.";

            }


            return;

        }


        // =================================================
        // SUMMARY
        // =================================================

        const totalAssignments =
            snapshot.size;


        if (summary) {

            summary.textContent =
                `${leaderIds.length} leader(s) • ` +
                `${totalAssignments} active assignment(s)`;

        }


        // =================================================
        // SORT LEADERS
        // =================================================

        leaderIds.sort(
            (a, b) => {

                const leaderA =
                    leaders[a] || {};

                const leaderB =
                    leaders[b] || {};


                const nameA =
                    (
                        leaderA.name ||
                        "Unknown"
                    )
                    .toLowerCase();


                const nameB =
                    (
                        leaderB.name ||
                        "Unknown"
                    )
                    .toLowerCase();


                return nameA.localeCompare(
                    nameB
                );

            }
        );


        // =================================================
        // CREATE LEADER CARDS
        // =================================================

        leaderIds.forEach(
            leaderUid => {

                const leader =
                    leaders[
                        leaderUid
                    ] || {};


                const assignedItems =
                    assignmentsByLeader[
                        leaderUid
                    ] || [];


                assignedItems.sort();


                // -----------------------------------------
                // LEADER CARD
                // -----------------------------------------

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "leader-assignment-card";


                // -----------------------------------------
                // ITEM HTML
                // -----------------------------------------

                let itemsHTML = "";


                assignedItems.forEach(
                    itemCode => {

                        const item =
                            itemMap[
                                itemCode
                            ] || {};


                        const description =
                            item.description ||
                            "Unknown item";


                        itemsHTML += `

                            <div
                                class="assigned-item"
                            >

                                <span
                                    class="assigned-item-code"
                                >
                                    ${itemCode}
                                </span>

                                <span
                                    class="assigned-item-description"
                                >
                                    ${description}
                                </span>

                            </div>

                        `;

                    }
                );


                // -----------------------------------------
                // CARD HTML
                // -----------------------------------------

                card.innerHTML = `

                    <div
                        class="leader-assignment-header"
                    >

                        <div>

                            <h3
                                class="leader-name"
                            >
                                👤 ${
                                    leader.name ||
                                    "Unknown Leader"
                                }
                            </h3>


                            <div
                                class="leader-region"
                            >
                                📍 ${
                                    leader.region ||
                                    "No Region"
                                }
                            </div>

                        </div>


                        <span
                            class="assigned-count"
                        >
                            ${
                                assignedItems.length
                            }
                            ${
                                assignedItems.length === 1
                                ? "Item"
                                : "Items"
                            }
                        </span>

                    </div>


                    <div
                        class="assigned-items-list"
                    >

                        ${
                            itemsHTML ||
                            `
                            <div
                                class="no-assignment"
                            >
                                No active items assigned.
                            </div>
                            `
                        }

                    </div>

                `;


                overview.appendChild(
                    card
                );

            }
        );


    }

    catch (error) {

        console.error(
            "Error loading assignment overview:",
            error
        );


        overview.innerHTML = `

            <div class="empty-message">

                Unable to load assignment overview.

            </div>

        `;


        if (summary) {

            summary.textContent =
                "Unable to load assignments.";

        }

    }

}
function goToAdminDashboard() {

    window.location.href =
        "admin.html";

}