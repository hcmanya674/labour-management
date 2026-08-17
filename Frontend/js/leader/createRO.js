// ==========================================
// CREATE REPAIR ORDER
// ==========================================

let leaderData = {};
let isSaving = false;

// ==========================================
// LOAD LOGGED-IN LEADER
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    auth.onAuthStateChanged(async (user) => {

        if (!user) {
            location = "../pages/auth/loginindex.html";
            return;
        }

        try {

            const doc = await db.collection("users")
                .doc(user.uid)
                .get();

            if (!doc.exists) {

                alert("Leader record not found.");
                return;

            }

            leaderData = doc.data();

            document.getElementById("leaderName").value =
                leaderData.name;

            // Load region
            loadRegion();

            // Load item codes
            loadItems();

        } catch (error) {

            console.error("Error loading leader:", error);

        }

    });

});


// ==========================================
// Load Region
// ==========================================

function loadRegion() {

    console.log("Leader Region ID:", leaderData.region);

    db.collection("regions")
    .doc(leaderData.region)
    .get()
    .then((doc) => {

        console.log("Region Exists:", doc.exists);

        if (!doc.exists) return;

        console.log(doc.data());

        document.getElementById("region").value =
            doc.data().regionName;

    });

}
// ========================================================
// LOAD ONLY ITEMS ASSIGNED TO THIS LEADER
// ========================================================

