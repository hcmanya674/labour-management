// ==========================================
// VIEW / EDIT REPAIR ORDER
// LEADER VERSION
// ==========================================
//
// IMPORTANT:
// Billing amount is CALCULATED and STORED,
// but NEVER DISPLAYED to the Leader.
//
// ==========================================


const roId =
    localStorage.getItem("currentRO");


let currentItemCodes = [];

let currentLeaderUid = null;

let assignedItemMap = {};

let isEditMode = false;


// ==========================================
// CHECK RO ID
// ==========================================

if (!roId) {

    alert(
        "Repair Order not selected."
    );

    history.back();

}


// ==========================================
// WAIT FOR LOGIN
// ==========================================

auth.onAuthStateChanged(
    async (user) => {

        if (!user) {

            alert(
                "Please login first."
            );

            window.location.href =
                "../../pages/auth/loginindex.html";

            return;

        }


        currentLeaderUid =
            user.uid;


        console.log(
            "Logged-in Leader UID:",
            currentLeaderUid
        );


        await loadRepairOrder();

    }
);


// ==========================================
// FIND ITEM DOCUMENT
// ==========================================
//
// This function handles all possible cases:
//
// 1. Document ID = item code
//
// OR
//
// 2. itemCode field contains NUMBER
//
// OR
//
// 3. itemCode field contains STRING
//
// ==========================================

async function findItemDocument(itemCode) {

    const code =
        String(itemCode).trim();


    if (!code) {

        return null;

    }


    // ======================================
    // STEP 1
    // TRY DOCUMENT ID
    // ======================================

    try {

        const directDoc =
            await db.collection(
                "itemcodes"
            )
            .doc(code)
            .get();


        if (directDoc.exists) {

            console.log(
                "Item found by document ID:",
                code
            );

            return directDoc;

        }

    }

    catch (error) {

        console.warn(
            "Document ID lookup failed:",
            code,
            error
        );

    }


    // ======================================
    // STEP 2
    // TRY itemCode AS NUMBER
    // ======================================

    const numericCode =
        Number(code);


    if (
        !Number.isNaN(numericCode)
    ) {

        try {

            const numberQuery =
                await db.collection(
                    "itemcodes"
                )
                .where(
                    "itemCode",
                    "==",
                    numericCode
                )
                .limit(1)
                .get();


            if (
                !numberQuery.empty
            ) {

                console.log(
                    "Item found by numeric itemCode:",
                    numericCode
                );


                return numberQuery.docs[0];

            }

        }

        catch (error) {

            console.warn(
                "Numeric itemCode lookup failed:",
                numericCode,
                error
            );

        }

    }


    // ======================================
    // STEP 3
    // TRY itemCode AS STRING
    // ======================================

    try {

        const stringQuery =
            await db.collection(
                "itemcodes"
            )
            .where(
                "itemCode",
                "==",
                code
            )
            .limit(1)
            .get();


        if (
            !stringQuery.empty
        ) {

            console.log(
                "Item found by string itemCode:",
                code
            );


            return stringQuery.docs[0];

        }

    }

    catch (error) {

        console.warn(
            "String itemCode lookup failed:",
            code,
            error
        );

    }


    // ======================================
    // NOT FOUND
    // ======================================

    console.warn(
        "Item not found anywhere:",
        code
    );


    return null;

}


// ==========================================
// LOAD REPAIR ORDER
// ==========================================

