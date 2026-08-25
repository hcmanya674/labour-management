// =====================================================
// ITEM CODE MANAGEMENT
// =====================================================


// =====================================================
// INITIALIZE PAGE
// =====================================================

loadItems();

function initializePage() {
    loadItems();
}


// =====================================================
// GENERATE NEXT ITEM CODE
//
// Format:
// ITEM001
// ITEM002
// ITEM003
// ...
// ITEM010
// ITEM011
// =====================================================

async function generateNextItemCode() {

    try {

        const snapshot =
            await db.collection("itemcodes").get();

        let highestNumber = 0;


        snapshot.forEach(doc => {

            const data = doc.data();


            // -------------------------------------------------
            // FIRST: CHECK itemCode FIELD
            // -------------------------------------------------

            let code =
                String(data.itemCode || "")
                    .trim()
                    .toUpperCase();


            // -------------------------------------------------
            // IF OLD DATABASE HAS NUMBER
            //
            // Example:
            // itemCode: 5
            //
            // Treat it as ITEM005
            // -------------------------------------------------

            if (/^\d+$/.test(code)) {

                const number =
                    parseInt(code, 10);

                if (number > highestNumber) {
                    highestNumber = number;
                }

            }


            // -------------------------------------------------
            // NORMAL FORMAT
            //
            // ITEM005
            // ITEM013
            // ITEM100
            // -------------------------------------------------

            const match =
                code.match(/^ITEM\s*(\d+)$/);

            if (match) {

                const number =
                    parseInt(match[1], 10);

                if (number > highestNumber) {
                    highestNumber = number;
                }

            }


            // -------------------------------------------------
            // ALSO CHECK DOCUMENT ID
            // -------------------------------------------------

            const docId =
                String(doc.id || "")
                    .trim()
                    .toUpperCase();


            const docMatch =
                docId.match(/^ITEM\s*(\d+)$/);

            if (docMatch) {

                const number =
                    parseInt(docMatch[1], 10);

                if (number > highestNumber) {
                    highestNumber = number;
                }

            }

        });


        // -------------------------------------------------
        // NEXT NUMBER
        // -------------------------------------------------

        const nextNumber =
            highestNumber + 1;


        // -------------------------------------------------
        // CREATE CODE
        //
        // 1   -> ITEM001
        // 9   -> ITEM009
        // 10  -> ITEM010
        // 100 -> ITEM100
        // -------------------------------------------------

        const nextCode =
            "ITEM" +
            String(nextNumber).padStart(3, "0");


        console.log(
            "Next Item Code:",
            nextCode
        );


        return nextCode;

    }
    catch (error) {

        console.error(
            "Error generating Item Code:",
            error
        );

        throw error;

    }

}


// =====================================================
// SAVE ITEM
// =====================================================