async function loadItems() {

    const container =
        document.getElementById("itemCodeContainer");

    if (!container) {

        console.error(
            "itemCodeContainer not found."
        );

        return;
    }

    container.innerHTML =
        "Loading assigned items...";

    try {

        // =================================================
        // CURRENT LEADER UID
        // =================================================

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


        // =================================================
        // GET ACTIVE ASSIGNMENTS
        // =================================================

        const assignmentSnapshot =
            await db.collection("leaderItemAssignments")
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


        // =================================================
        // GET ASSIGNED ITEM CODES
        // =================================================

        const assignedItemCodes = [];

        assignmentSnapshot.forEach(doc => {

            const data =
                doc.data();

            if (data.itemCode) {

                assignedItemCodes.push(
                    data.itemCode
                );

            }

        });


        console.log(
            "Assigned Item Codes:",
            assignedItemCodes
        );


        // =================================================
        // NO ASSIGNED ITEMS
        // =================================================

        if (
            assignedItemCodes.length === 0
        ) {

            container.innerHTML = `
                <p style="color:red;">
                    No items have been assigned to you.
                    Please contact Admin.
                </p>
            `;

            return;
        }


        // =================================================
        // LOAD ACTIVE ITEM DETAILS
        // =================================================

        const itemSnapshot =
            await db.collection("itemcodes")
                .where(
                    "active",
                    "==",
                    true
                )
                .get();


        container.innerHTML = "";

        let assignedCount = 0;


        // =================================================
        // DISPLAY ONLY ASSIGNED ITEMS
        // =================================================

        itemSnapshot.forEach(doc => {

            const data =
                doc.data();


            const itemCode =
                data.itemCode || doc.id;


            // ---------------------------------------------
            // Only show items assigned to this leader
            // ---------------------------------------------

            if (
                !assignedItemCodes.includes(itemCode)
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


            const itemDiv =
                document.createElement("div");


            itemDiv.className =
                "item-option";


            itemDiv.innerHTML = `

                <label class="item-checkbox">

                    <input
                        type="checkbox"
                        name="itemCode"
                        value="${itemCode}"
                        data-cost="${cost}"
                        data-description="${description
                            .replace(/"/g, "&quot;")}"
                        onchange="calculateBillingAmount()"
                    >

                    <span>

                        ${itemCode}
                        -
                        ${description}

                        <strong>
                            ₹${cost.toLocaleString("en-IN")}
                        </strong>

                    </span>

                </label>

            `;


            container.appendChild(
                itemDiv
            );

        });


        // =================================================
        // ASSIGNED ITEMS NOT FOUND
        // =================================================

        if (
            assignedCount === 0
        ) {

            container.innerHTML = `
                <p style="color:red;">
                    Assigned items could not be found
                    in the itemcodes collection.
                </p>
            `;

            console.error(
                "Assignments exist, but matching itemcodes were not found.",
                assignedItemCodes
            );

            return;
        }


        // =================================================
        // INITIAL BILLING
        // =================================================

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

    selectedItems.forEach(checkbox => {

        const cost =
            Number(
                checkbox.dataset.cost
            ) || 0;

        total += cost;

    });

    const totalElement =
        document.getElementById(
            "totalBillingAmount"
        );

    if (totalElement) {

        totalElement.textContent =
            "₹" +
            total.toLocaleString(
                "en-IN",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );

    }

}
// ==========================================
// SAVE REPAIR ORDER
// ==========================================

async function saveRO() {

    const saveBtn = document.getElementById("saveBtn");

    // ------------------------------------------
    // Get values
    // ------------------------------------------

    const roNumber =
        document.getElementById("roNumber")
        .value
        .trim()
        .toUpperCase();

    const vehicleNumber =
        document.getElementById("vehicleNumber")
        .value
        .trim()
        .toUpperCase();

    const advisorName =
        document.getElementById("advisorName")
        .value
        .trim()
        .toUpperCase();

    // ------------------------------------------
    // Get selected item codes
    // ------------------------------------------

const selectedCheckboxes =
    Array.from(
        document.querySelectorAll(
            'input[name="itemCode"]:checked'
        )
    );

const selectedItems =
    selectedCheckboxes.map(
        checkbox => checkbox.value
    );


// ==========================================
// ITEM DETAILS SNAPSHOT
// ==========================================

const itemDetails =
    selectedCheckboxes.map(checkbox => {

        return {

            itemCode:
                checkbox.value,

            description:
                checkbox.dataset.description || "",

            billingAmount:
                Number(
                    checkbox.dataset.cost
                ) || 0

        };

    });

console.log(
    "Selected Item Details:",
    itemDetails
);
   // ==========================================
   // CALCULATE BILLING AMOUNT
   // ==========================================

let billingAmount = 0;

document
    .querySelectorAll(
        'input[name="itemCode"]:checked'
    )
    .forEach(checkbox => {

        billingAmount +=
            Number(
                checkbox.dataset.cost
            ) || 0;

    });

console.log(
    "Billing Amount:",
    billingAmount
);
    // ------------------------------------------
    // Validation
    // ------------------------------------------

    if (!roNumber) {

        alert("Please enter RO Number.");
        return;

    }

    if (!vehicleNumber) {

        alert("Please enter Vehicle Number.");
        return;

    }

    if (!advisorName) {

        alert("Please enter Advisor Name.");
        return;

    }

    // Advisor name validation

    const namePattern =
        /^[A-Za-z]+(?: [A-Za-z]+)*$/;

    if (!namePattern.test(advisorName)) {

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


    
    // ------------------------------------------
    // Item validation
    // ------------------------------------------

    if (selectedItems.length === 0) {

    alert("Please select at least one item.");

    saveBtn.disabled = false;
    saveBtn.innerHTML = "Save Repair Order";

    return;

}

    // ------------------------------------------
    // Disable button
    // ------------------------------------------

    saveBtn.disabled = true;
    saveBtn.innerHTML = "Saving...";

    try {

        // --------------------------------------
        // Create date
        // --------------------------------------

        const now = new Date();

        const yyyy = now.getFullYear();

        const months = [
            "Jan","Feb","Mar","Apr",
            "May","Jun","Jul","Aug",
            "Sep","Oct","Nov","Dec"
        ];

        const dd =
            String(now.getDate()).padStart(2, "0");

        const displayDate =
            dd + "-" +
            months[now.getMonth()] +
            "-" +
            yyyy;

        // --------------------------------------
        // Document ID
        // --------------------------------------

        const documentId =
            displayDate + " | " + roNumber;

        // --------------------------------------
        // Check duplicate RO Number
        // --------------------------------------

        const existing =
            await db.collection("repairorders")
            .where("roNumber", "==", roNumber)
            .get();

        if (!existing.empty) {

            alert("RO Number already exists.");

            return;

        }

        // --------------------------------------
        // Save Repair Order
        // --------------------------------------

        await db.collection("repairorders")
        .doc(documentId)
        .set({

            roNumber: roNumber,

            documentId: documentId,

            leaderUid: uid,

            leaderName: leaderData.name,

            region: leaderData.region,

            advisorName: advisorName,

            vehicleNumber: vehicleNumber,

            itemCodes: selectedItems,

            itemDetails: itemDetails,

            // Total billing calculated at RO creation
            billingAmount: billingAmount,

            status: "Pending",

            createdAt:
                firebase.firestore.FieldValue
                .serverTimestamp()

        });

        // --------------------------------------
        // Success
        // --------------------------------------

        alert(
            "Repair Order Saved Successfully"
        );

        // Clear fields

        document.getElementById("roNumber").value = "";

        document.getElementById("vehicleNumber").value = "";

        document.getElementById("advisorName").value = "";
  
        // Uncheck all items

        document
        .querySelectorAll(
            'input[name="itemCode"]'
        )
        .forEach(checkbox => {

            checkbox.checked = false;

        });

        // Reset billing display

        document.getElementById(
            "totalBillingAmount"
        ).textContent = "₹0.00";

    }

    catch (error) {

        console.error(
            "Error saving repair order:",
            error
        );

        alert(
            "Unable to save Repair Order: " +
            error.message
        );

    }

    finally {

        saveBtn.disabled = false;

        saveBtn.innerHTML =
            "Save Repair Order";

    }

}