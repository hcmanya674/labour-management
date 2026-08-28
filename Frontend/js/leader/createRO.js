// =====================================================
// CREATE REPAIR ORDER
// =====================================================

// =====================================================
// GLOBAL VARIABLES
// =====================================================

let leaderData = {};

let isSaving = false;

// Stores all assigned items
let itemMap = {};

// Stores currently selected item codes
// IMPORTANT: Set prevents duplicate item codes
let selectedItemCodes = new Set();


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        auth.onAuthStateChanged(
            async (user) => {

                // ==========================================
                // USER NOT LOGGED IN
                // ==========================================

                if (!user) {

                    window.location.replace(
                        "../auth/loginindex.html"
                    );

                    return;
                }


                try {

                    console.log(
                        "Logged-in UID:",
                        user.uid
                    );


                    // ======================================
                    // LOAD LEADER DATA
                    // ======================================

                    const leaderDoc =
                        await db
                            .collection("users")
                            .doc(user.uid)
                            .get();


                    if (!leaderDoc.exists) {

                        alert(
                            "Leader record not found."
                        );

                        return;

                    }


                    leaderData =
                        leaderDoc.data();


                    console.log(
                        "Leader Data:",
                        leaderData
                    );


                    // ======================================
                    // CHECK ROLE
                    // ======================================

                    if (
                        leaderData.role &&
                        leaderData.role !== "leader"
                    ) {

                        alert(
                            "Access denied. Leader only."
                        );

                        return;

                    }


                    // ======================================
                    // DISPLAY LEADER NAME
                    // ======================================

                    const leaderName =
                        document.getElementById(
                            "leaderName"
                        );


                    if (leaderName) {

                        leaderName.value =
                            leaderData.name || "";

                    }


                    // ======================================
                    // LOAD REGION
                    // ======================================

                    await loadRegion();


                    // ======================================
                    // LOAD ASSIGNED ITEMS
                    // ======================================

                    await loadItems();


                }

                catch (error) {

                    console.error(
                        "Error loading leader:",
                        error
                    );


                    alert(
                        "Unable to load leader information."
                    );

                }

            }
        );

    }
);


// =====================================================
// LOAD LEADER REGION
// =====================================================

async function loadRegion() {

    const regionInput =
        document.getElementById(
            "region"
        );


    if (!leaderData.region) {

        if (regionInput) {

            regionInput.value =
                "Region not assigned";

        }

        return;

    }


    try {

        const regionDoc =
            await db
                .collection("regions")
                .doc(
                    String(
                        leaderData.region
                    )
                )
                .get();


        // ==========================================
        // REGION DOCUMENT NOT FOUND
        // ==========================================

        if (!regionDoc.exists) {

            if (regionInput) {

                regionInput.value =
                    leaderData.region || "";

            }

            return;

        }


        const regionData =
            regionDoc.data();


        if (regionInput) {

            regionInput.value =
                regionData.regionName ||
                leaderData.region ||
                "";

        }

    }

    catch (error) {

        console.error(
            "Error loading region:",
            error
        );


        if (regionInput) {

            regionInput.value =
                leaderData.region || "";

        }

    }

}


// =====================================================
// LOAD ITEMS ASSIGNED TO CURRENT LEADER
// =====================================================

