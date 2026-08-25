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

            const doc =
                await db
                    .collection("users")
                    .doc(user.uid)
                    .get();


            if (!doc.exists) {

                alert(
                    "Leader record not found."
                );

                return;

            }


            leaderData =
                doc.data();


            console.log(
                "Logged-in Leader:",
                leaderData
            );


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

            loadRegion();


            // ----------------------------------
            // LOAD ITEMS
            // ----------------------------------

            loadItems();

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

    });

});


// ==========================================
// LOAD REGION
// ==========================================

function loadRegion() {

    console.log(
        "Leader Region ID:",
        leaderData.region
    );


    if (!leaderData.region) {

        console.error(
            "Leader region is missing."
        );

        return;

    }


    db.collection("regions")
        .doc(leaderData.region)
        .get()

        .then((doc) => {

            console.log(
                "Region Exists:",
                doc.exists
            );


            if (!doc.exists) {

                console.error(
                    "Region document not found."
                );

                return;

            }


            console.log(
                "Region Data:",
                doc.data()
            );


            const regionInput =
                document.getElementById(
                    "region"
                );


            if (regionInput) {

                regionInput.value =
                    doc.data().regionName || "";

            }

        })

        .catch((error) => {

            console.error(
                "Error loading region:",
                error
            );

        });

}


// ========================================================
// LOAD ONLY ITEMS ASSIGNED TO THIS LEADER
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


    container.innerHTML =
        "Loading assigned items...";


    try {

        // ==========================================
        // CURRENT LEADER
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


        // ==========================================
        // GET ASSIGNED ITEM CODES
        // ==========================================

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


        // ==========================================
        // NO ITEMS
        // ==========================================

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


        // ==========================================
        // LOAD ACTIVE ITEM DETAILS
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


        container.innerHTML = "";


        let assignedCount = 0;


        // ==========================================
        // DISPLAY ASSIGNED ITEMS
        // ==========================================

        itemSnapshot.forEach(doc => {

            const data =
                doc.data();


            const itemCode =
                data.itemCode || doc.id;


            // --------------------------------------
            // ONLY ASSIGNED ITEMS
            // --------------------------------------

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


        // ==========================================
        // ASSIGNED ITEMS NOT FOUND
        // ==========================================

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
    // GET VALUES
    // ======================================

    const roNumber =
        document
            .getElementById("roNumber")
            .value
            .trim()
            .toUpperCase();


    const vehicleNumber =
        document
            .getElementById("vehicleNumber")
            .value
            .trim()
            .toUpperCase();


    const advisorName =
        document
            .getElementById("advisorName")
            .value
            .trim()
            .toUpperCase();


    // ======================================
    // GET SELECTED ITEMS
    // ======================================

    const selectedCheckboxes =
        Array.from(
            document.querySelectorAll(
                'input[name="itemCode"]:checked'
            )
        );


    const selectedItems =
        selectedCheckboxes.map(
            checkbox =>
                checkbox.value
        );


    // ======================================
    // ITEM DETAILS
    // ======================================

    const itemDetails =
        selectedCheckboxes.map(
            checkbox => {

                return {

                    itemCode:
                        checkbox.value,

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

    // IMPORTANT:
    // RO NUMBER IS OPTIONAL
    //
    // Therefore we DO NOT check:
    //
    // if (!roNumber)
    //
    // ======================================


    // --------------------------------------
    // VEHICLE NUMBER
    // --------------------------------------

    if (!vehicleNumber) {

        alert(
            "Please enter Vehicle Number."
        );

        return;

    }


    // --------------------------------------
    // ADVISOR NAME
    // --------------------------------------

    if (!advisorName) {

        alert(
            "Please enter Advisor Name."
        );

        return;

    }


    // --------------------------------------
    // ADVISOR NAME FORMAT
    // --------------------------------------

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


    // --------------------------------------
    // ITEM VALIDATION
    // --------------------------------------

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


    saveBtn.disabled =
        true;


    saveBtn.innerHTML =
        "Saving...";


    try {

        // ==================================
        // VERIFY LOGGED-IN USER
        // ==================================

        const currentUser =
            auth.currentUser;


        if (!currentUser) {

            alert(
                "User is not logged in."
            );

            return;

        }


        const leaderUid =
            currentUser.uid;


        console.log(
            "Saving RO for Leader UID:",
            leaderUid
        );


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
            months[now.getMonth()] +
            "-" +
            yyyy;


        // ==================================
        // GENERATE UNIQUE DOCUMENT ID
        // ==================================
        //
        // If RO number exists:
        //
        // 24-Aug-2026 | RO123
        //
        // If RO number is empty:
        //
        // 24-Aug-2026 | NO-RO-xxxxxxxx
        //
        // This prevents duplicate document IDs.
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
                Date.now();

        }


        console.log(
            "Document ID:",
            documentId
        );


        // ==================================
        // DUPLICATE RO CHECK
        // ==================================
        //
        // ONLY CHECK DUPLICATES IF USER
        // ENTERED AN RO NUMBER.
        //
        // Empty RO numbers are allowed.
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
            .doc(documentId)
            .set({

                // RO NUMBER CAN BE EMPTY
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

                itemCodes:
                    selectedItems,

                itemDetails:
                    itemDetails,

                billingAmount:
                    billingAmount,

                status:
                    "Pending",

                createdAt:
                    firebase.firestore
                        .FieldValue
                        .serverTimestamp()

            });


        // ==================================
        // SUCCESS
        // ==================================

        alert(
            "Repair Order Saved Successfully."
        );


        // ==================================
        // CLEAR FORM
        // ==================================

        document
            .getElementById(
                "roNumber"
            )
            .value = "";


        document
            .getElementById(
                "vehicleNumber"
            )
            .value = "";


        document
            .getElementById(
                "advisorName"
            )
            .value = "";


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

        document
            .getElementById(
                "totalBillingAmount"
            )
            .textContent =
                "₹0.00";

    }

    catch (error) {

        console.error(
            "Error saving repair order:",
            error
        );


        alert(
            "Unable to save Repair Order:\n" +
            error.message
        );

    }

    finally {

        isSaving =
            false;


        saveBtn.disabled =
            false;


        saveBtn.innerHTML =
            "Save Repair Order";

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

            // --------------------------------
            // Remove stored login
            // --------------------------------

            localStorage.removeItem(
                "uid"
            );


            localStorage.removeItem(
                "labourAppInstalled"
            );


            // --------------------------------
            // Go to login
            // --------------------------------

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