async function saveItem() {

    try {

        // =================================================
        // GET DESCRIPTION
        // =================================================

        const description =
            document.getElementById("itemDescription")
                .value
                .trim()
                .toUpperCase();


        // =================================================
        // GET BILLING
        // =================================================

        const billingInput =
            document.getElementById("itemBillingAmount")
                .value
                .trim();


        // =================================================
        // GET INCENTIVE
        // =================================================

        const incentiveInput =
            document.getElementById("itemIncentiveAmount")
                .value
                .trim();


        // =================================================
        // DESCRIPTION VALIDATION
        // =================================================

        if (description === "") {

            alert(
                "Please enter Item Description."
            );

            return;
        }


        // =================================================
        // BILLING VALIDATION
        // =================================================

        if (billingInput === "") {

            alert(
                "Please enter Billing Amount."
            );

            return;
        }


        const billingAmount =
            Number(billingInput);


        if (
            isNaN(billingAmount) ||
            billingAmount < 0
        ) {

            alert(
                "Please enter a valid Billing Amount."
            );

            return;
        }


        // =================================================
        // INCENTIVE
        //
        // EMPTY = 0
        // =================================================

        let incentiveAmount = 0;


        if (incentiveInput !== "") {

            incentiveAmount =
                Number(incentiveInput);


            if (
                isNaN(incentiveAmount) ||
                incentiveAmount < 0
            ) {

                alert(
                    "Please enter a valid Incentive Amount."
                );

                return;
            }

        }


        // =================================================
        // INCENTIVE CANNOT EXCEED BILLING
        // =================================================

        if (
            incentiveAmount >
            billingAmount
        ) {

            alert(
                "Incentive amount cannot be greater than billing amount."
            );

            return;
        }


        // =================================================
        // CHECK DUPLICATE DESCRIPTION
        // =================================================

        const snapshot =
            await db.collection("itemcodes").get();


        let duplicateDescription = false;


        snapshot.forEach(doc => {

            const data =
                doc.data();


            const existingDescription =
                String(
                    data.description || ""
                )
                .trim()
                .toUpperCase();


            if (
                existingDescription ===
                description
            ) {

                duplicateDescription = true;

            }

        });


        if (duplicateDescription) {

            alert(
                "Item Description already exists."
            );

            return;
        }


        // =================================================
        // GENERATE ITEM CODE
        // =================================================

        const code =
            await generateNextItemCode();


        console.log(
            "Generated Item Code:",
            code
        );


        // =================================================
        // EXTRA DUPLICATE SAFETY CHECK
        // =================================================

        const codeDoc =
            await db.collection("itemcodes")
                .doc(code)
                .get();


        if (codeDoc.exists) {

            alert(
                "Generated Item Code already exists.\n\nPlease try again."
            );

            return;
        }


        // =================================================
        // SAVE TO FIRESTORE
        // =================================================

        await db.collection("itemcodes")
            .doc(code)
            .set({

                // IMPORTANT:
                // Store as STRING
                itemCode: code,

                description:
                    description,

                billingAmount:
                    billingAmount,

                // Empty incentive = 0
                incentiveAmount:
                    incentiveAmount,

                active:
                    true,

                createdAt:
                    firebase.firestore
                        .FieldValue
                        .serverTimestamp()

            });


        // =================================================
        // SUCCESS
        // =================================================

        alert(
            "Item Code " +
            code +
            " Added Successfully."
        );


        // =================================================
        // CLEAR FORM
        // =================================================

        document.getElementById(
            "itemDescription"
        ).value = "";


        document.getElementById(
            "itemBillingAmount"
        ).value = "";


        document.getElementById(
            "itemIncentiveAmount"
        ).value = "";


    }
    catch (error) {

        console.error(
            "Error saving item:",
            error
        );


        alert(
            "Unable to save Item Code:\n\n" +
            error.message
        );

    }

}


// =====================================================
// LOAD ITEMS
// =====================================================

function loadItems() {

    const table =
        document.getElementById("itemTable");


    if (!table) {

        console.error(
            "itemTable not found."
        );

        return;
    }


    db.collection("itemcodes")
        .onSnapshot((snapshot) => {


        table.innerHTML = `

        <tr>

            <th>Item Code</th>

            <th>Description</th>

            <th>Billing Amount</th>

            <th>Incentive Amount</th>

            <th>Status</th>

            <th>Edit</th>

            <th>Edit Billing</th>

            <th>Edit Incentive</th>

            <th>Action</th>

            <th>Delete</th>

        </tr>

        `;


        snapshot.forEach((doc) => {

            const data =
                doc.data();


            const row =
                table.insertRow();


            // =================================================
            // ITEM CODE
            // =================================================

            const codeCell =
                row.insertCell(0);


            /*
             * New records:
             * data.itemCode = "ITEM005"
             *
             * Old records:
             * data.itemCode = 5
             *
             * Convert old numeric records for display.
             */

            let displayCode =
                String(
                    data.itemCode ?? ""
                )
                .trim()
                .toUpperCase();


            if (/^\d+$/.test(displayCode)) {

                displayCode =
                    "ITEM" +
                    displayCode.padStart(3, "0");

            }


            if (
                /^ITEM\s+\d+$/.test(displayCode)
            ) {

                const number =
                    displayCode
                        .replace(/\D/g, "");


                displayCode =
                    "ITEM" +
                    number.padStart(3, "0");

            }


            // If itemCode field is missing,
            // use document ID.

            if (displayCode === "") {

                displayCode =
                    String(doc.id)
                        .trim()
                        .toUpperCase();

            }


            codeCell.textContent =
                displayCode;


            // =================================================
            // DESCRIPTION
            // =================================================

            row.insertCell(1)
                .textContent =
                data.description || "";


            // =================================================
            // BILLING AMOUNT
            // =================================================

            row.insertCell(2)
                .textContent =
                "₹" +
                Number(
                    data.billingAmount || 0
                ).toLocaleString("en-IN");


            // =================================================
            // INCENTIVE AMOUNT
            // =================================================

            row.insertCell(3)
                .textContent =
                "₹" +
                Number(
                    data.incentiveAmount || 0
                ).toLocaleString("en-IN");


            // =================================================
            // STATUS
            // =================================================

            row.insertCell(4)
                .textContent =
                data.active
                    ? "Active"
                    : "Inactive";


            // =================================================
            // EDIT DESCRIPTION
            // =================================================

            const editCell =
                row.insertCell(5);


            const editBtn =
                document.createElement("button");


            editBtn.textContent =
                "Edit";


            editBtn.onclick =
                function () {

                    editItem(
                        doc.id,
                        data.description
                    );

                };


            editCell.appendChild(
                editBtn
            );


            // =================================================
            // EDIT BILLING
            // =================================================

            const billingCell =
                row.insertCell(6);


            const billingBtn =
                document.createElement("button");


            billingBtn.textContent =
                "Edit Billing";


            billingBtn.onclick =
                function () {

                    editBilling(
                        doc.id,
                        data.billingAmount || 0
                    );

                };


            billingCell.appendChild(
                billingBtn
            );


            // =================================================
            // EDIT INCENTIVE
            // =================================================

            const incentiveCell =
                row.insertCell(7);


            const incentiveBtn =
                document.createElement("button");


            incentiveBtn.textContent =
                "Edit Incentive";


            incentiveBtn.onclick =
                function () {

                    editIncentive(
                        doc.id,
                        data.incentiveAmount || 0,
                        data.billingAmount || 0
                    );

                };


            incentiveCell.appendChild(
                incentiveBtn
            );


            // =================================================
            // ACTION
            // =================================================

            const actionCell =
                row.insertCell(8);


            const actionBtn =
                document.createElement("button");


            if (data.active) {

                actionBtn.textContent =
                    "Deactivate";


                actionBtn.style.background =
                    "#12a10d";


                actionBtn.style.color =
                    "white";


                actionBtn.onclick =
                    function () {

                        deleteItem(doc.id);

                    };

            }
            else {

                actionBtn.textContent =
                    "Activate";


                actionBtn.style.background =
                    "#e53935";


                actionBtn.style.color =
                    "white";


                actionBtn.onclick =
                    function () {

                        activateItem(doc.id);

                    };

            }


            actionCell.appendChild(
                actionBtn
            );


            // =================================================
            // DELETE
            // =================================================

            const deleteCell =
                row.insertCell(9);


            const deleteBtn =
                document.createElement("button");


            deleteBtn.textContent =
                "Delete";


            deleteBtn.style.background =
                "#d32f2f";


            deleteBtn.style.color =
                "white";


            deleteBtn.onclick =
                function () {

                    deleteItemCode(
                        doc.id,
                        displayCode
                    );

                };


            deleteCell.appendChild(
                deleteBtn
            );

        });


        attachSearch();

    });

}


