

const BACKEND_URL = "https://labour-management-backend-y6g2.onrender.com/createLeader";
let editLeaderId = null;

loadAdminLayout("Leader Management",`

<div class="form-box">

<h2>Create Leader</h2>
<br>

<label>Leader Name</label>
<input type="text" id="leaderName" placeholder="Enter Leader Name" style="text-transform:uppercase">

<label>Email</label>
<input type="email" id="leaderEmail" placeholder="Enter Email">

<label>Initial Password</label>
<input type="password" id="leaderPassword"
 placeholder="Enter Initial Password">

<label>Phone Number</label>
<input type="text" id="leaderPhone" placeholder="Enter Phone Number">

<label>Region</label>
<select id="leaderRegion">
<option value="">Select Region</option>
</select>

<br>
<button id="saveLeaderBtn" onclick="saveLeader()">
Create Leader
</button>
<div
id="leaderMessage"
style="color:red;font-weight:bold;margin-top:5px;">
</div>

</div>

<br>

<input
type="text"
id="searchLeader"
placeholder="Search Name, Email, Phone or Region">

<br><br>

<table id="leaderTable">

<thead>

<tr>

<th>Name</th>
<th>Email</th>
<th>Phone</th>
<th>Region</th>
<th>Status</th>
<th>Edit</th>
<th>Deactivate</th>

</tr>

</thead>

<tbody>

</tbody>

</table>

`);

// ===========================================
// CREATE LEADER
// ===========================================

async function saveLeader() {

    const name = document.getElementById("leaderName").value.trim();
    const email = document.getElementById("leaderEmail").value.trim();
    // Temporary password
    const password = document.getElementById("leaderPassword").value.trim();

    const phone = document.getElementById("leaderPhone").value.trim();
    const region = document.getElementById("leaderRegion").value;
    if(editLeaderId){

     updateLeader();
 
     return;

   }
  if (!name || !email || !password || !phone || !region) {

    alert("Please fill all fields.");

    return;

}

    
    try {

        const response = await fetch(BACKEND_URL + "/createLeader", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name,
                email,
                password,
                phone,
                region
            })

        });

        const result = await response.json();

        if (result.success) {

            alert("Leader Created Successfully!");

            document.getElementById("leaderName").value = "";
            document.getElementById("leaderEmail").value = "";
            document.getElementById("leaderPassword").value = "";
            document.getElementById("leaderPhone").value = "";
            document.getElementById("leaderRegion").value = "";

            loadLeaders();

        } else {

            alert(result.message);

        }

    } catch (error) {

        console.error(error);
        alert("Server Error");

    }

}

// ===========================================
// UPDATE LEADER
// ===========================================

async function updateLeader(){

    try{

        await db.collection("users")
        .doc(editLeaderId)
        .update({

            name:document.getElementById("leaderName").value.trim(),

            phone:document.getElementById("leaderPhone").value.trim(),

            region:document.getElementById("leaderRegion").value

        });

        alert("Leader Updated Successfully");

        editLeaderId=null;

        document.getElementById("leaderName").value="";
        document.getElementById("leaderEmail").value="";
        document.getElementById("leaderPhone").value="";
        document.getElementById("leaderPassword").value="";
        document.getElementById("leaderPassword").style.display="";

        document.getElementById("leaderRegion").value="";

        document.getElementById("saveLeaderBtn").innerHTML=
        "Create Leader";

        loadLeaders();

    }

    catch(error){

        console.log(error);

        alert(error.message);

    }

}
// ===========================================
// LOAD REGIONS
// ===========================================

async function loadRegions() {

    const regionSelect = document.getElementById("leaderRegion");

    regionSelect.innerHTML =
        `<option value="">Select Region</option>`;

    try {

        const snapshot = await db.collection("regions")
                                 .where("active", "==", true)
                                 .get();

        snapshot.forEach(doc => {

            const region = doc.data();

            regionSelect.innerHTML += `
                <option value="${region.regionId}">
                    ${region.regionName}
                </option>
            `;

        });

    } catch (error) {

        console.error("Error loading regions:", error);

    }

}

// ===========================================
// LOAD LEADERS
// ===========================================