async function loadRepairOrder() {

    try {

        const doc =
            await db.collection(
                "repairorders"
            )
            .doc(roId)
            .get();


        if (!doc.exists) {

            alert(
                "Repair Order not found."
            );

            return;

        }


        const repairData =
            doc.data();


        console.log(
            "Repair Order:",
            repairData
        );


        // ======================================
        // RO NUMBER
        // ======================================

        const roNumber =
            document.getElementById(
                "roNumber"
            );


        if (roNumber) {

            roNumber.textContent =
                repairData.roNumber || "-";

        }


        // ======================================
        // DATE & TIME
        // ======================================

        const createdDate =
            document.getElementById(
                "createdDate"
            );


        if (
            createdDate &&
            repairData.createdAt
        ) {

            try {

                createdDate.textContent =
                    repairData.createdAt
                        .toDate()
                        .toLocaleString(
                            "en-GB",
                            {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true
                            }
                        );

            }

            catch (error) {

                console.error(
                    "Date error:",
                    error
                );


                createdDate.textContent =
                    "-";

            }

        }

        else if (createdDate) {

            createdDate.textContent =
                "-";

        }


        // ======================================
        // VEHICLE NUMBER
        // ======================================

        const vehicleNumber =
            document.getElementById(
                "vehicleNumber"
            );


        if (vehicleNumber) {

            vehicleNumber.value =
                repairData.vehicleNumber || "";

        }


        // ======================================
        // ADVISOR NAME
        // ======================================

        const advisorName =
            document.getElementById(
                "advisorName"
            );


        if (advisorName) {

            advisorName.value =
                repairData.advisorName || "";

        }


        // ======================================
        // GET CURRENT RO ITEMS
        // ======================================

        if (
            Array.isArray(
                repairData.itemCodes
            )
        ) {

            currentItemCodes =
                repairData.itemCodes.map(
                    code =>
                        String(code).trim()
                );

        }

        else if (
            repairData.itemCode !== undefined &&
            repairData.itemCode !== null
        ) {

            currentItemCodes = [
                String(
                    repairData.itemCode
                ).trim()
            ];

        }

        else {

            currentItemCodes = [];

        }


        console.log(
            "Current RO Items:",
            currentItemCodes
        );


        // ======================================
        // LOAD ITEMS FOR VIEW MODE
        // ======================================

        await loadViewItems(
            currentItemCodes
        );

    }

    catch (error) {

        console.error(
            "Load Repair Order error:",
            error
        );


        alert(
            "Unable to load Repair Order."
        );

    }

}


// ==========================================
// DISPLAY BILLING AMOUNT
// ==========================================
//
// Billing is hidden from Leader.
//
// Function kept only for compatibility.
// ==========================================

function displayBillingAmount(amount) {

    console.log(
        "Billing calculated internally:",
        amount
    );

}


// ==========================================
// LOAD ITEMS FOR VIEW MODE
// ==========================================

async function loadViewItems(
    selectedItems
) {

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


    container.innerHTML =
        "";


    if (
        !Array.isArray(
            selectedItems
        ) ||
        selectedItems.length === 0
    ) {

        container.innerHTML = `
            <p>
                No item codes selected for this Repair Order.
            </p>
        `;

        return;

    }


    for (
        const itemCode of selectedItems
    ) {

        try {

            const itemDoc =
                await findItemDocument(
                    itemCode
                );


            const itemDiv =
                document.createElement(
                    "div"
                );


            itemDiv.className =
                "item-option";


            // ==================================
            // ITEM NOT FOUND
            // ==================================

            if (!itemDoc) {

                itemDiv.innerHTML = `

                    <label class="item-checkbox">

                        <input
                            type="checkbox"
                            name="itemCode"
                            value="${escapeHTML(itemCode)}"
                            checked
                            disabled
                        >

                        <span>

                            <strong>
                                ${escapeHTML(itemCode)}
                            </strong>

                            - Item details unavailable

                        </span>

                    </label>

                `;


                container.appendChild(
                    itemDiv
                );


                continue;

            }


            const item =
                itemDoc.data();


            const actualItemCode =
                String(
                    item.itemCode ??
                    itemCode
                ).trim();


            const description =
                item.description ||
                "-";


            // ==================================
            // DISPLAY ITEM
            // ==================================
            //
            // Billing is intentionally NOT shown.
            //
            // ==================================

            itemDiv.innerHTML = `

                <label class="item-checkbox">

                    <input
                        type="checkbox"
                        name="itemCode"
                        value="${escapeHTML(actualItemCode)}"
                        checked
                        disabled
                    >

                    <span>

                        <strong>
                            ${escapeHTML(actualItemCode)}
                        </strong>

                        -
                        ${escapeHTML(description)}

                    </span>

                </label>

            `;


            container.appendChild(
                itemDiv
            );


            console.log(
                "Displayed view item:",
                actualItemCode
            );

        }

        catch (error) {

            console.error(
                "Error loading item:",
                itemCode,
                error
            );

        }

    }

}


