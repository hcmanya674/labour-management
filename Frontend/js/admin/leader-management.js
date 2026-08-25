const BACKEND_URL = "https://labour-management-backend-y6g2.onrender.com";

let editLeaderId = null;


// ======================================================
// LOAD LEADER MANAGEMENT PAGE
// ======================================================

document.addEventListener("DOMContentLoaded", async function () {

    loadLeaderPage();

    await loadRegions();

    await loadLeaders();

});

// ======================================================
// CREATE LEADER MANAGEMENT CONTENT
// ======================================================
function loadLeaderPage() {

    const app = document.getElementById("app");

    if (!app) {
        console.error("App container not found.");
        return;
    }

    app.innerHTML = `

        <div class="form-box">

            <h2>Create Leader</h2>

            <br>

            <label>Leader Name</label>

            <input
                type="text"
                id="leaderName"
                placeholder="Enter Leader Name"
                style="text-transform:uppercase"
            >

            <label>Phone Number</label>

            <input
                type="text"
                id="leaderPhone"
                placeholder="Enter 10-digit Phone Number"
                maxlength="10"
                inputmode="numeric"
            >

            <label>Password</label>

            <input
                type="password"
                id="leaderPassword"
                placeholder="Enter Leader Password"
            >

            <label>Region</label>

            <select id="leaderRegion">

                <option value="">
                    Select Region
                </option>

            </select>

            <br>

            <button
                id="saveLeaderBtn"
                onclick="saveLeader()"
            >
                Create Leader
            </button>

            <div
                id="leaderMessage"
                style="color:red;font-weight:bold;margin-top:5px;"
            ></div>

        </div>

        <br>

        <input
            type="text"
            id="searchLeader"
            placeholder="Search Name, Phone or Region"
        >

        <br>
        <br>

        <table id="leaderTable">

            <thead>

                <tr>

                    <th>Name</th>
                    <th>Phone</th>
                    <th>Region</th>
                    <th>Status</th>
                    <th>Edit</th>
                    <th>Deactivate</th>
                    <th>Delete</th>

                </tr>

            </thead>

            <tbody></tbody>

        </table>

    `;
}


// ======================================================
// CREATE / UPDATE LEADER
// ======================================================

async function saveLeader() {

    // ==========================================
    // EDIT MODE
    // ==========================================

    if (editLeaderId) {

        await updateLeader();

        return;

    }


    // ==========================================
    // GET VALUES
    // ==========================================

    const name =
        document.getElementById("leaderName")
            .value
            .trim()
            .toUpperCase();

    const phone =
        document.getElementById("leaderPhone")
            .value
            .trim();

    const password =
        document.getElementById("leaderPassword")
            .value
            .trim();

    const region =
        document.getElementById("leaderRegion")
            .value
            .trim();


    // ==========================================
    // DEBUG
    // ==========================================

    console.log("========== CREATE LEADER ==========");
    console.log("Name:", name);
    console.log("Phone:", phone);
    console.log(
        "Password:",
        password ? "ENTERED" : "EMPTY"
    );
    console.log("Region:", region);
    console.log("==================================");


    // ==========================================
    // VALIDATION
    // ==========================================

    if (!name) {

        alert("Please enter Leader Name.");

        return;
    }


    if (!phone) {

        alert("Please enter Phone Number.");

        return;
    }


    if (!/^[0-9]{10}$/.test(phone)) {

        alert(
            "Phone Number must contain exactly 10 digits."
        );

        return;
    }


    if (!password) {

        alert("Please enter Password.");

        return;
    }


    if (password.length < 6) {

        alert(
            "Password must contain at least 6 characters."
        );

        return;
    }


    if (!region) {

        alert("Please select Region.");

        return;
    }


    // ==========================================
    // DISABLE BUTTON
    // ==========================================

    const saveBtn =
        document.getElementById("saveLeaderBtn");

    saveBtn.disabled = true;

    saveBtn.innerHTML = "Creating...";


    // ==========================================
    // SEND TO BACKEND
    // ==========================================

    try {

        const response =
            await fetch(
                BACKEND_URL + "/createLeader",
                {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        name: name,

                        phone: phone,

                        password: password,

                        region: region

                    })

                }
            );


        console.log(
            "Backend status:",
            response.status
        );


        const result =
            await response.json();


        console.log(
            "Backend response:",
            result
        );


        // ==========================================
        // SUCCESS
        // ==========================================

        if (result.success) {

            alert(
                "Leader Created Successfully!"
            );


            // Clear form

            document.getElementById(
                "leaderName"
            ).value = "";

            document.getElementById(
                "leaderPhone"
            ).value = "";

            document.getElementById(
                "leaderPassword"
            ).value = "";

            document.getElementById(
                "leaderRegion"
            ).value = "";


            // Reload table

            await loadLeaders();

        }


        // ==========================================
        // ERROR
        // ==========================================

        else {

            alert(
                result.message ||
                "Unable to create leader."
            );

        }

    }

    catch (error) {

        console.error(
            "Create Leader Error:",
            error
        );

        alert(
            "Server Error:\n\n" +
            error.message
        );

    }


    finally {

        saveBtn.disabled = false;

        saveBtn.innerHTML =
            "Create Leader";

    }

}
// ======================================================
// UPDATE LEADER
// ======================================================

