initializePage();

function initializePage(){

    loadRegions();

}

function loadRegions(){

    db.collection("regions")

    .where("active","==",true)

    .get()

    .then((snapshot)=>{

        let html =

        `<option value="">All Regions</option>`;

        snapshot.forEach(doc=>{

            let region = doc.data();

            html += `

            <option value="${region.regionId}">

                ${region.regionName}

            </option>

            `;

        });

        document.getElementById("reportRegion").innerHTML = html;

    });

}
async function generateReport() {

    const fromDate = document.getElementById("fromDate").value;
    const toDate = document.getElementById("toDate").value;
    const region = document.getElementById("reportRegion").value;
    const btn = document.getElementById("generateBtn");
    const exportBtn = document.getElementById("exportBtn");
    const advisorExportBtn = document.getElementById("advisorExportBtn");

if (advisorExportBtn) {
    advisorExportBtn.disabled = true;
}
// Disable Export until the new report finishes generating
exportBtn.disabled = true;

    btn.disabled = true;

    btn.innerHTML =
    `
    <div class="spinner"></div>
    Generating...
    `;
    if (fromDate === "" || toDate === "") {
        alert("Please select From Date and To Date.");
        exportBtn.disabled = true;
       btn.disabled = false;
       btn.innerHTML = "Generate Report";
        return;
    }

    let start = new Date(fromDate);
    start.setHours(0,0,0,0);

    let end = new Date(toDate);
    end.setHours(23,59,59,999);

    let query = db.collection("repairorders");

    // Filter by Region
    if(region !== ""){
        query = query.where("region","==",region);
    }

    query.get().then(async(snapshot)=>{

        let html="";
        let advisorSummary = {};
        let allWorkTypes = new Set();
        for(const doc of snapshot.docs){

            const ro = doc.data();

            if(!ro.createdAt) continue;

            const createdDate = ro.createdAt.toDate();

            if(createdDate < start || createdDate > end)
                continue;

            //--------------------------------------------------
            // Get Region Name
            //--------------------------------------------------

            let regionName = ro.region;

            const regionDoc =
                await db.collection("regions")
                .doc(ro.region)
                .get();

            if(regionDoc.exists){

                regionName =regionDoc.data().regionName;

            }
                
            //--------------------------------------------------
            // GET ITEM CODES + BILLING AMOUNT
            //--------------------------------------------------

            let itemCodes = [];

            // New records
            if (Array.isArray(ro.itemCodes)) {

                itemCodes = ro.itemCodes;

            }

            // Old records
            else if (ro.itemCodes) {

                itemCodes = [ro.itemCodes];

            }

            // Very old records
            else if (ro.itemCode) {

                itemCodes = [ro.itemCode];

            }


            // ------------------------------------------
            // Calculate Billing Amount
            // ------------------------------------------

            let billingAmount = 0;

            let workDescriptions = [];


            // Loop through every selected item
            for (const itemCode of itemCodes) {

                const itemDoc =
                    await db.collection("itemcodes")
                    .doc(itemCode)
                    .get();


                if (itemDoc.exists) {

                    const item = itemDoc.data();


                    // Add item cost
                    billingAmount +=
                      Number(item.billingAmount) || 0;


                    // Add description
                    workDescriptions.push(
                        `${item.itemCode} - ${item.description || "-"}`
                    );

                }

                else {

                    // If item code no longer exists
                    workDescriptions.push(itemCode);

                }

            }


            // ------------------------------------------
            // Work Done Display
            // ------------------------------------------

            const workDone =
            workDescriptions.length > 0
                ? workDescriptions
                    .map(item => `<div class="work-item">${item}</div>`)
                    .join("")
                : "-";
         //--------------------------------------
        // Advisor Wise Summary
        //--------------------------------------

            allWorkTypes.add(workDone);

            if(!advisorSummary[ro.advisorName]){

                advisorSummary[ro.advisorName]={};

            }

            if(!advisorSummary[ro.advisorName][workDone]){

                advisorSummary[ro.advisorName][workDone]=0;

            }

            advisorSummary[ro.advisorName][workDone]++;
            //--------------------------------------------------
            // Format Date
            //--------------------------------------------------

            const date =
                createdDate.toLocaleDateString("en-GB");


html += `

<tr>

    <td>${ro.roNumber || "-"}</td>

    <td>${date}</td>

    <td>${regionName || "-"}</td>

    <td>${ro.advisorName || "-"}</td>

    <td>${ro.vehicleNumber || "-"}</td>

    <td>${workDone || "-"}</td>

    <td>
        ₹${billingAmount.toLocaleString("en-IN")}
    </td>

</tr>

`;
  }
//------------------------------------------------
// Advisor Wise Summary Table
//------------------------------------------------

let workTypes = Array.from(allWorkTypes);

let head ="<tr><th>Advisor Name</th>";

workTypes.forEach(work=>{

    head += `<th>${work}</th>`;

});

head += "<th>Total</th></tr>";

document.getElementById("advisorSummaryHead").innerHTML = head;


let body="";

let columnTotals={};

let grandTotal=0;

for(const advisor in advisorSummary){

    body += `<tr>`;

    body += `<td>${advisor}</td>`;

    let rowTotal=0;

    workTypes.forEach(work=>{

        let count = advisorSummary[advisor][work] || 0;

        body += `<td>${count}</td>`;

        rowTotal += count;

        columnTotals[work]=(columnTotals[work]||0)+count;

    });

    body += `<td><b>${rowTotal}</b></td>`;

    body += `</tr>`;

    grandTotal += rowTotal;

}

body += `<tr style="font-weight:bold;background:#f5f5f5;">`;

body += `<td>TOTAL</td>`;

workTypes.forEach(work=>{

    body += `<td>${columnTotals[work]||0}</td>`;

});

body += `<td>${grandTotal}</td>`;

body += `</tr>`;

document.getElementById("advisorSummaryBody").innerHTML=body;
//--------------------------------------------------
// Display Report
//--------------------------------------------------

if (html === "") {
   exportBtn.disabled = true;


    // Show "No Repair Orders Found"
    document.getElementById("reportBody").innerHTML = `

    <tr>
        <td colspan="7"
            style="
                text-align:center;
                color:red;
                font-size:18px;
                font-weight:bold;
                padding:20px;
            ">
            No Repair Orders Found
        </td>
    </tr>
    `;

} else {

    document.getElementById("reportBody").innerHTML = html;
    exportBtn.disabled = false;
}

// Restore button

btn.disabled = false;
btn.innerHTML = "Generate Report";
    })
   .catch((error)=>{

    console.error("REPORT ERROR:", error);

    alert(error.message);

    btn.disabled = false;
    btn.innerHTML = "Generate Report";

});

}
// ======================================================
// ADVISOR ITEM & AMOUNT REPORT
// ======================================================

