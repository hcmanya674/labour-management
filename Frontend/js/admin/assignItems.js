// =====================================================
// ADMIN - ASSIGN ITEMS TO LEADER
// ITEM CODE TYPE: NUMBER
// =====================================================

let adminData = {};
let leaders = {};
let itemMap = {};


// =====================================================
// CHECK ADMIN LOGIN
// =====================================================

auth.onAuthStateChanged(async (user) => {

    if (!user) {

        window.location.replace(
            "../../pages/auth/loginindex.html"
        );

        return;
    }

    try {

        console.log("Admin UID:", user.uid);


        // =================================================
        // LOAD ADMIN PROFILE
        // =================================================

        const adminDoc =
            await db
                .collection("users")
                .doc(user.uid)
                .get();


        if (!adminDoc.exists) {

            alert(
                "Admin user profile not found."
            );

            return;
        }


        adminData =
            adminDoc.data();


        console.log(
            "Admin Data:",
            adminData
        );


        // =================================================
        // CHECK ADMIN ROLE
        // =================================================

        if (adminData.role !== "admin") {

            alert(
                "Access denied. Admin only."
            );

            await auth.signOut();

            return;
        }


        // =================================================
        // LOAD LEADERS
        // =================================================

        await loadLeaders();


        // =================================================
        // LOAD ACTIVE ITEMS
        // =================================================

        await loadItems();


        // =================================================
        // LOAD ASSIGNMENT OVERVIEW
        // =================================================

        await loadAssignmentOverview();


        console.log(
            "Admin assignment page loaded successfully."
        );

    }

    catch (error) {

        console.error(
            "Admin initialization error:",
            error
        );

        alert(
            "Unable to load assignment page.\n\n" +
            error.message
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


    if (!select) {

        throw new Error(
            "leaderSelect element not found."
        );

    }


    console.log(
        "Loading leaders..."
    );


    const snapshot =
        await db
            .collection("users")
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


        leaders[doc.id] =
            leader;


        const option =
            document.createElement(
                "option"
            );


        option.value =
            doc.id;


        option.textContent =
            `${leader.name || "Unknown"} - ${
                leader.region || "No Region"
            }`;


        select.appendChild(
            option
        );

    });


    console.log(
        "Leaders loaded:",
        leaders
    );

}


// =====================================================
// LOAD ACTIVE ITEM CODES
// ITEM CODE = NUMBER
// =====================================================

async function loadItems() {

    const container =
        document.getElementById(
            "itemContainer"
        );


    if (!container) {

        throw new Error(
            "itemContainer element not found."
        );

    }


    console.log(
        "Loading active item codes..."
    );


    const snapshot =
        await db
            .collection("itemcodes")
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


        // ==============================================
        // ITEM CODE MUST BE NUMBER
        // ==============================================

        const itemCode =
            Number(item.itemCode);


        if (
            !Number.isInteger(itemCode)
        ) {

            console.warn(
                "Invalid itemCode found:",
                doc.id,
                item.itemCode
            );

            return;

        }


        itemMap[itemCode] = {

            itemCode:
                itemCode,

            description:
                item.description || "",

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


    const itemCount =
        document.getElementById(
            "itemCount"
        );


    const status =
        document.getElementById(
            "assignmentStatus"
        );


    if (!leaderUid) {

        container.innerHTML = `
            <div class="empty-message">
                Select a leader to view available items.
            </div>
        `;


        saveBtn.disabled = true;


        if (itemCount) {

            itemCount.textContent =
                "0 Items";

        }


        if (status) {

            status.textContent =
                "";

        }


        return;

    }


    try {

        // =================================================
        // GET ACTIVE ASSIGNMENTS
        // =================================================

        const assignmentSnapshot =
            await db
                .collection(
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


        assignmentSnapshot.forEach(doc => {

            const data =
                doc.data();


            if (
                data.itemCode !== undefined &&
                data.itemCode !== null
            ) {

                const itemCode =
                    Number(
                        data.itemCode
                    );


                if (
                    Number.isInteger(
                        itemCode
                    )
                ) {

                    assignedItems.push(
                        itemCode
                    );

                }

            }

        });


        console.log(
            "Assigned items:",
            assignedItems
        );


        // =================================================
        // DISPLAY ITEMS
        // =================================================

        container.innerHTML = "";


        const itemCodes =
            Object.keys(
                itemMap
            )
            .map(Number)
            .sort(
                (a, b) => a - b
            );


        if (itemCodes.length === 0) {

            container.innerHTML = `
                <p>
                    No active items available.
                </p>
            `;

            saveBtn.disabled = true;

            return;

        }


        itemCodes.forEach(itemCode => {

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

        });


        saveBtn.disabled = false;


        if (itemCount) {

            itemCount.textContent =
                `${itemCodes.length} Items`;

        }


        if (status) {

            status.textContent =
                `${assignedItems.length} item(s) currently assigned.`;

        }


        console.log(
            "Items displayed:",
            itemCodes.length
        );

    }

    catch (error) {

        console.error(
            "Error loading assignments:",
            error
        );


        alert(
            "Unable to load leader assignments.\n\n" +
            error.message
        );

    }

}


// =====================================================
// SAVE ASSIGNMENTS
// ITEM CODE SAVED AS NUMBER
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


    // =================================================
    // GET SELECTED ITEMS
    // =================================================

    const selectedItems =
        Array.from(
            document.querySelectorAll(
                'input[name="assignedItem"]:checked'
            )
        )
        .map(
            checkbox =>
                Number(
                    checkbox.value
                )
        )
        .filter(
            Number.isInteger
        );


    console.log(
        "Selected item codes:",
        selectedItems
    );


    saveBtn.disabled = true;

    saveBtn.textContent =
        "Saving...";


    try {

        // =================================================
        // CHECK ADMIN
        // =================================================

        const currentUser =
            auth.currentUser;


        if (!currentUser) {

            throw new Error(
                "Admin is not logged in."
            );

        }


        // =================================================
        // GET EXISTING ASSIGNMENTS
        // =================================================

        const existingSnapshot =
            await db
                .collection(
                    "leaderItemAssignments"
                )
                .where(
                    "leaderUid",
                    "==",
                    leaderUid
                )
                .get();


        // =================================================
        // CREATE BATCH
        // =================================================

        const batch =
            db.batch();


        // =================================================
        // DISABLE OLD ASSIGNMENTS
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
        // CREATE / REACTIVATE SELECTED ITEMS
        // =================================================

        selectedItems.forEach(itemCode => {

            // =============================================
            // DOCUMENT ID MAY CONTAIN STRING
            // BUT itemCode FIELD IS NUMBER
            // =============================================

            const assignmentId =
                `${leaderUid}_${itemCode}`;


            const ref =
                db
                    .collection(
                        "leaderItemAssignments"
                    )
                    .doc(
                        assignmentId
                    );


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
                        currentUser.uid,

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


        alert(
            "Item assignments saved successfully."
        );


        // =================================================
        // REFRESH
        // =================================================

        await loadLeaderAssignments();

        await loadAssignmentOverview();

    }

    catch (error) {

        console.error(
            "Save assignment error:",
            error
        );


        alert(
            "Unable to save assignments.\n\n" +
            error.message
        );

    }

    finally {

        saveBtn.disabled =
            false;

        saveBtn.textContent =
            "Save Assignment";

    }

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
            "assignmentOverview element not found."
        );

        return;

    }


    overview.innerHTML = `
        <div class="assignment-loading">
            Loading assignments...
        </div>
    `;


    try {

        const snapshot =
            await db
                .collection(
                    "leaderItemAssignments"
                )
                .where(
                    "active",
                    "==",
                    true
                )
                .get();


        const assignmentsByLeader = {};


        snapshot.forEach(doc => {

            const data =
                doc.data();


            const leaderUid =
                data.leaderUid;


            if (!leaderUid) {

                return;

            }


            const itemCode =
                Number(
                    data.itemCode
                );


            if (
                !Number.isInteger(
                    itemCode
                )
            ) {

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
            ].push(
                itemCode
            );

        });


        overview.innerHTML = "";


        const leaderIds =
            Object.keys(
                assignmentsByLeader
            );


        if (leaderIds.length === 0) {

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


        if (summary) {

            summary.textContent =
                `${leaderIds.length} leader(s) • ` +
                `${snapshot.size} active assignment(s)`;

        }


        leaderIds.sort(
            (a, b) => {

                const nameA =
                    (
                        leaders[a]?.name ||
                        "Unknown"
                    )
                    .toLowerCase();


                const nameB =
                    (
                        leaders[b]?.name ||
                        "Unknown"
                    )
                    .toLowerCase();


                return nameA.localeCompare(
                    nameB
                );

            }
        );


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


                assignedItems.sort(
                    (a, b) => a - b
                );


                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "leader-assignment-card";


                let itemsHTML = "";


                assignedItems.forEach(
                    itemCode => {

                        const item =
                            itemMap[
                                itemCode
                            ] || {};


                        itemsHTML += `

                            <div class="assigned-item">

                                <span class="assigned-item-code">
                                    ${itemCode}
                                </span>

                                <span class="assigned-item-description">
                                    ${
                                        item.description ||
                                        "Unknown item"
                                    }
                                </span>

                            </div>

                        `;

                    }
                );


                card.innerHTML = `

                    <div class="leader-assignment-header">

                        <div>

                            <h3 class="leader-name">
                                👤 ${
                                    leader.name ||
                                    "Unknown Leader"
                                }
                            </h3>

                            <div class="leader-region">
                                📍 ${
                                    leader.region ||
                                    "No Region"
                                }
                            </div>

                        </div>

                        <span class="assigned-count">

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


                    <div class="assigned-items-list">

                        ${
                            itemsHTML ||
                            `
                            <div class="no-assignment">
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

            localStorage.removeItem(
                "uid"
            );


            window.location.replace(
                "../../pages/auth/loginindex.html"
            );

        })
        .catch(error => {

            console.error(
                "Logout error:",
                error
            );

        });

}

// =====================================================
// SEARCH ITEMS IN ASSIGN ITEMS PAGE
// =====================================================

function searchAssignedItems() {

    const searchInput =
        document.getElementById(
            "assignmentItemSearch"
        );

    const container =
        document.getElementById(
            "itemContainer"
        );

    const message =
        document.getElementById(
            "assignmentSearchMessage"
        );


    if (!searchInput || !container) {

        return;

    }


    const searchText =
        searchInput.value
            .trim()
            .toLowerCase();


    const items =
        container.querySelectorAll(
            ".item-option"
        );


    let matchFound = false;


    items.forEach(item => {

        const itemText =
            item.textContent
                .toLowerCase();


        if (
            searchText === "" ||
            itemText.includes(searchText)
        ) {

            item.style.display =
                "";

            matchFound = true;

        }

        else {

            item.style.display =
                "none";

        }

    });


    // =================================================
    // SEARCH MESSAGE
    // =================================================

    if (message) {

        if (
            searchText !== "" &&
            !matchFound
        ) {

            message.textContent =
                "No matching item found.";

            message.style.color =
                "#d32f2f";

        }

        else {

            message.textContent =
                "";

        }

    }

}


// =====================================================
// CLEAR SEARCH
// =====================================================

function clearAssignedItemSearch() {

    const searchInput =
        document.getElementById(
            "assignmentItemSearch"
        );


    const message =
        document.getElementById(
            "assignmentSearchMessage"
        );


    if (searchInput) {

        searchInput.value =
            "";

    }


    const container =
        document.getElementById(
            "itemContainer"
        );


    if (container) {

        const items =
            container.querySelectorAll(
                ".item-option"
            );


        items.forEach(item => {

            item.style.display =
                "";

        });

    }


    if (message) {

        message.textContent =
            "";

    }

}
// =====================================================
// SEARCH WHILE TYPING
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const searchInput =
            document.getElementById(
                "assignmentItemSearch"
            );


        if (!searchInput) {

            return;

        }


        searchInput.addEventListener(
            "input",
            function () {

                searchAssignedItems();

            }
        );

    }
);