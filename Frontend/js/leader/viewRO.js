// ==========================================
// VIEW / EDIT REPAIR ORDER
// LEADER VERSION
// ==========================================
//
// Billing amount is CALCULATED and STORED
// but NEVER DISPLAYED to the Leader.
//
// ==========================================


// ==========================================
// GLOBAL VARIABLES
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
// Supports:
//
// 1. Document ID = item code
//
// 2. itemCode field = number
//
// 3. itemCode field = string
//
// ==========================================

async function findItemDocument(itemCode) {

    const code =
        String(itemCode)
            .trim();


    if (!code) {

        return null;

    }


    // ======================================
    // METHOD 1
    // DOCUMENT ID
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
            "Document ID search failed:",
            code,
            error
        );

    }


    // ======================================
    // METHOD 2
    // itemCode = NUMBER
    // ======================================

    const numericCode =
        Number(code);


    if (
        !Number.isNaN(numericCode)
    ) {

        try {

            const numberSnapshot =
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
                !numberSnapshot.empty
            ) {

                console.log(
                    "Item found as number:",
                    numericCode
                );


                return numberSnapshot.docs[0];

            }

        }

        catch (error) {

            console.warn(
                "Numeric itemCode search failed:",
                numericCode,
                error
            );

        }

    }


    // ======================================
    // METHOD 3
    // itemCode = STRING
    // ======================================

    try {

        const stringSnapshot =
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
            !stringSnapshot.empty
        ) {

            console.log(
                "Item found as string:",
                code
            );


            return stringSnapshot.docs[0];

        }

    }

    catch (error) {

        console.warn(
            "String itemCode search failed:",
            code,
            error
        );

    }


    // ======================================
    // NOT FOUND
    // ======================================

    console.warn(
        "ITEM DOCUMENT NOT FOUND:",
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
        // DATE
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
        // CURRENT RO ITEM CODES
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
        // LOAD ITEMS FOR VIEW
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
// LOAD ITEMS IN VIEW MODE
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


    container.innerHTML = "";


    if (
        !Array.isArray(selectedItems) ||
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
            // Billing is NOT displayed.
            //
            // ==================================

            itemDiv.innerHTML = `

                <label class="item-checkbox">

                    <input
                        type="checkbox"
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
                "Error loading view item:",
                itemCode,
                error
            );

        }

    }

}


// ==========================================
// ENABLE EDIT MODE
// ==========================================
//
// Edit button becomes Update.
// ==========================================

async function enableEdit() {

    if (isEditMode) {

        return;

    }


    try {

        isEditMode = true;


        // ======================================
        // ENABLE VEHICLE
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
        // ENABLE ADVISOR
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
        // LOAD ASSIGNED ITEMS
        // ======================================

        await loadAssignedItemsForEdit();


        // ======================================
        // CHANGE EDIT → UPDATE
        // ======================================

        const actionBtn =
            document.getElementById(
                "actionBtn"
            );


        if (actionBtn) {

            actionBtn.textContent =
                "Update";


            actionBtn.classList.remove(
                "edit-btn"
            );


            actionBtn.classList.add(
                "save-btn"
            );


            actionBtn.onclick =
                updateRO;

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
        // CURRENT USER
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
            "Loading assignments for:",
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
            "Assignment documents:",
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
        // RESET ASSIGNED MAP
        // ======================================

        assignedItemMap =
            {};


        // ======================================
        // COLLECT ASSIGNED CODES
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


        if (
            assignedCodes.length === 0
        ) {

            container.innerHTML = `
                <p>
                    No valid item codes found.
                </p>
            `;

            return;

        }


        // ======================================
        // CLEAR VIEW ITEMS
        // ======================================

        container.innerHTML = "";


        // ======================================
        // LOAD ASSIGNED ITEMS
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
                // CHECK CURRENT RO ITEM
                // ==================================

                const normalizedCurrentCodes =
                    currentItemCodes.map(
                        code =>
                            String(code)
                                .trim()
                    );


                const isSelected =
                    normalizedCurrentCodes.includes(
                        actualItemCode
                    );


                // ==================================
                // CREATE ITEM
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
        // CHECK DISPLAYED ITEMS
        // ======================================

        if (
            container.querySelectorAll(
                'input[name="itemCode"]'
            ).length === 0
        ) {

            container.innerHTML = `
                <p>
                    Assigned items could not be loaded.
                </p>
            `;

            console.error(
                "No assigned item documents could be found."
            );

            return;

        }


        // ======================================
        // CALCULATE BILLING
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
// Billing is calculated internally.
// It is NOT displayed.
//
// ==========================================

async function recalculateBilling() {

    if (!isEditMode) {

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


    let total = 0;


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


            if (itemDoc) {

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

    if (!isEditMode) {

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
            "Selected items:",
            selectedItems
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


        if (
            selectedItems.length === 0
        ) {

            alert(
                "Please select at least one item."
            );

            return;

        }


        // ======================================
        // VERIFY ASSIGNMENTS
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

        let billingAmount = 0;


        const updatedItemDetails = [];


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
            // BILLING CALCULATION
            // ==================================

            billingAmount +=
                itemBilling;


            // ==================================
            // STORE ITEM DETAILS
            // ==================================
            //
            // Admin can use this.
            //
            // Leader does NOT display it.
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

function escapeHTML(value) {

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