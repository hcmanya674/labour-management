///Load Admin Layout
loadAdminLayout("Region Management", `
<div class="form-box">
    <label>Region ID</label>
    <input type="text" id="regionId" 
        oninput="this.value=this.value.toUpperCase()" 
        style="text-transform:uppercase">

    <label>Region Name</label>
    <input type="text" id="regionName" 
        oninput="this.value=this.value.toUpperCase()" 
        style="text-transform:uppercase">

    <button onclick="saveRegion()">Save Region</button>
</div>
<br>

<input
    type="text"
    id="searchRegion"
    placeholder="Search Region Name">

<div
    id="regionMessage"
    style="color:red;font-weight:bold;margin-top:5px;">
</div>

<br><br>

<table id="regionTable">
    <tr>
        <th>Region ID</th>
        <th>Region Name</th>
        <th>Status</th>
        <th>Edit</th>
        <th>Deactivate</th>
        <th>Activate</th>
    </tr>
</table>
`);

loadRegions();

function initializePage() {
    loadRegions();
}
async function saveRegion() {

    const id = document.getElementById("regionId")
        .value.trim().toUpperCase();

    const name = document.getElementById("regionName")
        .value.trim().toUpperCase();

    //-----------------------------
    // Empty Validation
    //-----------------------------

    if(id === "" && name === ""){

        alert("Please enter Region ID and Region Name.");

        return;

    }

    if(id === ""){

        alert("Please enter Region ID.");

        return;

    }

    if(name === ""){

        alert("Please enter Region Name.");

        return;

    }

    //-----------------------------
    // Length Validation
    //-----------------------------

    if(name.length > 30){

        alert("Region Name cannot exceed 30 characters.");

        return;

    }

    //-----------------------------
    // Only Letters & Spaces
    //-----------------------------

    const regex = /^[A-Za-z ]+$/;

    if(!regex.test(name)){

        alert("Region Name should contain only letters and spaces.");

        return;

    }

    //-----------------------------
    // Region ID Already Exists?
    //-----------------------------

    const idDoc = await db.collection("regions")
        .doc(id)
        .get();

    if(idDoc.exists){

        alert("Region ID already exists.");

        return;

    }

    //-----------------------------
    // Region Name Already Exists?
    //-----------------------------

    const duplicate = await db.collection("regions")
        .where("regionName","==",name)
        .get();

    if(!duplicate.empty){

        alert("Region Name already exists.");

        return;

    }

    //-----------------------------
    // Save
    //-----------------------------

    db.collection("regions")
        .doc(id)
        .set({

            regionId:id,

            regionName:name,

            active:true,

            createdAt:firebase.firestore.FieldValue.serverTimestamp()

        })

        .then(()=>{

            alert("Region Added Successfully.");

            document.getElementById("regionId").value="";

            document.getElementById("regionName").value="";

        });

}

function loadRegions() {

    const table = document.getElementById("regionTable");

    db.collection("regions").onSnapshot((snapshot) => {

        table.innerHTML = `
        <tr>
            <th>Region ID</th>
            <th>Region Name</th>
            <th>Status</th>
            <th>Edit</th>
            <th>Action</th>
        </tr>
        `;

        snapshot.forEach((doc) => {

            const data = doc.data();

            const row = table.insertRow();

            // Region ID
            row.insertCell(0).textContent = data.regionId;

            // Region Name
            row.insertCell(1).textContent = data.regionName;

            // Status
            row.insertCell(2).textContent =
                data.active ? "Active" : "Inactive";

           // Edit Button
            const editCell = row.insertCell(3);

            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";

            editBtn.onclick = function () {
            editRegion(doc.id, data.regionName);
            };

editCell.appendChild(editBtn);
        // Action Button
const actionCell = row.insertCell(4);

const actionBtn = document.createElement("button");

if (data.active) {

    actionBtn.textContent = "Deactivate";
    actionBtn.style.background = "#12a10d";
    actionBtn.style.color = "white";

    actionBtn.onclick = function () {
        deleteRegion(doc.id);
    };

} else {

    actionBtn.textContent = "Activate";
    actionBtn.style.background = "#ec1919";
    actionBtn.style.color = "white";

    actionBtn.onclick = function () {
        activateRegion(doc.id);
    };

}

actionCell.appendChild(actionBtn);    
        });

        attachSearch();

    });

}

function deleteRegion(id) {

    if (!confirm("Deactivate Region?"))
        return;

    db.collection("regions")
        .doc(id)
        .update({
            active: false
        });

}

function activateRegion(id) {

    if (!confirm("Activate Region?"))
        return;

    db.collection("regions")
        .doc(id)
        .update({
            active: true
        });

}

async function editRegion(id,currentName){

    const newName = prompt("Edit Region Name",currentName);

    if(newName===null)
        return;

    const name = newName.trim().toUpperCase();

    if(name===""){

        alert("Region Name cannot be empty.");

        return;

    }

    if(name.length>30){

        alert("Maximum 30 characters allowed.");

        return;

    }

    const regex=/^[A-Za-z ]+$/;

    if(!regex.test(name)){

        alert("Only letters and spaces are allowed.");

        return;

    }

    const duplicate=await db.collection("regions")
    .where("regionName","==",name)
    .get();

    let exists=false;

    duplicate.forEach(doc=>{

        if(doc.id!==id){

            exists=true;

        }

    });

    if(exists){

        alert("Region Name already exists.");

        return;

    }

    db.collection("regions")
    .doc(id)
    .update({

        regionName:name

    })

    .then(()=>{

        alert("Region updated successfully.");

    });

}
// ======================================================
// SEARCH ONLY REGION NAME
// ======================================================

function attachSearch() {

    const searchBox = document.getElementById("searchRegion");

    if (searchBox.dataset.listenerAdded)
        return;

    searchBox.dataset.listenerAdded = "true";

    searchBox.addEventListener("keyup", function () {

        const filter = this.value.toLowerCase().trim();

        const rows =
            document.querySelectorAll("#regionTable tr:not(:first-child)");

        let matchFound = false;

        rows.forEach(row => {

            const nameCell = row.cells[1];

            const originalName = nameCell.textContent;

            nameCell.textContent = originalName;

            if (filter === "") {

                row.style.display = "";

            }
            else if (originalName.toLowerCase().includes(filter)) {

                row.style.display = "";

                matchFound = true;

                const regex = new RegExp(filter, "gi");

                nameCell.innerHTML =
                    originalName.replace(
                        regex,
                        match =>
                        `<span style="background:yellow;">${match}</span>`
                    );

            }
            else {

                row.style.display = "none";

            }

        });

        document.getElementById("regionMessage").textContent =
            (filter !== "" && !matchFound)
            ? "No Region Found"
            : "";

    });

}
