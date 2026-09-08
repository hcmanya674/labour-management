// ==========================================
// LABOUR MANAGEMENT SYSTEM
// LEADER - REPAIR ORDERS
// ==========================================

let leaderData = {};


// ==========================================
// CHECK LOGIN
// ==========================================

auth.onAuthStateChanged(async (user) => {

    if (!user) {

        location =
            "../../pages/auth/loginindex.html";

        return;

    }


    try {

        const leaderDoc =
            await db.collection("users")
                .doc(user.uid)
                .get();


        if (!leaderDoc.exists) {

            alert(
                "Leader record not found."
            );

            return;

        }


        leaderData =
            leaderDoc.data();


        console.log(
            "Leader Data:",
            leaderData
        );


        // ------------------------------------------
        // Create month filter
        // ------------------------------------------

        initializeMonthFilter();


        // ------------------------------------------
        // Load repair orders
        // ------------------------------------------

        await loadRepairOrders();

    }

    catch (error) {

        console.error(
            "Error loading repair orders:",
            error
        );


        alert(
            "Unable to load Repair Orders."
        );

    }

});


// ==========================================
// INITIALIZE MONTH FILTER
// ==========================================

function initializeMonthFilter() {

    const select =
        document.getElementById(
            "monthFilter"
        );


    if (!select) {

        console.warn(
            "monthFilter not found."
        );

        return;

    }


    select.innerHTML = "";


    const now =
        new Date();


    // ------------------------------------------
    // Show last 12 months
    // ------------------------------------------

    for (
        let i = 0;
        i < 12;
        i++
    ) {

        const date =
            new Date(
                now.getFullYear(),
                now.getMonth() - i,
                1
            );


        const year =
            date.getFullYear();


        const month =
            date.getMonth();


        const value =
            `${year}-${String(
                month + 1
            ).padStart(2, "0")}`;


        const label =
            date.toLocaleDateString(
                "en-IN",
                {
                    month: "long",
                    year: "numeric"
                }
            );


        const option =
            document.createElement(
                "option"
            );


        option.value =
            value;


        option.textContent =
            label;


        select.appendChild(
            option
        );

    }


    // ------------------------------------------
    // Reload when month changes
    // ------------------------------------------

    select.addEventListener(
        "change",
        function () {

            loadRepairOrders();

        }
    );

}


// ==========================================
// LOAD REPAIR ORDERS
// ==========================================

