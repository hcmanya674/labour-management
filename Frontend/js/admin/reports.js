// ======================================================
// LABOUR MANAGEMENT SYSTEM
// reports.js
// ======================================================
//
// Features:
// 1. Region loading
// 2. Date filtering
// 3. Specific region filtering
// 4. All-region filtering
// 5. Repair Order Report
// 6. Work Done = Item Code + Description
// 7. Billing Amount
// 8. Advisor-wise Work Summary
// 9. Advisor Item & Amount Report
// 10. Incentive + Net Billing
// 11. Repair Order PDF
// 12. Advisor Item & Amount PDF
//
// BILLING LOGIC:
// Priority:
// 1. repairorders.billingAmount
// 2. repairorders.itemDetails[].billingAmount
// 3. itemcodes.billingAmount
//
// This keeps historical Repair Order billing correct even if
// the Item Master price is changed later.
// ======================================================


// ======================================================
// GLOBAL REGION DATA
// ======================================================

let regionData = [];

let regionsLoadedPromise = null;


// ======================================================
// INITIALIZE PAGE
// ======================================================

initializePage();


function initializePage() {

    regionsLoadedPromise = loadRegions();

}


// ======================================================
// NORMALIZE TEXT
// ======================================================

function normalizeText(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

}


// ======================================================
// CONVERT VALUE TO NUMBER
// ======================================================
//
// Handles:
// 1500
// "1500"
// "1,500"
// "₹1,500"
// "Rs. 1,500"
// ======================================================

function toNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return 0;
    }

    if (typeof value === "number") {
        return Number.isFinite(value) ? value : 0;
    }

    let cleaned = String(value)
        .trim();

    // Convert superscript digits to normal digits
    cleaned = cleaned.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, ch => {

        const map = {
            "⁰": "0",
            "¹": "1",
            "²": "2",
            "³": "3",
            "⁴": "4",
            "⁵": "5",
            "⁶": "6",
            "⁷": "7",
            "⁸": "8",
            "⁹": "9"
        };

        return map[ch];
    });

    cleaned = cleaned
        .replace(/₹/g, "")
        .replace(/Rs\.?/gi, "")
        .replace(/INR/gi, "")
        .replace(/,/g, "")
        .trim();

    const number = Number(cleaned);

    return Number.isFinite(number)
        ? number
        : 0;
}

function formatMoney(value) {

    const amount = toNumber(value);

    return "₹" + amount.toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });

}
function formatReportMoney(value) {

    const amount = toNumber(value);

    return (
        '<span class="currency-symbol">&#8377;</span>' +
        amount.toLocaleString("en-IN", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        })
    );

}
// ======================================================
// LOAD REGIONS
// ======================================================

