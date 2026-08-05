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
        let workSummary = {};
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
            // Get Work Description
            //--------------------------------------------------

           let workDone = ro.itemCode;

const itemDoc =
    await db.collection("itemcodes")
    .doc(ro.itemCode)
    .get();

if(itemDoc.exists){

    const item = itemDoc.data();

    workDone = `${item.itemCode} - ${item.description}`;

}
             // Count each work type

            if(workSummary[workDone]){

             workSummary[workDone]++;

           }else{

              workSummary[workDone] = 1;

         }
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

                <td>${ro.roNumber}</td>

                <td>${date}</td>

                <td>${regionName}</td>
                 
                <td>${ro.advisorName}</td>

                <td>${ro.vehicleNumber}</td>

                <td>${workDone}</td>

            </tr>

            `;

        }
    //--------------------------------------------------
// Generate Work Summary
//--------------------------------------------------

let summaryHTML = "";

for (const work in workSummary) {

    summaryHTML += `
    <tr>
        <td>${work}</td>
        <td>${workSummary[work]}</td>
    </tr>
    `;

}

document.getElementById("workSummary").innerHTML = summaryHTML;

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

    // Clear previous work summary
    document.getElementById("workSummary").innerHTML = "";

    // Show "No Repair Orders Found"
    document.getElementById("reportBody").innerHTML = `

    <tr>
        <td colspan="6"
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
    // Work Summary
    //---------------------------------------------------

    let summary=[];

    document.querySelectorAll("#workSummary tr")
    .forEach(tr=>{

        let row=[];

        tr.querySelectorAll("td")
        .forEach(td=>{

            row.push(td.innerText);

        });

        if(row.length>0){

            summary.push(row);

        }

    });

    doc.autoTable({

        startY:doc.lastAutoTable.finalY+12,

        head:[[
            "Work Type",
            "Count"
        ]],

        body:summary,

        theme:"striped",

        headStyles:{
            fillColor:[39,174,96]
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

}