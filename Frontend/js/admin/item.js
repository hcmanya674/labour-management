// Load Admin Layout
loadAdminLayout("Item Code Management", `
<div class="form-box">

    <label>Item Code</label>
    <input type="text" id="itemCode" placeholder="Enter Item Code">

    <label>Description</label>
    <input type="text" id="description" placeholder="Enter Description">

    <button onclick="saveItem()">Save Item Code</button>

</div>

<br>

<input
    type="text"
    id="searchItem"
    placeholder="Search Item Code or Description">

<div
    id="itemMessage"
    style="color:red;font-weight:bold;margin-top:5px;">
</div>

<br><br>

<table id="itemTable">

<tr>
    <th>Item Code</th>
    <th>Description</th>
    <th>Status</th>
    <th>Edit</th>
    <th>Deactivate</th>
    <th>Activate</th>
</tr>

</table>
`);

loadItems();

function initializePage() {
    loadItems();
}
async function saveItem() {

    const code = document.getElementById("itemCode")
        .value
        .trim()
        .toUpperCase();

    const description = document.getElementById("itemDescription")
        .value
        .trim()
        .toUpperCase();

    if(code === "" || description === ""){

        alert("Please fill all fields.");

        return;

    }

    //--------------------------------------------------
    // Check Duplicate Item Code
    //--------------------------------------------------

    const codeDoc = await db.collection("itemcodes")
        .doc(code)
        .get();

    if(codeDoc.exists){

        alert("Item Code already exists.");

        return;

    }

    //--------------------------------------------------
    // Check Duplicate Description
    //--------------------------------------------------

    const snapshot = await db.collection("itemcodes").get();

    let duplicateDescription = false;

    snapshot.forEach(doc=>{

        if(doc.data().description === description){

            duplicateDescription = true;

        }

    });

    if(duplicateDescription){

        alert("Item Description already exists.");

        return;

    }

    //--------------------------------------------------
    // Save
    //--------------------------------------------------

    db.collection("itemcodes")
    .doc(code)
    .set({

        itemCode: code,

        description: description,

        active: true,

        createdAt: firebase.firestore.FieldValue.serverTimestamp()

    })

    .then(()=>{

        alert("Item Code Added Successfully.");

        document.getElementById("itemCode").value="";
        document.getElementById("itemDescription").value="";

        loadItems();

    });

}

function loadItems() {

    const table = document.getElementById("itemTable");

    db.collection("itemcodes").onSnapshot((snapshot) => {

        table.innerHTML = `
        <tr>
            <th>Item Code</th>
            <th>Description</th>
            <th>Status</th>
            <th>Edit</th>
            <th>Action</th>
        </tr>
        `;

        snapshot.forEach((doc) => {

            const data = doc.data();

            const row = table.insertRow();

            row.insertCell(0).textContent = data.itemCode;
            row.insertCell(1).textContent = data.description;
            row.insertCell(2).textContent =
                data.active ? "Active" : "Inactive";

            const editCell = row.insertCell(3);

            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";

            // Trigger the edit prompt with item ID and existing description
            editBtn.onclick = function () {
                editItem(doc.id, data.description);
            };

            editCell.appendChild(editBtn);

            // Action Button
const actionCell = row.insertCell(4);

const actionBtn = document.createElement("button");

if (data.active) {

    actionBtn.textContent = "Deactivate";
    actionBtn.style.background = "#43a047";
    actionBtn.style.color = "white";

    actionBtn.onclick = function () {
        deleteItem(doc.id);
    };

} else {

    actionBtn.textContent = "Activate";
    actionBtn.style.background =  "#e53935";
    actionBtn.style.color = "white";

    actionBtn.onclick = function () {
        activateItem(doc.id);
    };

}

actionCell.appendChild(actionBtn);

        });

        attachSearch();

    });

}

function deleteItem(id) {

    if (!confirm("Deactivate Item?"))
        return;

    db.collection("itemcodes")
        .doc(id)
        .update({
            active: false
        });

}

function activateItem(id) {

    if (!confirm("Activate Item?"))
        return;

    db.collection("itemcodes")
        .doc(id)
        .update({
            active: true
        });

}

async function editItem(id, currentDescription)  {

    const newDescription = prompt(
    "Edit Item Description",
    currentDescription
);

if(newDescription == null)
    return;

const description = newDescription
    .trim()
    .toUpperCase();

if(description === ""){

    alert("Description cannot be empty.");

    return;

}

// Duplicate Check

const snapshot = await db.collection("itemcodes").get();

let duplicate = false;

snapshot.forEach(doc=>{

    if(doc.id !== id &&
       doc.data().description === description){

        duplicate = true;

    }

});

if(duplicate){

    alert("Item Description already exists.");

    return;

}

db.collection("itemcodes")
.doc(id)
.update({

    description: description

})
.then(()=>{

    alert("Updated Successfully.");

});


}

// ==========================================
// SEARCH ITEM CODE + DESCRIPTION ONLY
// ==========================================

function attachSearch() {

    const searchBox = document.getElementById("searchItem");

    if (!searchBox || searchBox.dataset.listenerAdded)
        return;

    searchBox.dataset.listenerAdded = "true";

    searchBox.addEventListener("keyup", function () {

        const filter = this.value.toLowerCase().trim();

        const rows =
            document.querySelectorAll("#itemTable tr:not(:first-child)");

        let matchFound = false;

        rows.forEach(row => {

            const codeCell = row.cells[0];
            const descCell = row.cells[1];

            const codeText = codeCell.textContent;
            const descText = descCell.textContent;

            // Remove old highlights
            codeCell.textContent = codeText;
            descCell.textContent = descText;

            const codeMatch =
                codeText.toLowerCase().includes(filter);

            const descMatch =
                descText.toLowerCase().includes(filter);

            if (filter === "") {

                row.style.display = "";

            }
            else if (codeMatch || descMatch) {

                row.style.display = "";
                matchFound = true;

                if (codeMatch) {

                    codeCell.innerHTML =
                        codeText.replace(
                            new RegExp(filter, "gi"),
                            m => `<span style="background:yellow">${m}</span>`
                        );

                }

                if (descMatch) {

                    descCell.innerHTML =
                        descText.replace(
                            new RegExp(filter, "gi"),
                            m => `<span style="background:yellow">${m}</span>`
                        );

                }

            }
            else {

                row.style.display = "none";

            }

        });

        document.getElementById("itemMessage").textContent =
            (filter !== "" && !matchFound)
                ? "No Item Code Found"
                : "";

    });

}
