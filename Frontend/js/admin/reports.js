// =====================================================
// LABOUR MANAGEMENT SYSTEM
// REPORTS.JS
// =====================================================
//
// Handles:
//
// 1. Region Loading
// 2. Repair Order Report
// 3. Advisor Wise Work Summary
// 4. Advisor Item & Amount Report
// 5. Repair Order PDF Export
// 6. Advisor Item & Amount PDF Export
//
// IMPORTANT:
// Item Code is stored as NUMBER in Firestore:
//
// itemCode: 1
// itemCode: 2
// itemCode: 3
//
// But Firestore document ID is STRING:
//
// itemcodes/"1"
// itemcodes/"2"
// itemcodes/"3"
//
// Therefore always use:
//
// .doc(String(itemCode))
//
// =====================================================


// =====================================================
// INITIALIZE PAGE
// =====================================================

initializePage();


function initializePage() {

    loadRegions();

}


// =====================================================
// LOAD ACTIVE REGIONS
// =====================================================

function loadRegions() {

    db.collection("regions")
        .where("active", "==", true)
        .get()

        .then((snapshot) => {

            let html =
                `<option value="">All Regions</option>`;


            snapshot.forEach((doc) => {

                const region =
                    doc.data();


                html += `

                    <option value="${region.regionId}">
                        ${region.regionName}
                    </option>

                `;

            });


            const regionSelect =
                document.getElementById(
                    "reportRegion"
                );


            if (regionSelect) {

                regionSelect.innerHTML =
                    html;

            }

        })

        .catch((error) => {

            console.error(
                "Error loading regions:",
                error
            );

        });

}


/// =====================================================
// GENERATE MAIN REPAIR ORDER REPORT
// =====================================================

