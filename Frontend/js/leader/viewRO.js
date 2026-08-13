// ==========================================
// VIEW REPAIR ORDER
// ==========================================

const roId = localStorage.getItem("currentRO");

let currentItemCodes = [];


// ==========================================
// CHECK RO ID
// ==========================================

if (!roId) {

    alert("Repair Order not selected.");

    history.back();

}


// ==========================================
// LOAD REPAIR ORDER
// ==========================================

db.collection("repairorders")
    .doc(roId)
    .get()

    .then((doc) => {

        if (!doc.exists) {

            alert("Repair Order not found.");

            return;

        }

        const repairData = doc.data();

        console.log(
            "Repair Order:",
            repairData
        );


        // ======================================
        // RO NUMBER
        // ======================================

        document.getElementById("roNumber").innerHTML =
            repairData.roNumber || "-";


        // ======================================
        // DATE & TIME
        // ======================================

        if (repairData.createdAt) {

            try {

                document.getElementById("createdDate").innerHTML =
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

                document.getElementById(
                    "createdDate"
                ).innerHTML = "-";

            }

        }

        else {

            document.getElementById(
                "createdDate"
            ).innerHTML = "-";

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
        // =================================================
        // BILLING AMOUNT
        // =================================================

        const billingAmount =
            Number(
                repairData.billingAmount || 0
            );

        const billingElement =
            document.getElementById(
                "billingAmount"
            );

        if (billingElement) {

            billingElement.value =
                "₹" +
                billingAmount.toLocaleString(
                    "en-IN",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                );

        }
           
        // ======================================
        // GET ITEM CODES
        // ======================================

        if (
            Array.isArray(
                repairData.itemCodes
            )
        ) {

            // New records
            currentItemCodes =
                repairData.itemCodes;

        }

        else if (
            repairData.itemCode
        ) {

            // Old records
            currentItemCodes = [
                repairData.itemCode
            ];

        }

        else {

            currentItemCodes = [];

        }


        // ======================================
        // LOAD ITEMS
        // ======================================

        loadItems(currentItemCodes);

    })

    .catch((error) => {

        console.error(error);

        alert(
            "Unable to load Repair Order."
        );

    });


// ==========================================
// LOAD ITEM CODES
// ==========================================

async function loadItems(selectedItems) {

    try {

        const snapshot =
            await db.collection("itemcodes")
                .where(
                    "active",
                    "==",
                    true
                )
                .get();


        const container =
            document.getElementById(
                "itemCodeContainer"
            );


        container.innerHTML = "";


        // ======================================
        // NO ITEMS
        // ======================================

        if (snapshot.empty) {

            container.innerHTML =
                "<p>No item codes available.</p>";

            return;

        }


        // ======================================
        // CREATE CHECKBOXES
        // ======================================

        snapshot.forEach((doc) => {

            const item = doc.data();

            const isSelected =
                selectedItems.includes(
                    item.itemCode
                );


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
                        value="${item.itemCode}"
                        ${isSelected ? "checked" : ""}
                        disabled>

                    <span>

                        ${item.itemCode}
                        -
                        ${item.description || ""}

                    </span>

                </label>

            `;


            container.appendChild(
                itemDiv
            );

        });

    }

    catch (error) {

        console.error(
            "Error loading item codes:",
            error
        );

    }

}


// ==========================================
// ENABLE EDIT
// ==========================================

function enableEdit() {

    document.getElementById(
        "vehicleNumber"
    ).disabled = false;


    document.getElementById(
        "advisorName"
    ).disabled = false;


    // Enable all item checkboxes

    document
        .querySelectorAll(
            'input[name="itemCode"]'
        )
        .forEach(
            checkbox => {

                checkbox.disabled = false;

            }
        );


    // Show update button

    document.getElementById(
        "updateBtn"
    ).style.display =
        "inline-block";


    // Hide Edit button

    document.querySelector(
        ".edit-btn"
    ).style.display =
        "none";

}


// ==========================================
// UPDATE REPAIR ORDER
// ==========================================

async function updateRO() {

    const vehicleNumber =
        document.getElementById(
            "vehicleNumber"
        )
        .value
        .trim()
        .toUpperCase();


    const advisorName =
        document.getElementById(
            "advisorName"
        )
        .value
        .trim()
        .toUpperCase();


    // ======================================
    // GET SELECTED ITEMS
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


    if (selectedItems.length === 0) {

        alert(
            "Please select at least one item."
        );

        return;

    }


    // ======================================
    // ADVISOR NAME VALIDATION
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


    if (advisorName.length < 3) {

        alert(
            "Advisor name must contain at least 3 characters."
        );

        return;

    }


    if (advisorName.length > 30) {

        alert(
            "Advisor name cannot exceed 30 characters."
        );

        return;

    }

    // ======================================
    // CALCULATE BILLING AMOUNT
    // ======================================

    let billingAmount = 0;


    try {

        for (const itemCode of selectedItems) {

            const itemDoc =
                await db.collection("itemcodes")
                .doc(itemCode)
                .get();


            if (itemDoc.exists) {

                const itemData =
                    itemDoc.data();

                const itemCost =
                    Number(itemData.billingAmount) || 0;

                billingAmount += itemCost;

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