async function loadItems() {

    const container =
        document.getElementById(
            "itemCodeContainer"
        );


    if (!container) {

        console.error(
            "itemCodeContainer not found."
        );

        return;

    }


    container.innerHTML = `
        <p>
            Loading assigned items...
        </p>
    `;


    try {

        // ==========================================
        // CURRENT USER
        // ==========================================

        const currentUser =
            auth.currentUser;


        if (!currentUser) {

            container.innerHTML = `
                <p style="color:#d32f2f;">
                    User is not logged in.
                </p>
            `;

            return;

        }


        const leaderUid =
            currentUser.uid;


        console.log(
            "Current Leader UID:",
            leaderUid
        );


        // ==========================================
        // GET ACTIVE ASSIGNMENTS
        // ==========================================

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


        const assignedItemCodes = [];


        assignmentSnapshot.forEach(
            doc => {

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

                        assignedItemCodes.push(
                            itemCode
                        );

                    }

                }

            }
        );


        console.log(
            "Assigned Item Codes:",
            assignedItemCodes
        );


        // ==========================================
        // NO ASSIGNED ITEMS
        // ==========================================

        if (
            assignedItemCodes.length === 0
        ) {

            container.innerHTML = `
                <div class="empty-message">

                    <p style="color:#d32f2f;">
                        No items have been assigned to you.
                    </p>

                    <p>
                        Please contact Admin.
                    </p>

                </div>
            `;

            updateBillingAmount();

            return;

        }


        // ==========================================
        // GET ACTIVE ITEM MASTER DATA
        // ==========================================

        const itemSnapshot =
            await db
                .collection("itemcodes")
                .where(
                    "active",
                    "==",
                    true
                )
                .get();


        // ==========================================
        // CLEAR ITEM MAP
        // ==========================================

        itemMap = {};


        // ==========================================
        // BUILD ITEM MAP
        // ONLY ASSIGNED ITEMS
        // ==========================================

        itemSnapshot.forEach(
            doc => {

                const data =
                    doc.data();


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


                // Only keep assigned items

                if (
                    !assignedItemCodes.includes(
                        itemCode
                    )
                ) {

                    return;

                }


                itemMap[itemCode] = {

                    itemCode:
                        itemCode,

                    description:
                        data.description || "",

                    billingAmount:
                        Number(
                            data.billingAmount
                        ) || 0

                };

            }
        );


        console.log(
            "Assigned items loaded:",
            itemMap
        );


        // ==========================================
        // NO MATCHING ACTIVE ITEMS
        // ==========================================

        if (
            Object.keys(itemMap).length === 0
        ) {

            container.innerHTML = `
                <div class="empty-message">

                    <p style="color:#d32f2f;">
                        Assigned items could not be found
                        in the itemcodes collection.
                    </p>

                    <p>
                        Please contact Admin.
                    </p>

                </div>
            `;

            updateBillingAmount();

            return;

        }


        // ==========================================
        // CLEAR PREVIOUS SELECTIONS
        // ==========================================

        selectedItemCodes.clear();


        // ==========================================
        // DISPLAY ALL ITEMS
        // ==========================================

        renderItems();


        // ==========================================
        // INITIAL BILLING
        // ==========================================

        updateBillingAmount();


        console.log(
            "Total assigned items:",
            Object.keys(itemMap).length
        );

    }

    catch (error) {

        console.error(
            "Error loading assigned items:",
            error
        );


        container.innerHTML = `
            <p style="color:#d32f2f;">
                Unable to load assigned items.
            </p>

            <p>
                ${escapeHTML(
                    error.message || ""
                )}
            </p>
        `;

    }

}


// =====================================================
// RENDER ITEMS
// =====================================================