async function generateReport() {

    const fromDate =
        document.getElementById("fromDate").value;

    const toDate =
        document.getElementById("toDate").value;

    const selectedRegion =
        document.getElementById("reportRegion").value;

    const btn =
        document.getElementById("generateBtn");

    const exportBtn =
        document.getElementById("exportBtn");

    const advisorExportBtn =
        document.getElementById("advisorExportBtn");


    // =====================================================
    // DISABLE BUTTONS
    // =====================================================

    if (advisorExportBtn) {
        advisorExportBtn.disabled = true;
    }

    if (exportBtn) {
        exportBtn.disabled = true;
    }

    btn.disabled = true;

    btn.innerHTML = `
        <div class="spinner"></div>
        Generating...
    `;


    // =====================================================
    // DATE VALIDATION
    // =====================================================

    if (!fromDate || !toDate) {

        alert(
            "Please select From Date and To Date."
        );

        btn.disabled = false;
        btn.innerHTML = "Generate Report";

        return;
    }


    // =====================================================
    // DATE RANGE
    // =====================================================

    const start =
        new Date(fromDate);

    start.setHours(
        0,
        0,
        0,
        0
    );


    const end =
        new Date(toDate);

    end.setHours(
        23,
        59,
        59,
        999
    );


    try {

        // =================================================
        // LOAD ITEM CODE MASTER
        //
        // IMPORTANT:
        // Match using item.itemCode
        // NOT Firestore document ID
        // =================================================

        const itemSnapshot =
            await db
                .collection("itemcodes")
                .get();


        const itemMap = {};


        itemSnapshot.forEach(doc => {

            const item =
                doc.data();


            // ---------------------------------------------
            // Normalize Item Code
            // ---------------------------------------------

            const code =
                String(
                    Number(item.itemCode)
                );


            if (
                code !== "NaN"
            ) {

                itemMap[code] = {

                    itemCode:
                        Number(item.itemCode),

                    description:
                        item.description || "-",

                    billingAmount:
                        Number(
                            item.billingAmount
                        ) || 0,

                    incentiveAmount:
                        Number(
                            item.incentiveAmount
                        ) || 0,

                    active:
                        item.active !== false,

                    deleted:
                        item.deleted === true

                };

            }

        });


        console.log(
            "ITEM CODE MASTER:",
            itemMap
        );


        // =================================================
        // LOAD REGIONS
        // =================================================

        const regionSnapshot =
            await db
                .collection("regions")
                .get();


        const regionMap = {};


        regionSnapshot.forEach(doc => {

            const region =
                doc.data();


            regionMap[doc.id] =
                region.regionName || doc.id;

        });


        // =================================================
        // LOAD REPAIR ORDERS
        // =================================================

        let query =
            db.collection("repairorders");


        // =================================================
        // REGION FILTER
        // =================================================

        if (
            selectedRegion !== ""
        ) {

            query =
                query.where(
                    "region",
                    "==",
                    selectedRegion
                );

        }


        const snapshot =
            await query.get();


        // =================================================
        // REPORT VARIABLES
        // =================================================

        let html = "";

        let advisorSummary = {};

        let allWorkTypes =
            new Set();


        // =================================================
        // PROCESS EACH REPAIR ORDER
        // =================================================

        for (
            const doc of snapshot.docs
        ) {

            const ro =
                doc.data();


            // =================================================
            // CREATED DATE
            // =================================================

            if (
                !ro.createdAt
            ) {

                continue;

            }


            const createdDate =
                ro.createdAt.toDate();


            // =================================================
            // DATE FILTER
            // =================================================

            if (
                createdDate < start ||
                createdDate > end
            ) {

                continue;

            }


            // =================================================
            // REGION NAME
            // =================================================

            const regionName =
                regionMap[ro.region] ||
                ro.region ||
                "-";


            // =================================================
            // GET ITEM CODES
            // =================================================

            let itemCodes = [];


            // New format
            if (
                Array.isArray(
                    ro.itemCodes
                )
            ) {

                itemCodes =
                    ro.itemCodes;

            }

            // Older format
            else if (
                ro.itemCodes !== undefined &&
                ro.itemCodes !== null &&
                ro.itemCodes !== ""
            ) {

                itemCodes = [
                    ro.itemCodes
                ];

            }

            // Very old format
            else if (
                ro.itemCode !== undefined &&
                ro.itemCode !== null &&
                ro.itemCode !== ""
            ) {

                itemCodes = [
                    ro.itemCode
                ];

            }


            console.log(
                "RO:",
                ro.roNumber,
                "Item Codes:",
                itemCodes
            );


            // =================================================
            // BILLING
            // =================================================

            let billingAmount =
                0;


            // =================================================
            // WORK DESCRIPTIONS
            // =================================================

            let workDescriptions =
                [];


            // =================================================
            // PROCESS EACH ITEM CODE
            // =================================================

            itemCodes.forEach(
                rawItemCode => {

                    // -----------------------------------------
                    // Normalize Item Code
                    // -----------------------------------------

                    const numericCode =
                        Number(
                            rawItemCode
                        );


                    const codeKey =
                        String(
                            numericCode
                        );


                    console.log(
                        "Looking for Item Code:",
                        rawItemCode,
                        "Normalized:",
                        codeKey
                    );


                    // -----------------------------------------
                    // FIND ITEM MASTER
                    // -----------------------------------------

                    const item =
                        itemMap[codeKey];


                    // -----------------------------------------
                    // ITEM FOUND
                    // -----------------------------------------

                    if (item) {

                        // Billing
                        billingAmount +=
                            Number(
                                item.billingAmount
                            ) || 0;


                        // Description
                        workDescriptions.push(
                            `${item.itemCode} - ${item.description}`
                        );


                    }

                    // -----------------------------------------
                    // ITEM NOT FOUND
                    // -----------------------------------------

                    else {

                        console.warn(
                            "Item Code not found in itemcodes:",
                            rawItemCode
                        );


                        // Keep code visible
                        workDescriptions.push(
                            `${rawItemCode} - Item Description Not Found`
                        );

                    }

                }
            );


            // =================================================
            // WORK DONE DISPLAY
            // =================================================

            let workDone =
                "-";


            if (
                workDescriptions.length > 0
            ) {

                workDone =
                    workDescriptions
                        .map(
                            item => `
                                <div class="work-item">
                                    ${item}
                                </div>
                            `
                        )
                        .join("");

            }


            // =================================================
            // ADVISOR
            // =================================================

            const advisor =
                ro.advisorName ||
                "Unknown Advisor";


            // =================================================
            // ADVISOR SUMMARY
            // =================================================

            if (
                !advisorSummary[advisor]
            ) {

                advisorSummary[advisor] =
                    {};

            }


            if (
                !advisorSummary[advisor][workDone]
            ) {

                advisorSummary[advisor][workDone] =
                    0;

            }


            advisorSummary[advisor][workDone]++;


            allWorkTypes.add(
                workDone
            );


            // =================================================
            // FORMAT DATE
            // =================================================

            const date =
                createdDate.toLocaleDateString(
                    "en-GB"
                );


            // =================================================
            // CREATE REPORT ROW
            // =================================================

            html += `

                <tr>

                    <td>
                        ${ro.roNumber || "-"}
                    </td>

                    <td>
                        ${date}
                    </td>

                    <td>
                        ${regionName}
                    </td>

                    <td>
                        ${advisor}
                    </td>

                    <td>
                        ${ro.vehicleNumber || "-"}
                    </td>

                    <td>
                        ${workDone}
                    </td>

                    <td>
                        ₹${billingAmount.toLocaleString("en-IN")}
                    </td>

                </tr>

            `;

        }


        // =====================================================
        // ADVISOR WISE SUMMARY
        // =====================================================

        const workTypes =
            Array.from(
                allWorkTypes
            );


        // =====================================================
        // HEADER
        // =====================================================

        let head =
            "<tr><th>Advisor Name</th>";


        workTypes.forEach(
            work => {

                head += `
                    <th>
                        ${work}
                    </th>
                `;

            }
        );


        head +=
            "<th>Total</th></tr>";


        const advisorSummaryHead =
            document.getElementById(
                "advisorSummaryHead"
            );


        if (
            advisorSummaryHead
        ) {

            advisorSummaryHead.innerHTML =
                head;

        }


        // =====================================================
        // BODY
        // =====================================================

        let body = "";

        let columnTotals = {};

        let grandTotal = 0;


        for (
            const advisor in advisorSummary
        ) {

            body += `
                <tr>
            `;


            body += `
                <td>
                    ${advisor}
                </td>
            `;


            let rowTotal =
                0;


            workTypes.forEach(
                work => {

                    const count =
                        advisorSummary[advisor][work] ||
                        0;


                    body += `
                        <td>
                            ${count}
                        </td>
                    `;


                    rowTotal +=
                        count;


                    columnTotals[work] =
                        (
                            columnTotals[work] ||
                            0
                        ) +
                        count;

                }
            );


            body += `
                <td>
                    <b>
                        ${rowTotal}
                    </b>
                </td>
            `;


            body += `
                </tr>
            `;


            grandTotal +=
                rowTotal;

        }


        // =====================================================
        // TOTAL ROW
        // =====================================================

        body += `

            <tr
                style="
                    font-weight:bold;
                    background:#f5f5f5;
                "
            >

                <td>
                    TOTAL
                </td>

        `;


        workTypes.forEach(
            work => {

                body += `
                    <td>
                        ${columnTotals[work] || 0}
                    </td>
                `;

            }
        );


        body += `

                <td>
                    ${grandTotal}
                </td>

            </tr>

        `;


        const advisorSummaryBody =
            document.getElementById(
                "advisorSummaryBody"
            );


        if (
            advisorSummaryBody
        ) {

            advisorSummaryBody.innerHTML =
                body;

        }


        // =====================================================
        // DISPLAY MAIN REPORT
        // =====================================================

        const reportBody =
            document.getElementById(
                "reportBody"
            );


        if (
            html === ""
        ) {

            reportBody.innerHTML = `

                <tr>

                    <td
                        colspan="7"
                        style="
                            text-align:center;
                            color:red;
                            font-size:18px;
                            font-weight:bold;
                            padding:20px;
                        "
                    >
                        No Repair Orders Found
                    </td>

                </tr>

            `;


            exportBtn.disabled =
                true;

        }

        else {

            reportBody.innerHTML =
                html;


            exportBtn.disabled =
                false;

        }


        // =====================================================
        // ENABLE ADVISOR REPORT BUTTON
        // =====================================================

        if (
            advisorExportBtn
        ) {

            advisorExportBtn.disabled =
                false;

        }


        // =====================================================
        // RESTORE BUTTON
        // =====================================================

        btn.disabled =
            false;

        btn.innerHTML =
            "Generate Report";


        console.log(
            "Report generated successfully."
        );

    }

    catch (error) {

        console.error(
            "REPORT ERROR:",
            error
        );


        alert(
            "Unable to generate report.\n\n" +
            error.message
        );


        btn.disabled =
            false;

        btn.innerHTML =
            "Generate Report";


        if (
            exportBtn
        ) {

            exportBtn.disabled =
                true;

        }

    }

}
// =====================================================
// ADVISOR ITEM & AMOUNT REPORT
// =====================================================

