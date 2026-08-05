const roId = localStorage.getItem("currentRO");

//====================================================
// Load Repair Order
//====================================================

db.collection("repairorders")
.doc(roId)
.get()
.then((doc) => {

    if (!doc.exists) {

        alert("Repair Order not found.");
        return;

    }

    const repairData = doc.data();

    //--------------------------------------------------
    // RO Number
    //--------------------------------------------------

    document.getElementById("roNumber").innerHTML =
        repairData.roNumber;

    //--------------------------------------------------
    // Date & Time
    //--------------------------------------------------

    if (repairData.createdAt) {

        document.getElementById("createdDate").innerHTML =
        repairData.createdAt.toDate().toLocaleString("en-GB", {

            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true

        });

    }

    //--------------------------------------------------
    // Vehicle Number
    //--------------------------------------------------

    document.getElementById("vehicleNumber").value =
        repairData.vehicleNumber;

    //--------------------------------------------------
    // advisor Name
    //--------------------------------------------------

    document.getElementById("advisorName").value =
        repairData.advisorName;

    //--------------------------------------------------
    // Item Code
    //--------------------------------------------------

    loadItems(repairData.itemCode);

})
.catch((error) => {

    console.error(error);
    alert("Unable to load Repair Order.");

});


//====================================================
// Load Item Codes
//====================================================

function loadItems(selectedItem){

    db.collection("itemcodes")
    .where("active","==",true)
    .get()

    .then((snapshot)=>{

        let html =
        `<option value="">-- Select Item Code --</option>`;

        snapshot.forEach((doc)=>{

            const item = doc.data();

            html += `
            <option value="${item.itemCode}">
                ${item.itemCode} - ${item.description}
            </option>
            `;

        });

        document.getElementById("itemCode").innerHTML = html;

        document.getElementById("itemCode").value = selectedItem;

    })

    .catch((error)=>{

        console.error(error);

    });

}


//====================================================
// Enable Edit
//====================================================

function enableEdit(){

    document.getElementById("vehicleNumber").disabled = false;

    document.getElementById("advisorName").disabled = false;

    document.getElementById("itemCode").disabled = false;

    document.getElementById("updateBtn").style.display =
    "inline-block";

}


//====================================================
// Update Repair Order
//====================================================

async function updateRO(){

    const vehicleNumber =
    document.getElementById("vehicleNumber")
    .value
    .trim()
    .toUpperCase();

    const advisorName =
    document.getElementById("advisorName")
    .value
    .trim()
    .toUpperCase();

    const itemCode =
    document.getElementById("itemCode").value;

    //--------------------------------------------------
    // Validation
    //--------------------------------------------------

    if(vehicleNumber === "" ||
       advisorName === "" ||
       itemCode === ""){

        alert("Please fill all fields.");

        return;

    }

    //--------------------------------------------------
    // Advisor Name Validation
    //--------------------------------------------------

    const namePattern = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

    if(!namePattern.test(advisorName)){

        alert("Advisor name can contain only letters and spaces.");

        return;

    }

    if(advisorName.length < 3){

        alert("Advisor name must contain at least 3 characters.");

        return;

    }

    if(advisorName.length > 20){

        alert("Advisor name cannot exceed 20 characters.");

        return;

    }

    //--------------------------------------------------
    // Update Firestore
    //--------------------------------------------------

    try{

        await db.collection("repairorders")
        .doc(roId)
        .update({

            vehicleNumber: vehicleNumber,

            advisorName: advisorName,

            itemCode: itemCode

        });

        alert("Repair Order Updated Successfully.");

        location.reload();

    }

    catch(error){

        console.error(error);

        alert("Unable to update Repair Order.");

    }

}