// =====================================================
// DEACTIVATE
// =====================================================

function deleteItem(id) {

    if (
        !confirm(
            "Deactivate Item?"
        )
    ) {

        return;

    }


    db.collection("itemcodes")
        .doc(id)
        .update({

            active: false

        });

}


// =====================================================
// ACTIVATE
// =====================================================

function activateItem(id) {

    if (
        !confirm(
            "Activate Item?"
        )
    ) {

        return;

    }


    db.collection("itemcodes")
        .doc(id)
        .update({

            active: true

        });

}


// =====================================================
// EDIT DESCRIPTION
// =====================================================

async function editItem(
    id,
    currentDescription
) {

    const newDescription =
        prompt(
            "Edit Item Description",
            currentDescription
        );


    if (
        newDescription === null
    ) {

        return;

    }


    const description =
        newDescription
            .trim()
            .toUpperCase();


    if (
        description === ""
    ) {

        alert(
            "Description cannot be empty."
        );

        return;

    }


    // =================================================
    // DUPLICATE DESCRIPTION CHECK
    // =================================================

    const snapshot =
        await db.collection("itemcodes")
            .get();


    let duplicate = false;


    snapshot.forEach(doc => {

        if (
            doc.id !== id
        ) {

            const existing =
                String(
                    doc.data().description || ""
                )
                .trim()
                .toUpperCase();


            if (
                existing === description
            ) {

                duplicate = true;

            }

        }

    });


    if (duplicate) {

        alert(
            "Item Description already exists."
        );

        return;

    }


    try {

        await db.collection("itemcodes")
            .doc(id)
            .update({

                description:
                    description

            });


        alert(
            "Updated Successfully."
        );

    }
    catch (error) {

        console.error(error);

        alert(
            "Unable to update description.\n\n" +
            error.message
        );

    }

}


// =====================================================
// EDIT BILLING
// =====================================================

