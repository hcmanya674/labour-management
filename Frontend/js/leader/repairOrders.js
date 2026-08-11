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

            itemMap[item.itemCode] =
                item.description || "";

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
            // ITEM CODE DISPLAY
            // ==================================

            const itemCodeDisplay =
                itemCodes.length > 0
                    ? itemCodes.join(", ")
                    : "-";


            // ==================================
            // WORK DESCRIPTION
            // ==================================

            const workDescriptions =
                itemCodes
                .map(code => {

                    return itemMap[code] || code;

                })
                .join(", ");


            const workDone =
                workDescriptions || "-";

            // ==================================
            // INCENTIVE AMOUNT
            // ==================================

            const billingAmount =
                Number(ro.billingAmount || 0);
            // ==================================
            // TABLE ROW
            // ==================================

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
                    ${itemCodeDisplay}
                </td>

                <td>
                    ${workDone}
                </td>
                <td>
                        ₹${ro.billingAmount?.toFixed(2) || "0.00"}
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