// ==========================================
// ENABLE EDIT
// ==========================================

async function enableEdit() {

    if (
        isEditMode
    ) {

        return;

    }


    try {

        // ======================================
        // ENTER EDIT MODE
        // ======================================

        isEditMode =
            true;


        // ======================================
        // ENABLE VEHICLE NUMBER
        // ======================================

        const vehicleNumber =
            document.getElementById(
                "vehicleNumber"
            );


        if (vehicleNumber) {

            vehicleNumber.disabled =
                false;

        }


        // ======================================
        // ENABLE ADVISOR NAME
        // ======================================

        const advisorName =
            document.getElementById(
                "advisorName"
            );


        if (advisorName) {

            advisorName.disabled =
                false;

        }


        // ======================================
        // LOAD LEADER ASSIGNED ITEMS
        // ======================================

        await loadAssignedItemsForEdit();


        // ======================================
        // SHOW UPDATE BUTTON
        // ======================================

        const updateBtn =
            document.getElementById(
                "updateBtn"
            );


        if (updateBtn) {

            updateBtn.style.display =
                "inline-block";

        }


        // ======================================
        // HIDE EDIT BUTTON
        // ======================================

        const editBtn =
            document.querySelector(
                ".edit-btn"
            );


        if (editBtn) {

            editBtn.style.display =
                "none";

        }

    }

    catch (error) {

        console.error(
            "Enable edit error:",
            error
        );


        alert(
            "Unable to enable edit mode."
        );


        isEditMode =
            false;

    }

}


// ==========================================
// LOAD LEADER ASSIGNED ITEMS FOR EDIT
// ==========================================