async function editBilling(
    id,
    currentBilling
) {

    const newBilling =
        prompt(
            "Enter Billing Amount",
            currentBilling
        );


    if (
        newBilling === null
    ) {

        return;

    }


    const billing =
        Number(
            newBilling.trim()
        );


    if (
        isNaN(billing) ||
        billing < 0
    ) {

        alert(
            "Please enter a valid billing amount."
        );

        return;

    }


    try {

        await db.collection("itemcodes")
            .doc(id)
            .update({

                billingAmount:
                    billing

            });


        alert(
            "Billing Amount Updated Successfully."
        );

    }
    catch (error) {

        console.error(error);

        alert(
            "Unable to update billing amount.\n\n" +
            error.message
        );

    }

}


// =====================================================
// EDIT INCENTIVE
// =====================================================

async function editIncentive(
    id,
    currentIncentive,
    currentBilling
) {

    const newIncentive =
        prompt(
            "Enter Incentive Amount\n\n" +
            "Leave blank to set incentive to ₹0.",
            currentIncentive || 0
        );


    // Cancel
    if (
        newIncentive === null
    ) {

        return;

    }


    const incentiveText =
        newIncentive.trim();


    // =================================================
    // EMPTY = ZERO
    // =================================================

    let incentive = 0;


    if (
        incentiveText !== ""
    ) {

        incentive =
            Number(
                incentiveText
            );


        if (
            isNaN(incentive) ||
            incentive < 0
        ) {

            alert(
                "Please enter a valid incentive amount."
            );

            return;

        }

    }


    // =================================================
    // CHECK BILLING
    // =================================================

    const billing =
        Number(
            currentBilling
        ) || 0;


    if (
        incentive > billing
    ) {

        alert(
            "Incentive cannot be greater than Billing Amount."
        );

        return;

    }


    try {

        await db.collection("itemcodes")
            .doc(id)
            .update({

                incentiveAmount:
                    incentive

            });


        alert(
            "Incentive Amount Updated Successfully."
        );

    }
    catch (error) {

        console.error(
            "Error updating incentive:",
            error
        );


        alert(
            "Unable to update incentive amount.\n\n" +
            error.message
        );

    }

}


// =====================================================
// SEARCH
// =====================================================

function attachSearch() {

    const searchBox =
        document.getElementById(
            "searchItem"
        );


    if (
        !searchBox ||
        searchBox.dataset.listenerAdded
    ) {

        return;

    }


    searchBox.dataset.listenerAdded =
        "true";


    searchBox.addEventListener(
        "keyup",
        function () {


            const filter =
                this.value
                    .toLowerCase()
                    .trim();


            const rows =
                document.querySelectorAll(
                    "#itemTable tr:not(:first-child)"
                );


            let matchFound = false;


            rows.forEach(row => {

                const codeCell =
                    row.cells[0];


                const descCell =
                    row.cells[1];


                const codeText =
                    codeCell.textContent;


                const descText =
                    descCell.textContent;


                const codeMatch =
                    codeText
                        .toLowerCase()
                        .includes(filter);


                const descMatch =
                    descText
                        .toLowerCase()
                        .includes(filter);


                if (
                    filter === ""
                ) {

                    row.style.display =
                        "";

                    return;

                }


                if (
                    codeMatch ||
                    descMatch
                ) {

                    row.style.display =
                        "";

                    matchFound = true;

                }
                else {

                    row.style.display =
                        "none";

                }

            });


            const message =
                document.getElementById(
                    "itemMessage"
                );


            if (message) {

                message.textContent =
                    (
                        filter !== "" &&
                        !matchFound
                    )
                        ? "No Item Code Found"
                        : "";

            }

        }
    );

}


// =====================================================
// DELETE ITEM CODE
// =====================================================

async function deleteItemCode(
    itemId,
    itemCode
) {

    const confirmation =
        confirm(

            `Are you sure you want to delete item "${itemCode}"?\n\n` +

            `Any active assignments for this item will also be removed.\n\n` +

            `This action cannot be undone.`

        );


    if (!confirmation) {

        return;

    }


    try {

        // =================================================
        // DELETE ASSIGNMENTS
        // =================================================

        const assignments =
            await db.collection(
                "leaderItemAssignments"
            )
            .where(
                "itemCode",
                "==",
                itemCode
            )
            .get();


        const batch =
            db.batch();


        assignments.forEach(
            doc => {

                batch.delete(
                    doc.ref
                );

            }
        );


        // =================================================
        // DELETE ITEM
        // =================================================

        const itemRef =
            db.collection(
                "itemcodes"
            )
            .doc(itemId);


        batch.delete(
            itemRef
        );


        // =================================================
        // COMMIT
        // =================================================

        await batch.commit();


        alert(
            `Item Code "${itemCode}" deleted successfully.`
        );

    }
    catch (error) {

        console.error(
            "Error deleting item code:",
            error
        );


        alert(
            "Unable to delete item code.\n\n" +
            error.message
        );

    }

}