async function loadRepairOrders() {

    try {

        const monthFilter =
            document.getElementById(
                "monthFilter"
            );


        if (!monthFilter) {

            console.error(
                "monthFilter not found."
            );

            return;

        }


        const selectedMonth =
            monthFilter.value;


        if (!selectedMonth) {

            return;

        }


        const [
            selectedYear,
            selectedMonthNumber
        ] =
            selectedMonth
                .split("-")
                .map(Number);


        // ======================================
        // START OF SELECTED MONTH
        // ======================================

        const startDate =
            new Date(
                selectedYear,
                selectedMonthNumber - 1,
                1
            );


        // ======================================
        // START OF NEXT MONTH
        // ======================================

        const endDate =
            new Date(
                selectedYear,
                selectedMonthNumber,
                1
            );


        console.log(
            "Loading month:",
            selectedMonth
        );


        // ======================================
        // FIRESTORE QUERY
        // ======================================

        const snapshot =
            await db.collection(
                "repairorders"
            )
            .where(
                "leaderUid",
                "==",
                auth.currentUser.uid
            )
            .where(
                "createdAt",
                ">=",
                firebase.firestore.Timestamp.fromDate(
                    startDate
                )
            )
            .where(
                "createdAt",
                "<",
                firebase.firestore.Timestamp.fromDate(
                    endDate
                )
            )
            .orderBy(
                "createdAt",
                "desc"
            )
            .get();


        let html = "";


        // ======================================
        // CREATE ROWS
        // ======================================

        for (
            const doc of snapshot.docs
        ) {

            const ro =
                doc.data();


            // ==================================
            // DATE
            // ==================================

            let date = "-";


            if (ro.createdAt) {

                try {

                    if (
                        typeof ro.createdAt.toDate ===
                        "function"
                    ) {

                        date =
                            ro.createdAt
                                .toDate()
                                .toLocaleDateString(
                                    "en-GB"
                                );

                    }

                    else {

                        date =
                            new Date(
                                ro.createdAt
                            )
                            .toLocaleDateString(
                                "en-GB"
                            );

                    }

                }

                catch (error) {

                    console.error(
                        "Date conversion error:",
                        error
                    );

                }

            }


            // ==================================
            // ITEM CODES
            // ==================================

            let itemCodes = [];


            if (
                Array.isArray(
                    ro.itemCodes
                )
            ) {

                itemCodes =
                    ro.itemCodes;

            }

            else if (
                ro.itemCode
            ) {

                itemCodes = [
                    ro.itemCode
                ];

            }


            // ==================================
            // NO ITEM CODE
            // ==================================

            if (
                itemCodes.length === 0
            ) {

                html += `

                <tr>

                    <td>

                        <input
                            type="checkbox"
                            class="ro-checkbox"
                            value="${escapeHTML(
                                doc.id
                            )}"
                            onchange="updateDeleteButton()"
                        >

                    </td>


                    <td>
                        ${escapeHTML(
                            ro.roNumber || "-"
                        )}
                    </td>


                    <td>
                        ${escapeHTML(
                            date
                        )}
                    </td>


                    <td>
                        ${escapeHTML(
                            ro.vehicleNumber || "-"
                        )}
                    </td>


                    <td>
                        ${escapeHTML(
                            ro.advisorName || "-"
                        )}
                    </td>


                    <td>
                        -
                    </td>


                    <td>
                        -
                    </td>


                    <td>

                        <button
                            class="view-btn"
                            onclick="viewRO('${escapeHTML(
                                doc.id
                            )}')"
                        >
                            View
                        </button>

                    </td>

                </tr>

                `;


                continue;

            }


            // ==================================
            // ROWSPAN
            // ==================================

            const rowCount =
                itemCodes.length;


            // ==================================
            // ITEM ROWS
            // ==================================

            itemCodes.forEach(
                (
                    itemCode,
                    index
                ) => {

                    // ----------------------------------
                    // Get item description
                    //
                    // We intentionally DO NOT load or
                    // display billing amount here.
                    // ----------------------------------

                    let description =
                        itemCode;


                    if (
                        Array.isArray(
                            ro.itemDetails
                        )
                    ) {

                        const itemInfo =
                            ro.itemDetails.find(
                                item =>
                                    String(
                                        item.itemCode
                                    ).trim() ===
                                    String(
                                        itemCode
                                    ).trim()
                            );


                        if (
                            itemInfo &&
                            itemInfo.description
                        ) {

                            description =
                                itemInfo.description;

                        }

                    }


                    // ==================================
                    // START ROW
                    // ==================================

                    html += `<tr>`;


                    // ==================================
                    // CHECKBOX
                    // ==================================

                    if (
                        index === 0
                    ) {

                        html += `

                        <td rowspan="${rowCount}">

                            <input
                                type="checkbox"
                                class="ro-checkbox"
                                value="${escapeHTML(
                                    doc.id
                                )}"
                                onchange="updateDeleteButton()"
                            >

                        </td>

                        `;

                    }


                    // ==================================
                    // RO NUMBER
                    // ==================================

                    if (
                        index === 0
                    ) {

                        html += `

                        <td rowspan="${rowCount}">
                            ${escapeHTML(
                                ro.roNumber || "-"
                            )}
                        </td>

                        `;

                    }


                    // ==================================
                    // DATE
                    // ==================================

                    if (
                        index === 0
                    ) {

                        html += `

                        <td rowspan="${rowCount}">
                            ${escapeHTML(
                                date
                            )}
                        </td>

                        `;

                    }


                    // ==================================
                    // VEHICLE
                    // ==================================

                    if (
                        index === 0
                    ) {

                        html += `

                        <td rowspan="${rowCount}">
                            ${escapeHTML(
                                ro.vehicleNumber || "-"
                            )}
                        </td>

                        `;

                    }


                    // ==================================
                    // ADVISOR
                    // ==================================

                    if (
                        index === 0
                    ) {

                        html += `

                        <td rowspan="${rowCount}">
                            ${escapeHTML(
                                ro.advisorName || "-"
                            )}
                        </td>

                        `;

                    }


                    // ==================================
                    // ITEM CODE
                    // ==================================

                    html += `

                    <td>
                        ${escapeHTML(
                            itemCode
                        )}
                    </td>

                    `;


                    // ==================================
                    // WORK DONE
                    // ==================================

                    html += `

                    <td>
                        ${escapeHTML(
                            description
                        )}
                    </td>

                    `;


                    // ==================================
                    // VIEW
                    // ==================================

                    if (
                        index === 0
                    ) {

                        html += `

                        <td rowspan="${rowCount}">

                            <button
                                class="view-btn"
                                onclick="viewRO('${escapeHTML(
                                    doc.id
                                )}')"
                            >
                                View
                            </button>

                        </td>

                        `;

                    }


                    // ==================================
                    // END ROW
                    // ==================================

                    html += `</tr>`;

                }
            );

        }


        // ==========================================
        // NO RECORDS
        // ==========================================

        if (
            html === ""
        ) {

            html = `

            <tr>

                <td
                    colspan="8"
                    style="
                        text-align:center;
                        color:red;
                        padding:20px;
                    "
                >

                    No Repair Orders Found
                    for the selected month.

                </td>

            </tr>

            `;

        }


        // ==========================================
        // DISPLAY TABLE
        // ==========================================

        const tableBody =
            document.getElementById(
                "repairOrderBody"
            );


        if (
            tableBody
        ) {

            tableBody.innerHTML =
                html;

        }

        else {

            console.error(
                "repairOrderBody not found."
            );

            return;

        }


        // ==========================================
        // RESET SELECT ALL
        // ==========================================

        const selectAll =
            document.getElementById(
                "selectAllRO"
            );


        if (
            selectAll
        ) {

            selectAll.checked =
                false;

        }


        // ==========================================
        // UPDATE DELETE BUTTON
        // ==========================================

        updateDeleteButton();


        // ==========================================
        // STATUS
        // ==========================================

        const status =
            document.getElementById(
                "roStatus"
            );


        if (
            status
        ) {

            status.textContent =
                `${snapshot.size} Repair Order(s) found.`;

        }

    }

    catch (error) {

        console.error(
            "Error loading repair orders:",
            error
        );


        // ==========================================
        // FIRESTORE INDEX ERROR
        // ==========================================

        if (
            error.message &&
            error.message.includes(
                "index"
            )
        ) {

            alert(
                "Firestore needs an index for this query. " +
                "Open the index link shown in the browser console."
            );

        }


        const status =
            document.getElementById(
                "roStatus"
            );


        if (
            status
        ) {

            status.textContent =
                "Unable to load Repair Orders.";

        }

    }

}