async function updateLeader() {

    try {

        const name =
            document.getElementById("leaderName")
                .value
                .trim();


        const phone =
            document.getElementById("leaderPhone")
                .value
                .trim();


        const region =
            document.getElementById("leaderRegion")
                .value;


        await db
            .collection("users")
            .doc(editLeaderId)
            .update({

                name: name,

                phone: phone,

                region: region

            });


        alert("Leader Updated Successfully");


        // Reset edit mode

        editLeaderId = null;


        // Clear fields

        document.getElementById("leaderName").value = "";

        document.getElementById("leaderPhone").value = "";

        document.getElementById("leaderPassword").value = "";

        document.getElementById("leaderPassword").style.display = "";

        document.getElementById("leaderRegion").value = "";


        // Change button back

        document.getElementById(
            "saveLeaderBtn"
        ).innerHTML = "Create Leader";


        // Reload leaders

        loadLeaders();

    }
    catch (error) {

        console.error(
            "Update Leader Error:",
            error
        );

        alert(error.message);

    }

}


// ======================================================
// LOAD ACTIVE REGIONS
// ======================================================

async function loadRegions() {

    const regionSelect =
        document.getElementById("leaderRegion");

    if (!regionSelect) {

        console.error(
            "Leader region select not found."
        );

        return;
    }

    // Clear existing options

    regionSelect.innerHTML = `
        <option value="">
            Select Region
        </option>
    `;

    try {

        const snapshot =
            await db
                .collection("regions")
                .where("active", "==", true)
                .get();


        snapshot.forEach(function (doc) {

            const region = doc.data();

            // IMPORTANT:
            // Use Firestore document ID
            // instead of region.regionId

            regionSelect.innerHTML += `

                <option value="${doc.id}">
                    ${region.regionName}
                </option>

            `;

        });

        console.log(
            "Regions loaded successfully."
        );

    }

    catch (error) {

        console.error(
            "Error loading regions:",
            error
        );

    }

}

// ======================================================
// LOAD LEADERS
// ======================================================

