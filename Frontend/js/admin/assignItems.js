// =====================================================
// ADMIN - ASSIGN ITEMS TO LEADER
// ROBUST FIREBASE INITIALIZATION
// =====================================================

let adminData = {};
let leaders = {};
let itemMap = {};
let currentAssignedItems = [];

// =====================================================
// FIRESTORE RETRY HELPER
// =====================================================

async function getFirestoreWithRetry(
    operation,
    retries = 3,
    delay = 2000
) {

    let lastError = null;

    for (let attempt = 1; attempt <= retries; attempt++) {

        try {

            console.log(
                `Firestore attempt ${attempt}/${retries}...`
            );

            const result = await operation();

            console.log(
                `Firestore attempt ${attempt} successful.`
            );

            return result;

        }

        catch (error) {

            lastError = error;

            console.error(
                `Firestore attempt ${attempt} failed:`,
                error
            );

            if (attempt < retries) {

                console.log(
                    `Retrying Firestore in ${delay / 1000} seconds...`
                );

                await new Promise(resolve =>
                    setTimeout(resolve, delay)
                );

            }

        }

    }

    throw lastError;

}


// =====================================================
// CHECK ADMIN LOGIN
// =====================================================

auth.onAuthStateChanged(async (user) => {

    if (!user) {

        console.log(
            "No authenticated user."
        );

        window.location.replace(
            "../../pages/auth/loginindex.html"
        );

        return;
    }


    console.log(
        "Admin UID:",
        user.uid
    );


    try {

        // =================================================
        // WAIT FOR FIRESTORE CONNECTION
        // =================================================

        console.log(
            "Checking Firestore connection..."
        );


        const adminDoc =
            await getFirestoreWithRetry(
                () =>
                    db
                        .collection("users")
                        .doc(user.uid)
                        .get(),
                5,
                2000
            );


        // =================================================
        // CHECK ADMIN PROFILE
        // =================================================

        if (!adminDoc.exists) {

            throw new Error(
                "Admin user profile not found in Firestore."
            );

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

        console.log(
            "Loading leaders..."
        );

        await loadLeaders();


        // =================================================
        // LOAD ITEMS
        // =================================================

        console.log(
            "Loading active items..."
        );

        await loadItems();


        // =================================================
        // LOAD ASSIGNMENT OVERVIEW
        // =================================================

        console.log(
            "Loading assignment overview..."
        );

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


        const container =
            document.getElementById(
                "itemContainer"
            );


        if (container) {

            container.innerHTML = `

                <div class="empty-message">

                    <strong>
                        Unable to connect to Firebase.
                    </strong>

                    <br><br>

                    Please check your internet connection
                    and refresh the page.

                    <br><br>

                    <small>
                        ${error.message}
                    </small>

                </div>

            `;

        }


        const itemCount =
            document.getElementById(
                "itemCount"
            );


        if (itemCount) {

            itemCount.textContent =
                "Connection Error";

        }

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
    await getFirestoreWithRetry(
        () =>
            db
                .collection("users")
                .where(
                    "role",
                    "==",
                    "leader"
                )
                .get(),
        5,
        2000
    );


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
    await getFirestoreWithRetry(
        () =>
            db
                .collection("itemcodes")
                .where(
                    "active",
                    "==",
                    true
                )
                .get(),
        5,
        2000
    );


    itemMap = {};


    snapshot.forEach(doc => {

        const item =
            doc.data();


        // =================================================
        // ITEM CODE AS NUMBER
        // =================================================

        const itemCode =
            Number(
                item.itemCode
            );


        if (
            !Number.isInteger(
                itemCode
            )
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


    // Show message before leader selection

    if (
        Object.keys(itemMap).length === 0
    ) {

        container.innerHTML = `
            <div class="empty-message">
                No active items available.
            </div>
        `;

    }

}


// =====================================================
// LOAD EXISTING ASSIGNMENTS
// =====================================================

async function loadLeaderAssignments() {

    const leaderSelect =
        document.getElementById(
            "leaderSelect"
        );


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


    const searchInput =
        document.getElementById(
            "assignmentItemSearch"
        );


    const searchMessage =
        document.getElementById(
            "assignmentSearchMessage"
        );


    if (
        !leaderSelect ||
        !container ||
        !saveBtn
    ) {

        console.error(
            "Required assignment elements not found."
        );

        return;
    }


    const leaderUid =
        leaderSelect.value;


    // =================================================
    // NO LEADER SELECTED
    // =================================================

    if (!leaderUid) {

        currentAssignedItems = [];


        container.innerHTML = `
            <div class="empty-message">
                Select a leader to view available items.
            </div>
        `;


        saveBtn.disabled =
            true;


        if (itemCount) {

            itemCount.textContent =
                "0 Items";

        }


        if (status) {

            status.textContent =
                "";

        }


        if (searchMessage) {

            searchMessage.textContent =
                "";

        }


        return;
    }


    try {

        console.log(
            "Loading assignments for leader:",
            leaderUid
        );


        // =================================================
        // GET ACTIVE ASSIGNMENTS
        // =================================================

        const assignmentSnapshot =
    await getFirestoreWithRetry(
        () =>
            db
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
                .get(),
        5,
        2000
    );


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


        // =================================================
        // STORE CURRENT ASSIGNMENTS
        // =================================================

        currentAssignedItems =
            [...assignedItems];


        console.log(
            "Assigned items:",
            currentAssignedItems
        );


        // =================================================
        // CLEAR SEARCH MESSAGE
        // =================================================

        if (searchMessage) {

            searchMessage.textContent =
                "";

        }


        // =================================================
        // DISPLAY ITEMS
        // =================================================

        renderAssignmentItems();


        // =================================================
        // SAVE BUTTON
        // =================================================

        if (
            Object.keys(itemMap).length > 0
        ) {

            saveBtn.disabled =
                false;

        }
        else {

            saveBtn.disabled =
                true;

        }


        // =================================================
        // STATUS
        // =================================================

        if (status) {

            status.textContent =
                `${currentAssignedItems.length} item(s) currently assigned.`;

        }


        console.log(
            "Items displayed:",
            Object.keys(itemMap).length
        );

    }

    catch (error) {

        console.error(
            "Error loading assignments:",
            error
        );


        container.innerHTML = `
            <div class="empty-message">
                Unable to load leader assignments.
            </div>
        `;


        saveBtn.disabled =
            true;


        if (status) {

            status.textContent =
                "Unable to load assignments.";

        }


        alert(
            "Unable to load leader assignments.\n\n" +
            error.message
        );

    }

}


// =====================================================
// RENDER ASSIGNMENT ITEMS
// =====================================================
// This function displays items from itemMap.
// It is used by both:
// - loadLeaderAssignments()
// - searchAssignedItems()
// =====================================================

function renderAssignmentItems(
    filteredCodes = null
) {

    const container =
        document.getElementById(
            "itemContainer"
        );


    const itemCount =
        document.getElementById(
            "itemCount"
        );


    if (!container) {

        return;
    }


    // =================================================
    // GET ITEM CODES
    // =================================================

    let itemCodes;


    if (
        Array.isArray(filteredCodes)
    ) {

        itemCodes =
            filteredCodes;

    }
    else {

        itemCodes =
            Object.keys(itemMap)
                .map(Number)
                .sort(
                    (a, b) => a - b
                );

    }


    // =================================================
    // NO ITEMS
    // =================================================

    if (
        itemCodes.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-message">
                No matching items found.
            </div>
        `;


        if (itemCount) {

            itemCount.textContent =
                "0 Items";

        }


        return;
    }


    // =================================================
    // CLEAR CONTAINER
    // =================================================

    container.innerHTML = "";


    // =================================================
    // CREATE ITEM CARDS
    // =================================================

    itemCodes.forEach(
        itemCode => {

            const item =
                itemMap[itemCode];


            if (!item) {

                return;
            }


            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className =
                "item-option";


            // =================================================
            // CHECK CURRENT ASSIGNMENT
            // =================================================

            const checked =
                currentAssignedItems.includes(
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
                                ${escapeHTML(
                                    item.description
                                )}
                            </span>

                        </div>

                        <span class="item-price">
                            ₹${Number(
                                item.billingAmount || 0
                            ).toLocaleString("en-IN")}
                        </span>

                    </div>

                </label>

            `;


            container.appendChild(
                wrapper
            );

        }
    );


    // =================================================
    // UPDATE COUNT
    // =================================================

    if (itemCount) {

        itemCount.textContent =
            `${itemCodes.length} Items`;

    }

}


// =====================================================
// ESCAPE HTML
// =====================================================
// Prevents item descriptions from breaking HTML.
// =====================================================

function escapeHTML(value) {

    return String(
        value || ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// =====================================================
// SEARCH ITEMS
// =====================================================
// Searches:
// 1. Item code
// 2. Item description
//
// Searches directly inside itemMap.
// This means it does NOT depend on the currently
// displayed HTML elements.
// =====================================================

function searchAssignedItems() {

    const searchInput =
        document.getElementById(
            "assignmentItemSearch"
        );


    const message =
        document.getElementById(
            "assignmentSearchMessage"
        );


    const leaderSelect =
        document.getElementById(
            "leaderSelect"
        );


    if (!searchInput) {

        return;
    }


    // =================================================
    // CHECK LEADER
    // =================================================

    if (
        !leaderSelect ||
        !leaderSelect.value
    ) {

        if (message) {

            message.textContent =
                "Please select a leader first.";

            message.style.color =
                "#d32f2f";

        }


        return;
    }


    // =================================================
    // SEARCH TEXT
    // =================================================

    const searchText =
        searchInput.value
            .trim()
            .toLowerCase();


    // =================================================
    // GET ALL ITEMS
    // =================================================

    const allItemCodes =
        Object.keys(itemMap)
            .map(Number)
            .sort(
                (a, b) => a - b
            );


    // =================================================
    // FILTER ITEMS
    // =================================================

    const matchingItemCodes =
        allItemCodes.filter(
            itemCode => {

                const item =
                    itemMap[itemCode];


                if (!item) {

                    return false;
                }


                const code =
                    String(
                        itemCode
                    )
                        .toLowerCase();


                const description =
                    String(
                        item.description || ""
                    )
                        .toLowerCase();


                return (
                    searchText === "" ||
                    code.includes(searchText) ||
                    description.includes(searchText)
                );

            }
        );


    // =================================================
    // DISPLAY RESULTS
    // =================================================

    renderAssignmentItems(
        matchingItemCodes
    );


    // =================================================
    // UPDATE MESSAGE
    // =================================================

    if (message) {

        if (
            searchText !== "" &&
            matchingItemCodes.length === 0
        ) {

            message.textContent =
                `No item found for "${searchInput.value.trim()}".`;

            message.style.color =
                "#d32f2f";

        }

        else if (
            searchText !== ""
        ) {

            message.textContent =
                `${matchingItemCodes.length} matching item(s) found.`;

            message.style.color =
                "#0D47A1";

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


    // =================================================
    // SHOW ALL ITEMS AGAIN
    // =================================================

    renderAssignmentItems();


    // =================================================
    // CLEAR MESSAGE
    // =================================================

    if (message) {

        message.textContent =
            "";

    }

}

// =====================================================
// UPDATE CURRENT ASSIGNED ITEMS
// PRESERVES HIDDEN SEARCH RESULTS
// =====================================================

function updateCurrentAssignedItems() {

    const container =
        document.getElementById(
            "itemContainer"
        );


    if (!container) {

        return;

    }


    const checkboxes =
        container.querySelectorAll(
            'input[name="assignedItem"]'
        );


    const visibleCodes =
        Array.from(
            checkboxes
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


    const checkedVisibleCodes =
        Array.from(
            checkboxes
        )
        .filter(
            checkbox =>
                checkbox.checked
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


    // =================================================
    // REMOVE VISIBLE ITEMS FROM CURRENT LIST
    // =================================================

    currentAssignedItems =
        currentAssignedItems.filter(
            code =>
                !visibleCodes.includes(
                    code
                )
        );


    // =================================================
    // ADD CHECKED VISIBLE ITEMS
    // =================================================

    checkedVisibleCodes.forEach(
        code => {

            if (
                !currentAssignedItems.includes(
                    code
                )
            ) {

                currentAssignedItems.push(
                    code
                );

            }

        }
    );


    // =================================================
    // SORT
    // =================================================

    currentAssignedItems.sort(
        (a, b) =>
            a - b
    );


    console.log(
        "Current assigned items:",
        currentAssignedItems
    );

}

// =====================================================
// SAVE ASSIGNMENTS
// ROBUST FIRESTORE SAVE
// =====================================================

async function saveAssignments() {

    const leaderSelect =
        document.getElementById(
            "leaderSelect"
        );

    const saveBtn =
        document.getElementById(
            "saveAssignmentBtn"
        );

    const status =
        document.getElementById(
            "assignmentStatus"
        );


    // =================================================
    // CHECK ELEMENTS
    // =================================================

    if (
        !leaderSelect ||
        !saveBtn
    ) {

        console.error(
            "Required save elements not found."
        );

        return;

    }


    // =================================================
    // GET LEADER
    // =================================================

    const leaderUid =
        leaderSelect.value;


    if (!leaderUid) {

        alert(
            "Please select a leader."
        );

        return;

    }


    // =================================================
    // UPDATE CURRENT SELECTIONS
    // =================================================

    updateCurrentAssignedItems();


    const selectedItems =
        [...new Set(
            currentAssignedItems
                .map(Number)
                .filter(
                    Number.isInteger
                )
        )];


    console.log(
        "===================================="
    );

    console.log(
        "Preparing assignment save..."
    );

    console.log(
        "Leader UID:",
        leaderUid
    );

    console.log(
        "Selected items:",
        selectedItems
    );

    console.log(
        "Selected item count:",
        selectedItems.length
    );

    console.log(
        "===================================="
    );


    // =================================================
    // DISABLE BUTTON
    // =================================================

    saveBtn.disabled = true;

    saveBtn.textContent =
        "Saving...";


    if (status) {

        status.textContent =
            "Connecting to Firebase...";

    }


    try {

        // =================================================
        // CHECK AUTHENTICATION
        // =================================================

        const currentUser =
            auth.currentUser;


        if (!currentUser) {

            throw new Error(
                "Admin is not logged in."
            );

        }


        console.log(
            "Admin UID:",
            currentUser.uid
        );


        // =================================================
        // FORCE FIRESTORE NETWORK
        // =================================================

        if (status) {

            status.textContent =
                "Connecting to database...";

        }


        try {

            await db.enableNetwork();

            console.log(
                "Firestore network enabled."
            );

        }

        catch (networkError) {

            console.warn(
                "Could not explicitly enable Firestore network:",
                networkError
            );

        }


        // =================================================
        // GET EXISTING ASSIGNMENTS
        // =================================================

        if (status) {

            status.textContent =
                "Reading current assignments...";

        }


        console.log(
            "Loading existing assignments..."
        );


        const existingSnapshot =
            await getFirestoreWithRetry(
                () =>
                    db
                        .collection(
                            "leaderItemAssignments"
                        )
                        .where(
                            "leaderUid",
                            "==",
                            leaderUid
                        )
                        .get(),
                5,
                2000
            );


        console.log(
            "Existing assignments:",
            existingSnapshot.size
        );


        // =================================================
        // CREATE BATCH
        // =================================================

        const batch =
            db.batch();


        let operationCount = 0;


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

                operationCount++;

            }
        );


        console.log(
            "Old assignments to disable:",
            existingSnapshot.size
        );


        // =================================================
        // CREATE / REACTIVATE SELECTED ITEMS
        // =================================================

        selectedItems.forEach(
            itemCode => {

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


                operationCount++;

            }
        );


        console.log(
            "Total Firestore operations:",
            operationCount
        );


        // =================================================
        // FIRESTORE BATCH LIMIT CHECK
        // =================================================

        if (
            operationCount > 500
        ) {

            throw new Error(
                "Too many assignment operations. " +
                "Firestore allows a maximum of 500 operations per batch."
            );

        }


        // =================================================
        // COMMIT
        // =================================================

        if (status) {

            status.textContent =
                "Saving assignments to Firebase...";

        }


        console.log(
            "Starting Firestore batch.commit()..."
        );


        const commitPromise =
            batch.commit();


        // =================================================
        // TIMEOUT PROTECTION
        // =================================================

        const timeoutPromise =
            new Promise(
                (_, reject) => {

                    setTimeout(
                        () => {

                            reject(
                                new Error(
                                    "Firestore save is taking too long. " +
                                    "Please check your internet connection and try again."
                                )
                            );

                        },
                        30000
                    );

                }
            );


        await Promise.race(
            [
                commitPromise,
                timeoutPromise
            ]
        );


        console.log(
            "Firestore batch.commit() completed."
        );


        // =================================================
        // WAIT FOR PENDING WRITES
        // =================================================

        try {

            await db.waitForPendingWrites();

            console.log(
                "All Firestore writes confirmed."
            );

        }

        catch (pendingError) {

            console.warn(
                "waitForPendingWrites warning:",
                pendingError
            );

        }


        // =================================================
        // SUCCESS
        // =================================================

        console.log(
            "===================================="
        );

        console.log(
            "ASSIGNMENTS SAVED SUCCESSFULLY"
        );

        console.log(
            "Leader:",
            leaderUid
        );

        console.log(
            "Items:",
            selectedItems
        );

        console.log(
            "===================================="
        );


        if (status) {

            status.textContent =
                `${selectedItems.length} item(s) assigned successfully.`;

        }


        alert(
            "Item assignments saved successfully."
        );


        // =================================================
        // REFRESH LEADER ASSIGNMENTS
        // =================================================

        await loadLeaderAssignments();


        // =================================================
        // REFRESH OVERVIEW
        // =================================================

        await loadAssignmentOverview();

    }

    catch (error) {

        console.error(
            "===================================="
        );

        console.error(
            "ASSIGNMENT SAVE ERROR"
        );

        console.error(
            error
        );

        console.error(
            "Code:",
            error.code
        );

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "===================================="
        );


        // =================================================
        // USER MESSAGE
        // =================================================

        if (status) {

            status.textContent =
                "Unable to save assignments.";

        }


        let message =
            "Unable to save assignments.\n\n";


        if (
            error.code ===
            "permission-denied"
        ) {

            message +=
                "Firebase permission denied.\n\n" +
                "Please check your Firestore security rules.";

        }

        else if (
            error.code ===
            "failed-precondition"
        ) {

            message +=
                "Firestore operation failed because " +
                "a required condition or index is missing.";

        }

        else if (
            error.code ===
            "unavailable"
        ) {

            message +=
                "Firebase is temporarily unavailable.\n\n" +
                "Please check your internet connection " +
                "and try again.";

        }

        else if (
            error.message &&
            error.message.toLowerCase()
                .includes("taking too long")
        ) {

            message +=
                "Firebase did not respond within 30 seconds.\n\n" +
                "Your internet connection may be unstable.";

        }

        else {

            message +=
                error.message ||
                "Unknown Firebase error.";

        }


        alert(
            message
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

        // =================================================
        // GET ACTIVE ASSIGNMENTS
        // =================================================

    const snapshot =
    await getFirestoreWithRetry(
        () =>
            db
                .collection(
                    "leaderItemAssignments"
                )
                .where(
                    "active",
                    "==",
                    true
                )
                .get(),
        5,
        2000
    );


        const assignmentsByLeader =
            {};


        // =================================================
        // GROUP BY LEADER
        // =================================================

        snapshot.forEach(
            doc => {

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

            }
        );


        // =================================================
        // CLEAR OVERVIEW
        // =================================================

        overview.innerHTML =
            "";


        const leaderIds =
            Object.keys(
                assignmentsByLeader
            );


        // =================================================
        // NO ASSIGNMENTS
        // =================================================

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

        if (summary) {

            summary.textContent =
                `${leaderIds.length} leader(s) • ` +
                `${snapshot.size} active assignment(s)`;

        }


        // =================================================
        // SORT LEADERS BY NAME
        // =================================================

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


                assignedItems.sort(
                    (a, b) => a - b
                );


                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "leader-assignment-card";


                // =================================================
                // ITEMS HTML
                // =================================================

                let itemsHTML =
                    "";


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
                                    ${escapeHTML(
                                        item.description ||
                                        "Unknown item"
                                    )}
                                </span>

                            </div>

                        `;

                    }
                );


                // =================================================
                // LEADER CARD
                // =================================================

                card.innerHTML = `

                    <div class="leader-assignment-header">

                        <div>

                            <h3 class="leader-name">

                                👤 ${
                                    escapeHTML(
                                        leader.name ||
                                        "Unknown Leader"
                                    )
                                }

                            </h3>


                            <div class="leader-region">

                                📍 ${
                                    escapeHTML(
                                        leader.region ||
                                        "No Region"
                                    )
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
// DOM CONTENT LOADED
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const searchInput =
            document.getElementById(
                "assignmentItemSearch"
            );


        const container =
            document.getElementById(
                "itemContainer"
            );


        if (!searchInput) {

            console.warn(
                "assignmentItemSearch not found."
            );

            return;
        }


        // =================================================
        // SEARCH WHILE TYPING
        // =================================================

        searchInput.addEventListener(
            "input",
            function () {

                searchAssignedItems();

            }
        );


        // =================================================
        // PRESS ENTER TO SEARCH
        // =================================================

        searchInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    searchAssignedItems();

                }

            }
        );


        // =================================================
        // CHECKBOX CHANGE
        // =================================================

        if (container) {

            container.addEventListener(
                "change",
                function (event) {

                    if (
                        event.target.matches(
                            'input[name="assignedItem"]'
                        )
                    ) {

                        updateCurrentAssignedItems();

                    }

                }
            );

        }

    }
);