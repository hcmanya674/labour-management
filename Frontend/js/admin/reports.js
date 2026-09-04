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
// IMPORTANT:
// Region filtering supports:
// - Region Firestore document ID
// - regionId
// - regionName
// - Different capitalization / spaces
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


            // --------------------------------------------------
            // IMPORTANT:
            // Use Firestore document ID as dropdown value.
            // We will compare it against all possible region
            // values stored inside Repair Orders.
            // --------------------------------------------------

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
// GET REGION OBJECT
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
//
// This is the MAIN FIX.
//
// A Repair Order may contain:
// ro.region = document ID
// ro.region = regionId
// ro.region = regionName
//
// We compare against all possible values.
// ======================================================

function repairOrderMatchesRegion(
    repairOrder,
    selectedRegion
) {

    // --------------------------------------------------
    // All Regions
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
    // If region is stored as a string
    // --------------------------------------------------

    if (
        typeof repairOrderRegion ===
        "string" ||

        typeof repairOrderRegion ===
        "number"
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
    // If region was stored as an object
    // --------------------------------------------------

    if (
        typeof repairOrderRegion ===
        "object"
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
    // Object region
    // --------------------------------------------------

    if (
        typeof value ===
        "object"
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
    // String / Number region
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


    // If no region document matches,
    // display the original value.

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
            repairOrder.createdAt instanceof
            Date
        ) {

            return repairOrder.createdAt;

        }


        // Timestamp object

        if (
            repairOrder.createdAt.seconds
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
// GET ITEM CODES FROM REPAIR ORDER
// ======================================================

function getRepairOrderItemCodes(
    repairOrder
) {

    let items = [];


    // --------------------------------------------------
    // New records
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
    // Older records
    // --------------------------------------------------

    else if (
        repairOrder.itemCodes !==
        undefined &&

        repairOrder.itemCodes !==
        null &&

        repairOrder.itemCodes !==
        ""
    ) {

        items = [
            repairOrder.itemCodes
        ];

    }


    // --------------------------------------------------
    // Very old records
    // --------------------------------------------------

    else if (
        repairOrder.itemCode !==
        undefined &&

        repairOrder.itemCode !==
        null &&

        repairOrder.itemCode !==
        ""
    ) {

        items = [
            repairOrder.itemCode
        ];

    }


    // --------------------------------------------------
    // Convert everything to strings
    // --------------------------------------------------

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
// LOAD ITEM INFORMATION
// ======================================================

async function loadItemInformation(
    itemCodes
) {

    const result = [];


    for (
        const itemCode
        of itemCodes
    ) {

        try {

            const itemDoc =
                await db.collection(
                    "itemcodes"
                )
                .doc(
                    String(itemCode)
                )
                .get();


            if (
                itemDoc.exists
            ) {

                const item =
                    itemDoc.data();


                result.push({

                    itemCode:
                        item.itemCode ||
                        itemCode,

                    description:
                        item.description ||
                        "-",

                    billingAmount:
                        Number(
                            item.billingAmount
                        ) || 0

                });

            }

            else {

                result.push({

                    itemCode:
                        itemCode,

                    description:
                        "-",

                    billingAmount:
                        0

                });

            }

        }

        catch (error) {

            console.error(
                "Error loading item:",
                itemCode,
                error
            );


            result.push({

                itemCode:
                    itemCode,

                description:
                    "-",

                billingAmount:
                    0

            });

        }

    }


    return result;

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


    // --------------------------------------------------
    // Disable buttons while generating
    // --------------------------------------------------

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
    // Validate dates
    // --------------------------------------------------

    if (
        fromDate === "" ||
        toDate === ""
    ) {

        alert(
            "Please select From Date and To Date."
        );


        restoreGenerateButton();

        return;

    }


    // --------------------------------------------------
    // Validate date order
    // --------------------------------------------------

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

        // --------------------------------------------------
        // Wait for regions to finish loading
        // --------------------------------------------------

        if (
            regionsLoadedPromise
        ) {

            await regionsLoadedPromise;

        }


        // --------------------------------------------------
        // LOAD REPAIR ORDERS
        //
        // IMPORTANT:
        // Do NOT use .where("region","==",...)
        //
        // because old records may contain:
        // document ID / regionId / regionName.
        // --------------------------------------------------

        const snapshot =
            await db.collection(
                "repairorders"
            ).get();


        let html = "";


        const advisorSummary = {};


        const allWorkTypes =
            new Set();


        // --------------------------------------------------
        // PROCESS REPAIR ORDERS
        // --------------------------------------------------

        for (
            const doc
            of snapshot.docs
        ) {

            const ro =
                doc.data();


            // --------------------------------------------------
            // Date
            // --------------------------------------------------

            const createdDate =
                getCreatedDate(ro);


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
            // REGION FILTER
            // --------------------------------------------------

            if (
                !repairOrderMatchesRegion(
                    ro,
                    selectedRegion
                )
            ) {

                continue;

            }


            // --------------------------------------------------
            // REGION NAME
            // --------------------------------------------------

            const regionName =
                getRegionDisplayName(ro);


            // --------------------------------------------------
// GET ITEM CODES / WORK DONE
// --------------------------------------------------

let itemCodes = [];

// New format: itemCodes is an array
if (Array.isArray(ro.itemCodes)) {

    itemCodes = ro.itemCodes;

}

// Single itemCodes value
else if (
    ro.itemCodes !== undefined &&
    ro.itemCodes !== null &&
    ro.itemCodes !== ""
) {

    itemCodes = [
        ro.itemCodes
    ];

}

// Old format: itemCode
else if (
    ro.itemCode !== undefined &&
    ro.itemCode !== null &&
    ro.itemCode !== ""
) {

    itemCodes = [
        ro.itemCode
    ];

}

// Another possible old format: workDone
else if (Array.isArray(ro.workDone)) {

    itemCodes = ro.workDone;

}

else if (
    ro.workDone !== undefined &&
    ro.workDone !== null &&
    ro.workDone !== ""
) {

    itemCodes = [
        ro.workDone
    ];

}

console.log(
    "RO:",
    doc.id,
    "ITEM CODES:",
    itemCodes
);

            // --------------------------------------------------
// LOAD ITEM INFORMATION
// --------------------------------------------------

const itemInformation = [];

for (const rawCode of itemCodes) {

    if (
        rawCode === null ||
        rawCode === undefined ||
        rawCode === ""
    ) {
        continue;
    }

    const code =
        String(rawCode).trim();

    let itemData = null;

    // ==================================================
    // FIRST: TRY DOCUMENT ID
    // ==================================================

    try {

        const itemDoc =
            await db
                .collection("itemcodes")
                .doc(code)
                .get();

        if (itemDoc.exists) {

            itemData =
                itemDoc.data();

        }

    }

    catch (error) {

        console.warn(
            "Document ID lookup failed:",
            code,
            error
        );

    }


    // ==================================================
    // SECOND: SEARCH itemCode AS STRING
    // ==================================================

    if (!itemData) {

        try {

            const stringSnapshot =
                await db
                    .collection("itemcodes")
                    .where(
                        "itemCode",
                        "==",
                        code
                    )
                    .limit(1)
                    .get();

            if (!stringSnapshot.empty) {

                itemData =
                    stringSnapshot
                        .docs[0]
                        .data();

            }

        }

        catch (error) {

            console.warn(
                "String itemCode lookup failed:",
                code,
                error
            );

        }

    }


    // ==================================================
    // THIRD: SEARCH itemCode AS NUMBER
    // ==================================================

    if (!itemData && !isNaN(Number(code))) {

        try {

            const numberSnapshot =
                await db
                    .collection("itemcodes")
                    .where(
                        "itemCode",
                        "==",
                        Number(code)
                    )
                    .limit(1)
                    .get();

            if (!numberSnapshot.empty) {

                itemData =
                    numberSnapshot
                        .docs[0]
                        .data();

            }

        }

        catch (error) {

            console.warn(
                "Number itemCode lookup failed:",
                code,
                error
            );

        }

    }


    // ==================================================
    // ITEM FOUND
    // ==================================================

    if (itemData) {

        const actualItemCode =
            itemData.itemCode !== undefined
                ? itemData.itemCode
                : code;

        const description =
            itemData.description ||
            itemData.workDescription ||
            itemData.workDone ||
            "-";

        const billingAmount =
            Number(
                itemData.billingAmount
            ) || 0;


        itemInformation.push({

            itemCode:
                String(actualItemCode),

            description:
                String(description),

            billingAmount:
                billingAmount

        });


        console.log(
            "ITEM FOUND:",
            code,
            description
        );

    }


    // ==================================================
    // ITEM NOT FOUND
    // ==================================================

    else {

        console.warn(
            "ITEM DESCRIPTION NOT FOUND FOR:",
            code
        );


        // Keep the code visible but clearly indicate
        // that the item master does not contain it.

        itemInformation.push({

            itemCode:
                code,

            description:
                "Description Not Found",

            billingAmount:
                0

        });

    }

}

            // --------------------------------------------------
            // BILLING
            // --------------------------------------------------

            let billingAmount = 0;


            const workDescriptions = [];


            itemInformation.forEach(
                item => {

                    billingAmount +=
                        Number(
                            item.billingAmount
                        ) || 0;


                    workDescriptions.push(

                        `${escapeHtml(
                            item.itemCode
                        )} - ${escapeHtml(
                            item.description
                        )}`

                    );

                }
            );


            // --------------------------------------------------
            // WORK DONE
            // --------------------------------------------------

            const workDone =
                workDescriptions.length > 0

                    ?

                    workDescriptions
                        .map(
                            item => `
                                <div class="work-item">
                                    ${item}
                                </div>
                            `
                        )
                        .join("")

                    :

                    "-";


            // --------------------------------------------------
            // Advisor
            // --------------------------------------------------

            const advisor =
                ro.advisorName ||
                "Unknown Advisor";


            // --------------------------------------------------
            // Advisor Wise Summary
            //
            // Use item-code + description as the key,
            // NOT the HTML workDone string.
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
            // DATE FORMAT
            // --------------------------------------------------

            const formattedDate =
                createdDate.toLocaleDateString(
                    "en-GB"
                );


            // --------------------------------------------------
            // DISPLAY TABLE
            // --------------------------------------------------

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

                    <td>
                        ₹${billingAmount.toLocaleString(
                            "en-IN"
                        )}
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


    // --------------------------------------------------
    // Restore Generate button
    // --------------------------------------------------

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
    // Validate dates
    // --------------------------------------------------

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


    if (
        from > to
    ) {

        alert(
            "From Date cannot be greater than To Date."
        );

        return;

    }


    try {

        // --------------------------------------------------
        // Wait for regions
        // --------------------------------------------------

        if (
            regionsLoadedPromise
        ) {

            await regionsLoadedPromise;

        }


        // ==================================================
        // LOAD ITEM CODES
        // ==================================================

        const itemSnapshot =
            await db.collection(
                "itemcodes"
            )
            .where(
                "active",
                "==",
                true
            )
            .get();


        const itemMap = {};


        itemSnapshot.forEach(
            doc => {

                const item =
                    doc.data();


                const code =
                    String(
                        item.itemCode ||
                        doc.id
                    ).trim();


                itemMap[code] = {

                    itemCode:
                        code,

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


        // ==================================================
        // LOAD REPAIR ORDERS
        // ==================================================
        //
        // IMPORTANT:
        // No direct Firestore region equality filter.
        // ==================================================

        const roSnapshot =
            await db.collection(
                "repairorders"
            ).get();


        // ==================================================
        // STORE DATA BY ADVISOR
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
                    getCreatedDate(ro);


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
                // REGION FILTER
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
                // CREATE ADVISOR
                // --------------------------------------------------

                if (
                    !advisorData[advisor]
                ) {

                    advisorData[advisor] = {

                        items: {},

                        incentive: 0

                    };

                }


                // --------------------------------------------------
                // COUNT ITEMS
                // --------------------------------------------------

                items.forEach(
                    itemCode => {

                        const code =
                            String(
                                itemCode
                            ).trim();


                        if (
                            !advisorData[
                                advisor
                            ].items[code]
                        ) {

                            advisorData[
                                advisor
                            ].items[code] = {

                                quantity: 0

                            };

                        }


                        advisorData[
                            advisor
                        ].items[code]
                            .quantity++;

                    }
                );


                // --------------------------------------------------
                // INCENTIVE
                // --------------------------------------------------

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


        // ==================================================
        // DISPLAY REPORT
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

                const items =
                    advisorData[
                        advisor
                    ].items;


                const incentiveAmount =
                    advisorData[
                        advisor
                    ].incentive || 0;


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


                // --------------------------------------------------
                // ITEMS
                // --------------------------------------------------

                Object.keys(
                    items
                )
                .sort()
                .forEach(
                    itemCode => {

                        const quantity =
                            items[
                                itemCode
                            ].quantity;


                        const itemInfo =
                            itemMap[
                                itemCode
                            ] || {

                                itemCode:
                                    itemCode,

                                description:
                                    "-",

                                billingAmount:
                                    0

                            };


                        const total =
                            quantity *
                            itemInfo.billingAmount;


                        advisorTotal +=
                            total;


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
                                    itemInfo.description
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
                                ₹${total.toLocaleString(
                                    "en-IN"
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
                // BILLING + INCENTIVE + NET
                // ==================================================

                const totalDiv =
                    document.createElement(
                        "div"
                    );


                totalDiv.className =
                    "advisor-total";


                const netAmount =
                    advisorTotal -
                    incentiveAmount;


                totalDiv.innerHTML = `

                    <div>

                        Total Billing:

                        <strong>

                            ₹${advisorTotal.toLocaleString(
                                "en-IN"
                            )}

                        </strong>

                    </div>


                    <div>

                        Incentive Amount:

                        <strong>

                            ₹${incentiveAmount.toLocaleString(
                                "en-IN"
                            )}

                        </strong>

                    </div>


                    <div>

                        Net Billing:

                        <strong>

                            ₹${netAmount.toLocaleString(
                                "en-IN"
                            )}

                        </strong>

                    </div>

                `;


                container.appendChild(
                    totalDiv
                );

            }
        );


        // --------------------------------------------------
        // Enable Advisor PDF
        // --------------------------------------------------

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
                    td => {

                        row.push(
                            td.innerText
                                .trim()
                        );

                    }
                );


                // --------------------------------------------------
                // Ignore "No Repair Orders Found"
                // --------------------------------------------------

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
                cellWidth:
                    22
            },

            1: {
                cellWidth:
                    22
            },

            2: {
                cellWidth:
                    28
            },

            3: {
                cellWidth:
                    28
            },

            4: {
                cellWidth:
                    28
            },

            5: {
                cellWidth:
                    45
            },

            6: {
                cellWidth:
                    25,

                halign:
                    "right"

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


    const fileName =
        `Repair_Report_${safeRegionName}_${reportDate}.pdf`;


    doc.save(
        fileName
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
    // FORMAT MONEY
    // ==================================================

    function formatMoney(
        value
    ) {

        if (
            value === null ||
            value === undefined
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
        (
            advisorHeading
        ) => {

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
                            cells.length <
                            4
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


            if (
                rows.length === 0
            ) {

                return;

            }


            // --------------------------------------------------
            // CHECK PAGE SPACE
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


            // --------------------------------------------------
            // TABLE END
            // --------------------------------------------------

            currentY =
                doc.lastAutoTable.finalY +
                5;


            // ==================================================
            // BILLING / INCENTIVE / NET BILLING
            // ==================================================

            const totalElement =
                table.nextElementSibling;


            if (
                totalElement
            ) {

                const summaryText =
                    totalElement.innerText;


                // --------------------------------------------------
                // TOTAL BILLING
                // --------------------------------------------------

                const billingMatch =
                    summaryText.match(
                        /Total Billing:\s*₹?\s*([\d,.-]+)/i
                    );


                const billing =
                    billingMatch

                        ?

                        Number(
                            billingMatch[1]
                                .replace(
                                    /,/g,
                                    ""
                                )
                        )

                        :

                        0;


                // --------------------------------------------------
                // INCENTIVE
                // --------------------------------------------------

                const incentiveMatch =
                    summaryText.match(
                        /Incentive Amount:\s*₹?\s*([\d,.-]+)/i
                    );


                const incentive =
                    incentiveMatch

                        ?

                        Number(
                            incentiveMatch[1]
                                .replace(
                                    /,/g,
                                    ""
                                )
                        )

                        :

                        0;


                // --------------------------------------------------
                // NET BILLING
                // --------------------------------------------------

                const netBillingMatch =
                    summaryText.match(
                        /Net Billing:\s*₹?\s*([\d,.-]+)/i
                    );


                const netBilling =
                    netBillingMatch

                        ?

                        Number(
                            netBillingMatch[1]
                                .replace(
                                    /,/g,
                                    ""
                                )
                        )

                        :

                        0;


                // --------------------------------------------------
                // CHECK SPACE
                // --------------------------------------------------

                if (
                    currentY >
                    pageHeight - 35
                ) {

                    doc.addPage();

                    currentY =
                        20;

                }


                // --------------------------------------------------
                // STYLE
                // --------------------------------------------------

                doc.setFont(
                    "helvetica",
                    "bold"
                );


                doc.setFontSize(
                    10
                );


                // --------------------------------------------------
                // TOTAL BILLING
                // --------------------------------------------------

                doc.text(
                    `Total Billing: ${formatMoney(
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


                // --------------------------------------------------
                // INCENTIVE
                // --------------------------------------------------

                doc.text(
                    `Incentive Amount: ${formatMoney(
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


                // --------------------------------------------------
                // NET BILLING
                // --------------------------------------------------

                doc.text(
                    `Net Billing: ${formatMoney(
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