async function loadLeaders() {

    const tbody =
        document.querySelector(
            "#leaderTable tbody"
        );


    if (!tbody) {

        console.error(
            "Leader table body not found."
        );

        return;

    }


    tbody.innerHTML = "";


    try {

        const snapshot =
            await db
                .collection("users")
                .where("role", "==", "leader")
                .get();


        for (
            const doc of snapshot.docs
        ) {

            const leader =
                doc.data();


            // ==========================================
            // GET REGION NAME
            // ==========================================

            let regionName =
                leader.region;


            try {

                if (leader.region) {

                    const regionDoc =
                        await db
                            .collection("regions")
                            .doc(leader.region)
                            .get();


                    if (regionDoc.exists) {

                        regionName =
                            regionDoc.data().regionName;

                    }

                }

            }
            catch (error) {

                console.log(
                    "Region lookup error:",
                    error
                );

            }


            // ==========================================
            // LEADER ROW
            // ==========================================

            tbody.innerHTML += `

                <tr>

                    <td>
                        ${leader.name || ""}
                    </td>

                    <td>
                        ${leader.phone || ""}
                    </td>


                    <td>
                        ${regionName || ""}
                    </td>


                    <td>
                        ${leader.active
                            ? "Active"
                            : "Inactive"}
                    </td>


                    <td>

                        <button
                            onclick="editLeader('${doc.id}')"
                        >
                            Edit
                        </button>

                    </td>


                   <td>

                        <button
                            class="${
                                leader.active
                                    ? "deactivate-btn"
                                    : "activate-btn"
                            }"

                            onclick="toggleLeader(
                                '${doc.id}',
                                ${leader.active ? true : false}
                            )"
                        >

                            ${
                                leader.active
                                    ? "Deactivate"
                                    : "Activate"
                            }

                        </button>

                    </td>

                    <td>

                        <button
                            style="
                                background:#d32f2f;
                                color:white;
                                border:none;
                                padding:6px 12px;
                                border-radius:4px;
                                cursor:pointer;
                            "

                            onclick="deleteLeader(
                                '${doc.id}',
                                '${(leader.name || "").replace(/'/g, "\\'")}'
                            )"
                        >
                            Delete
                        </button>

                    </td>

                </tr>

            `;

        }


        attachSearch();


    }
    catch (error) {

        console.error(
            "Error loading leaders:",
            error
        );

    }

}



// ======================================================
// EDIT LEADER
// ======================================================

async function editLeader(uid) {

    try {

        const doc =
            await db
                .collection("users")
                .doc(uid)
                .get();


        if (!doc.exists) {

            alert(
                "Document not found"
            );

            return;

        }


        const leader =
            doc.data();


        // ==========================================
        // FILL FORM
        // ==========================================

        document.getElementById(
            "leaderName"
        ).value =
            leader.name || "";

        document.getElementById(
            "leaderPhone"
        ).value =
            leader.phone || "";


        document.getElementById(
            "leaderRegion"
        ).value =
            leader.region || "";


        // ==========================================
        // HIDE PASSWORD DURING EDIT
        // ==========================================

        document.getElementById(
            "leaderPassword"
        ).style.display =
            "none";


        // ==========================================
        // SET EDIT MODE
        // ==========================================

        editLeaderId =
            uid;


        document.getElementById(
            "saveLeaderBtn"
        ).innerHTML =
            "Update Leader";


        // Scroll to form

        document
            .getElementById("leaderName")
            .scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

    }
    catch (error) {

        console.error(
            "Edit Leader Error:",
            error
        );

        alert(
            error.message
        );

    }

}



// ======================================================
// ACTIVATE / DEACTIVATE LEADER
// ======================================================

async function toggleLeader(
    uid,
    currentStatus
) {

    try {

        await db
            .collection("users")
            .doc(uid)
            .update({

                active:
                    !currentStatus

            });


        // Reload table

        loadLeaders();

    }
    catch (error) {

        console.error(
            "Status Update Error:",
            error
        );

        alert(
            "Unable to update status."
        );

    }

}



// ======================================================
// SEARCH LEADER
// ======================================================

