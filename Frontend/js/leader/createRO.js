// ==========================================
// CREATE REPAIR ORDER
// ==========================================

// uid comes from leader-common.js
let leaderData = {};

let isSaving = false;

// Load logged-in leader
auth.onAuthStateChanged(async (user) => {

    if (!user) {
        location = "../pages/auth/loginindex.html";
        return;
    }

    const doc = await db.collection("users")
        .doc(user.uid)
        .get();

    if (!doc.exists) {
        alert("Leader record not found.");
        return;
    }

    leaderData = doc.data();

    document.getElementById("leaderName").value = leaderData.name;

    loadRegion();

    loadItems();

});


// ==========================================
// Load Region
// ==========================================

function loadRegion() {

    console.log("Leader Region ID:", leaderData.region);

    db.collection("regions")
    .doc(leaderData.region)
    .get()
    .then((doc) => {

        console.log("Region Exists:", doc.exists);

        if (!doc.exists) return;

        console.log(doc.data());

        document.getElementById("region").value =
            doc.data().regionName;

    });

}

// ==========================================
// Load Item Codes
// ==========================================
function loadItems() {

    const select =
    document.getElementById("itemCode");

    select.innerHTML =
    `<option value="">-- Select Item Code --</option>`;

    db.collection("itemcodes")
    .where("active","==",true)
    .get()
    .then((snapshot)=>{

        snapshot.forEach((doc)=>{

            const data = doc.data();

            const option =
            document.createElement("option");

            option.value = data.itemCode;

            option.text =
            data.itemCode + " - " + data.description;

            select.appendChild(option);

        });

    });

}

// ==========================================
// Save Repair Order
// ==========================================
async function saveRO() {

    const saveBtn = document.getElementById("saveBtn");
    const roNumber =document.getElementById("roNumber").value.trim().toUpperCase();
    saveBtn.disabled = true;
    saveBtn.innerHTML = "Saving...";

    try {

    const vehicleNumber =
    document.getElementById("vehicleNumber")
    .value.trim()
    .toUpperCase();

    const advisorName =
        document.getElementById("advisorName")
        .value.trim()
        .toUpperCase();

    const itemCode =
        document.getElementById("itemCode").value;

        // -----------------------------------
        // Advisor Name Validation
        // -----------------------------------

        const namePattern = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

        if (!namePattern.test(advisorName)) {

            alert("Advisor name can contain only letters and spaces.");

            saveBtn.disabled = false;
            saveBtn.innerHTML = "Save Repair Order";

            return;

        }

        if (advisorName.length < 3) {

            alert("Advisor name must contain at least 3 characters.");

            saveBtn.disabled = false;
            saveBtn.innerHTML = "Save Repair Order";

            return;

        }

        if (advisorName.length > 30) {

            alert("Advisor name cannot exceed 30 characters.");

            saveBtn.disabled = false;
            saveBtn.innerHTML = "Save Repair Order";

            return;

        }

        if (itemCode === "") {
         alert("Please select an Item.");
        return;
       }
        if (
        roNumber == "" ||
        vehicleNumber == "" ||
        advisorName == "" ||
        itemCode == ""
        ) {

            alert("Please fill all required fields.");

            saveBtn.disabled = false;
            saveBtn.innerHTML = "Save Repair Order";

            return;
        }

        const now = new Date();

        const yyyy = now.getFullYear();

        const months = [
            "Jan","Feb","Mar","Apr",
            "May","Jun","Jul","Aug",
            "Sep","Oct","Nov","Dec"
        ];

        const dd = String(now.getDate()).padStart(2,"0");

        const displayDate =
        dd + "-" +
        months[now.getMonth()] +
        "-" +
        yyyy;

        const documentId =
        displayDate + " | " + roNumber;

        // Check duplicate RO Number
        const existing = await db.collection("repairorders")
        .where("roNumber","==",roNumber)
        .get();

        if(!existing.empty){

            alert("RO Number already exists.");

            saveBtn.disabled = false;
            saveBtn.innerHTML = "Save Repair Order";

            return;

        }

        await db.collection("repairorders")
        .doc(documentId)
        .set({

            roNumber: roNumber,

            documentId: documentId,

            leaderUid: uid,

            Name: leaderData.name,

            region: leaderData.region,

            advisorName: advisorName,

            vehicleNumber: vehicleNumber,

            itemCode: itemCode,

            createdAt:
            firebase.firestore.FieldValue.serverTimestamp()

        });
        //-------------------------------------------------

        alert("Repair Order Saved Successfully");
        document.getElementById("roNumber").value = "";
        document.getElementById("vehicleNumber").value = "";

        document.getElementById("advisorName").value = "";

        document.getElementById("itemCode").value = "";

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

    finally {

        saveBtn.disabled = false;

        saveBtn.innerHTML = "Save Repair Order";

    }

}