async function loadAssignedItemsForEdit() {

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


    container.innerHTML =
        "<p>Loading assigned items...</p>";


    try {

        // ======================================
        // GET CURRENT USER
        // ======================================

        const user =
            auth.currentUser;


        if (!user) {

            throw new Error(
                "Leader is not logged in."
            );

        }


        currentLeaderUid =
            user.uid;


        console.log(
            "Loading assignments for leader:",
            currentLeaderUid
        );


        // ======================================
        // GET ACTIVE ASSIGNMENTS
        // ======================================

        const assignmentSnapshot =
            await db.collection(
                "leaderItemAssignments"
            )
            .where(
                "leaderUid",
                "==",
                currentLeaderUid
            )
            .where(
                "active",
                "==",
                true
            )
            .get();


        console.log(
            "Assignment documents found:",
            assignmentSnapshot.size
        );


        // ======================================
        // NO ASSIGNMENTS
        // ======================================

        if (
            assignmentSnapshot.empty
        ) {

            container.innerHTML = `
                <p>
                    No items have been assigned to you.
                </p>
            `;

            return;

        }


        // ======================================
        // CLEAR ASSIGNMENT MAP
        // ======================================

        assignedItemMap =
            {};


        // ======================================
        // STORE ASSIGNED CODES
        // ======================================

        assignmentSnapshot.forEach(
            (doc) => {

                const data =
                    doc.data();


                console.log(
                    "Assignment:",
                    doc.id,
                    data
                );


                if (
                    data.itemCode !== undefined &&
                    data.itemCode !== null
                ) {

                    const code =
                        String(
                            data.itemCode
                        ).trim();


                    assignedItemMap[
                        code
                    ] = true;

                }

            }
        );


        const assignedCodes =
            Object.keys(
                assignedItemMap
            )
            .sort(
                (a, b) => {

                    const numA =
                        Number(a);

                    const numB =
                        Number(b);


                    if (
                        !Number.isNaN(numA) &&
                        !Number.isNaN(numB)
                    ) {

                        return numA - numB;

                    }


                    return a.localeCompare(b);

                }
            );


        console.log(
            "Leader assigned item codes:",
            assignedCodes
        );


        // ======================================
        // NO VALID CODES
        // ======================================

        if (
            assignedCodes.length === 0
        ) {

            container.innerHTML = `
                <p>
                    No valid item codes found in your assignments.
                </p>
            `;

            return;

        }


        // ======================================
        // CLEAR OLD VIEW ITEMS
        // ======================================

        container.innerHTML =
            "";


        // ======================================
        // LOAD EACH ASSIGNED ITEM
        // ======================================

        for (
            const assignedCode of assignedCodes
        ) {

            try {

                const itemDoc =
                    await findItemDocument(
                        assignedCode
                    );


                // ==================================
                // ITEM NOT FOUND
                // ==================================

                if (!itemDoc) {

                    console.warn(
                        "Assigned item not found:",
                        assignedCode
                    );

                    continue;

                }


                const item =
                    itemDoc.data();


                const actualItemCode =
                    String(
                        item.itemCode ??
                        assignedCode
                    ).trim();


                const description =
                    item.description ||
                    "-";


                // ==================================
                // CHECK IF ALREADY IN CURRENT RO
                // ==================================

                const isSelected =
                    currentItemCodes
                        .map(
                            code =>
                                String(
                                    code
                                ).trim()
                        )
                        .includes(
                            actualItemCode
                        );


                // ==================================
                // CREATE ITEM DIV
                // ==================================

                const itemDiv =
                    document.createElement(
                        "div"
                    );


                itemDiv.className =
                    "item-option";


                itemDiv.innerHTML = `

                    <label class="item-checkbox">

                        <input
                            type="checkbox"
                            name="itemCode"
                            value="${escapeHTML(actualItemCode)}"
                            ${isSelected ? "checked" : ""}
                            onchange="recalculateBilling()"
                        >

                        <span>

                            <strong>
                                ${escapeHTML(actualItemCode)}
                            </strong>

                            -
                            ${escapeHTML(description)}

                        </span>

                    </label>

                `;


                container.appendChild(
                    itemDiv
                );


                console.log(
                    "Displayed assigned item:",
                    actualItemCode,
                    "Selected:",
                    isSelected
                );

            }

            catch (error) {

                console.error(
                    "Error loading assigned item:",
                    assignedCode,
                    error
                );

            }

        }


        // ======================================
        // CHECK WHETHER ITEMS WERE DISPLAYED
        // ======================================

        if (
            container.children.length === 0
        ) {

            container.innerHTML = `
                <p>
                    Assigned items could not be loaded.
                </p>
            `;

            return;

        }


        // ======================================
        // RECALCULATE BILLING INTERNALLY
        // ======================================

        await recalculateBilling();


        console.log(
            "Assigned items loaded successfully."
        );

    }

    catch (error) {

        console.error(
            "Load assigned items error:",
            error
        );


        container.innerHTML = `
            <p>
                Unable to load assigned items.
            </p>
        `;


        throw error;

    }

}


// ==========================================
// RECALCULATE BILLING
// ==========================================
//
// Billing is calculated internally only.
// Nothing is displayed to Leader.
// ==========================================

async function recalculateBilling() {

    if (
        !isEditMode
    ) {

        return 0;

    }


    const selectedItems =
        Array.from(
            document.querySelectorAll(
                'input[name="itemCode"]:checked'
            )
        )
        .map(
            checkbox =>
                String(
                    checkbox.value
                ).trim()
        );


    let total =
        0;


    for (
        const itemCode of selectedItems
    ) {

        // ======================================
        // VERIFY ASSIGNMENT
        // ======================================

        if (
            !assignedItemMap[itemCode]
        ) {

            console.warn(
                "Unauthorized item:",
                itemCode
            );

            continue;

        }


        try {

            const itemDoc =
                await findItemDocument(
                    itemCode
                );


            if (
                itemDoc
            ) {

                const item =
                    itemDoc.data();


                total +=
                    Number(
                        item.billingAmount
                    ) || 0;

            }

        }

        catch (error) {

            console.error(
                "Billing calculation error:",
                itemCode,
                error
            );

        }

    }


    // ======================================
    // BILLING IS NOT DISPLAYED
    // ======================================

    console.log(
        "Internal Billing Total:",
        total
    );


    return total;

}


