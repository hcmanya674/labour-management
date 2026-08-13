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

        location = "../../pages/auth/loginindex.html";

        return;
    }

    try {

        const leaderDoc = await db.collection("users")
            .doc(user.uid)
            .get();

        if (!leaderDoc.exists) {

            alert("Leader record not found.");

            return;
        }

        leaderData = leaderDoc.data();

        console.log("Leader Data:", leaderData);

        // Load item code descriptions first
        await loadItemCodes();

        // Then load repair orders
        await loadRepairOrders();

    }

    catch (error) {

        console.error(
            "Error loading repair orders:",
            error
        );

    }

});


// ==========================================
// LOAD ITEM CODES
// ==========================================

async function loadItemCodes() {

    try {

        const snapshot = await db.collection("itemcodes")
            .where("active", "==", true)
            .get();

        itemMap = {};

        snapshot.forEach(doc => {

            const item = doc.data();

            itemMap[item.itemCode] ={
                description: item.description || "",
                billingAmount: Number(item.billingAmount) || 0
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

        const snapshot =
            await db.collection("repairorders")
            .where(
                "region",
                "==",
                leaderData.region
            )
            .orderBy(
                "createdAt",
                "desc"
            )
            .get();


        let html = "";


        // ======================================
        // LOOP THROUGH REPAIR ORDERS
        // ======================================

        for (const doc of snapshot.docs) {

            const ro = doc.data();


            // ==================================
            // DATE
            // ==================================

            let date = "-";

            if (ro.createdAt) {

                try {

                    date =
                        ro.createdAt
                        .toDate()
                        .toLocaleDateString("en-GB");

                }

                catch (e) {

                    console.log(
                        "Date conversion error:",
                        e
                    );

                }

            }


            // ==================================
            // ITEM CODES
            // ==================================

            let itemCodes = [];


            // New records
            if (
                Array.isArray(ro.itemCodes)
            ) {

                itemCodes = ro.itemCodes;

            }

            // Old records
            else if (ro.itemCode) {

                itemCodes = [
                    ro.itemCode
                ];

            }


            // ==================================
            // NO ITEM CODE
            // ==================================

            if (itemCodes.length === 0) {

                html += `

                <tr>

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
                            onclick="viewRO('${doc.id}')">

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
            // CREATE ONE ROW FOR EACH ITEM
            // ==================================

            itemCodes.forEach(
                (itemCode, index) => {


                    // ----------------------------------
                    // ITEM INFORMATION
                    // ----------------------------------

                    const itemInfo =
                        itemMap[itemCode] || {

                            description:
                                itemCode,

                            billingAmount: 0

                        };


                    const description =
                        itemInfo.description ||
                        itemCode;


                    const billingAmount =
                        Number(itemInfo.billingAmount) || 0;


                    // ----------------------------------
                    // FIRST ROW
                    // ----------------------------------

                    html += `<tr>`;


                    // ----------------------------------
                    // RO NUMBER
                    // ----------------------------------

                    if (index === 0) {

                        html += `

                        <td rowspan="${rowCount}">
                            ${ro.roNumber || "-"}
                        </td>

                        `;

                    }


                    // ----------------------------------
                    // DATE
                    // ----------------------------------

                    if (index === 0) {

                        html += `

                        <td rowspan="${rowCount}">
                            ${date}
                        </td>

                        `;

                    }


                    // ----------------------------------
                    // VEHICLE
                    // ----------------------------------

                    if (index === 0) {

                        html += `

                        <td rowspan="${rowCount}">
                            ${ro.vehicleNumber || "-"}
                        </td>

                        `;

                    }


                    // ----------------------------------
                    // ADVISOR
                    // ----------------------------------

                    if (index === 0) {

                        html += `

                        <td rowspan="${rowCount}">
                            ${ro.advisorName || "-"}
                        </td>

                        `;

                    }


                    // ----------------------------------
                    // ITEM CODE
                    // ----------------------------------

                    html += `

                    <td>
                        ${itemCode}
                    </td>

                    `;


                    // ----------------------------------
                    // WORK DONE
                    // ----------------------------------

                    html += `

                    <td>
                        ${description}
                    </td>

                    `;


                    // ----------------------------------
                    // BILLING AMOUNT
                    // ----------------------------------

                    html += `

                    <td>
                        ₹${billingAmount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </td>

                    `;


                    // ----------------------------------
                    // VIEW BUTTON
                    // ----------------------------------

                    if (index === 0) {

                        html += `

                        <td rowspan="${rowCount}">

                            <button
                                class="view-btn"
                                onclick="viewRO('${doc.id}')">

                                View

                            </button>

                        </td>

                        `;

                    }


                    html += `</tr>`;

                }

            );

        }


        // ======================================
        // NO RECORDS
        // ======================================

        if (html === "") {

            html = `

            <tr>

                <td
                    colspan="8"
                    style="
                        text-align:center;
                        color:red;
                    ">

                    No Repair Orders Found

                </td>

            </tr>

            `;

        }


        // ======================================
        // DISPLAY TABLE
        // ======================================

        document
            .querySelector("#roTable tbody")
            .innerHTML = html;


    }

    catch (error) {

        console.error(
            "Error loading repair orders:",
            error
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

    location = "viewRO.html";

}

function goToLeaderDashboard() {

    window.location.href = "leaders.html";

}