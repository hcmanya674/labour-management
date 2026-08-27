// ==========================================
// CREATE REPAIR ORDER
// ITEM CODE TYPE: NUMBER
// ==========================================

let leaderData = {};
let isSaving = false;


// ==========================================
// LOAD LOGGED-IN LEADER
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        auth.onAuthStateChanged(
            async (user) => {

                // --------------------------------------
                // USER NOT LOGGED IN
                // --------------------------------------

                if (!user) {

                    window.location.replace(
                        "../auth/loginindex.html"
                    );

                    return;
                }


                try {

                    // ----------------------------------
                    // GET LEADER DATA
                    // ----------------------------------

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
                        "Logged-in Leader:",
                        leaderData
                    );


                    // ----------------------------------
                    // CHECK ROLE
                    // ----------------------------------

                    if (
                        leaderData.role &&
                        leaderData.role !== "leader"
                    ) {

                        console.error(
                            "Logged-in user is not a leader."
                        );

                        alert(
                            "Access denied. Leader only."
                        );

                        return;

                    }


                    // ----------------------------------
                    // DISPLAY LEADER NAME
                    // ----------------------------------

                    const leaderName =
                        document.getElementById(
                            "leaderName"
                        );


                    if (leaderName) {

                        leaderName.value =
                            leaderData.name || "";

                    }


                    // ----------------------------------
                    // LOAD REGION
                    // ----------------------------------

                    await loadRegion();


                    // ----------------------------------
                    // LOAD ASSIGNED ITEMS
                    // ----------------------------------

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


// ==========================================
// LOAD LEADER REGION
// ==========================================

async function loadRegion() {

    console.log(
        "Leader Region ID:",
        leaderData.region
    );


    const regionInput =
        document.getElementById(
            "region"
        );


    if (!leaderData.region) {

        console.warn(
            "Leader region is missing."
        );


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


        console.log(
            "Region Exists:",
            regionDoc.exists
        );


        if (!regionDoc.exists) {

            console.warn(
                "Region document not found. Using stored region value."
            );


            if (regionInput) {

                regionInput.value =
                    leaderData.region || "";

            }

            return;

        }


        const regionData =
            regionDoc.data();


        console.log(
            "Region Data:",
            regionData
        );


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


// ========================================================
// LOAD ONLY ITEMS ASSIGNED TO THIS LEADER
// ITEM CODE TYPE: NUMBER
// ========================================================

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
        // CURRENT LOGGED-IN LEADER
        // ==========================================

        const currentUser =
            auth.currentUser;


        if (!currentUser) {

            container.innerHTML = `
                <p style="color:red;">
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


        console.log(
            "Active assignments found:",
            assignmentSnapshot.size
        );


        // ==========================================
        // GET ASSIGNED ITEM CODES
        // AS NUMBERS
        // ==========================================

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
        // LOAD ACTIVE ITEMS
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


        console.log(
            "Active item codes found:",
            itemSnapshot.size
        );


        // ==========================================
        // CLEAR CONTAINER
        // ==========================================

        container.innerHTML = "";


        let assignedCount = 0;


        // ==========================================
        // DISPLAY ONLY ASSIGNED ITEMS
        // ==========================================

        itemSnapshot.forEach(
            doc => {

                const data =
                    doc.data();


                // ==================================
                // ITEM CODE = NUMBER
                // ==================================

                const itemCode =
                    Number(
                        data.itemCode
                    );


                if (
                    !Number.isInteger(
                        itemCode
                    )
                ) {

                    console.warn(
                        "Invalid item code:",
                        data.itemCode
                    );

                    return;

                }


                console.log(
                    "Checking item:",
                    itemCode,
                    "Assigned:",
                    assignedItemCodes.includes(
                        itemCode
                    )
                );


                // ==================================
                // ONLY DISPLAY ASSIGNED ITEM
                // ==================================

                if (
                    !assignedItemCodes.includes(
                        itemCode
                    )
                ) {

                    return;

                }


                assignedCount++;


                const description =
                    data.description || "";


                const cost =
                    Number(
                        data.billingAmount
                    ) || 0;


                // ==================================
                // CREATE ITEM ELEMENT
                // ==================================

                const itemDiv =
                    document.createElement(
                        "div"
                    );


                itemDiv.className =
                    "item-option";


                // ==================================
                // LABEL
                // ==================================

                const label =
                    document.createElement(
                        "label"
                    );


                label.className =
                    "item-checkbox";


                // ==================================
                // CHECKBOX
                // ==================================

                const checkbox =
                    document.createElement(
                        "input"
                    );


                checkbox.type =
                    "checkbox";


                checkbox.name =
                    "itemCode";


                // Browser value is string,
                // but Firestore value will be NUMBER.

                checkbox.value =
                    String(
                        itemCode
                    );


                checkbox.dataset.cost =
                    String(
                        cost
                    );


                checkbox.dataset.description =
                    description;


                checkbox.addEventListener(
                    "change",
                    calculateBillingAmount
                );


                // ==================================
                // DISPLAY TEXT
                // ==================================

                const span =
                    document.createElement(
                        "span"
                    );


                span.textContent =
                    `${itemCode} - ${description}`;


                // ==================================
                // COST
                // ==================================

                const strong =
                    document.createElement(
                        "strong"
                    );


                strong.textContent =
                    ` ₹${cost.toLocaleString(
                        "en-IN"
                    )}`;


                span.appendChild(
                    strong
                );


                // ==================================
                // BUILD ITEM
                // ==================================

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


        // ==========================================
        // SORT DISPLAYED ITEMS NUMERICALLY
        // ==========================================

        const itemElements =
            Array.from(
                container.querySelectorAll(
                    ".item-option"
                )
            );


        itemElements.sort(
            (a, b) => {

                const codeA =
                    Number(
                        a.querySelector(
                            'input[name="itemCode"]'
                        ).value
                    );


                const codeB =
                    Number(
                        b.querySelector(
                            'input[name="itemCode"]'
                        ).value
                    );


                return codeA - codeB;

            }
        );


        itemElements.forEach(
            element =>
                container.appendChild(
                    element
                )
        );


        // ==========================================
        // ASSIGNED ITEMS NOT FOUND
        // ==========================================

        if (
            assignedCount === 0
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


            console.error(
                "Assignments exist, but matching active itemcodes were not found.",
                {
                    assignedItemCodes:
                        assignedItemCodes
                }
            );


            updateBillingAmount();

            return;

        }


        // ==========================================
        // INITIAL BILLING
        // ==========================================

        calculateBillingAmount();


        console.log(
            "Assigned items displayed:",
            assignedCount
        );

    }

    catch (error) {

        console.error(
            "Error loading assigned items:",
            error
        );


        container.innerHTML = `
            <p style="color:red;">
                Unable to load assigned items.
            </p>

            <p>
                ${error.message || ""}
            </p>
        `;

    }

}


// ==========================================
// CALCULATE TOTAL BILLING AMOUNT
// ==========================================

function calculateBillingAmount() {

    const selectedItems =
        document.querySelectorAll(
            'input[name="itemCode"]:checked'
        );


    let total = 0;


    selectedItems.forEach(
        checkbox => {

            const cost =
                Number(
                    checkbox.dataset.cost
                ) || 0;


            total += cost;

        }
    );


    updateBillingAmount(
        total
    );

}


// ==========================================
// UPDATE BILLING DISPLAY
// ==========================================

function updateBillingAmount(
    total = 0
) {

    const totalElement =
        document.getElementById(
            "totalBillingAmount"
        );


    if (!totalElement) {

        return;

    }


    totalElement.textContent =
        "₹" +
        Number(total)
            .toLocaleString(
                "en-IN",
                {
                    minimumFractionDigits:
                        2,

                    maximumFractionDigits:
                        2
                }
            );

}


// ==========================================
// GET SELECTED ITEMS
// RETURNS CHECKBOX ELEMENTS
// ==========================================

function getSelectedItems() {

    return Array.from(
        document.querySelectorAll(
            'input[name="itemCode"]:checked'
        )
    );

}


// ==========================================
// VERIFY ITEMS ARE STILL ASSIGNED
// ITEM CODE = NUMBER
// ==========================================

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


        // ======================================
        // CHECK EVERY SELECTED ITEM
        // ======================================

        const invalidItems =
            selectedItems.filter(
                itemCode =>
                    !assignedCodes.has(
                        Number(itemCode)
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


// ==========================================
// SAVE REPAIR ORDER
// ==========================================

async function saveRO() {

    // --------------------------------------
    // PREVENT DOUBLE CLICK
    // --------------------------------------

    if (isSaving) {

        return;

    }


    const saveBtn =
        document.getElementById(
            "saveBtn"
        );


    // ======================================
    // GET FORM ELEMENTS
    // ======================================

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


    // ======================================
    // SAFETY CHECK
    // ======================================

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


    // ======================================
    // GET VALUES
    // ======================================

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


    // ======================================
    // GET SELECTED ITEMS
    // ======================================

    const selectedCheckboxes =
        getSelectedItems();


    // ======================================
    // IMPORTANT:
    // CONVERT CHECKBOX STRING TO NUMBER
    // ======================================

    const selectedItems =
        selectedCheckboxes
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
        "Selected Items:",
        selectedItems
    );


    // ======================================
    // ITEM DETAILS
    // ITEM CODE = NUMBER
    // ======================================

    const itemDetails =
        selectedCheckboxes.map(
            checkbox => {

                return {

                    itemCode:
                        Number(
                            checkbox.value
                        ),

                    description:
                        checkbox.dataset
                            .description || "",

                    billingAmount:
                        Number(
                            checkbox.dataset.cost
                        ) || 0

                };

            }
        );


    console.log(
        "Selected Item Details:",
        itemDetails
    );


    // ======================================
    // CALCULATE BILLING
    // ======================================

    let billingAmount = 0;


    selectedCheckboxes.forEach(
        checkbox => {

            billingAmount +=
                Number(
                    checkbox.dataset.cost
                ) || 0;

        }
    );


    console.log(
        "Billing Amount:",
        billingAmount
    );


    // ======================================
    // VALIDATION
    // ======================================

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


    // ======================================
    // DISABLE SAVE BUTTON
    // ======================================

    isSaving = true;


    if (saveBtn) {

        saveBtn.disabled =
            true;

        saveBtn.innerHTML =
            "Saving...";

    }


    try {

        // ==================================
        // VERIFY LOGGED-IN USER
        // ==================================

        const currentUser =
            auth.currentUser;


        if (!currentUser) {

            throw new Error(
                "User is not logged in."
            );

        }


        const leaderUid =
            currentUser.uid;


        console.log(
            "Saving RO for Leader UID:",
            leaderUid
        );


        // ==================================
        // VERIFY LEADER ROLE
        // ==================================

        if (
            leaderData.role &&
            leaderData.role !== "leader"
        ) {

            throw new Error(
                "Only leaders can create Repair Orders."
            );

        }


        // ==================================
        // VERIFY SELECTED ITEMS
        // ==================================

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


        // ==================================
        // CREATE DATE
        // ==================================

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


        // ==================================
        // GENERATE DOCUMENT ID
        // ==================================

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


        console.log(
            "Document ID:",
            documentId
        );


        // ==================================
        // DUPLICATE RO CHECK
        // ==================================

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


        // ==================================
        // SAVE REPAIR ORDER
        // ==================================

        await db
            .collection(
                "repairorders"
            )
            .doc(
                documentId
            )
            .set({

                // --------------------------------
                // BASIC INFORMATION
                // --------------------------------

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


                // --------------------------------
                // ITEM INFORMATION
                // IMPORTANT: NUMBERS
                // --------------------------------

                itemCodes:
                    selectedItems,

                itemDetails:
                    itemDetails,


                // --------------------------------
                // BILLING
                // --------------------------------

                billingAmount:
                    billingAmount,


                // --------------------------------
                // STATUS
                // --------------------------------

                status:
                    "Pending",


                // --------------------------------
                // CREATED TIME
                // --------------------------------

                createdAt:
                    firebase.firestore
                        .FieldValue
                        .serverTimestamp()

            });


        console.log(
            "Repair Order saved successfully."
        );


        // ==================================
        // SUCCESS
        // ==================================

        alert(
            "Repair Order Saved Successfully."
        );


        // ==================================
        // CLEAR FORM
        // ==================================

        roNumberInput.value =
            "";


        vehicleNumberInput.value =
            "";


        advisorNameInput.value =
            "";


        // ==================================
        // UNCHECK ITEMS
        // ==================================

        document
            .querySelectorAll(
                'input[name="itemCode"]'
            )
            .forEach(
                checkbox => {

                    checkbox.checked =
                        false;

                }
            );


        // ==================================
        // RESET BILLING
        // ==================================

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


// ==========================================
// LOGOUT
// ==========================================

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