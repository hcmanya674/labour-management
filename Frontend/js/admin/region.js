// =====================================================
// REGION MANAGEMENT
// =====================================================

// Load Admin Layout
loadAdminLayout("Region Management", `

<div class="form-box">

    <label>Region ID</label>

    <input
        type="text"
        id="regionId"
        maxlength="5"
        placeholder="Enter Region ID"
        oninput="this.value=this.value.toUpperCase()"
    >

    <label>Region Name</label>

    <input
        type="text"
        id="regionName"
        maxlength="30"
        placeholder="Enter Region Name"
        oninput="this.value=this.value.toUpperCase()"
    >

    <button onclick="saveRegion()">
        Save Region
    </button>

</div>

<br>

<input
    type="text"
    id="searchRegion"
    placeholder="Search Region Name"
>

<div
    id="regionMessage"
    style="
        color:red;
        font-weight:bold;
        margin-top:5px;
    "
></div>

<br><br>

<table id="regionTable">

    <tr>

        <th>Region ID</th>

        <th>Region Name</th>

        <th>Status</th>

        <th>Edit</th>

        <th>Action</th>

        <th>Delete</th>

    </tr>

</table>

`);
// =====================================================
// INITIALIZE PAGE
// =====================================================

function initializePage() {
    loadRegions();
}

// =====================================================
// SAVE REGION
// =====================================================

async function saveRegion() {

    const id =
        document.getElementById("regionId")
        .value
        .trim()
        .toUpperCase();

    const name =
        document.getElementById("regionName")
        .value
        .trim()
        .toUpperCase();


    // Empty validation

    if (!id && !name) {

        alert(
            "Please enter Region ID and Region Name."
        );

        return;

    }

    if (!id) {

        alert(
            "Please enter Region ID."
        );

        return;

    }

    if (!name) {

        alert(
            "Please enter Region Name."
        );

        return;

    }


    // Region ID validation

    if (!/^[A-Z0-9]+$/.test(id)) {

        alert(
            "Region ID can contain only letters and numbers."
        );

        return;

    }


    // Region name length

    if (name.length > 30) {

        alert(
            "Region Name cannot exceed 30 characters."
        );

        return;

    }


    // Region name validation

    const nameRegex =
        /^[A-Za-z ]+$/;

    if (!nameRegex.test(name)) {

        alert(
            "Region Name should contain only letters and spaces."
        );

        return;

    }


    try {

        // Check ID

        const idDoc =
            await db.collection("regions")
            .doc(id)
            .get();


        if (idDoc.exists) {

            alert(
                "Region ID already exists."
            );

            return;

        }


        // Check name

        const duplicate =
            await db.collection("regions")
            .where(
                "regionName",
                "==",
                name
            )
            .get();


        if (!duplicate.empty) {

            alert(
                "Region Name already exists."
            );

            return;

        }


        // Save

        await db.collection("regions")
            .doc(id)
            .set({

                regionId: id,

                regionName: name,

                active: true,

                createdAt:
                    firebase.firestore
                    .FieldValue
                    .serverTimestamp()

            });


        alert(
            "Region Added Successfully."
        );


        document.getElementById(
            "regionId"
        ).value = "";


        document.getElementById(
            "regionName"
        ).value = "";


    }

    catch (error) {

        console.error(
            "Error saving region:",
            error
        );

        alert(
            "Unable to save region:\n\n" +
            error.message
        );

    }

}


// =====================================================
// LOAD REGIONS
// =====================================================

function loadRegions() {

    const table =
        document.getElementById(
            "regionTable"
        );


    db.collection("regions")
        .onSnapshot(

            (snapshot) => {


                // Header

                table.innerHTML = `

                <tr>

                    <th>Region ID</th>

                    <th>Region Name</th>

                    <th>Status</th>

                    <th>Edit</th>

                    <th>Action</th>

                    <th>Delete</th>

                </tr>

                `;


                // Rows

                snapshot.forEach(
                    (doc) => {

                        const data =
                            doc.data();


                        const row =
                            table.insertRow();


                        // ---------------------------------
                        // REGION ID
                        // ---------------------------------

                        row.insertCell(0)
                            .textContent =
                            data.regionId || doc.id;


                        // ---------------------------------
                        // REGION NAME
                        // ---------------------------------

                        row.insertCell(1)
                            .textContent =
                            data.regionName || "-";


                        // ---------------------------------
                        // STATUS
                        // ---------------------------------

                        row.insertCell(2)
                            .textContent =
                            data.active
                            ? "Active"
                            : "Inactive";


                        // ---------------------------------
                        // EDIT
                        // ---------------------------------

                        const editCell =
                            row.insertCell(3);


                        const editBtn =
                            document.createElement(
                                "button"
                            );


                        editBtn.textContent =
                            "Edit";


                        editBtn.onclick =
                            function () {

                                editRegion(
                                    doc.id,
                                    data.regionName
                                );

                            };


                        editCell.appendChild(
                            editBtn
                        );


                        // ---------------------------------
                        // ACTIVATE / DEACTIVATE
                        // ---------------------------------

                        const actionCell =
                            row.insertCell(4);


                        const actionBtn =
                            document.createElement(
                                "button"
                            );


                        if (data.active) {

                            actionBtn.textContent =
                                "Deactivate";

                            actionBtn.style.background =
                                "#12a10d";

                            actionBtn.style.color =
                                "white";


                            actionBtn.onclick =
                                function () {

                                    deactivateRegion(
                                        doc.id,
                                        data.regionName
                                    );

                                };

                        }

                        else {

                            actionBtn.textContent =
                                "Activate";

                            actionBtn.style.background =
                                "#ec1919";

                            actionBtn.style.color =
                                "white";


                            actionBtn.onclick =
                                function () {

                                    activateRegion(
                                        doc.id,
                                        data.regionName
                                    );

                                };

                        }


                        actionCell.appendChild(
                            actionBtn
                        );


                        // ---------------------------------
                        // PERMANENT DELETE
                        // ---------------------------------

                        const deleteCell =
                            row.insertCell(5);


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

                                deleteRegion(
                                    doc.id,
                                    data.regionName
                                );

                            };


                        deleteCell.appendChild(
                            deleteBtn
                        );

                    }
                );


                // Search

                attachSearch();

            },

            (error) => {

                console.error(
                    "Error loading regions:",
                    error
                );

            }

        );

}
// =====================================================
// DEACTIVATE REGION
// =====================================================