async function generateAdvisorItemReport() {

    const advisorExportBtn =
        document.getElementById(
            "advisorExportBtn"
        );


    if (advisorExportBtn) {

        advisorExportBtn.disabled =
            true;

    }


    const fromDate =
        document.getElementById(
            "fromDate"
        ).value;


    const toDate =
        document.getElementById(
            "toDate"
        ).value;


    const selectedRegion =
        document.getElementById(
            "reportRegion"
        ).value;


    // =================================================
    // VALIDATE DATES
    // =================================================

    if (
        !fromDate ||
        !toDate
    ) {

        alert(
            "Please select From Date and To Date."
        );

        return;

    }


    const from =
        new Date(fromDate);


    from.setHours(
        0,
        0,
        0,
        0
    );


    const to =
        new Date(toDate);


    to.setHours(
        23,
        59,
        59,
        999
    );


    if (from > to) {

        alert(
            "From Date cannot be greater than To Date."
        );

        return;

    }


    try {

        // =================================================
        // LOAD ALL ITEM CODES
        // =================================================
        //
        // IMPORTANT:
        // We intentionally DO NOT use:
        //
        // .where("active", "==", true)
        //
        // because deleted/inactive Item Codes can still
        // belong to old Repair Orders.
        //
        // Historical reports must still show their
        // original billing amount and description.
        //
        // =================================================

        const itemSnapshot =
            await db
                .collection(
                    "itemcodes"
                )
                .get();


        const itemMap = {};


        itemSnapshot.forEach(
            (doc) => {

                const item =
                    doc.data();


                const itemCodeKey =
                    String(
                        item.itemCode
                    );


                itemMap[
                    itemCodeKey
                ] = {

                    description:
                        item.description ||
                        "-",

                    billingAmount:
                        Number(
                            item.billingAmount
                        ) || 0

                };

            }
        );


        // =================================================
        // LOAD REPAIR ORDERS
        // =================================================

        let roQuery =
            db.collection(
                "repairorders"
            );


        // =================================================
        // REGION FILTER
        // =================================================

        if (
            selectedRegion !== ""
        ) {

            roQuery =
                roQuery.where(
                    "region",
                    "==",
                    selectedRegion
                );

        }


        const roSnapshot =
            await roQuery.get();


        // =================================================
        // STORE DATA BY ADVISOR
        // =================================================

        const advisorData = {};


        // =================================================
        // PROCESS REPAIR ORDERS
        // =================================================

        roSnapshot.forEach(
            (doc) => {

                const ro =
                    doc.data();


                // =============================================
                // DATE VALIDATION
                // =============================================

                if (
                    !ro.createdAt
                ) {

                    return;

                }


                let createdDate;


                try {

                    createdDate =
                        ro.createdAt.toDate();

                }

                catch (error) {

                    console.warn(
                        "Invalid createdAt:",
                        doc.id
                    );

                    return;

                }


                // =============================================
                // DATE FILTER
                // =============================================

                if (
                    createdDate < from ||
                    createdDate > to
                ) {

                    return;

                }


                // =============================================
                // ADVISOR
                // =============================================

                const advisor =
                    ro.advisorName ||
                    "Unknown Advisor";


                // =============================================
                // ITEM CODES
                // =============================================

                let items = [];


                if (
                    Array.isArray(
                        ro.itemCodes
                    )
                ) {

                    items =
                        ro.itemCodes;

                }

                else if (
                    ro.itemCodes !==
                    undefined &&
                    ro.itemCodes !==
                    null &&
                    ro.itemCodes !== ""
                ) {

                    items = [
                        ro.itemCodes
                    ];

                }

                else if (
                    ro.itemCode !==
                    undefined &&
                    ro.itemCode !==
                    null &&
                    ro.itemCode !== ""
                ) {

                    items = [
                        ro.itemCode
                    ];

                }


                // =============================================
                // CREATE ADVISOR
                // =============================================

                if (
                    !advisorData[
                        advisor
                    ]
                ) {

                    advisorData[
                        advisor
                    ] = {

                        items: {},

                        incentive: 0

                    };

                }


                // =============================================
                // COUNT ITEMS
                // =============================================

                items.forEach(
                    (rawItemCode) => {

                        // =====================================
                        // NORMALIZE ITEM CODE
                        // =====================================

                        const itemCodeKey =
                            String(
                                rawItemCode
                            );


                        if (
                            !advisorData[
                                advisor
                            ].items[
                                itemCodeKey
                            ]
                        ) {

                            advisorData[
                                advisor
                            ].items[
                                itemCodeKey
                            ] = {

                                quantity:
                                    0

                            };

                        }


                        advisorData[
                            advisor
                        ].items[
                            itemCodeKey
                        ].quantity++;

                    }
                );


                // =============================================
                // INCENTIVE AMOUNT
                // =============================================

                const incentive =
                    Number(
                        ro.incentiveAmount
                    ) || 0;


                advisorData[
                    advisor
                ].incentive +=
                    incentive;

            }
        );


        // =================================================
        // DISPLAY REPORT
        // =================================================

        const container =
            document.getElementById(
                "advisorItemReportContainer"
            );


        if (!container) {

            alert(
                "Advisor Item Report container not found."
            );

            return;

        }


        container.innerHTML =
            "";


        const advisors =
            Object.keys(
                advisorData
            ).sort();


        // =================================================
        // NO DATA
        // =================================================

        if (
            advisors.length === 0
        ) {

            container.innerHTML = `

                <div
                    style="
                        text-align:center;
                        color:red;
                        font-weight:bold;
                        padding:20px;
                    "
                >

                    No data found for selected dates.

                </div>

            `;


            if (advisorExportBtn) {

                advisorExportBtn.disabled =
                    true;

            }


            return;

        }


        // =================================================
        // CREATE ADVISOR SECTIONS
        // =================================================

        advisors.forEach(
            (advisor) => {

                const items =
                    advisorData[
                        advisor
                    ].items;


                const incentiveAmount =
                    advisorData[
                        advisor
                    ].incentive || 0;


                // =============================================
                // ADVISOR HEADING
                // =============================================

                const advisorTitle =
                    document.createElement(
                        "h3"
                    );


                advisorTitle.textContent =
                    "Advisor: " +
                    advisor;


                advisorTitle.style.marginTop =
                    "25px";


                advisorTitle.style.marginBottom =
                    "10px";


                container.appendChild(
                    advisorTitle
                );


                // =============================================
                // TABLE
                // =============================================

                const table =
                    document.createElement(
                        "table"
                    );


                table.className =
                    "advisor-item-table";


                table.innerHTML = `

                    <thead>

                        <tr>

                            <th>
                                Item Code
                            </th>

                            <th>
                                Description
                            </th>

                            <th>
                                Items Done
                            </th>

                            <th>
                                Total Amount
                            </th>

                        </tr>

                    </thead>

                    <tbody></tbody>

                `;


                const tbody =
                    table.querySelector(
                        "tbody"
                    );


                let advisorTotal =
                    0;


                // =============================================
                // SORT ITEM CODES NUMERICALLY
                // =============================================

                const sortedItems =
                    Object.keys(
                        items
                    ).sort(
                        (a, b) =>
                            Number(a) -
                            Number(b)
                    );


                // =============================================
                // ITEMS
                // =============================================

                sortedItems.forEach(
                    (itemCode) => {

                        const quantity =
                            items[
                                itemCode
                            ].quantity;


                        // =====================================
                        // GET ITEM INFORMATION
                        // =====================================

                        const itemInfo =
                            itemMap[
                                String(
                                    itemCode
                                )
                            ] || {

                                description:
                                    "-",

                                billingAmount:
                                    0

                            };


                        // =====================================
                        // TOTAL AMOUNT
                        // =====================================

                        const total =
                            quantity *
                            itemInfo.billingAmount;


                        advisorTotal +=
                            total;


                        // =====================================
                        // CREATE ROW
                        // =====================================

                        const row =
                            document.createElement(
                                "tr"
                            );


                        row.innerHTML = `

                            <td>
                                ${itemCode}
                            </td>

                            <td>
                                ${itemInfo.description}
                            </td>

                            <td
                                class="quantity-cell"
                            >
                                ${quantity}
                            </td>

                            <td
                                class="amount-cell"
                            >
                                ₹${total.toLocaleString("en-IN")}
                            </td>

                        `;


                        tbody.appendChild(
                            row
                        );

                    }
                );


                container.appendChild(
                    table
                );


                // =============================================
                // BILLING / INCENTIVE / NET BILLING
                // =============================================

                const totalDiv =
                    document.createElement(
                        "div"
                    );


                totalDiv.className =
                    "advisor-total";


                // =============================================
                // NET BILLING
                // =============================================

                const netAmount =
                    advisorTotal -
                    incentiveAmount;


                totalDiv.innerHTML = `

                    <div>

                        Total Billing:

                        <strong>
                            ₹${advisorTotal.toLocaleString("en-IN")}
                        </strong>

                    </div>

                    <div>

                        Incentive Amount:

                        <strong>
                            ₹${incentiveAmount.toLocaleString("en-IN")}
                        </strong>

                    </div>

                    <div>

                        Net Billing:

                        <strong>
                            ₹${netAmount.toLocaleString("en-IN")}
                        </strong>

                    </div>

                `;


                container.appendChild(
                    totalDiv
                );

            }
        );


        // =================================================
        // ENABLE ADVISOR PDF
        // =================================================

        if (advisorExportBtn) {

            advisorExportBtn.disabled =
                false;

        }

    }

    catch (error) {

        console.error(
            "Advisor report error:",
            error
        );


        alert(
            "Unable to generate Advisor Item Report.\n\n" +
            error.message
        );


        if (advisorExportBtn) {

            advisorExportBtn.disabled =
                true;

        }

    }

}