function attachSearch() {

    const searchBox =
        document.getElementById(
            "searchLeader"
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
                    "#leaderTable tbody tr"
                );


            let matchFound =
                false;


            rows.forEach(function (row) {

                const nameCell =
                    row.cells[0];


                const phoneCell =
                    row.cells[1];


                const regionCell =
                    row.cells[2];


                if (
                    !nameCell ||
                    !phoneCell ||
                    !regionCell
                ) {

                    return;

                }


                // ======================================
                // ORIGINAL TEXT
                // ======================================

                const name =
                    nameCell.textContent;

                const phone =
                    phoneCell.textContent;


                const region =
                    regionCell.textContent;


                // ======================================
                // REMOVE PREVIOUS HIGHLIGHT
                // ======================================

                nameCell.textContent =
                    name;

                phoneCell.textContent =
                    phone;


                regionCell.textContent =
                    region;


                // ======================================
                // MATCH
                // ======================================

                const nameMatch =
                    name
                        .toLowerCase()
                        .includes(filter);


                const phoneMatch =
                    phone
                        .toLowerCase()
                        .includes(filter);


                const regionMatch =
                    region
                        .toLowerCase()
                        .includes(filter);


                // ======================================
                // EMPTY SEARCH
                // ======================================

                if (filter === "") {

                    row.style.display =
                        "";

                    return;

                }


                // ======================================
                // MATCH FOUND
                // ======================================

                if (
                    nameMatch ||
                    phoneMatch ||
                    regionMatch
                ) {

                    row.style.display =
                        "";


                    matchFound =
                        true;


                    // Escape special regex characters

                    const escapedFilter =
                        filter.replace(
                            /[.*+?^${}()|[\]\\]/g,
                            "\\$&"
                        );


                    const regex =
                        new RegExp(
                            escapedFilter,
                            "gi"
                        );


                    // Highlight name

                    if (nameMatch) {

                        nameCell.innerHTML =
                            name.replace(
                                regex,
                                function (match) {

                                    return `
                                        <span
                                            style="background:yellow;"
                                        >
                                            ${match}
                                        </span>
                                    `;

                                }
                            );

                    }


                    // Highlight phone

                    if (phoneMatch) {

                        phoneCell.innerHTML =
                            phone.replace(
                                regex,
                                function (match) {

                                    return `
                                        <span
                                            style="background:yellow;"
                                        >
                                            ${match}
                                        </span>
                                    `;

                                }
                            );

                    }


                    // Highlight region

                    if (regionMatch) {

                        regionCell.innerHTML =
                            region.replace(
                                regex,
                                function (match) {

                                    return `
                                        <span
                                            style="background:yellow;"
                                        >
                                            ${match}
                                        </span>
                                    `;

                                }
                            );

                    }

                }


                // ======================================
                // NO MATCH
                // ======================================

                else {

                    row.style.display =
                        "none";

                }

            });


            // ==========================================
            // NO LEADER MESSAGE
            // ==========================================

            const message =
                document.getElementById(
                    "leaderMessage"
                );


            if (message) {

                message.textContent =
                    (
                        filter !== "" &&
                        !matchFound
                    )
                        ? "No Leader Found"
                        : "";

            }

        }
    );

}


// =====================================================
// DELETE LEADER
// =====================================================

async function deleteLeader(leaderUid, leaderName) {

    const confirmation = confirm(
    `⚠️ DELETE LEADER\n\n` +
    `Leader: ${leaderName}\n\n` +
    `The following will be permanently deleted:\n` +
    `• Leader profile\n` +
    `• All item assignments\n\n` +
    `Existing Repair Orders will NOT be deleted.\n\n` +
    `This action cannot be undone.\n\n` +
    `Do you want to continue?`
);

    if (!confirmation) {
        return;
    }

    try {

        // -------------------------------------------------
        // Find leader's item assignments
        // -------------------------------------------------

        const assignments =
            await db.collection("leaderItemAssignments")
                .where("leaderUid","==",  leaderUid)
                .get();


        // -------------------------------------------------
        // Batch delete assignments + user profile
        // -------------------------------------------------

        const batch = db.batch();


        assignments.forEach(doc => {

            batch.delete(doc.ref);

        });


        // -------------------------------------------------
        // Delete leader Firestore profile
        // -------------------------------------------------

        const userRef =
            db.collection("users")
                .doc(leaderUid);


        batch.delete(userRef);


        // -------------------------------------------------
        // Commit
        // -------------------------------------------------

        await batch.commit();


        alert(
            `Leader "${leaderName}" deleted successfully.`
        );


        loadLeaders();

    } catch (error) {

        console.error(
            "Error deleting leader:",
            error
        );

        alert(
            "Unable to delete leader.\n\n" +
            error.message
        );
    }
}