async function loadRegions() {

    try {

        const snapshot =
            await db.collection("regions")
                .where("active", "==", true)
                .get();


        regionData = [];


        let html =
            `<option value="">All Regions</option>`;


        snapshot.forEach(doc => {

            const region =
                doc.data();


            const regionObject = {

                docId:
                    doc.id,

                regionId:
                    region.regionId || "",

                regionName:
                    region.regionName || doc.id

            };


            regionData.push(
                regionObject
            );


            html += `

                <option value="${escapeHtmlAttribute(doc.id)}">

                    ${escapeHtml(
                        regionObject.regionName
                    )}

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

    }

    catch (error) {

        console.error(
            "Error loading regions:",
            error
        );


        const regionSelect =
            document.getElementById(
                "reportRegion"
            );


        if (regionSelect) {

            regionSelect.innerHTML =
                `<option value="">
                    All Regions
                </option>`;

        }

    }

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ======================================================
// ESCAPE HTML ATTRIBUTE
// ======================================================

function escapeHtmlAttribute(value) {

    return escapeHtml(value);

}


// ======================================================
// GET SELECTED REGION OBJECT
// ======================================================

function getSelectedRegionObject(
    selectedRegion
) {

    if (!selectedRegion) {

        return null;

    }


    const selected =
        regionData.find(region => {

            return (

                normalizeText(region.docId) ===
                    normalizeText(selectedRegion)

                ||

                normalizeText(region.regionId) ===
                    normalizeText(selectedRegion)

                ||

                normalizeText(region.regionName) ===
                    normalizeText(selectedRegion)

            );

        });


    return selected || null;

}


// ======================================================
// CHECK REGION MATCH
// ======================================================

function repairOrderMatchesRegion(
    repairOrder,
    selectedRegion
) {

    // --------------------------------------------------
    // ALL REGIONS
    // --------------------------------------------------

    if (
        !selectedRegion ||
        selectedRegion === ""
    ) {

        return true;

    }


    const selected =
        getSelectedRegionObject(
            selectedRegion
        );


    if (!selected) {

        console.warn(
            "Selected region not found:",
            selectedRegion
        );

        return false;

    }


    const repairOrderRegion =
        repairOrder.region;


    if (
        repairOrderRegion === null ||
        repairOrderRegion === undefined
    ) {

        return false;

    }


    // --------------------------------------------------
    // STRING / NUMBER
    // --------------------------------------------------

    if (
        typeof repairOrderRegion === "string" ||
        typeof repairOrderRegion === "number"
    ) {

        const roRegion =
            normalizeText(
                repairOrderRegion
            );


        return (

            roRegion ===
                normalizeText(selected.docId)

            ||

            roRegion ===
                normalizeText(selected.regionId)

            ||

            roRegion ===
                normalizeText(selected.regionName)

        );

    }


    // --------------------------------------------------
    // OBJECT
    // --------------------------------------------------

    if (
        typeof repairOrderRegion === "object"
    ) {

        const possibleValues = [

            repairOrderRegion.docId,

            repairOrderRegion.regionId,

            repairOrderRegion.regionName,

            repairOrderRegion.id,

            repairOrderRegion.name

        ];


        return possibleValues.some(value => {

            return (

                normalizeText(value) ===
                    normalizeText(selected.docId)

                ||

                normalizeText(value) ===
                    normalizeText(selected.regionId)

                ||

                normalizeText(value) ===
                    normalizeText(selected.regionName)

            );

        });

    }


    return false;

}


// ======================================================
// GET REGION DISPLAY NAME
// ======================================================

function getRegionDisplayName(
    repairOrder
) {

    const value =
        repairOrder.region;


    if (
        value === null ||
        value === undefined
    ) {

        return "-";

    }


    // --------------------------------------------------
    // OBJECT REGION
    // --------------------------------------------------

    if (
        typeof value === "object"
    ) {

        const possibleValues = [

            value.regionName,

            value.name,

            value.regionId,

            value.id,

            value.docId

        ];


        for (
            const regionValue
            of possibleValues
        ) {

            if (!regionValue) {

                continue;

            }


            const found =
                regionData.find(region => {

                    return (

                        normalizeText(
                            region.regionName
                        ) ===
                        normalizeText(
                            regionValue
                        )

                        ||

                        normalizeText(
                            region.regionId
                        ) ===
                        normalizeText(
                            regionValue
                        )

                        ||

                        normalizeText(
                            region.docId
                        ) ===
                        normalizeText(
                            regionValue
                        )

                    );

                });


            if (found) {

                return found.regionName;

            }

        }

    }


    // --------------------------------------------------
    // STRING / NUMBER
    // --------------------------------------------------

    const found =
        regionData.find(region => {

            return (

                normalizeText(
                    region.docId
                ) ===
                normalizeText(value)

                ||

                normalizeText(
                    region.regionId
                ) ===
                normalizeText(value)

                ||

                normalizeText(
                    region.regionName
                ) ===
                normalizeText(value)

            );

        });


    if (found) {

        return found.regionName;

    }


    return String(value);

}


// ======================================================
// GET CREATED DATE
// ======================================================

function getCreatedDate(
    repairOrder
) {

    if (!repairOrder.createdAt) {

        return null;

    }


    try {

        // Firestore Timestamp

        if (
            typeof repairOrder.createdAt.toDate ===
            "function"
        ) {

            return repairOrder.createdAt.toDate();

        }


        // JavaScript Date

        if (
            repairOrder.createdAt instanceof Date
        ) {

            return repairOrder.createdAt;

        }


        // Timestamp-like object

        if (
            repairOrder.createdAt.seconds !==
            undefined
        ) {

            return new Date(
                repairOrder.createdAt.seconds *
                1000
            );

        }


        return new Date(
            repairOrder.createdAt
        );

    }

    catch (error) {

        console.error(
            "Invalid createdAt:",
            error
        );

        return null;

    }

}


// ======================================================
// GET REPAIR ORDER ITEM CODES
// ======================================================

function getRepairOrderItemCodes(
    repairOrder
) {

    let items = [];


    // --------------------------------------------------
    // NEW FORMAT
    // --------------------------------------------------

    if (
        Array.isArray(
            repairOrder.itemCodes
        )
    ) {

        items =
            repairOrder.itemCodes;

    }


    // --------------------------------------------------
    // SINGLE itemCodes
    // --------------------------------------------------

    else if (
        repairOrder.itemCodes !== undefined &&
        repairOrder.itemCodes !== null &&
        repairOrder.itemCodes !== ""
    ) {

        items = [
            repairOrder.itemCodes
        ];

    }


    // --------------------------------------------------
    // OLD itemCode
    // --------------------------------------------------

    else if (
        repairOrder.itemCode !== undefined &&
        repairOrder.itemCode !== null &&
        repairOrder.itemCode !== ""
    ) {

        items = [
            repairOrder.itemCode
        ];

    }


    // --------------------------------------------------
    // WORK DONE FALLBACK
    // --------------------------------------------------

    else if (
        Array.isArray(repairOrder.workDone)
    ) {

        items =
            repairOrder.workDone;

    }

    else if (
        repairOrder.workDone !== undefined &&
        repairOrder.workDone !== null &&
        repairOrder.workDone !== ""
    ) {

        items = [
            repairOrder.workDone
        ];

    }


    return items
        .filter(
            item =>
                item !== null &&
                item !== undefined &&
                item !== ""
        )
        .map(
            item =>
                String(item).trim()
        );

}


// ======================================================
// GET ITEM DETAILS FROM RO
// ======================================================
//
// Uses the itemDetails already saved inside the RO.
//
// This is important because the RO contains the billing
// amount that was applicable when the RO was created.
// ======================================================

function getStoredItemDetails(
    repairOrder
) {

    if (
        !Array.isArray(
            repairOrder.itemDetails
        )
    ) {

        return [];

    }


    return repairOrder.itemDetails.map(
        item => {

            const code =
                String(
                    item.itemCode ||
                    item.code ||
                    ""
                ).trim();


            return {

                itemCode:
                    code,

                description:
                    item.description ||
                    item.itemDescription ||
                    item.workDescription ||
                    item.workDone ||
                    "-",

                billingAmount:
                    toNumber(
                        item.billingAmount
                    ),

                incentiveAmount:
                    toNumber(
                        item.incentiveAmount
                    )

            };

        }
    );

}


// ======================================================
// LOAD ALL ITEM MASTER DATA
// ======================================================
//
// Creates a normalized map so that:
// itemCode = 1
// itemCode = "1"
// document ID = "1"
//
// can all be resolved.
// ======================================================

async function loadItemMasterMap() {

    const snapshot =
        await db.collection(
            "itemcodes"
        ).get();


    const itemMap = {};


    snapshot.forEach(doc => {

        const item =
            doc.data();


        const code =
            String(
                item.itemCode !== undefined &&
                item.itemCode !== null &&
                item.itemCode !== ""
                    ? item.itemCode
                    : doc.id
            ).trim();


        const itemObject = {

            itemCode:
                code,

            description:
                item.description ||
                item.itemDescription ||
                item.workDescription ||
                item.workDone ||
                "-",

            billingAmount:
                toNumber(
                    item.billingAmount
                ),

            incentiveAmount:
                toNumber(
                    item.incentiveAmount
                )

        };


        // Normal key

        itemMap[
            normalizeText(code)
        ] =
            itemObject;


        // Document ID key

        itemMap[
            normalizeText(doc.id)
        ] =
            itemObject;

    });


    return itemMap;

}


// ======================================================
// GET ITEM INFORMATION
// ======================================================
//
// Priority:
// 1. Stored itemDetails
// 2. Item Master
// 3. Not found
// ======================================================

function getItemInformation(
    repairOrder,
    itemCodes,
    itemMap
) {

    const storedDetails =
        getStoredItemDetails(
            repairOrder
        );


    const information = [];


    itemCodes.forEach(
        rawCode => {

            const code =
                String(rawCode).trim();


            if (!code) {

                return;

            }


            // --------------------------------------------------
            // FIRST: STORED ITEM DETAIL
            // --------------------------------------------------

            const stored =
                storedDetails.find(
                    item =>
                        normalizeText(
                            item.itemCode
                        ) ===
                        normalizeText(code)
                );


            if (stored) {

                information.push({

                    itemCode:
                        stored.itemCode ||
                        code,

                    description:
                        stored.description ||
                        "-",

                    billingAmount:
                        toNumber(
                            stored.billingAmount
                        ),

                    incentiveAmount:
                        toNumber(
                            stored.incentiveAmount
                        ),

                    fromStoredRO:
                        true

                });

                return;

            }


            // --------------------------------------------------
            // SECOND: ITEM MASTER
            // --------------------------------------------------

            const master =
                itemMap[
                    normalizeText(code)
                ];


            if (master) {

                information.push({

                    itemCode:
                        master.itemCode ||
                        code,

                    description:
                        master.description ||
                        "-",

                    billingAmount:
                        toNumber(
                            master.billingAmount
                        ),

                    incentiveAmount:
                        toNumber(
                            master.incentiveAmount
                        ),

                    fromStoredRO:
                        false

                });

                return;

            }


            // --------------------------------------------------
            // NOT FOUND
            // --------------------------------------------------

            information.push({

                itemCode:
                    code,

                description:
                    "Description Not Found",

                billingAmount:
                    0,

                incentiveAmount:
                    0,

                fromStoredRO:
                    false

            });

        }
    );


    return information;

}


// ======================================================
// GET REPAIR ORDER BILLING
// ======================================================
//
// VERY IMPORTANT:
//
// 1. Use stored ro.billingAmount
// 2. Otherwise sum itemDetails billing
// 3. Otherwise use item master
// ======================================================

function getRepairOrderBilling(
    repairOrder,
    itemInformation
) {

    // --------------------------------------------------
    // FIRST: STORED TOTAL BILLING
    // --------------------------------------------------

    if (
        repairOrder.billingAmount !==
        undefined &&
        repairOrder.billingAmount !==
        null &&
        repairOrder.billingAmount !== ""
    ) {

        return toNumber(
            repairOrder.billingAmount
        );

    }


    // --------------------------------------------------
    // SECOND: STORED ITEM DETAILS
    // --------------------------------------------------

    const storedDetails =
        getStoredItemDetails(
            repairOrder
        );


    if (
        storedDetails.length > 0
    ) {

        const storedTotal =
            storedDetails.reduce(
                (
                    total,
                    item
                ) => {

                    return total +
                        toNumber(
                            item.billingAmount
                        );

                },
                0
            );


        if (
            storedTotal > 0
        ) {

            return storedTotal;

        }

    }


    // --------------------------------------------------
    // THIRD: ITEM MASTER FALLBACK
    // --------------------------------------------------

    return itemInformation.reduce(
        (
            total,
            item
        ) => {

            return total +
                toNumber(
                    item.billingAmount
                );

        },
        0
    );

}


// ======================================================
// GET REPAIR ORDER INCENTIVE
// ======================================================

function getRepairOrderIncentive(
    repairOrder,
    itemInformation
) {

    const storedDetails =
        getStoredItemDetails(
            repairOrder
        );


    if (
        storedDetails.length > 0
    ) {

        const storedTotal =
            storedDetails.reduce(
                (
                    total,
                    item
                ) => {

                    return total +
                        toNumber(
                            item.incentiveAmount
                        );

                },
                0
            );


        if (
            storedTotal > 0
        ) {

            return storedTotal;

        }

    }


    return itemInformation.reduce(
        (
            total,
            item
        ) => {

            return total +
                toNumber(
                    item.incentiveAmount
                );

        },
        0
    );

}


// ======================================================
// GENERATE REPAIR ORDER REPORT
// ======================================================

async function generateReport() {

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


    const btn =
        document.getElementById(
            "generateBtn"
        );


    const exportBtn =
        document.getElementById(
            "exportBtn"
        );


    const advisorExportBtn =
        document.getElementById(
            "advisorExportBtn"
        );


    if (exportBtn) {

        exportBtn.disabled =
            true;

    }


    if (advisorExportBtn) {

        advisorExportBtn.disabled =
            true;

    }


    if (btn) {

        btn.disabled =
            true;

        btn.innerHTML = `
            <div class="spinner"></div>
            Generating...
        `;

    }


    // --------------------------------------------------
    // VALIDATE DATES
    // --------------------------------------------------

    if (
        !fromDate ||
        !toDate
    ) {

        alert(
            "Please select From Date and To Date."
        );

        restoreGenerateButton();

        return;

    }


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


    if (
        start > end
    ) {

        alert(
            "From Date cannot be greater than To Date."
        );

        restoreGenerateButton();

        return;

    }


    try {

        if (
            regionsLoadedPromise
        ) {

            await regionsLoadedPromise;

        }


        // --------------------------------------------------
        // LOAD ITEM MASTER ONCE
        // --------------------------------------------------

        const itemMap =
            await loadItemMasterMap();


        // --------------------------------------------------
        // LOAD REPAIR ORDERS
        // --------------------------------------------------

        const snapshot =
            await db.collection(
                "repairorders"
            ).get();


        let html = "";


        const advisorSummary = {};


        const allWorkTypes =
            new Set();


        // ==================================================
        // PROCESS REPAIR ORDERS
        // ==================================================

        for (
            const doc
            of snapshot.docs
        ) {

            const ro =
                doc.data();


            // --------------------------------------------------
            // DATE
            // --------------------------------------------------

            const createdDate =
                getCreatedDate(
                    ro
                );


            if (!createdDate) {

                continue;

            }


            if (
                createdDate < start ||
                createdDate > end
            ) {

                continue;

            }


            // --------------------------------------------------
            // REGION
            // --------------------------------------------------

            if (
                !repairOrderMatchesRegion(
                    ro,
                    selectedRegion
                )
            ) {

                continue;

            }


            const regionName =
                getRegionDisplayName(
                    ro
                );


            // --------------------------------------------------
            // ITEM CODES
            // --------------------------------------------------

            const itemCodes =
                getRepairOrderItemCodes(
                    ro
                );


            console.log(
                "RO:",
                doc.id,
                "ITEM CODES:",
                itemCodes
            );


            // --------------------------------------------------
            // ITEM INFORMATION
            // --------------------------------------------------

            const itemInformation =
                getItemInformation(
                    ro,
                    itemCodes,
                    itemMap
                );


            // --------------------------------------------------
            // BILLING
            // --------------------------------------------------

            const billingAmount =
                getRepairOrderBilling(
                    ro,
                    itemInformation
                );


            console.log(
                "RO:",
                doc.id,
                "STORED BILLING:",
                ro.billingAmount,
                "DISPLAY BILLING:",
                billingAmount
            );


            // --------------------------------------------------
            // WORK DONE
            // --------------------------------------------------

            const workDescriptions =
                itemInformation.map(
                    item => {

                        return `
                            <div class="work-item">
                                ${escapeHtml(
                                    item.itemCode
                                )}
                                -
                                ${escapeHtml(
                                    item.description
                                )}
                            </div>
                        `;

                    }
                );


            const workDone =
                workDescriptions.length > 0

                    ?

                    workDescriptions.join("")

                    :

                    "-";


            // --------------------------------------------------
            // ADVISOR
            // --------------------------------------------------

            const advisor =
                ro.advisorName ||
                "Unknown Advisor";


            // --------------------------------------------------
            // ADVISOR SUMMARY
            // --------------------------------------------------

            const workTypeKey =
                itemInformation.length > 0

                    ?

                    itemInformation
                        .map(
                            item =>
                                `${item.itemCode} - ${item.description}`
                        )
                        .join(" | ")

                    :

                    "-";


            allWorkTypes.add(
                workTypeKey
            );


            if (
                !advisorSummary[advisor]
            ) {

                advisorSummary[advisor] = {};

            }


            if (
                !advisorSummary[advisor][
                    workTypeKey
                ]
            ) {

                advisorSummary[advisor][
                    workTypeKey
                ] = 0;

            }


            advisorSummary[advisor][
                workTypeKey
            ]++;


            // --------------------------------------------------
            // DATE
            // --------------------------------------------------

            const formattedDate =
                createdDate.toLocaleDateString(
                    "en-GB"
                );


            // ==================================================
            // TABLE ROW
            // ==================================================

            html += `

                <tr>

                    <td>
                        ${escapeHtml(
                            ro.roNumber ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${formattedDate}
                    </td>

                    <td>
                        ${escapeHtml(
                            regionName ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            advisor
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            ro.vehicleNumber ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${workDone}
                    </td>

   <td class="billing-cell">
    ${formatReportMoney(billingAmount)}
</td>

                </tr>

            `;

        }


        // ==================================================
        // ADVISOR WISE SUMMARY
        // ==================================================

        const workTypes =
            Array.from(
                allWorkTypes
            );


        let head =
            "<tr><th>Advisor Name</th>";


        workTypes.forEach(
            work => {

                head += `

                    <th>
                        ${escapeHtml(
                            work
                        )}
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


        let body = "";


        const columnTotals = {};


        let grandTotal = 0;


        Object.keys(
            advisorSummary
        )
        .sort()
        .forEach(
            advisor => {

                body += `
                    <tr>
                `;


                body += `
                    <td>
                        ${escapeHtml(
                            advisor
                        )}
                    </td>
                `;


                let rowTotal = 0;


                workTypes.forEach(
                    work => {

                        const count =
                            advisorSummary[
                                advisor
                            ][work] || 0;


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
                            ) + count;

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
        );


        // --------------------------------------------------
        // TOTAL ROW
        // --------------------------------------------------

        if (
            Object.keys(
                advisorSummary
            ).length > 0
        ) {

            body += `
                <tr
                    style="
                        font-weight:bold;
                        background:#f5f5f5;
                    "
                >
            `;


            body += `
                <td>
                    TOTAL
                </td>
            `;


            workTypes.forEach(
                work => {

                    body += `
                        <td>
                            ${
                                columnTotals[
                                    work
                                ] || 0
                            }
                        </td>
                    `;

                }
            );


            body += `
                <td>
                    ${grandTotal}
                </td>
            `;


            body += `
                </tr>
            `;

        }


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


        // ==================================================
        // DISPLAY REPAIR ORDER REPORT
        // ==================================================

        const reportBody =
            document.getElementById(
                "reportBody"
            );


        if (
            html === ""
        ) {

            if (
                reportBody
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

            }


            if (
                exportBtn
            ) {

                exportBtn.disabled =
                    true;

            }

        }

        else {

            if (
                reportBody
            ) {

                reportBody.innerHTML =
                    html;

            }


            if (
                exportBtn
            ) {

                exportBtn.disabled =
                    false;

            }

        }

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


        if (
            exportBtn
        ) {

            exportBtn.disabled =
                true;

        }

    }


    restoreGenerateButton();

}


// ======================================================
// RESTORE GENERATE BUTTON
// ======================================================

function restoreGenerateButton() {

    const btn =
        document.getElementById(
            "generateBtn"
        );


    if (btn) {

        btn.disabled =
            false;

        btn.innerHTML =
            "Generate Report";

    }

}


// ======================================================
// GENERATE ADVISOR ITEM REPORT
// ======================================================

async function generateAdvisorItemReport() {

    const advisorExportBtn =
        document.getElementById(
            "advisorExportBtn"
        );


    if (
        advisorExportBtn
    ) {

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


    // --------------------------------------------------
    // VALIDATE
    // --------------------------------------------------

    if (
        !fromDate ||
        !toDate
    ) {

        alert(
            "Please select From Date and To Date."
        );

        if (advisorExportBtn) {

            advisorExportBtn.disabled =
                true;

        }

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


    if (
        from > to
    ) {

        alert(
            "From Date cannot be greater than To Date."
        );

        if (advisorExportBtn) {

            advisorExportBtn.disabled =
                true;

        }

        return;

    }


    try {

        if (
            regionsLoadedPromise
        ) {

            await regionsLoadedPromise;

        }


        // ==================================================
        // LOAD ITEM MASTER
        // ==================================================

        const itemMap =
            await loadItemMasterMap();


        // ==================================================
        // LOAD REPAIR ORDERS
        // ==================================================

        const roSnapshot =
            await db.collection(
                "repairorders"
            ).get();


        // ==================================================
        // ADVISOR DATA
        // ==================================================

        const advisorData = {};


        roSnapshot.forEach(
            doc => {

                const ro =
                    doc.data();


                // --------------------------------------------------
                // DATE
                // --------------------------------------------------

                const createdDate =
                    getCreatedDate(
                        ro
                    );


                if (!createdDate) {

                    return;

                }


                if (
                    createdDate < from ||
                    createdDate > to
                ) {

                    return;

                }


                // --------------------------------------------------
                // REGION
                // --------------------------------------------------

                if (
                    !repairOrderMatchesRegion(
                        ro,
                        selectedRegion
                    )
                ) {

                    return;

                }


                // --------------------------------------------------
                // ADVISOR
                // --------------------------------------------------

                const advisor =
                    ro.advisorName ||
                    "Unknown Advisor";


                // --------------------------------------------------
                // ITEM CODES
                // --------------------------------------------------

                const items =
                    getRepairOrderItemCodes(
                        ro
                    );


                // --------------------------------------------------
                // STORED ITEM DETAILS
                // --------------------------------------------------

                const storedDetails =
                    getStoredItemDetails(
                        ro
                    );


                if (
                    !advisorData[advisor]
                ) {

                    advisorData[advisor] = {

                        items: {},

                        incentive: 0,

                        billing: 0

                    };

                }


                // ==================================================
                // BILLING
                // ==================================================

                const roBilling =
                    getRepairOrderBilling(
                        ro,
                        getItemInformation(
                            ro,
                            items,
                            itemMap
                        )
                    );


                advisorData[advisor]
                    .billing +=
                    roBilling;


                // ==================================================
                // ITEMS
                // ==================================================

                items.forEach(
                    itemCodeRaw => {

                        const code =
                            String(
                                itemCodeRaw
                            ).trim();


                        if (!code) {

                            return;

                        }


                        if (
                            !advisorData[
                                advisor
                            ].items[code]
                        ) {

                            advisorData[
                                advisor
                            ].items[code] = {

                                quantity:
                                    0,

                                totalAmount:
                                    0,

                                incentiveAmount:
                                    0,

                                description:
                                    "-"

                            };

                        }


                        const entry =
                            advisorData[
                                advisor
                            ].items[code];


                        entry.quantity++;


                        // --------------------------------------------------
                        // FIRST: STORED ITEM DETAIL
                        // --------------------------------------------------

                        const stored =
                            storedDetails.find(
                                item =>
                                    normalizeText(
                                        item.itemCode
                                    ) ===
                                    normalizeText(
                                        code
                                    )
                            );


                        if (stored) {

                            entry.description =
                                stored.description ||
                                "-";


                            entry.totalAmount +=
                                toNumber(
                                    stored.billingAmount
                                );


                            entry.incentiveAmount +=
                                toNumber(
                                    stored.incentiveAmount
                                );

                        }

                        else {

                            // --------------------------------------------------
                            // FALLBACK: ITEM MASTER
                            // --------------------------------------------------

                            const itemInfo =
                                itemMap[
                                    normalizeText(
                                        code
                                    )
                                ];


                            if (itemInfo) {

                                entry.description =
                                    itemInfo.description ||
                                    "-";


                                entry.totalAmount +=
                                    toNumber(
                                        itemInfo.billingAmount
                                    );


                                entry.incentiveAmount +=
                                    toNumber(
                                        itemInfo.incentiveAmount
                                    );

                            }

                        }

                    }
                );


                // ==================================================
                // INCENTIVE
                // ==================================================

                const storedIncentive =
                    storedDetails.reduce(
                        (
                            total,
                            item
                        ) => {

                            return total +
                                toNumber(
                                    item.incentiveAmount
                                );

                        },
                        0
                    );


                if (
                    storedIncentive > 0
                ) {

                    // Already included in item-level incentive.
                    // Do not add again here.

                }

            }
        );


        // ==================================================
        // DISPLAY
        // ==================================================

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
            )
            .sort();


        // ==================================================
        // NO DATA
        // ==================================================

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

                    No data found for selected dates or region.

                </div>

            `;


            if (
                advisorExportBtn
            ) {

                advisorExportBtn.disabled =
                    true;

            }


            return;

        }


        // ==================================================
        // CREATE ADVISOR SECTIONS
        // ==================================================

        advisors.forEach(
            advisor => {

                const advisorInfo =
                    advisorData[
                        advisor
                    ];


                const items =
                    advisorInfo.items;


                // --------------------------------------------------
                // ADVISOR HEADING
                // --------------------------------------------------

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


                // --------------------------------------------------
                // TABLE
                // --------------------------------------------------

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


                let incentiveAmount =
                    0;


                // --------------------------------------------------
                // ITEMS
                // --------------------------------------------------

                Object.keys(
                    items
                )
                .sort()
                .forEach(
                    itemCode => {

                        const item =
                            items[
                                itemCode
                            ];


                        const quantity =
                            item.quantity;


                        const total =
                            toNumber(
                                item.totalAmount
                            );


                        const itemIncentive =
                            toNumber(
                                item.incentiveAmount
                            );


                        advisorTotal +=
                            total;


                        incentiveAmount +=
                            itemIncentive;


                        const row =
                            document.createElement(
                                "tr"
                            );


                        row.innerHTML = `

                            <td>
                                ${escapeHtml(
                                    itemCode
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    item.description ||
                                    "-"
                                )}
                            </td>

                            <td
                                class="quantity-cell"
                            >
                                ${quantity}
                            </td>

                            <td
                                class="amount-cell"
                            >
                                ${formatMoney(
                                    total
                                )}
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


                // ==================================================
                // BILLING / INCENTIVE / NET
                // ==================================================

                const totalDiv =
                    document.createElement(
                        "div"
                    );


                totalDiv.className =
                    "advisor-total";


                // --------------------------------------------------
                // IMPORTANT:
                // advisorTotal is based on item-level stored
                // billing amounts.
                //
                // If there is a difference because an old RO
                // only stored total billing, use the stored
                // advisor billing as fallback.
                // --------------------------------------------------

                if (
                    advisorTotal === 0 &&
                    advisorInfo.billing > 0
                ) {

                    advisorTotal =
                        advisorInfo.billing;

                }


                const netAmount =
                    advisorTotal -
                    incentiveAmount;


                totalDiv.innerHTML = `

                    <div>

                        Total Billing:

                        <strong>

                            ${formatMoney(
                                advisorTotal
                            )}

                        </strong>

                    </div>


                    <div>

                        Incentive Amount:

                        <strong>

                            ${formatMoney(
                                incentiveAmount
                            )}

                        </strong>

                    </div>


                    <div>

                        Net Billing:

                        <strong>

                            ${formatMoney(
                                netAmount
                            )}

                        </strong>

                    </div>

                `;


                container.appendChild(
                    totalDiv
                );

            }
        );


        if (
            advisorExportBtn
        ) {

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


        if (
            advisorExportBtn
        ) {

            advisorExportBtn.disabled =
                true;

        }

    }

}


// ======================================================
// EXPORT REPAIR ORDER PDF
// ======================================================

async function exportPDF() {

    const {
        jsPDF
    } = window.jspdf;


    const doc =
        new jsPDF(
            "p",
            "mm",
            "a4"
        );


    // ==================================================
    // HEADING
    // ==================================================

    doc.setFontSize(
        18
    );


    doc.text(
        "Labour Management System",
        105,
        15,
        {
            align:
                "center"
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
            align:
                "center"
        }
    );


    // ==================================================
    // FILTERS
    // ==================================================

    const fromDate =
        document.getElementById(
            "fromDate"
        ).value;


    const toDate =
        document.getElementById(
            "toDate"
        ).value;


    const regionSelect =
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


    let regionText =
        "All Regions";


    if (
        regionSelect &&
        regionSelect.selectedIndex >= 0
    ) {

        regionText =
            regionSelect
                .options[
                    regionSelect.selectedIndex
                ]
                .text;

    }


    doc.text(
        `Region : ${regionText}`,
        14,
        41
    );


    // ==================================================
    // GET TABLE DATA
    // ==================================================

    const rows = [];

document
    .querySelectorAll(
        "#reportBody tr"
    )
    .forEach(
        tr => {

            const row = [];


            tr.querySelectorAll(
                "td"
            )
            .forEach(
                (td, index) => {

                    let value =
                        td.innerText
                            .trim();


                    // --------------------------------------
                    // BILLING AMOUNT
                    // Replace ₹ with Rs.
                    // because jsPDF Helvetica does not
                    // properly support the ₹ symbol.
                    // --------------------------------------

                    if (
                        index === 6
                    ) {

                        value =
                            value.replace(
                                /₹/g,
                                "Rs. "
                            );

                    }


                    row.push(
                        value
                    );

                }
            );


            if (
                row.length === 7 &&
                !row[0]
                    .toLowerCase()
                    .includes(
                        "no repair"
                    )
            ) {

                rows.push(
                    row
                );

            }

        }
    );


    if (
        rows.length === 0
    ) {

        alert(
            "Please generate a Repair Order Report first."
        );

        return;

    }


    // ==================================================
    // AUTO TABLE
    // ==================================================

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

            font:
                "helvetica",

            fontSize:
                8,

            cellPadding:
                2,

            valign:
                "middle"

        },

        headStyles: {

            fillColor: [
                13,
                71,
                161
            ],

            textColor:
                255,

            fontStyle:
                "bold"

        },

       columnStyles: {

    0: {
        cellWidth: 20
    },

    1: {
        cellWidth: 20
    },

    2: {
        cellWidth: 25
    },

    3: {
        cellWidth: 25
    },

    4: {
        cellWidth: 25
    },

    5: {
        cellWidth: 42
    },

    6: {
        cellWidth: 25,
        halign: "center"
    }

}

    });


    // ==================================================
    // FOOTER
    // ==================================================

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


    let footerY =
        doc.lastAutoTable.finalY +
        15;


    if (
        footerY >
        285
    ) {

        doc.addPage();

        footerY =
            20;

    }


    doc.setFontSize(
        9
    );


    doc.text(
        `Generated on : ${generatedOn}`,
        14,
        footerY
    );


    // ==================================================
    // FILE NAME
    // ==================================================

    const safeRegionName =
        regionText
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


    doc.save(
        `Repair_Report_${safeRegionName}_${reportDate}.pdf`
    );

}


// ======================================================
// EXPORT ADVISOR ITEM & AMOUNT PDF
// ======================================================

async function exportAdvisorItemPDF() {

    const {
        jsPDF
    } = window.jspdf;


    const doc =
        new jsPDF(
            "p",
            "mm",
            "a4"
        );


    // ==================================================
    // PAGE SETTINGS
    // ==================================================

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


    // ==================================================
    // FORMAT MONEY FOR PDF
    // ==================================================

    function formatPDFMoney(
        value
    ) {

        const amount =
            toNumber(value);


        return (
            "Rs. " +
            amount.toLocaleString(
                "en-IN",
                {
                    maximumFractionDigits: 2
                }
            )
        );

    }


    // ==================================================
    // HEADING
    // ==================================================

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


    // ==================================================
    // DATE
    // ==================================================

    const fromDate =
        document.getElementById(
            "fromDate"
        ).value;


    const toDate =
        document.getElementById(
            "toDate"
        ).value;


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


    doc.setFontSize(
        10
    );


    doc.text(
        `From : ${from}    To : ${to}`,
        leftMargin,
        currentY
    );


    currentY +=
        6;


    // ==================================================
    // REGION
    // ==================================================

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

        regionText =
            regionSelect
                .options[
                    regionSelect.selectedIndex
                ]
                .text;

    }


    doc.text(
        `Region : ${regionText}`,
        leftMargin,
        currentY
    );


    currentY +=
        10;


    // ==================================================
    // REPORT CONTAINER
    // ==================================================

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


    if (
        container.children.length === 0
    ) {

        alert(
            "Please generate the Advisor Item Report first."
        );

        return;

    }


    // ==================================================
    // FIND ADVISOR SECTIONS
    // ==================================================

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


    // ==================================================
    // PROCESS EACH ADVISOR
    // ==================================================

    advisorSections.forEach(
        advisorHeading => {

            const advisorName =
                advisorHeading
                    .textContent
                    .replace(
                        "Advisor:",
                        ""
                    )
                    .trim();


            // --------------------------------------------------
            // FIND TABLE
            // --------------------------------------------------

            const table =
                advisorHeading
                    .nextElementSibling;


            if (!table) {

                return;

            }


            // --------------------------------------------------
            // EXTRACT ROWS
            // --------------------------------------------------

            const rows = [];


            table
                .querySelectorAll(
                    "tbody tr"
                )
                .forEach(
                    tr => {

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

                            formatPDFMoney(
                                amount
                            )

                        ]);

                    }
                );


            if (
                rows.length === 0
            ) {

                return;

            }


            // --------------------------------------------------
            // PAGE SPACE
            // --------------------------------------------------

            if (
                currentY >
                pageHeight - 65
            ) {

                doc.addPage();

                currentY =
                    20;

            }


            // --------------------------------------------------
            // ADVISOR HEADING
            // --------------------------------------------------

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


            // --------------------------------------------------
            // ADVISOR TABLE
            // --------------------------------------------------

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

                    valign:
                        "middle"

                },

                headStyles: {

                    fillColor: [
                        13,
                        71,
                        161
                    ],

                    textColor:
                        255,

                    fontStyle:
                        "bold",

                    halign:
                        "left"

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

                didParseCell:
                    function(data) {

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


            currentY =
                doc.lastAutoTable.finalY +
                5;


            // ==================================================
            // TOTALS
            // ==================================================

            const totalElement =
                table.nextElementSibling;


            if (
                totalElement
            ) {

                const summaryText =
                    totalElement.innerText;


                const billingMatch =
                    summaryText.match(
                        /Total Billing:\s*₹?\s*([\d,.-]+)/i
                    );


                const billing =
                    billingMatch

                        ?

                        toNumber(
                            billingMatch[1]
                        )

                        :

                        0;


                const incentiveMatch =
                    summaryText.match(
                        /Incentive Amount:\s*₹?\s*([\d,.-]+)/i
                    );


                const incentive =
                    incentiveMatch

                        ?

                        toNumber(
                            incentiveMatch[1]
                        )

                        :

                        0;


                const netBillingMatch =
                    summaryText.match(
                        /Net Billing:\s*₹?\s*([\d,.-]+)/i
                    );


                const netBilling =
                    netBillingMatch

                        ?

                        toNumber(
                            netBillingMatch[1]
                        )

                        :

                        0;


                if (
                    currentY >
                    pageHeight - 35
                ) {

                    doc.addPage();

                    currentY =
                        20;

                }


                doc.setFont(
                    "helvetica",
                    "bold"
                );


                doc.setFontSize(
                    10
                );


                doc.text(
                    `Total Billing: ${formatPDFMoney(
                        billing
                    )}`,
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


                doc.text(
                    `Incentive Amount: ${formatPDFMoney(
                        incentive
                    )}`,
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


                doc.text(
                    `Net Billing: ${formatPDFMoney(
                        netBilling
                    )}`,
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


    // ==================================================
    // FOOTER
    // ==================================================

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


    // ==================================================
    // SAVE PDF
    // ==================================================

    const safeRegionName =
        regionText
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


    doc.save(
        `Advisor_Item_Amount_Report_${safeRegionName}_${reportDate}.pdf`
    );

}


// ======================================================
// GO TO ADMIN DASHBOARD
// ======================================================

function goToAdminDashboard() {

    window.location.href =
        "admin.html";

}