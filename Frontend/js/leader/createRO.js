// ==========================================
// CREATE REPAIR ORDER
// ==========================================

// uid comes from leader-common.js
let leaderData = {};

let isSaving = false;

// Load logged-in leader
auth.onAuthStateChanged(async (user) => {

    if (!user) {
        location = "../pages/auth/loginindex.html";
        return;
    }

    const doc = await db.collection("users")
        .doc(user.uid)
        .get();

    if (!doc.exists) {
        alert("Leader record not found.");
        return;
    }

    leaderData = doc.data();

    document.getElementById("leaderName").value = leaderData.name;

    loadRegion();

    loadItems();

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

// ==========================================
// Load Item Codes
// ==========================================

function loadItems() {

    const container =
        document.getElementById("itemCodeContainer");

    container.innerHTML = "Loading items...";

    db.collection("itemcodes")
        .where("active", "==", true)
        .get()
        .then((snapshot) => {

            container.innerHTML = "";

            snapshot.forEach((doc) => {

                const data = doc.data();

                const itemDiv =
                    document.createElement("div");

                itemDiv.className = "item-option";

                itemDiv.innerHTML = `

                    <label>

                        <input
                            type="checkbox"
                            name="itemCode"
                            value="${data.itemCode}">

                        <span>
                            ${data.itemCode} - ${data.description}
                        </span>

                    </label>

                `;

                container.appendChild(itemDiv);

            });

        })
        .catch((error) => {

            console.error("Error loading items:", error);

            container.innerHTML =
                "Unable to load items.";

        });

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

    const selectedItems =
        Array.from(
            document.querySelectorAll(
                'input[name="itemCode"]:checked'
            )
        ).map(
            checkbox => checkbox.value
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

            // MULTIPLE ITEM CODES
            itemCodes: selectedItems,

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