function renderItems(
    filteredCodes = null
) {

    const container =
        document.getElementById(
            "itemCodeContainer"
        );


    if (!container) {

        return;

    }


    // ==========================================
    // GET ITEM CODES
    // ==========================================

    let itemCodes;


    if (
        Array.isArray(filteredCodes)
    ) {

        itemCodes =
            [...filteredCodes];

    }

    else {

        itemCodes =
            Object.keys(itemMap)
                .map(Number);

    }


    // ==========================================
    // SORT NUMERICALLY
    // ==========================================

    itemCodes.sort(
        (a, b) =>
            a - b
    );


    // ==========================================
    // NO RESULTS
    // ==========================================

    if (
        itemCodes.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-message">
                No matching items found.
            </div>
        `;

        return;

    }


    // ==========================================
    // CLEAR CONTAINER
    // ==========================================

    container.innerHTML = "";


    // ==========================================
    // CREATE ITEM CARDS
    // ==========================================

    itemCodes.forEach(
        itemCode => {

            const item =
                itemMap[itemCode];


            if (!item) {

                return;

            }


            // ======================================
            // OUTER ITEM
            // ======================================

            const itemDiv =
                document.createElement(
                    "div"
                );


            itemDiv.className =
                "item-option";


            // ======================================
            // LABEL
            // ======================================

            const label =
                document.createElement(
                    "label"
                );


            label.className =
                "item-checkbox";


            // ======================================
            // CHECKBOX
            // ======================================

            const checkbox =
                document.createElement(
                    "input"
                );


            checkbox.type =
                "checkbox";


            checkbox.name =
                "itemCode";


            checkbox.value =
                String(
                    itemCode
                );


            // ======================================
            // RESTORE CHECKED STATE
            // ======================================

            checkbox.checked =
                selectedItemCodes.has(
                    itemCode
                );


            // ======================================
            // STORE ITEM DATA
            // ======================================

            checkbox.dataset.cost =
                String(
                    item.billingAmount
                );


            checkbox.dataset.description =
                item.description;


            // ======================================
            // CHECKBOX CHANGE
            // ======================================

            checkbox.addEventListener(
                "change",
                function () {

                    if (
                        checkbox.checked
                    ) {

                        selectedItemCodes.add(
                            itemCode
                        );

                    }

                    else {

                        selectedItemCodes.delete(
                            itemCode
                        );

                    }


                    console.log(
                        "Selected items:",
                        Array.from(
                            selectedItemCodes
                        )
                    );


                    updateBillingAmount();

                }
            );


            // ======================================
            // TEXT
            // ======================================

            const span =
                document.createElement(
                    "span"
                );


            span.className =
                "item-text";


            span.textContent =
                `${itemCode} - ${item.description}`;


            // ======================================
            // PRICE
            // ======================================

            const strong =
                document.createElement(
                    "strong"
                );


            strong.textContent =
                ` ₹${Number(
                    item.billingAmount
                ).toLocaleString(
                    "en-IN"
                )}`;


            span.appendChild(
                strong
            );


            // ======================================
            // BUILD ELEMENT
            // ======================================

            label.appendChild(
                checkbox
            );


            label.appendChild(
                span
            );


            itemDiv.appendChild(
                label
            );


            container.appendChild(
                itemDiv
            );

        }
    );

}


// =====================================================
// SEARCH ITEMS
// =====================================================
// =====================================================
// SEARCH ITEMS
// FILTER WHILE TYPING
// =====================================================

function searchItems() {

    const searchInput =
        document.getElementById(
            "itemSearchInput"
        );

    const message =
        document.getElementById(
            "itemSearchMessage"
        );


    if (!searchInput) {

        return;

    }


    const searchText =
        searchInput.value
            .trim()
            .toLowerCase();


    // ==========================================
    // EMPTY SEARCH
    // SHOW ALL ASSIGNED ITEMS
    // ==========================================

    if (
        searchText === ""
    ) {

        renderItems();


        if (message) {

            message.textContent =
                "";

        }

        return;

    }


    // ==========================================
    // FILTER ITEM CODE + DESCRIPTION
    // ==========================================

    const matchingCodes =
        Object.keys(itemMap)
            .map(Number)
            .filter(
                itemCode => {

                    const item =
                        itemMap[itemCode];


                    const code =
                        String(
                            itemCode
                        ).toLowerCase();


                    const description =
                        String(
                            item.description || ""
                        ).toLowerCase();


                    return (
                        code.includes(
                            searchText
                        ) ||
                        description.includes(
                            searchText
                        )
                    );

                }
            );


    // ==========================================
    // DISPLAY FILTERED ITEMS
    // ==========================================

    renderItems(
        matchingCodes
    );


    // ==========================================
    // SEARCH MESSAGE
    // ==========================================

    if (message) {

        if (
            matchingCodes.length === 0
        ) {

            message.textContent =
                `No item found for "${searchInput.value.trim()}".`;

            message.style.color =
                "#d32f2f";

        }

        else {

            message.textContent =
                `${matchingCodes.length} matching item(s) found.`;

            message.style.color =
                "#0D47A1";

        }

    }

}
// =====================================================
// FILTER ITEMS WHILE TYPING
// =====================================================

document.addEventListener(
    "input",
    function (event) {

        if (
            event.target &&
            event.target.id === "itemSearchInput"
        ) {

            searchItems();

        }

    }
);
// =====================================================
// CLEAR SEARCH
// =====================================================

function clearItemSearch() {

    const searchInput =
        document.getElementById(
            "itemSearchInput"
        );


    const message =
        document.getElementById(
            "itemSearchMessage"
        );


    if (searchInput) {

        searchInput.value =
            "";

    }


    // ==========================================
    // SHOW ALL ITEMS
    // ==========================================

    renderItems();


    // ==========================================
    // CLEAR MESSAGE
    // ==========================================

    if (message) {

        message.textContent =
            "";

    }

}


// =====================================================
// ENTER KEY SEARCH
// =====================================================

document.addEventListener(
    "keydown",
    function (event) {

        const searchInput =
            document.getElementById(
                "itemSearchInput"
            );


        if (
            searchInput &&
            event.target === searchInput &&
            event.key === "Enter"
        ) {

            event.preventDefault();

            searchItems();

        }

    }
);


// =====================================================
// CALCULATE BILLING
// =====================================================

function calculateBillingAmount() {

    updateBillingAmount();

}


// =====================================================
// UPDATE BILLING DISPLAY
// =====================================================

function updateBillingAmount() {

    let total = 0;


    selectedItemCodes.forEach(
        itemCode => {

            const item =
                itemMap[itemCode];


            if (item) {

                total +=
                    Number(
                        item.billingAmount
                    ) || 0;

            }

        }
    );


    const totalElement =
        document.getElementById(
            "totalBillingAmount"
        );


    if (!totalElement) {

        return;

    }


    totalElement.textContent =
        "₹" +
        total.toLocaleString(
            "en-IN",
            {
                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    2
            }
        );

}


// =====================================================
// GET SELECTED ITEMS
// =====================================================

function getSelectedItems() {

    return Array.from(
        selectedItemCodes
    );

}


// =====================================================
// VERIFY ITEMS ARE STILL ASSIGNED
// =====================================================

async function verifyAssignedItems(
    leaderUid,
    selectedItems
) {

    try {

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


        const assignedCodes =
            new Set();


        assignmentSnapshot.forEach(
            doc => {

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

                        assignedCodes.add(
                            itemCode
                        );

                    }

                }

            }
        );


        // ==========================================
        // CHECK SELECTED ITEMS
        // ==========================================

        const invalidItems =
            selectedItems.filter(
                itemCode =>
                    !assignedCodes.has(
                        Number(
                            itemCode
                        )
                    )
            );


        if (
            invalidItems.length > 0
        ) {

            console.error(
                "Invalid/unassigned items:",
                invalidItems
            );


            return false;

        }


        return true;

    }

    catch (error) {

        console.error(
            "Error verifying assigned items:",
            error
        );


        throw error;

    }

}


// =====================================================
// SAVE REPAIR ORDER
// =====================================================

async function saveRO() {

    // ==========================================
    // PREVENT DOUBLE CLICK
    // ==========================================

    if (isSaving) {

        return;

    }


    const saveBtn =
        document.getElementById(
            "saveBtn"
        );


    // ==========================================
    // GET FORM ELEMENTS
    // ==========================================

    const roNumberInput =
        document.getElementById(
            "roNumber"
        );


    const vehicleNumberInput =
        document.getElementById(
            "vehicleNumber"
        );


    const advisorNameInput =
        document.getElementById(
            "advisorName"
        );


    if (
        !roNumberInput ||
        !vehicleNumberInput ||
        !advisorNameInput
    ) {

        alert(
            "Required form fields are missing."
        );

        return;

    }


    // ==========================================
    // GET VALUES
    // ==========================================

    const roNumber =
        roNumberInput.value
            .trim()
            .toUpperCase();


    const vehicleNumber =
        vehicleNumberInput.value
            .trim()
            .toUpperCase();


    const advisorName =
        advisorNameInput.value
            .trim()
            .toUpperCase();


    // ==========================================
    // GET SELECTED ITEM CODES
    // ==========================================

    const selectedItems =
        Array.from(
            selectedItemCodes
        )
        .map(Number)
        .filter(
            Number.isInteger
        );


    console.log(
        "Selected Items:",
        selectedItems
    );


    // ==========================================
    // ITEM DETAILS
    // ==========================================

    const itemDetails =
        selectedItems.map(
            itemCode => {

                const item =
                    itemMap[itemCode];


                return {

                    itemCode:
                        itemCode,

                    description:
                        item?.description || "",

                    billingAmount:
                        Number(
                            item?.billingAmount
                        ) || 0

                };

            }
        );


    // ==========================================
    // CALCULATE BILLING
    // ==========================================

    let billingAmount = 0;


    selectedItems.forEach(
        itemCode => {

            const item =
                itemMap[itemCode];


            if (item) {

                billingAmount +=
                    Number(
                        item.billingAmount
                    ) || 0;

            }

        }
    );


    // ==========================================
    // VALIDATION
    // ==========================================

    if (!vehicleNumber) {

        alert(
            "Please enter Vehicle Number."
        );

        return;

    }


    if (!advisorName) {

        alert(
            "Please enter Advisor Name."
        );

        return;

    }


    const namePattern =
        /^[A-Za-z]+(?: [A-Za-z]+)*$/;


    if (
        !namePattern.test(
            advisorName
        )
    ) {

        alert(
            "Advisor name can contain only letters and spaces."
        );

        return;

    }


    if (
        advisorName.length < 3
    ) {

        alert(
            "Advisor name must contain at least 3 characters."
        );

        return;

    }


    if (
        advisorName.length > 30
    ) {

        alert(
            "Advisor name cannot exceed 30 characters."
        );

        return;

    }


    if (
        selectedItems.length === 0
    ) {

        alert(
            "Please select at least one item."
        );

        return;

    }


    // ==========================================
    // START SAVING
    // ==========================================

    isSaving = true;


    if (saveBtn) {

        saveBtn.disabled =
            true;

        saveBtn.innerHTML =
            "Saving...";

    }


    try {

        // ======================================
        // CURRENT USER
        // ======================================

        const currentUser =
            auth.currentUser;


        if (!currentUser) {

            throw new Error(
                "User is not logged in."
            );

        }


        const leaderUid =
            currentUser.uid;


        // ======================================
        // CHECK ROLE
        // ======================================

        if (
            leaderData.role &&
            leaderData.role !== "leader"
        ) {

            throw new Error(
                "Only leaders can create Repair Orders."
            );

        }


        // ======================================
        // VERIFY ITEMS
        // ======================================

        const itemsAreAssigned =
            await verifyAssignedItems(
                leaderUid,
                selectedItems
            );


        if (!itemsAreAssigned) {

            alert(
                "One or more selected items are no longer assigned to you. Please refresh the page and try again."
            );

            await loadItems();

            return;

        }


        // ======================================
        // CREATE DATE
        // ======================================

        const now =
            new Date();


        const yyyy =
            now.getFullYear();


        const months = [

            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec"

        ];


        const dd =
            String(
                now.getDate()
            ).padStart(
                2,
                "0"
            );


        const displayDate =
            dd +
            "-" +
            months[
                now.getMonth()
            ] +
            "-" +
            yyyy;


        // ======================================
        // DOCUMENT ID
        // ======================================

        let documentId;


        if (roNumber) {

            documentId =
                displayDate +
                " | " +
                roNumber;

        }

        else {

            documentId =
                displayDate +
                " | NO-RO-" +
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .substring(2, 8);

        }


        // ======================================
        // DUPLICATE RO CHECK
        // ======================================

        if (roNumber) {

            const existing =
                await db
                    .collection(
                        "repairorders"
                    )
                    .where(
                        "leaderUid",
                        "==",
                        leaderUid
                    )
                    .where(
                        "roNumber",
                        "==",
                        roNumber
                    )
                    .get();


            if (!existing.empty) {

                alert(
                    "RO Number already exists."
                );

                return;

            }

        }


        // ======================================
        // SAVE REPAIR ORDER
        // ======================================

        await db
            .collection(
                "repairorders"
            )
            .doc(
                documentId
            )
            .set({

                // BASIC INFORMATION

                roNumber:
                    roNumber || "",

                documentId:
                    documentId,

                leaderUid:
                    leaderUid,

                leaderName:
                    leaderData.name || "",

                region:
                    leaderData.region || "",

                advisorName:
                    advisorName,

                vehicleNumber:
                    vehicleNumber,


                // ITEM INFORMATION

                itemCodes:
                    selectedItems,

                itemDetails:
                    itemDetails,


                // BILLING

                billingAmount:
                    billingAmount,


                // STATUS

                status:
                    "Pending",


                // CREATED TIME

                createdAt:
                    firebase.firestore
                        .FieldValue
                        .serverTimestamp()

            });


        console.log(
            "Repair Order saved successfully."
        );


        // ==========================================
        // SUCCESS
        // ==========================================

        alert(
            "Repair Order Saved Successfully."
        );


        // ==========================================
        // CLEAR FORM
        // ==========================================

        roNumberInput.value =
            "";

        vehicleNumberInput.value =
            "";

        advisorNameInput.value =
            "";


        // ==========================================
        // CLEAR SELECTED ITEMS
        // ==========================================

        selectedItemCodes.clear();


        // ==========================================
        // CLEAR SEARCH
        // ==========================================

        const searchInput =
            document.getElementById(
                "itemSearchInput"
            );


        const searchMessage =
            document.getElementById(
                "itemSearchMessage"
            );


        if (searchInput) {

            searchInput.value =
                "";

        }


        if (searchMessage) {

            searchMessage.textContent =
                "";

        }


        // ==========================================
        // RE-RENDER ITEMS
        // ==========================================

        renderItems();


        // ==========================================
        // RESET BILLING
        // ==========================================

        updateBillingAmount(
            0
        );

    }

    catch (error) {

        console.error(
            "Error saving repair order:",
            error
        );


        alert(
            "Unable to save Repair Order:\n" +
            (
                error.message ||
                "Unknown error"
            )
        );

    }

    finally {

        isSaving =
            false;


        if (saveBtn) {

            saveBtn.disabled =
                false;

            saveBtn.innerHTML =
                "Save Repair Order";

        }

    }

}


// =====================================================
// LOGOUT
// =====================================================

function logout() {

    console.log(
        "Leader logout triggered."
    );


    auth.signOut()

        .then(() => {

            localStorage.removeItem(
                "uid"
            );


            localStorage.removeItem(
                "labourAppInstalled"
            );


            window.location.replace(
                "../auth/loginindex.html"
            );

        })

        .catch((error) => {

            console.error(
                "Logout error:",
                error
            );


            alert(
                "Unable to logout. Please try again."
            );

        });

}


// =====================================================
// HOME / DASHBOARD
// =====================================================

function showDashboard() {

    window.location.href =
        "leader.html";

}


// =====================================================
// ESCAPE HTML
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