async function loadLeaders() {

    const tbody = document.querySelector("#leaderTable tbody");

    tbody.innerHTML = "";

    try {

        const snapshot = await db.collection("users")
            .where("role", "==", "leader")
            .get();

        for (const doc of snapshot.docs) {

            const leader = doc.data();

            // Get Region Name
            let regionName = leader.region;

            try {

                const regionDoc = await db.collection("regions")
                    .doc(leader.region)
                    .get();

                if (regionDoc.exists) {

                    regionName = regionDoc.data().regionName;

                }

            } catch (e) {

                console.log(e);

            }

            tbody.innerHTML += `

            <tr>

                <td>${leader.name}</td>

                <td>${leader.email}</td>

                <td>${leader.phone}</td>

                <td>${regionName}</td>

                <td>${leader.active ? "Active" : "Inactive"}</td>

              <td>

              <button onclick="editLeader('${doc.id}')">

               Edit

               </button>

               </td>
                <td>

    <button
        class="${leader.active ? 'deactivate-btn' : 'activate-btn'}"
        onclick="toggleLeader('${doc.id}', ${leader.active})">

        ${leader.active ? "Deactivate" : "Activate"}

    </button>

</td>

            </tr>

            `;

        }

        attachSearch();

    }

    catch(error){

        console.log(error);

    }

}
// ===========================================
// EDIT LEADER
// ===========================================
async function editLeader(uid) {

    console.log("Step 1");

    const doc = await db.collection("users").doc(uid).get();

    console.log("Step 2");

    if (!doc.exists) {
        alert("Document not found");
        return;
    }

    const leader = doc.data();

    console.log("Step 3", leader);

    document.getElementById("leaderName").value = leader.name;
    console.log("Step 4");

    document.getElementById("leaderEmail").value = leader.email;
    console.log("Step 5");

    document.getElementById("leaderPhone").value = leader.phone;
    console.log("Step 6");

    document.getElementById("leaderRegion").value = leader.region;
    console.log("Step 7");

    document.getElementById("leaderPassword").style.display = "none";
    console.log("Step 8");

    editLeaderId = uid;

    document.getElementById("saveLeaderBtn").innerHTML = "Update Leader";

    console.log("Finished");

}
// ===========================================
// ACTIVATE / DEACTIVATE
// ===========================================

async function toggleLeader(uid, currentStatus) {

    try {

        await db.collection("users")
            .doc(uid)
            .update({

                active: !currentStatus

            });

        loadLeaders();

    } catch (error) {

        console.error(error);

        alert("Unable to update status.");

    }

}
// ==========================================
// SEARCH LEADER
// ==========================================
function attachSearch() {

    const searchBox = document.getElementById("searchLeader");

    if (!searchBox || searchBox.dataset.listenerAdded)
        return;

    searchBox.dataset.listenerAdded = "true";

    searchBox.addEventListener("keyup", function () {

        const filter = this.value.toLowerCase().trim();

        const rows = document.querySelectorAll("#leaderTable tbody tr");

        let matchFound = false;

        rows.forEach(row => {

            const nameCell = row.cells[0];
            const emailCell = row.cells[1];
            const phoneCell = row.cells[2];
            const regionCell = row.cells[3];

            // Original text
            const name = nameCell.textContent;
            const email = emailCell.textContent;
            const phone = phoneCell.textContent;
            const region = regionCell.textContent;

            // Remove previous highlights
            nameCell.textContent = name;
            emailCell.textContent = email;
            phoneCell.textContent = phone;
            regionCell.textContent = region;

            const nameMatch = name.toLowerCase().includes(filter);
            const emailMatch = email.toLowerCase().includes(filter);
            const phoneMatch = phone.toLowerCase().includes(filter);
            const regionMatch = region.toLowerCase().includes(filter);

            if (filter === "") {

                row.style.display = "";

            }
            else if (nameMatch || emailMatch || phoneMatch || regionMatch) {

                row.style.display = "";
                matchFound = true;

                const regex = new RegExp(filter, "gi");

                if (nameMatch) {
                    nameCell.innerHTML =
                        name.replace(regex,
                        m => `<span style="background:yellow;">${m}</span>`);
                }

                if (emailMatch) {
                    emailCell.innerHTML =
                        email.replace(regex,
                        m => `<span style="background:yellow;">${m}</span>`);
                }

                if (phoneMatch) {
                    phoneCell.innerHTML =
                        phone.replace(regex,
                        m => `<span style="background:yellow;">${m}</span>`);
                }

                if (regionMatch) {
                    regionCell.innerHTML =
                        region.replace(regex,
                        m => `<span style="background:yellow;">${m}</span>`);
                }

            }
            else {

                row.style.display = "none";

            }

        });

        document.getElementById("leaderMessage").textContent =
            (filter !== "" && !matchFound)
            ? "No Leader Found"
            : "";

    });

}
function initializePage() {
    loadRegions();
    loadLeaders();
}