// ==========================================
// SELECT ALL
// ==========================================

function toggleSelectAll(
    checkbox
) {

    const checkboxes =
        document.querySelectorAll(
            ".ro-checkbox"
        );


    checkboxes.forEach(
        item => {

            item.checked =
                checkbox.checked;

        }
    );


    updateDeleteButton();

}


// ==========================================
// UPDATE DELETE BUTTON
// ==========================================

function updateDeleteButton() {

    const selected =
        document.querySelectorAll(
            ".ro-checkbox:checked"
        );


    const button =
        document.getElementById(
            "deleteSelectedBtn"
        );


    if (
        !button
    ) {

        return;

    }


    const count =
        selected.length;


    button.disabled =
        count === 0;


    if (
        count === 0
    ) {

        button.textContent =
            "🗑 Delete Selected";

    }

    else {

        button.textContent =
            `🗑 Delete Selected (${count})`;

    }

}


// ==========================================
// DELETE SELECTED ROs
// ==========================================

async function deleteSelectedROs() {

    const selected =
        Array.from(
            document.querySelectorAll(
                ".ro-checkbox:checked"
            )
        )
        .map(
            checkbox =>
                checkbox.value
        );


    if (
        selected.length === 0
    ) {

        alert(
            "Please select at least one Repair Order."
        );

        return;

    }


    const confirmation =
        confirm(
            `Are you sure you want to delete ${selected.length} Repair Order(s)?\n\nThis action cannot be undone.`
        );


    if (
        !confirmation
    ) {

        return;

    }


    try {

        const batch =
            db.batch();


        selected.forEach(
            id => {

                const ref =
                    db.collection(
                        "repairorders"
                    )
                    .doc(id);


                batch.delete(
                    ref
                );

            }
        );


        await batch.commit();


        alert(
            `${selected.length} Repair Order(s) deleted successfully.`
        );


        await loadRepairOrders();

    }

    catch (error) {

        console.error(
            "Delete error:",
            error
        );


        alert(
            "Unable to delete Repair Orders: " +
            error.message
        );

    }

}


// ==========================================
// VIEW REPAIR ORDER
// ==========================================

function viewRO(id) {

    localStorage.setItem(
        "currentRO",
        id
    );


    location =
        "viewRO.html";

}


// ==========================================
// HOME
// ==========================================

function goToLeaderDashboard() {

    window.location.href =
        "leaders.html";

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(
    value
) {

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