// ==========================================
// UPDATE REPAIR ORDER
// ==========================================

async function updateRO() {

    if (
        !isEditMode
    ) {

        return;

    }


    try {

        // ======================================
        // VEHICLE NUMBER
        // ======================================

        const vehicleElement =
            document.getElementById(
                "vehicleNumber"
            );


        const vehicleNumber =
            vehicleElement
                ? vehicleElement.value
                    .trim()
                    .toUpperCase()
                : "";


        // ======================================
        // ADVISOR NAME
        // ======================================

        const advisorElement =
            document.getElementById(
                "advisorName"
            );


        const advisorName =
            advisorElement
                ? advisorElement.value
                    .trim()
                    .toUpperCase()
                : "";


        // ======================================
        // SELECTED ITEMS
        // ======================================

        const selectedItems =
            Array.from(
                document.querySelectorAll(
                    'input[name="itemCode"]:checked'
                )
            )
            .map(
                checkbox =>
                    String(
                        checkbox.value
                    ).trim()
            );


        console.log(
            "Selected Items:",
            selectedItems
        );


        // ======================================
        // VALIDATION
        // ======================================

        if (
            !vehicleNumber
        ) {

            alert(
                "Please enter Vehicle Number."
            );

            return;

        }


        if (
            !advisorName
        ) {

            alert(
                "Please enter Advisor Name."
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
        // VERIFY ALL ITEMS ARE ASSIGNED
        // ======================================

        for (
            const itemCode of selectedItems
        ) {

            if (
                !assignedItemMap[itemCode]
            ) {

                alert(
                    "You are not authorized to use item: " +
                    itemCode
                );

                return;

            }

        }


        // ======================================
        // ADVISOR VALIDATION
        // ======================================

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


        // ======================================
        // CALCULATE BILLING
        // ======================================

        let billingAmount =
            0;


        // ======================================
        // CREATE ITEM DETAILS
        // ======================================

        const updatedItemDetails =
            [];


        for (
            const itemCode of selectedItems
        ) {

            const itemDoc =
                await findItemDocument(
                    itemCode
                );


            if (!itemDoc) {

                alert(
                    "Item details not found for item: " +
                    itemCode
                );

                return;

            }


            const itemData =
                itemDoc.data();


            const actualItemCode =
                String(
                    itemData.itemCode ??
                    itemCode
                ).trim();


            const description =
                itemData.description ||
                "-";


            const itemBilling =
                Number(
                    itemData.billingAmount
                ) || 0;


            // ==================================
            // CALCULATE TOTAL
            // ==================================

            billingAmount +=
                itemBilling;


            // ==================================
            // STORE ITEM DETAILS
            // ==================================
            //
            // Billing is stored for Admin,
            // but not displayed to Leader.
            //
            // ==================================

            updatedItemDetails.push({

                itemCode:
                    actualItemCode,

                description:
                    description,

                billingAmount:
                    itemBilling

            });

        }


        console.log(
            "New Billing Amount:",
            billingAmount
        );


        console.log(
            "Updated Item Details:",
            updatedItemDetails
        );


        // ======================================
        // UPDATE FIRESTORE
        // ======================================

        await db.collection(
            "repairorders"
        )
        .doc(roId)
        .update({

            vehicleNumber:
                vehicleNumber,

            advisorName:
                advisorName,

            itemCodes:
                selectedItems,

            itemDetails:
                updatedItemDetails,

            billingAmount:
                billingAmount

        });


        // ======================================
        // SUCCESS
        // ======================================

        alert(
            "Repair Order Updated Successfully."
        );


        // ======================================
        // EXIT EDIT MODE
        // ======================================

        isEditMode =
            false;


        // ======================================
        // RELOAD PAGE
        // ======================================

        location.reload();

    }

    catch (error) {

        console.error(
            "Update error:",
            error
        );


        alert(
            "Unable to update Repair Order: " +
            error.message
        );

    }

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(value)

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