let leaderData = {};
let itemMap = {};

auth.onAuthStateChanged(async (user) => {

    if (!user) {
        location = "../../pages/auth/loginindex.html";
        return;
    }

    const leaderDoc = await db.collection("users")
        .doc(user.uid)
        .get();
leaderData = leaderDoc.data();

await loadItemCodes();

loadRepairOrders();

});
async function loadItemCodes(){

    const snapshot = await db.collection("itemcodes")
    .where("active","==",true)
    .get();

    snapshot.forEach(doc=>{

        const item = doc.data();

        itemMap[item.itemCode] = item.description;

    });

}
async function loadRepairOrders() {

    try {

        const snapshot = await db.collection("repairorders")
            .where("region", "==", leaderData.region)
            .orderBy("createdAt", "desc")
            .get();

        let html = "";

        for (const doc of snapshot.docs) {

            const ro = doc.data();

            //--------------------------------------------------
            // Date
            //--------------------------------------------------

            let date = "-";

            if (ro.createdAt) {

                date = ro.createdAt.toDate()
                    .toLocaleDateString("en-GB");

            }

            //--------------------------------------------------
            // Work Description
            //--------------------------------------------------

            const workDone = itemMap[ro.itemCode] || "-";

            //--------------------------------------------------
            // Table
            //--------------------------------------------------

            html += `

            <tr>

                <td>${ro.roNumber}</td>

                <td>${date}</td>

                <td>${ro.vehicleNumber}</td>

                <td>${ro.labourName}</td>

                <td>${ro.itemCode}</td>

                <td>${workDone}</td>

                <td>
                <button class="view-btn" onclick="viewRO('${doc.id}')">
                View
                </button>
                </td>
            </tr>

            `;

        }

        if (html === "") {

            html = `

            <tr>

                <td colspan="7"
                style="text-align:center;color:red">

                No Repair Orders Found

                </td>

            </tr>

            `;

        }

        document.querySelector("#roTable tbody").innerHTML = html;

    }

    catch (error) {

        console.error(error);

    }

}

function viewRO(id){

    localStorage.setItem("currentRO",id);

    location="viewRO.html";

}