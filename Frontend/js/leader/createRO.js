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

    saveBtn.disabled = true;
    saveBtn.innerHTML = "Saving...";

    try {

    const vehicleNumber =
    document.getElementById("vehicleNumber")
    .value.trim()
    .toUpperCase();

    const labourName =
        document.getElementById("labourName")
        .value.trim()
        .toUpperCase();

    const itemCode =
        document.getElementById("itemCode").value;

        // -----------------------------------
        // Labour Name Validation
        // -----------------------------------

        const namePattern = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

        if (!namePattern.test(labourName)) {

            alert("Labour name can contain only letters and spaces.");

            saveBtn.disabled = false;
            saveBtn.innerHTML = "Save Repair Order";

            return;

        }

        if (labourName.length < 3) {

            alert("Labour name must contain at least 3 characters.");

            saveBtn.disabled = false;
            saveBtn.innerHTML = "Save Repair Order";

            return;

        }

        if (labourName.length > 30) {

            alert("Labour name cannot exceed 30 characters.");

            saveBtn.disabled = false;
            saveBtn.innerHTML = "Save Repair Order";

            return;

        }

        if (itemCode === "") {
         alert("Please select an Item.");
        return;
       }
        if (
            vehicleNumber == "" ||
            labourName == "" ||
            itemCode == ""
        ) {

            alert("Please fill all required fields.");

            saveBtn.disabled = false;
            saveBtn.innerHTML = "Save Repair Order";

            return;
        }

        //-------------------------------------------------
        // Today's Date
        //-------------------------------------------------

        const now = new Date();

        const yyyy = now.getFullYear();

        const mm = String(now.getMonth() + 1).padStart(2, "0");

        const dd = String(now.getDate()).padStart(2, "0");

        const counterId = `${yyyy}-${mm}-${dd}`;

        //-------------------------------------------------
        // Transaction
        //-------------------------------------------------

        let roNumber = "";

        await db.runTransaction(async (transaction) => {

            const counterRef =
                db.collection("counters")
                .doc(counterId);

            const counterDoc =
                await transaction.get(counterRef);

            let lastNumber = 0;

            if (counterDoc.exists) {

                lastNumber =
                    counterDoc.data().lastNumber;

            }

            lastNumber++;

            transaction.set(counterRef, {

                lastNumber: lastNumber

            });

            roNumber =
                "RO" +
                String(lastNumber).padStart(4, "0");

            //-------------------------------------------------

            const months = [

                "Jan","Feb","Mar","Apr",
                "May","Jun","Jul","Aug",
                "Sep","Oct","Nov","Dec"

            ];

            const displayDate =
                dd + "-" +
                months[now.getMonth()] +
                "-" +
                yyyy;

            const documentId =
                displayDate + " | " + roNumber;

            //-------------------------------------------------

            const repairRef =
                db.collection("repairorders")
                .doc(documentId);

            transaction.set(repairRef, {

                roNumber: roNumber,

                documentId: documentId,

                leaderUid: uid,

                leaderName: leaderData.name,

                region: leaderData.region,

                labourName: labourName,

                vehicleNumber: vehicleNumber,

                itemCode: itemCode,
 

                createdAt:
                    firebase.firestore.FieldValue.serverTimestamp()

            });

        });

        //-------------------------------------------------

        alert("Repair Order Saved Successfully");

        document.getElementById("vehicleNumber").value = "";

        document.getElementById("labourName").value = "";

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