// =====================================================
// EXPORT REPAIR ORDER PDF
// =====================================================

async function exportPDF() {

    // =================================================
    // CHECK jsPDF
    // =================================================

    if (
        !window.jspdf ||
        !window.jspdf.jsPDF
    ) {

        alert(
            "jsPDF library is not loaded."
        );

        return;

    }


    const {
        jsPDF
    } =
        window.jspdf;


    const doc =
        new jsPDF(
            "p",
            "mm",
            "a4"
        );


    // =================================================
    // HEADING
    // =================================================

    doc.setFontSize(
        18
    );


    doc.text(
        "Labour Management System",
        105,
        15,
        {
            align: "center"
        }
    );


    doc.setFontSize(
        14
    );


    doc.text(
        "Repair Order Report",
        105,
        24,
        {
            align: "center"
        }
    );


    // =================================================
    // FILTERS
    // =================================================

    const fromDate =
        document.getElementById(
            "fromDate"
        ).value;


    const toDate =
        document.getElementById(
            "toDate"
        ).value;


    const region =
        document.getElementById(
            "reportRegion"
        );


    doc.setFontSize(
        10
    );


    const from =
        fromDate
            ? new Date(
                fromDate
            ).toLocaleDateString(
                "en-GB"
            )
            : "-";


    const to =
        toDate
            ? new Date(
                toDate
            ).toLocaleDateString(
                "en-GB"
            )
            : "-";


    doc.text(
        `From : ${from}   To : ${to}`,
        14,
        35
    );


    const selectedRegionText =
        region &&
        region.selectedIndex >= 0

            ? region
                .options[
                    region.selectedIndex
                ]
                .text

            : "All Regions";


    doc.text(
        `Region : ${selectedRegionText}`,
        14,
        41
    );


    // =================================================
    // EXTRACT REPORT TABLE
    // =================================================

    const rows =
        [];


    document
        .querySelectorAll(
            "#reportBody tr"
        )
        .forEach(
            (tr) => {

                const row =
                    [];


                tr.querySelectorAll(
                    "td"
                ).forEach(
                    (td) => {

                        row.push(
                            td.innerText
                                .trim()
                        );

                    }
                );


                // =============================================
                // Only include actual 7-column rows
                // =============================================

                if (
                    row.length === 7
                ) {

                    rows.push(
                        row
                    );

                }

            }
        );


    // =================================================
    // NO DATA
    // =================================================

    if (
        rows.length === 0
    ) {

        alert(
            "Please generate the Repair Order Report first."
        );

        return;

    }


    // =================================================
    // PDF TABLE
    // =================================================

    doc.autoTable({

        startY:
            48,

        head: [[

            "RO Number",

            "Date",

            "Region",

            "Advisor",

            "Vehicle",

            "Work Done",

            "Billing Amount"

        ]],

        body:
            rows,

        theme:
            "grid",

        styles: {

            fontSize:
                8,

            cellPadding:
                2,

            valign:
                "middle"

        },

        headStyles: {

            fillColor: [
                41,
                128,
                185
            ],

            textColor:
                255,

            fontStyle:
                "bold"

        },

        columnStyles: {

            0: {
                cellWidth: 23
            },

            1: {
                cellWidth: 22
            },

            2: {
                cellWidth: 25
            },

            3: {
                cellWidth: 28
            },

            4: {
                cellWidth: 25
            },

            5: {
                cellWidth: 45
            },

            6: {
                cellWidth: 25,
                halign: "right"
            }

        }

    });


    // =================================================
    // FOOTER
    // =================================================

    doc.setFontSize(
        10
    );


    const generatedOn =
        new Date()
            .toLocaleString(
                "en-GB",
                {

                    day:
                        "2-digit",

                    month:
                        "2-digit",

                    year:
                        "numeric",

                    hour:
                        "2-digit",

                    minute:
                        "2-digit",

                    second:
                        "2-digit",

                    hour12:
                        true

                }
            );


    const finalY =
        doc.lastAutoTable &&
        doc.lastAutoTable.finalY

            ? doc.lastAutoTable.finalY

            : 48;


    // =================================================
    // CHECK FOOTER SPACE
    // =================================================

    if (
        finalY >
        doc.internal.pageSize.height -
        20
    ) {

        doc.addPage();

        doc.text(
            `Generated on : ${generatedOn}`,
            14,
            15
        );

    }

    else {

        doc.text(
            `Generated on : ${generatedOn}`,
            14,
            finalY + 15
        );

    }


    // =================================================
    // FILE NAME
    // =================================================

    const regionName =
        selectedRegionText
            .replace(
                /\s+/g,
                "_"
            )
            .replace(
                /[^a-zA-Z0-9_-]/g,
                ""
            );


    const reportDate =
        new Date()
            .toLocaleDateString(
                "en-GB"
            )
            .replace(
                /\//g,
                "-"
            );


    const fileName =
        `Repair_Report_${regionName}_${reportDate}.pdf`;


    // =================================================
    // SAVE PDF
    // =================================================

    doc.save(
        fileName
    );

}


