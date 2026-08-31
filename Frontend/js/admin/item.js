// =====================================================
// ITEM CODE MANAGEMENT
// ITEM CODE TYPE: NUMBER
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
// New format:
//
// 1
// 2
// 3
// 4
// 5
// ...
//
// Firestore field:
// itemCode: 1
// =====================================================

async function generateNextItemCode() {

    try {

        const snapshot =
            await db
                .collection(
                    "itemcodes"
                )
                .get();


        let highestNumber = 0;


        snapshot.forEach(doc => {

            const data =
                doc.data();


            // =============================================
            // ITEM CODE MUST BE NUMBER
            // =============================================

            const itemCode =
                Number(
                    data.itemCode
                );


            if (
                Number.isInteger(
                    itemCode
                ) &&
                itemCode > highestNumber
            ) {

                highestNumber =
                    itemCode;

            }

        });


        // =============================================
        // NEXT ITEM CODE
        // =============================================

        const nextCode =
            highestNumber + 1;


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
            document.getElementById(
                "itemDescription"
            )
            .value
            .trim()
            .toUpperCase();


        // =================================================
        // GET BILLING
        // =================================================

        const billingInput =
            document.getElementById(
                "itemBillingAmount"
            )
            .value
            .trim();


        // =================================================
        // GET INCENTIVE
        // =================================================

        const incentiveInput =
            document.getElementById(
                "itemIncentiveAmount"
            )
            .value
            .trim();


        // =================================================
        // DESCRIPTION VALIDATION
        // =================================================

        if (
            description === ""
        ) {

            alert(
                "Please enter Item Description."
            );

            return;

        }


        // =================================================
        // BILLING VALIDATION
        // =================================================

        if (
            billingInput === ""
        ) {

            alert(
                "Please enter Billing Amount."
            );

            return;

        }


        const billingAmount =
            Number(
                billingInput
            );


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
        // EMPTY = 0
        // =================================================

        let incentiveAmount =
            0;


        if (
            incentiveInput !== ""
        ) {

            incentiveAmount =
                Number(
                    incentiveInput
                );


            if (
                isNaN(
                    incentiveAmount
                ) ||
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
            await db
                .collection(
                    "itemcodes"
                )
                .get();


        let duplicateDescription =
            false;


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

                duplicateDescription =
                    true;

            }

        });


        if (
            duplicateDescription
        ) {

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

        const codeSnapshot =
            await db
                .collection(
                    "itemcodes"
                )
                .where(
                    "itemCode",
                    "==",
                    code
                )
                .get();


        if (
            !codeSnapshot.empty
        ) {

            alert(
                "Generated Item Code already exists.\n\nPlease try again."
            );

            return;

        }


        // =================================================
        // SAVE TO FIRESTORE
        // =================================================

        await db
            .collection(
                "itemcodes"
            )
            .doc(
                String(code)
            )
            .set({

                // =========================================
                // IMPORTANT
                // FIRESTORE NUMBER
                // =========================================

                itemCode:
                    code,

                description:
                    description,

                billingAmount:
                    billingAmount,

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
        document.getElementById(
            "itemTable"
        );


    if (!table) {

        console.error(
            "itemTable not found."
        );

        return;

    }


    db.collection(
        "itemcodes"
    )
    .onSnapshot(
        (snapshot) => {

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


            // =============================================
            // SORT ITEMS NUMERICALLY
            // =============================================

            const items =
                [];


            snapshot.forEach(doc => {

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

                    console.warn(
                        "Skipping invalid itemCode:",
                        doc.id,
                        data.itemCode
                    );

                    return;

                }


                items.push({

                    docId:
                        doc.id,

                    data:
                        data,

                    itemCode:
                        itemCode

                });

            });


            items.sort(
                (a, b) =>
                    a.itemCode -
                    b.itemCode
            );


            // =============================================
            // CREATE ROWS
            // =============================================

            items.forEach(
                item => {

                    const docId =
                        item.docId;


                    const data =
                        item.data;


                    const itemCode =
                        item.itemCode;


                    const row =
                        table.insertRow();


                    // =================================================
                    // ITEM CODE
                    // =================================================

                    row.insertCell(0)
                        .textContent =
                        itemCode;

// =================================================
// DESCRIPTION
// =================================================

const descriptionCell =
    row.insertCell(1);


if (data.deleted === true) {

    descriptionCell.textContent =
        `ITEM ${itemCode} IS DELETED AND NOT AVAILABLE`;

    descriptionCell.style.color =
        "#d32f2f";

    descriptionCell.style.fontWeight =
        "700";

}
else {

    descriptionCell.textContent =
        data.description || "";

}

                    // =================================================
                    // BILLING AMOUNT
                    // =================================================

                    row.insertCell(2)
                        .textContent =
                        "₹" +
                        Number(
                            data.billingAmount || 0
                        )
                        .toLocaleString(
                            "en-IN"
                        );


                    // =================================================
                    // INCENTIVE AMOUNT
                    // =================================================

                    row.insertCell(3)
                        .textContent =
                        "₹" +
                        Number(
                            data.incentiveAmount || 0
                        )
                        .toLocaleString(
                            "en-IN"
                        );

// =================================================
// STATUS
// =================================================

const statusCell =
    row.insertCell(4);


if (data.deleted === true) {

    statusCell.textContent =
        "Deleted";

    statusCell.style.color =
        "#d32f2f";

    statusCell.style.fontWeight =
        "700";

}
else {

    statusCell.textContent =
        data.active
            ? "Active"
            : "Inactive";

}

                    // =================================================
                    // EDIT DESCRIPTION
                    // =================================================

                    const editCell =
                        row.insertCell(5);


                    const editBtn =
                        document.createElement(
                            "button"
                        );

                    editBtn.textContent =
                        data.deleted
                            ? "Unavailable"
                            : "Edit";

                    editBtn.disabled =
                        data.deleted === true;


                    editBtn.onclick =
                        function () {

                            editItem(
                                docId,
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
                        document.createElement(
                            "button"
                        );

                    billingBtn.textContent =
                        data.deleted
                            ? "Unavailable"
                            : "Edit Billing";

                    billingBtn.disabled =
                        data.deleted === true;


                    billingBtn.onclick =
                        function () {

                            editBilling(
                                docId,
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
                        document.createElement(
                            "button"
                        );


                    incentiveBtn.textContent =
                    data.deleted
                        ? "Unavailable"
                        : "Edit Incentive";

                    incentiveBtn.disabled =
                        data.deleted === true;


                    incentiveBtn.onclick =
                        function () {

                            editIncentive(
                                docId,
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
                        document.createElement(
                            "button"
                        );


                    // =================================================
                    // DELETED ITEM
                    // =================================================

                    if (data.deleted === true) {

                        actionBtn.textContent =
                            "Deleted";

                        actionBtn.style.background =
                            "#9e9e9e";

                        actionBtn.style.color =
                            "white";

                        actionBtn.disabled =
                            true;

                    }


                    // =================================================
                    // ACTIVE ITEM
                    // =================================================

                    else if (data.active) {

                        actionBtn.textContent =
                            "Deactivate";

                        actionBtn.style.background =
                            "#12a10d";

                        actionBtn.style.color =
                            "white";


                        actionBtn.onclick =
                            function () {

                                deleteItem(
                                    docId
                                );

                            };

                    }


                    // =================================================
                    // INACTIVE ITEM
                    // =================================================

                    else {

                        actionBtn.textContent =
                            "Activate";

                        actionBtn.style.background =
                            "#e53935";

                        actionBtn.style.color =
                            "white";


                        actionBtn.onclick =
                            function () {

                                activateItem(
                                    docId
                                );

                            };

                    }


                    actionCell.appendChild(
                        actionBtn
                    );

                    // =================================================
                    // DELETE
                    // =================================================

                    const  deleteCell =
                    row.insertCell(9);


                if (data.deleted === true) {

                    deleteCell.textContent =
                        "Not Available";

                    deleteCell.style.color =
                        "#888";

                    deleteCell.style.fontWeight =
                        "600";

                }
                else {

                    const deleteBtn =
                        document.createElement(
                            "button"
                        );


                    deleteBtn.textContent =
                        "Delete";


                    deleteBtn.style.background =
                        "#d32f2f";


                    deleteBtn.style.color =
                        "white";



                    deleteBtn.onclick =
                        function () {

                            deleteItemCode(
                                docId,
                                itemCode
                            );

                        };


                    deleteCell.appendChild(
                        deleteBtn
                    );

                }
         } );


            attachSearch();

        },
        (error) => {

            console.error(
                "Error loading items:",
                error
            );

        }
    );

}


// =====================================================
// DEACTIVATE
// =====================================================

async function deleteItem(
    id
) {

    if (
        !confirm(
            "Deactivate Item?"
        )
    ) {

        return;

    }


    try {

        await db
            .collection(
                "itemcodes"
            )
            .doc(id)
            .update({

                active:
                    false

            });

    }

    catch (error) {

        console.error(
            "Deactivate error:",
            error
        );

        alert(
            "Unable to deactivate item.\n\n" +
            error.message
        );

    }

}


// =====================================================
// ACTIVATE
// =====================================================

async function activateItem(
    id
) {

    if (
        !confirm(
            "Activate Item?"
        )
    ) {

        return;

    }


    try {

        await db
            .collection(
                "itemcodes"
            )
            .doc(id)
            .update({

                active:
                    true

            });

    }

    catch (error) {

        console.error(
            "Activate error:",
            error
        );

        alert(
            "Unable to activate item.\n\n" +
            error.message
        );

    }

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
        await db
            .collection(
                "itemcodes"
            )
            .get();


    let duplicate =
        false;


    snapshot.forEach(doc => {

        if (
            doc.id !== id
        ) {

            const existing =
                String(
                    doc.data()
                        .description || ""
                )
                .trim()
                .toUpperCase();


            if (
                existing ===
                description
            ) {

                duplicate =
                    true;

            }

        }

    });


    if (
        duplicate
    ) {

        alert(
            "Item Description already exists."
        );

        return;

    }


    try {

        await db
            .collection(
                "itemcodes"
            )
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

        console.error(
            error
        );

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
        isNaN(
            billing
        ) ||
        billing < 0
    ) {

        alert(
            "Please enter a valid billing amount."
        );

        return;

    }


    try {

        await db
            .collection(
                "itemcodes"
            )
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

        console.error(
            error
        );

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


    if (
        newIncentive === null
    ) {

        return;

    }


    const incentiveText =
        newIncentive.trim();


    let incentive =
        0;


    if (
        incentiveText !== ""
    ) {

        incentive =
            Number(
                incentiveText
            );


        if (
            isNaN(
                incentive
            ) ||
            incentive < 0
        ) {

            alert(
                "Please enter a valid incentive amount."
            );

            return;

        }

    }


    const billing =
        Number(
            currentBilling
        ) || 0;


    if (
        incentive >
        billing
    ) {

        alert(
            "Incentive cannot be greater than Billing Amount."
        );

        return;

    }


    try {

        await db
            .collection(
                "itemcodes"
            )
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


            let matchFound =
                false;


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
                        .includes(
                            filter
                        );


                const descMatch =
                    descText
                        .toLowerCase()
                        .includes(
                            filter
                        );


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

                    matchFound =
                        true;

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
// IMPORTANT:
// Item Code is NEVER physically deleted.
// The document is kept so the number is never reused.
// The item is marked as deleted/not available.
// =====================================================

async function deleteItemCode(
    itemId,
    itemCode
) {

    const numericItemCode =
        Number(itemCode);


    if (
        !Number.isInteger(numericItemCode)
    ) {

        alert(
            "Invalid Item Code."
        );

        return;

    }


    const confirmation =
        confirm(

            `Are you sure you want to delete Item Code "${numericItemCode}"?\n\n` +

            `The item will be marked as "Deleted - Not Available".\n\n` +

            `The Item Code ${numericItemCode} will NOT be reused.\n\n` +

            `Existing Repair Orders will NOT be deleted.\n\n` +

            `Continue?`

        );


    if (!confirmation) {

        return;

    }


    try {

        // =================================================
        // REMOVE ACTIVE ASSIGNMENTS
        // =================================================

        const assignments =
            await db
                .collection(
                    "leaderItemAssignments"
                )
                .where(
                    "itemCode",
                    "==",
                    numericItemCode
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
        // DO NOT DELETE ITEM DOCUMENT
        // =================================================
        //
        // Instead mark it as deleted.
        //
        // This preserves:
        //
        // Item Code
        // Description
        // Billing
        // Incentive
        //
        // =================================================

        const itemRef =
            db
                .collection(
                    "itemcodes"
                )
                .doc(
                    itemId
                );


        batch.update(
            itemRef,
            {

                active: false,

                deleted: true,

                deletedAt:
                    firebase.firestore
                        .FieldValue
                        .serverTimestamp()

            }
        );


        // =================================================
        // COMMIT
        // =================================================

        await batch.commit();


        alert(
            `Item Code ${numericItemCode} has been deleted and marked as "Not Available".`
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