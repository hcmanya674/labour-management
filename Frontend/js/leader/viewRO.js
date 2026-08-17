// ==========================================
// VIEW / EDIT REPAIR ORDER
// ==========================================

const roId = localStorage.getItem("currentRO");

let currentItemCodes = [];

let currentLeaderUid = null;

let assignedItemMap = {};

let isEditMode = false;


// ==========================================
// CHECK RO ID
// ==========================================

if (!roId) {

    alert("Repair Order not selected.");

    history.back();

}


// ==========================================
// WAIT FOR LOGIN
// ==========================================

auth.onAuthStateChanged(async (user) => {

    if (!user) {

        alert("Please login first.");

        window.location.href =
            "../../pages/auth/loginindex.html";

        return;

    }

    currentLeaderUid = user.uid;

    console.log(
        "Logged-in Leader UID:",
        currentLeaderUid
    );

    await loadRepairOrder();

});


// ==========================================
// LOAD REPAIR ORDER
// ==========================================

async function loadRepairOrder() {

    try {

        const doc =
            await db.collection("repairorders")
                .doc(roId)
                .get();


        if (!doc.exists) {

            alert("Repair Order not found.");

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
            document.getElementById("roNumber");

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

        document.getElementById(
            "vehicleNumber"
        ).value =
            repairData.vehicleNumber || "";


        // ======================================
        // ADVISOR NAME
        // ======================================

        document.getElementById(
            "advisorName"
        ).value =
            repairData.advisorName || "";


        // ======================================
        // GET CURRENT RO ITEMS
        // ======================================

        if (
            Array.isArray(
                repairData.itemCodes
            )
        ) {

            currentItemCodes =
                [...repairData.itemCodes];

        }

        else if (
            repairData.itemCode
        ) {

            currentItemCodes = [
                repairData.itemCode
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
        // DISPLAY BILLING
        // ======================================

        displayBillingAmount(
            Number(
                repairData.billingAmount || 0
            )
        );


        // ======================================
        // VIEW MODE
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

function displayBillingAmount(amount) {

    const billingElement =
        document.getElementById(
            "billingAmount"
        );


    if (!billingElement) {

        return;

    }


    billingElement.value =
        "₹" +
        Number(amount || 0)
            .toLocaleString(
                "en-IN",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
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
                await db.collection("itemcodes")
                    .doc(itemCode)
                    .get();


            const itemDiv =
                document.createElement(
                    "div"
                );


            itemDiv.className =
                "item-option";


            // ==================================
            // ITEM DOCUMENT NOT FOUND
            // ==================================

            if (!itemDoc.exists) {

                itemDiv.innerHTML = `

                    <label class="item-checkbox">

                        <input
                            type="checkbox"
                            name="itemCode"
                            value="${itemCode}"
                            checked
                            disabled
                        >

                        <span>
                            ${itemCode}
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
                item.itemCode ||
                itemCode;


            const description =
                item.description || "-";


            const billingAmount =
                Number(
                    item.billingAmount
                ) || 0;


            itemDiv.innerHTML = `

                <label class="item-checkbox">

                    <input
                        type="checkbox"
                        name="itemCode"
                        value="${actualItemCode}"
                        checked
                        disabled
                    >

                    <span>

                        <strong>
                            ${actualItemCode}
                        </strong>

                        -
                        ${description}

                        <span>
                            ₹${billingAmount.toLocaleString("en-IN")}
                        </span>

                    </span>

                </label>

            `;


            container.appendChild(
                itemDiv
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

    if (isEditMode) {

        return;

    }


    try {

        isEditMode = true;


        // ======================================
        // ENABLE VEHICLE
        // ======================================

        document.getElementById(
            "vehicleNumber"
        ).disabled = false;


        // ======================================
        // ENABLE ADVISOR
        // ======================================

        document.getElementById(
            "advisorName"
        ).disabled = false;


        // ======================================
        // LOAD ADMIN-ASSIGNED ITEMS
        // ======================================

        await loadAssignedItemsForEdit();


        // ======================================
        // SHOW UPDATE BUTTON
        // ======================================

        document.getElementById(
            "updateBtn"
        ).style.display =
            "inline-block";


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

        isEditMode = false;

    }

}


// ==========================================
// LOAD LEADER ASSIGNED ITEMS
// ==========================================

async function loadAssignedItemsForEdit() {

    const container =
        document.getElementById(
            "itemCodeContainer"
        );


    container.innerHTML =
        "<p>Loading assigned items...</p>";


    try {

        // ======================================
        // GET CURRENT LEADER
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
        // CLEAR MAP
        // ======================================

        assignedItemMap = {};


        // ======================================
        // STORE ASSIGNED ITEM CODES
        // ======================================

        assignmentSnapshot.forEach(
            (doc) => {

                const data =
                    doc.data();


                if (
                    data.itemCode
                ) {

                    assignedItemMap[
                        data.itemCode
                    ] = true;

                }

            }
        );


        console.log(
            "Leader assigned items:",
            Object.keys(
                assignedItemMap
            )
        );


        // ======================================
        // LOAD ITEM DETAILS
        // ======================================

        container.innerHTML = "";


        const assignedCodes =
            Object.keys(
                assignedItemMap
            ).sort();


        for (
            const itemCode of assignedCodes
        ) {

            const itemDoc =
                await db.collection(
                    "itemcodes"
                )
                .doc(itemCode)
                .get();


            if (!itemDoc.exists) {

                console.warn(
                    "Assigned item does not exist:",
                    itemCode
                );

                continue;

            }


            const item =
                itemDoc.data();


            const actualItemCode =
                item.itemCode ||
                itemCode;


            const description =
                item.description || "-";


            const billingAmount =
                Number(
                    item.billingAmount
                ) || 0;


            // ==================================
            // CHECK IF ITEM IS ALREADY IN RO
            // ==================================

            const isSelected =
                currentItemCodes.includes(
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
                        value="${actualItemCode}"
                        ${isSelected ? "checked" : ""}
                        onchange="recalculateBilling()"
                    >

                    <span>

                        <strong>
                            ${actualItemCode}
                        </strong>

                        -
                        ${description}

                        <span>
                            ₹${billingAmount.toLocaleString("en-IN")}
                        </span>

                    </span>

                </label>

            `;


            container.appendChild(
                itemDiv
            );

        }


        // ======================================
        // INITIAL BILLING
        // ======================================

        recalculateBilling();

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

async function recalculateBilling() {

    if (!isEditMode) {

        return;

    }


    const selectedItems =
        Array.from(
            document.querySelectorAll(
                'input[name="itemCode"]:checked'
            )
        )
        .map(
            checkbox =>
                checkbox.value
        );


    let total =
        0;


    for (
        const itemCode of selectedItems
    ) {

        // ======================================
        // USE ASSIGNED ITEM MAP
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
                await db.collection(
                    "itemcodes"
                )
                .doc(itemCode)
                .get();


            if (
                itemDoc.exists
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


    displayBillingAmount(
        total
    );

}


// ==========================================
// UPDATE REPAIR ORDER
// ==========================================

async function updateRO() {

    if (!isEditMode) {

        return;

    }


    // ======================================
    // VEHICLE NUMBER
    // ======================================

    const vehicleNumber =
        document.getElementById(
            "vehicleNumber"
        )
        .value
        .trim()
        .toUpperCase();


    // ======================================
    // ADVISOR NAME
    // ======================================

    const advisorName =
        document.getElementById(
            "advisorName"
        )
        .value
        .trim()
        .toUpperCase();


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
                checkbox.value
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


    try {

        for (
            const itemCode of selectedItems
        ) {

            const itemDoc =
                await db.collection(
                    "itemcodes"
                )
                .doc(itemCode)
                .get();


            if (
                itemDoc.exists
            ) {

                const itemData =
                    itemDoc.data();


                billingAmount +=
                    Number(
                        itemData.billingAmount
                    ) || 0;

            }

        }


        console.log(
            "Selected Items:",
            selectedItems
        );


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

            billingAmount:
                billingAmount

        });


        alert(
            "Repair Order Updated Successfully."
        );


        // ======================================
        // EXIT EDIT MODE
        // ======================================

        isEditMode = false;


        // ======================================
        // RELOAD
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