// =====================================================
// EXPORT ADVISOR ITEM & AMOUNT PDF
// =====================================================

async function exportAdvisorItemPDF() {

    // =================================================
    // CHECK jsPDF
    // =================================================

    if (
        !window.jspdf ||
        !window.jspdf.jsPDF
    ) {

        alert(
            "jsPDF library is not loaded."
        );

        return;

    }


    const {
        jsPDF
    } =
        window.jspdf;


    const doc =
        new jsPDF(
            "p",
            "mm",
            "a4"
        );


    // =================================================
    // PAGE SETTINGS
    // =================================================

    const pageWidth =
        doc.internal.pageSize
            .getWidth();


    const pageHeight =
        doc.internal.pageSize
            .getHeight();


    const leftMargin =
        14;


    const rightMargin =
        14;


    let currentY =
        15;


    // =================================================
    // FORMAT MONEY
    // =================================================

    function formatMoney(
        value
    ) {

        if (
            value ===
            null ||
            value ===
            undefined
        ) {

            return "Rs. 0";

        }


        let text =
            String(
                value
            ).trim();


        text =
            text
                .replace(
                    /₹/g,
                    ""
                )
                .replace(
                    /Rs\.?/gi,
                    ""
                )
                .replace(
                    /,/g,
                    ""
                )
                .replace(
                    /\s/g,
                    ""
                )
                .replace(
                    /[^\d.-]/g,
                    ""
                );


        const number =
            Number(
                text
            );


        if (
            isNaN(number)
        ) {

            return "Rs. 0";

        }


        return (
            "Rs. " +
            number.toLocaleString(
                "en-IN"
            )
        );

    }


    // =================================================
    // HEADING
    // =================================================

    doc.setFont(
        "helvetica",
        "normal"
    );


    doc.setFontSize(
        18
    );


    doc.text(
        "Labour Management System",
        pageWidth / 2,
        currentY,
        {
            align:
                "center"
        }
    );


    currentY +=
        9;


    doc.setFontSize(
        14
    );


    doc.text(
        "Advisor Item & Amount Report",
        pageWidth / 2,
        currentY,
        {
            align:
                "center"
        }
    );


    currentY +=
        11;


    // =================================================
    // DATE
    // =================================================

    const fromDate =
        document.getElementById(
            "fromDate"
        ).value;


    const toDate =
        document.getElementById(
            "toDate"
        ).value;


    let from =
        "-";


    let to =
        "-";


    if (
        fromDate
    ) {

        from =
            new Date(
                fromDate
            ).toLocaleDateString(
                "en-GB"
            );

    }


    if (
        toDate
    ) {

        to =
            new Date(
                toDate
            ).toLocaleDateString(
                "en-GB"
            );

    }


    doc.setFontSize(
        10
    );


    doc.setFont(
        "helvetica",
        "normal"
    );


    doc.text(
        `From : ${from}    To : ${to}`,
        leftMargin,
        currentY
    );


    currentY +=
        6;


    // =================================================
    // REGION
    // =================================================

    const regionSelect =
        document.getElementById(
            "reportRegion"
        );


    let regionText =
        "All Regions";


    if (
        regionSelect &&
        regionSelect.selectedIndex >= 0
    ) {

        const selectedOption =
            regionSelect.options[
                regionSelect.selectedIndex
            ];


        if (
            selectedOption
        ) {

            regionText =
                selectedOption.text;

        }

    }


    doc.text(
        `Region : ${regionText}`,
        leftMargin,
        currentY
    );


    currentY +=
        10;


    // =================================================
    // REPORT CONTAINER
    // =================================================

    const container =
        document.getElementById(
            "advisorItemReportContainer"
        );


    if (
        !container
    ) {

        alert(
            "Advisor Item Report container not found."
        );

        return;

    }


    if (
        container.children.length === 0
    ) {

        alert(
            "Please generate the Advisor Item Report first."
        );

        return;

    }


    // =================================================
    // FIND ADVISOR SECTIONS
    // =================================================

    const advisorSections =
        container.querySelectorAll(
            "h3"
        );


    if (
        advisorSections.length === 0
    ) {

        alert(
            "No advisor data available for PDF."
        );

        return;

    }


    // =================================================
    // PROCESS EACH ADVISOR
    // =================================================

    advisorSections.forEach(
        (
            advisorHeading
        ) => {

            // =============================================
            // ADVISOR NAME
            // =============================================

            const advisorName =
                advisorHeading
                    .textContent
                    .replace(
                        "Advisor:",
                        ""
                    )
                    .trim();


            // =============================================
            // FIND TABLE
            // =============================================

            const table =
                advisorHeading
                    .nextElementSibling;


            if (
                !table
            ) {

                return;

            }


            // =============================================
            // EXTRACT TABLE ROWS
            // =============================================

            const rows =
                [];


            table
                .querySelectorAll(
                    "tbody tr"
                )
                .forEach(
                    (tr) => {

                        const cells =
                            tr.querySelectorAll(
                                "td"
                            );


                        if (
                            cells.length < 4
                        ) {

                            return;

                        }


                        const itemCode =
                            cells[0]
                                .innerText
                                .trim();


                        const description =
                            cells[1]
                                .innerText
                                .trim();


                        const itemsDone =
                            cells[2]
                                .innerText
                                .trim();


                        const amount =
                            cells[3]
                                .innerText
                                .trim();


                        rows.push([

                            itemCode,

                            description,

                            itemsDone,

                            formatMoney(
                                amount
                            )

                        ]);

                    }
                );


            // =============================================
            // SKIP EMPTY ADVISOR
            // =============================================

            if (
                rows.length === 0
            ) {

                return;

            }


            // =============================================
            // CHECK PAGE SPACE
            // =============================================

            if (
                currentY >
                pageHeight - 65
            ) {

                doc.addPage();

                currentY =
                    20;

            }


            // =============================================
            // ADVISOR HEADING
            // =============================================

            doc.setFont(
                "helvetica",
                "bold"
            );


            doc.setFontSize(
                13
            );


            doc.text(
                `Advisor: ${advisorName}`,
                leftMargin,
                currentY
            );


            currentY +=
                7;


            // =============================================
            // ADVISOR TABLE
            // =============================================

            doc.autoTable({

                startY:
                    currentY,

                margin: {

                    left:
                        leftMargin,

                    right:
                        rightMargin

                },

                tableWidth:
                    "auto",

                head: [[

                    "Item Code",

                    "Description",

                    "Items Done",

                    "Total Amount"

                ]],

                body:
                    rows,

                theme:
                    "grid",

                styles: {

                    font:
                        "helvetica",

                    fontSize:
                        9,

                    cellPadding:
                        3,

                    lineColor: [
                        190,
                        190,
                        190
                    ],

                    lineWidth:
                        0.2,

                    valign:
                        "middle"

                },

                headStyles: {

                    fillColor: [
                        41,
                        128,
                        185
                    ],

                    textColor:
                        255,

                    fontStyle:
                        "bold",

                    halign:
                        "left",

                    valign:
                        "middle"

                },

                columnStyles: {

                    0: {

                        cellWidth:
                            35,

                        halign:
                            "left"

                    },

                    1: {

                        cellWidth:
                            78,

                        halign:
                            "left"

                    },

                    2: {

                        cellWidth:
                            30,

                        halign:
                            "center"

                    },

                    3: {

                        cellWidth:
                            39,

                        halign:
                            "right"

                    }

                },

                bodyStyles: {

                    valign:
                        "middle"

                },

                didParseCell:
                    function (
                        data
                    ) {

                        if (
                            data.section ===
                            "body" &&
                            data.column.index ===
                            3
                        ) {

                            data.cell.styles.halign =
                                "right";

                        }


                        if (
                            data.section ===
                            "body" &&
                            data.column.index ===
                            2
                        ) {

                            data.cell.styles.halign =
                                "center";

                        }

                    }

            });


            // =============================================
            // TABLE BOTTOM
            // =============================================

            currentY =
                doc.lastAutoTable.finalY +
                5;


            // =============================================
            // BILLING / INCENTIVE / NET BILLING
            // =============================================

            const totalElement =
                table.nextElementSibling;


            if (
                totalElement
            ) {

                const summaryText =
                    totalElement.innerText;


                console.log(
                    "PDF Summary:",
                    summaryText
                );


                // =========================================
                // TOTAL BILLING
                // =========================================

                const billingMatch =
                    summaryText.match(
                        /Total Billing:\s*₹?\s*([\d,.-]+)/i
                    );


                const billing =
                    billingMatch

                        ? Number(
                            billingMatch[1]
                                .replace(
                                    /,/g,
                                    ""
                                )
                        )

                        : 0;


                // =========================================
                // INCENTIVE
                // =========================================

                const incentiveMatch =
                    summaryText.match(
                        /Incentive Amount:\s*₹?\s*([\d,.-]+)/i
                    );


                const incentive =
                    incentiveMatch

                        ? Number(
                            incentiveMatch[1]
                                .replace(
                                    /,/g,
                                    ""
                                )
                        )

                        : 0;


                // =========================================
                // NET BILLING
                // =========================================

                const netBillingMatch =
                    summaryText.match(
                        /Net Billing:\s*₹?\s*([\d,.-]+)/i
                    );


                const netBilling =
                    netBillingMatch

                        ? Number(
                            netBillingMatch[1]
                                .replace(
                                    /,/g,
                                    ""
                                )
                        )

                        : 0;


                // =========================================
                // FORMAT VALUES
                // =========================================

                const billingText =
                    formatMoney(
                        billing
                    );


                const incentiveText =
                    formatMoney(
                        incentive
                    );


                const netBillingText =
                    formatMoney(
                        netBilling
                    );


                // =========================================
                // PDF STYLE
                // =========================================

                doc.setFont(
                    "helvetica",
                    "bold"
                );


                doc.setFontSize(
                    10
                );


                // =========================================
                // TOTAL BILLING
                // =========================================

                doc.text(
                    `Total Billing: ${billingText}`,
                    pageWidth -
                        rightMargin,
                    currentY,
                    {
                        align:
                            "right"
                    }
                );


                currentY +=
                    5;


                // =========================================
                // INCENTIVE
                // =========================================

                doc.text(
                    `Incentive Amount: ${incentiveText}`,
                    pageWidth -
                        rightMargin,
                    currentY,
                    {
                        align:
                            "right"
                    }
                );


                currentY +=
                    5;


                // =========================================
                // NET BILLING
                // =========================================

                doc.text(
                    `Net Billing: ${netBillingText}`,
                    pageWidth -
                        rightMargin,
                    currentY,
                    {
                        align:
                            "right"
                    }
                );


                currentY +=
                    12;

            }

        }
    );


    // =================================================
    // FOOTER
    // =================================================

    if (
        currentY >
        pageHeight - 20
    ) {

        doc.addPage();

        currentY =
            20;

    }


    doc.setFont(
        "helvetica",
        "normal"
    );


    doc.setFontSize(
        9
    );


    const generatedOn =
        new Date()
            .toLocaleString(
                "en-GB",
                {

                    day:
                        "2-digit",

                    month:
                        "2-digit",

                    year:
                        "numeric",

                    hour:
                        "2-digit",

                    minute:
                        "2-digit",

                    hour12:
                        true

                }
            );


    doc.text(

        `Generated on: ${generatedOn}`,

        leftMargin,

        currentY + 5

    );


    // =================================================
    // SAVE PDF
    // =================================================

    doc.save(
        "Advisor_Item_Amount_Report.pdf"
    );

}


// =====================================================
// GO TO ADMIN DASHBOARD
// =====================================================

function goToAdminDashboard() {

    window.location.href =
        "admin.html";

}