async function generateAdvisorItemReport() {

   const advisorExportBtn =
    document.getElementById("advisorExportBtn");
    advisorExportBtn.disabled = true;
    const fromDate =
        document.getElementById("fromDate").value;

    const toDate =
        document.getElementById("toDate").value;

    const selectedRegion =
        document.getElementById("reportRegion").value;
   
    if (!fromDate || !toDate) {

        alert("Please select From Date and To Date.");

        return;
    }

    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);

    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);

    try {

        // ==================================================
        // LOAD ITEM CODES
        // ==================================================

        const itemSnapshot =
            await db.collection("itemcodes")
            .where("active", "==", true)
            .get();

        const itemMap = {};

        itemSnapshot.forEach(doc => {

            const item = doc.data();

          itemMap[item.itemCode] = {

    description:
        item.description || "-",

    billingAmount:
        Number(item.billingAmount) || 0

};

        });


        // ==================================================
        // LOAD REPAIR ORDERS
        // ==================================================

        let roQuery =
            db.collection("repairorders");

        // Region filter

        if (selectedRegion !== "") {

            roQuery =
                roQuery.where(
                    "region",
                    "==",
                    selectedRegion
                );

        }

        const roSnapshot =
            await roQuery.get();


        // ==================================================
        // STORE DATA BY ADVISOR
        // ==================================================

        const advisorData = {};


        roSnapshot.forEach(doc => {

            const ro = doc.data();

            // ----------------------------------------------
            // Date validation
            // ----------------------------------------------

            if (!ro.createdAt) {
                return;
            }

            const createdDate =
                ro.createdAt.toDate();

            if (
                createdDate < from ||
                createdDate > to
            ) {
                return;
            }


            // ----------------------------------------------
            // Advisor
            // ----------------------------------------------

            const advisor =
                ro.advisorName ||
                "Unknown Advisor";


            // ----------------------------------------------
            // Item Codes
            // ----------------------------------------------

            let items = [];

            if (Array.isArray(ro.itemCodes)) {

                items = ro.itemCodes;

            }
            else if (ro.itemCodes) {

                items = [ro.itemCodes];

            }
            else if (ro.itemCode) {

                // Support old records

                items = [ro.itemCode];

            }


            // ----------------------------------------------
            // Create Advisor
            // ----------------------------------------------
                if (!advisorData[advisor]) {

                    advisorData[advisor] = {
                        items: {},
                        incentive: 0
                    };

                }


            // ----------------------------------------------
            // Count Items
            // ----------------------------------------------

                items.forEach(itemCode => {

            if (!advisorData[advisor].items[itemCode]) {

                advisorData[advisor].items[itemCode] = {

                    quantity: 0

                };

                }

                advisorData[advisor].items[itemCode]
                    .quantity++;

            });
            // ----------------------------------------------
            // INCENTIVE AMOUNT
            // ----------------------------------------------

            const incentive =
                Number(ro.incentiveAmount) || 0;

            advisorData[advisor].incentive += incentive;

        });


        // ==================================================
        // DISPLAY REPORT
        // ==================================================

        const container =
            document.getElementById(
                "advisorItemReportContainer"
            );

        container.innerHTML = "";


        const advisors =
            Object.keys(advisorData)
            .sort();


        if (advisors.length === 0) {

            container.innerHTML = `

                <div style="
                    text-align:center;
                    color:red;
                    font-weight:bold;
                    padding:20px;
                ">

                    No data found for selected dates.

                </div>

            `;

            document.getElementById(
                "advisorExportBtn"
            ).disabled = true;

            return;
        }


        // ==================================================
        // CREATE ADVISOR SECTIONS
        // ==================================================

        advisors.forEach(advisor => {

                const items =
            advisorData[advisor].items;

        const incentiveAmount =
            advisorData[advisor].incentive || 0;


            // ------------------------------------------
            // Advisor Heading
            // ------------------------------------------

            const advisorTitle =
                document.createElement("h3");

            advisorTitle.textContent =
                "Advisor: " + advisor;

            advisorTitle.style.marginTop =
                "25px";

            advisorTitle.style.marginBottom =
                "10px";

            container.appendChild(
                advisorTitle
            );


            // ------------------------------------------
            // Table
            // ------------------------------------------

            const table =
                document.createElement("table");

            table.className =
                "advisor-item-table";


            table.innerHTML = `

                <thead>

                    <tr>

                        <th>Item Code</th>

                        <th>Description</th>

                        <th>Items Done</th>

                        <th>Total Amount</th>

                    </tr>

                </thead>

                <tbody></tbody>

            `;


            const tbody =
                table.querySelector("tbody");


            let advisorTotal = 0;


            // ------------------------------------------
            // Items
            // ------------------------------------------

            Object.keys(items)
                .sort()
                .forEach(itemCode => {

                    const quantity =
                        items[itemCode].quantity;


                    const itemInfo =
                    itemMap[itemCode] || {

                        description: "-",

                        billingAmount: 0

                    };


                    const total =
                            quantity *
                            itemInfo.billingAmount;


                    advisorTotal += total;


                    const row =
                        document.createElement("tr");


                    row.innerHTML = `

                        <td>
                            ${itemCode}
                        </td>

                        <td>
                            ${itemInfo.description}
                        </td>

                        <td class="quantity-cell">
                            ${quantity}
                        </td>

                        <td class="amount-cell">
                            ₹${total.toLocaleString("en-IN")}
                        </td>

                    `;


                    tbody.appendChild(row);

                });


            container.appendChild(table);

// ------------------------------------------
// BILLING + INCENTIVE SUMMARY
// ------------------------------------------

const totalDiv =
    document.createElement("div");

totalDiv.className =
    "advisor-total";


// Net amount after incentive

const netAmount =
    advisorTotal - incentiveAmount;


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

        });


        // Enable PDF

        document.getElementById(
            "advisorExportBtn"
        ).disabled = false;



    }

    catch (error) {

        console.error(
            "Advisor report error:",
            error
        );

        alert(
            "Unable to generate Advisor Item Report."
        );

    }

}
async function exportPDF(){

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF("p","mm","a4");

    //---------------------------------------------------
    // Heading
    //---------------------------------------------------

    doc.setFontSize(18);
    doc.text("Labour Management System",105,15,{align:"center"});

    doc.setFontSize(14);
    doc.text("Repair Order Report",105,24,{align:"center"});

    //---------------------------------------------------
    // Filters
    //---------------------------------------------------

    const fromDate =
    document.getElementById("fromDate").value;

    const toDate =
    document.getElementById("toDate").value;

    const region =
    document.getElementById("reportRegion");

    doc.setFontSize(10);

    const from =new Date(fromDate).toLocaleDateString("en-GB");

    const to =new Date(toDate).toLocaleDateString("en-GB");

    doc.text(`From : ${from}   To : ${to}`,14,35);

    doc.text(
    `Region : ${region.options[region.selectedIndex].text}`,
    14,
    41
    );

    //---------------------------------------------------
    // Report Table
    //---------------------------------------------------

    let rows=[];

    document.querySelectorAll("#reportBody tr")
    .forEach(tr=>{

        let row=[];

        tr.querySelectorAll("td")
        .forEach(td=>{

            row.push(td.innerText);

        });

        if(row.length>0){

            rows.push(row);

        }

    });

    doc.autoTable({

        startY:48,

        head:[[
            "RO Number",
            "Date",
            "Region",
            "Leader",
            "Vehicle",
            "Work Done"
        ]],

        body:rows,

        theme:"grid",

        headStyles:{
            fillColor:[41,128,185]
        }

    });


    //---------------------------------------------------
    // Footer
    //---------------------------------------------------

    doc.setFontSize(10);

    const generatedOn =
new Date().toLocaleString("en-GB", {

    day: "2-digit",
    month: "2-digit",
    year: "numeric",

    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",

    hour12: true

});

doc.text(
`Generated on : ${generatedOn}`,
14,
doc.lastAutoTable.finalY + 15
);
    //---------------------------------------------------
    // Download
    //---------------------------------------------------

    //----------------------------------------
// Create File Name
//----------------------------------------

const regionName =
region.options[region.selectedIndex].text
.replace(/\s+/g,"_");

const reportDate =
new Date().toLocaleDateString("en-GB")
.replace(/\//g,"-");

const fileName =
`Repair_Report_${regionName}_${reportDate}.pdf`;

doc.save(fileName);

}// ======================================================
// EXPORT ADVISOR ITEM & AMOUNT PDF
// ======================================================

async function exportAdvisorItemPDF() {

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF("p", "mm", "a4");

    // ==================================================
    // PAGE SETTINGS
    // ==================================================

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const leftMargin = 14;
    const rightMargin = 14;

    let currentY = 15;


    // ==================================================
    // HELPER: FORMAT MONEY
    // ==================================================

    function formatMoney(value) {

        if (value === null || value === undefined) {
            return "Rs. 0";
        }

        // Convert to string
        let text = String(value).trim();

        // Remove Rs / ₹ / commas / spaces / other symbols
        text = text
            .replace(/₹/g, "")
            .replace(/Rs\.?/gi, "")
            .replace(/,/g, "")
            .replace(/\s/g, "")
            .replace(/[^\d.-]/g, "");

        const number = Number(text);

        if (isNaN(number)) {
            return "Rs. 0";
        }

        return "Rs. " + number.toLocaleString("en-IN");
    }


    // ==================================================
    // HEADING
    // ==================================================

    doc.setFont("helvetica", "normal");

    doc.setFontSize(18);

    doc.text(
        "Labour Management System",
        pageWidth / 2,
        currentY,
        {
            align: "center"
        }
    );

    currentY += 9;


    doc.setFontSize(14);

    doc.text(
        "Advisor Item & Amount Report",
        pageWidth / 2,
        currentY,
        {
            align: "center"
        }
    );

    currentY += 11;


    // ==================================================
    // DATE
    // ==================================================

    const fromDate =
        document.getElementById("fromDate").value;

    const toDate =
        document.getElementById("toDate").value;


    let from = "-";
    let to = "-";


    if (fromDate) {

        from =
            new Date(fromDate)
            .toLocaleDateString("en-GB");

    }


    if (toDate) {

        to =
            new Date(toDate)
            .toLocaleDateString("en-GB");

    }


    doc.setFontSize(10);

    doc.setFont("helvetica", "normal");

    doc.text(
        `From : ${from}    To : ${to}`,
        leftMargin,
        currentY
    );

    currentY += 6;


    // ==================================================
    // REGION
    // ==================================================

    const regionSelect =
        document.getElementById("reportRegion");


    let regionText = "All Regions";


    if (regionSelect) {

        const selectedOption =
            regionSelect.options[
                regionSelect.selectedIndex
            ];

        if (selectedOption) {

            regionText =
                selectedOption.text;

        }

    }


    doc.text(
        `Region : ${regionText}`,
        leftMargin,
        currentY
    );

    currentY += 10;


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


    if (container.children.length === 0) {

        alert(
            "Please generate the Advisor Item Report first."
        );

        return;

    }


    // ==================================================
    // FIND ADVISOR SECTIONS
    // ==================================================

    const advisorSections =
        container.querySelectorAll("h3");


    if (advisorSections.length === 0) {

        alert(
            "No advisor data available for PDF."
        );

        return;

    }


    // ==================================================
    // PROCESS EACH ADVISOR
    // ==================================================

    advisorSections.forEach(
        (advisorHeading, index) => {


            // ------------------------------------------
            // Advisor Name
            // ------------------------------------------

            const advisorName =
                advisorHeading.textContent
                .replace("Advisor:", "")
                .trim();


            // ------------------------------------------
            // Find table
            // ------------------------------------------

            const table =
                advisorHeading.nextElementSibling;


            if (!table) {
                return;
            }


            // ------------------------------------------
            // Extract rows
            // ------------------------------------------

            const rows = [];


            table
                .querySelectorAll("tbody tr")
                .forEach(tr => {


                    const cells =
                        tr.querySelectorAll("td");


                    if (cells.length < 4) {
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

                        formatMoney(amount)

                    ]);

                });


            // ------------------------------------------
            // Skip empty advisor
            // ------------------------------------------

            if (rows.length === 0) {
                return;
            }


            // ------------------------------------------
            // Check page space
            // ------------------------------------------

            if (currentY > pageHeight - 65) {

                doc.addPage();

                currentY = 20;

            }


            // ------------------------------------------
            // Advisor heading
            // ------------------------------------------

            doc.setFont("helvetica", "bold");

            doc.setFontSize(13);

            doc.text(
                `Advisor: ${advisorName}`,
                leftMargin,
                currentY
            );


            currentY += 7;


            // ------------------------------------------
            // Advisor table
            // ------------------------------------------

            doc.autoTable({

                startY: currentY,

                margin: {
                    left: leftMargin,
                    right: rightMargin
                },

                tableWidth: "auto",

                head: [[

                    "Item Code",

                    "Description",

                    "Items Done",

                    "Total Amount"

                ]],

                body: rows,

                theme: "grid",


                // --------------------------------------
                // GENERAL STYLES
                // --------------------------------------

                styles: {

                    font: "helvetica",

                    fontSize: 9,

                    cellPadding: 3,

                    lineColor: [
                        190,
                        190,
                        190
                    ],

                    lineWidth: 0.2,

                    valign: "middle"

                },


                // --------------------------------------
                // HEADER
                // --------------------------------------

                headStyles: {

                    fillColor: [
                        41,
                        128,
                        185
                    ],

                    textColor: 255,

                    fontStyle: "bold",

                    halign: "left",

                    valign: "middle"

                },


                // --------------------------------------
                // COLUMNS
                // --------------------------------------

                columnStyles: {

                    0: {

                        cellWidth: 35,

                        halign: "left"

                    },

                    1: {

                        cellWidth: 78,

                        halign: "left"

                    },

                    2: {

                        cellWidth: 30,

                        halign: "center"

                    },

                    3: {

                        cellWidth: 39,

                        halign: "right"

                    }

                },


                // --------------------------------------
                // BODY ALIGNMENT
                // --------------------------------------

                bodyStyles: {

                    valign: "middle"

                },


                // --------------------------------------
                // AMOUNT COLUMN
                // --------------------------------------

                didParseCell: function (data) {

                    if (
                        data.section === "body" &&
                        data.column.index === 3
                    ) {

                        data.cell.styles.halign =
                            "right";

                    }

                    if (
                        data.section === "body" &&
                        data.column.index === 2
                    ) {

                        data.cell.styles.halign =
                            "center";

                    }

                }

            });


            // ------------------------------------------
            // Get table bottom position
            // ------------------------------------------

            currentY =
                doc.lastAutoTable.finalY + 5;


            // ------------------------------------------
// BILLING / INCENTIVE / NET BILLING
// ------------------------------------------

const totalElement =
    table.nextElementSibling;

if (totalElement) {

    // Get all text from the dashboard summary
    const summaryText =
        totalElement.innerText;

    console.log(
        "PDF Summary:",
        summaryText
    );

    // --------------------------------------
    // Extract Total Billing
    // --------------------------------------

    const billingMatch =
        summaryText.match(
            /Total Billing:\s*₹?\s*([\d,.-]+)/i
        );

    const billing =
        billingMatch
            ? Number(
                billingMatch[1]
                .replace(/,/g, "")
              )
            : 0;


    // --------------------------------------
    // Extract Incentive Amount
    // --------------------------------------

    const incentiveMatch =
        summaryText.match(
            /Incentive Amount:\s*₹?\s*([\d,.-]+)/i
        );

    const incentive =
        incentiveMatch
            ? Number(
                incentiveMatch[1]
                .replace(/,/g, "")
              )
            : 0;


    // --------------------------------------
    // Extract Net Billing
    // --------------------------------------

    const netBillingMatch =
        summaryText.match(
            /Net Billing:\s*₹?\s*([\d,.-]+)/i
        );

    const netBilling =
        netBillingMatch
            ? Number(
                netBillingMatch[1]
                .replace(/,/g, "")
              )
            : 0;


    console.log(
        "Billing:",
        billing
    );

    console.log(
        "Incentive:",
        incentive
    );

    console.log(
        "Net Billing:",
        netBilling
    );


    // --------------------------------------
    // Format values
    // --------------------------------------

    const billingText =
        "Rs. " +
        billing.toLocaleString("en-IN");

    const incentiveText =
        "Rs. " +
        incentive.toLocaleString("en-IN");

    const netBillingText =
        "Rs. " +
        netBilling.toLocaleString("en-IN");


    // --------------------------------------
    // PDF Styling
    // --------------------------------------

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.setFontSize(10);


    // --------------------------------------
    // Total Billing
    // --------------------------------------

    doc.text(
        `Total Billing: ${billingText}`,
        pageWidth - rightMargin,
        currentY,
        {
            align: "right"
        }
    );

    currentY += 5;


    // --------------------------------------
    // Incentive Amount
    // --------------------------------------

    doc.text(
        `Incentive Amount: ${incentiveText}`,
        pageWidth - rightMargin,
        currentY,
        {
            align: "right"
        }
    );

    currentY += 5;


    // --------------------------------------
    // Net Billing
    // --------------------------------------

    doc.text(
        `Net Billing: ${netBillingText}`,
        pageWidth - rightMargin,
        currentY,
        {
            align: "right"
        }
    );

    currentY += 12;

}

        }
    );


    // ==================================================
    // FOOTER
    // ==================================================

    if (currentY > pageHeight - 20) {

        doc.addPage();

        currentY = 20;

    }


    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.setFontSize(9);


    const generatedOn =
        new Date().toLocaleString(
            "en-GB",
            {

                day: "2-digit",

                month: "2-digit",

                year: "numeric",

                hour: "2-digit",

                minute: "2-digit",

                hour12: true

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

    doc.save(
        "Advisor_Item_Amount_Report.pdf"
    );

}