async function deactivateRegion( id, regionName)
{

    const confirmation =
        confirm(
            `Deactivate Region "${regionName}"?`
        );


    if (!confirmation) {

        return;

    }


    try {

        await db.collection("regions")
            .doc(id)
            .update({

                active: false

            });


        alert(
            "Region deactivated successfully."
        );

    }

    catch (error) {

        console.error(error);

        alert(
            "Unable to deactivate region:\n\n" +
            error.message
        );

    }

}

// =====================================================
// ACTIVATE REGION
// =====================================================

async function activateRegion(
    id,
    regionName
) {

    const confirmation =
        confirm(
            `Activate Region "${regionName}"?`
        );


    if (!confirmation) {

        return;

    }


    try {

        await db.collection("regions")
            .doc(id)
            .update({

                active: true

            });


        alert(
            "Region activated successfully."
        );

    }

    catch (error) {

        console.error(error);

        alert(
            "Unable to activate region:\n\n" +
            error.message
        );

    }

}

// =====================================================
// EDIT REGION
// =====================================================

async function editRegion(
    id,
    currentName
) {

    const newName =
        prompt(
            "Edit Region Name",
            currentName
        );


    if (newName === null) {

        return;

    }


    const name =
        newName
        .trim()
        .toUpperCase();


    if (!name) {

        alert(
            "Region Name cannot be empty."
        );

        return;

    }


    if (name.length > 30) {

        alert(
            "Maximum 30 characters allowed."
        );

        return;

    }


    const regex =
        /^[A-Za-z ]+$/;


    if (!regex.test(name)) {

        alert(
            "Only letters and spaces are allowed."
        );

        return;

    }


    try {

        const duplicate =
            await db.collection("regions")
            .where(
                "regionName",
                "==",
                name
            )
            .get();


        let exists = false;


        duplicate.forEach(
            (doc) => {

                if (doc.id !== id) {

                    exists = true;

                }

            }
        );


        if (exists) {

            alert(
                "Region Name already exists."
            );

            return;

        }


        await db.collection("regions")
            .doc(id)
            .update({

                regionName: name

            });


        alert(
            "Region updated successfully."
        );

    }

    catch (error) {

        console.error(error);

        alert(
            "Unable to update region:\n\n" +
            error.message
        );

    }

}

// =====================================================
// SEARCH REGION
// =====================================================

function attachSearch() {

    const searchBox =
        document.getElementById(
            "searchRegion"
        );


    if (!searchBox) {

        return;

    }


    if (
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
                    "#regionTable tr:not(:first-child)"
                );


            let matchFound = false;


            rows.forEach(
                row => {

                    const nameCell =
                        row.cells[1];


                    if (!nameCell) {

                        return;

                    }


                    const originalName =
                        nameCell.textContent;


                    if (!filter) {

                        row.style.display =
                            "";

                        return;

                    }


                    if (
                        originalName
                        .toLowerCase()
                        .includes(filter)
                    ) {

                        row.style.display =
                            "";

                        matchFound = true;

                    }

                    else {

                        row.style.display =
                            "none";

                    }

                }
            );


            const message =
                document.getElementById(
                    "regionMessage"
                );


            if (message) {

                message.textContent =
                    (
                        filter &&
                        !matchFound
                    )
                    ? "No Region Found"
                    : "";

            }

        }

    );

}
// =====================================================
// PERMANENT DELETE REGION
// =====================================================

async function deleteRegion(
    regionId,
    regionName
) {

    const confirmation =
        confirm(

            `Are you sure you want to PERMANENTLY DELETE region "${regionName}"?\n\n` +

            `This action cannot be undone.`

        );


    if (!confirmation) {

        return;

    }


    try {

        await db.collection("regions")
            .doc(regionId)
            .delete();


        alert(
            `Region "${regionName}" deleted successfully.`
        );

    }

    catch (error) {

        console.error(
            "Error deleting region:",
            error
        );


        alert(

            "Unable to delete region.\n\n" +
            error.message

        );

    }

}
