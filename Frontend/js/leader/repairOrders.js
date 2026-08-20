// ==========================================
// REPAIR ORDERS
// ==========================================

let leaderData = {};
let itemMap = {};


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

            alert("Leader record not found.");

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
        // Load item codes
        // ------------------------------------------

        await loadItemCodes();


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
            `${year}-${String(month + 1).padStart(2, "0")}`;


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

}


// ==========================================
// LOAD ITEM CODES
// ==========================================

async function loadItemCodes() {

    try {

        const snapshot =
            await db.collection("itemcodes")
                .where(
                    "active",
                    "==",
                    true
                )
                .get();


        itemMap = {};


        snapshot.forEach(doc => {

            const item =
                doc.data();


            const itemCode =
                item.itemCode ||
                doc.id;


            itemMap[itemCode] = {

                description:
                    item.description || "",

                billingAmount:
                    Number(
                        item.billingAmount
                    ) || 0

            };

        });


        console.log(
            "Item Map:",
            itemMap
        );

    }

    catch (error) {

        console.error(
            "Error loading item codes:",
            error
        );

    }

}


// ==========================================
// LOAD REPAIR ORDERS
// ==========================================

async function loadRepairOrders() {

    try {

        const selectedMonth =
            document.getElementById(
                "monthFilter"
            ).value;


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


        // ------------------------------------------
        // Start of selected month
        // ------------------------------------------

        const startDate =
            new Date(
                selectedYear,
                selectedMonthNumber - 1,
                1
            );


        // ------------------------------------------
        // Start of next month
        // ------------------------------------------

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


        // ------------------------------------------
        // Firestore query
        // ------------------------------------------

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


        // ------------------------------------------
        // Create rows
        // ------------------------------------------

        for (
            const doc of snapshot.docs
        ) {

            const ro =
                doc.data();


            // ======================================
            // DATE
            // ======================================

            let date = "-";


            if (ro.createdAt) {

                try {

                    date =
                        ro.createdAt
                            .toDate()
                            .toLocaleDateString(
                                "en-GB"
                            );

                }

                catch (e) {

                    console.error(
                        "Date conversion error:",
                        e
                    );

                }

            }


            // ======================================
            // ITEM CODES
            // ======================================

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


            // ======================================
            // NO ITEM CODE
            // ======================================

            if (
                itemCodes.length === 0
            ) {

                html += `

                <tr>

                    <td>

                      <input
                            type="checkbox"
                            class="ro-checkbox"
                            value="${doc.id}"
                            onchange="updateDeleteButton()"
                        >

                    </td>

                    <td>
                        ${ro.roNumber || "-"}
                    </td>

                    <td>
                        ${date}
                    </td>

                    <td>
                        ${ro.vehicleNumber || "-"}
                    </td>

                    <td>
                        ${ro.advisorName || "-"}
                    </td>

                    <td>
                        -
                    </td>

                    <td>
                        -
                    </td>

                    <td>
                        ₹0.00
                    </td>

                    <td>

                        <button
                            class="view-btn"
                            onclick="viewRO('${doc.id}')"
                        >
                            View
                        </button>

                    </td>

                </tr>

                `;

                continue;

            }


            // ======================================
            // ROWSPAN
            // ======================================

            const rowCount =
                itemCodes.length;


            // ======================================
            // ITEM ROWS
            // ======================================

            itemCodes.forEach(
                (
                    itemCode,
                    index
                ) => {

                    let itemInfo =
                        null;


                    // ----------------------------------
                    // Saved item snapshot
                    // ----------------------------------

                    if (
                        Array.isArray(
                            ro.itemDetails
                        )
                    ) {

                        itemInfo =
                            ro.itemDetails.find(
                                item =>
                                    item.itemCode ===
                                    itemCode
                            );

                    }


                    // ----------------------------------
                    // Fallback
                    // ----------------------------------

                    if (!itemInfo) {

                        itemInfo =
                            itemMap[itemCode] || {

                                description:
                                    itemCode,

                                billingAmount:
                                    0

                            };

                    }


                    const description =
                        itemInfo.description ||
                        itemCode;


                    const billingAmount =
                        Number(
                            itemInfo.billingAmount
                        ) || 0;


                    html += `<tr>`;


                    // =================================
                    // CHECKBOX
                    // =================================

                    if (index === 0) {

                        html += `

                        <td rowspan="${rowCount}">

                            <input
                                type="checkbox"
                                class="ro-checkbox"
                                value="${doc.id}"
                                onchange="updateDeleteButton()"
                            >

                        </td>

                        `;

                    }


                    // =================================
                    // RO NUMBER
                    // =================================

                    if (index === 0) {

                        html += `

                        <td rowspan="${rowCount}">
                            ${ro.roNumber || "-"}
                        </td>

                        `;

                    }


                    // =================================
                    // DATE
                    // =================================

                    if (index === 0) {

                        html += `

                        <td rowspan="${rowCount}">
                            ${date}
                        </td>

                        `;

                    }


                    // =================================
                    // VEHICLE
                    // =================================

                    if (index === 0) {

                        html += `

                        <td rowspan="${rowCount}">
                            ${ro.vehicleNumber || "-"}
                        </td>

                        `;

                    }


                    // =================================
                    // ADVISOR
                    // =================================

                    if (index === 0) {

                        html += `

                        <td rowspan="${rowCount}">
                            ${ro.advisorName || "-"}
                        </td>

                        `;

                    }


                    // =================================
                    // ITEM CODE
                    // =================================

                    html += `

                    <td>
                        ${itemCode}
                    </td>

                    `;


                    // =================================
                    // WORK DONE
                    // =================================

                    html += `

                    <td>
                        ${description}
                    </td>

                    `;


                    // =================================
                    // BILLING
                    // =================================

                    html += `

                    <td>

                        ₹${billingAmount.toLocaleString(
                            "en-IN",
                            {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }
                        )}

                    </td>

                    `;


                    // =================================
                    // VIEW
                    // =================================

                    if (index === 0) {

                        html += `

                        <td rowspan="${rowCount}">

                            <button
                                class="view-btn"
                                onclick="viewRO('${doc.id}')"
                            >
                                View
                            </button>

                        </td>

                        `;

                    }


                    html += `</tr>`;

                }
            );

        }


        // ==========================================
        // NO RECORDS
        // ==========================================

        if (html === "") {

            html = `

            <tr>

                <td
                    colspan="9"
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
        // DISPLAY
        // ==========================================

    
        const tableBody =
            document.getElementById(
                "repairOrderBody"
            );


        if (tableBody) {

            tableBody.innerHTML =
                html;

        }
        else {

            console.error(
                "repairOrderBody not found."
            );

            return;

        }


        updateDeleteButton();


        const selectAll =
        document.getElementById(
            "selectAllRO"
        );


    if (selectAll) {

        selectAll.checked = false;

    }


        // ==========================================
        // STATUS
        // ==========================================

        document.getElementById(
            "roStatus"
        ).textContent =
            `${snapshot.size} Repair Order(s) found.`;


    }

    catch (error) {

        console.error(
            "Error loading repair orders:",
            error
        );


        // ==========================================
        // Firestore index error
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


        document.getElementById(
            "roStatus"
        ).textContent =
            "Unable to load Repair Orders.";

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


    if (!button) {

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


    if (!confirmation) {

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