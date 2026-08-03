// ===========================================
// ADMIN LAYOUT
// ===========================================

function loadAdminLayout(pageTitle, pageContent) {

document.body.innerHTML = `

<div class="container">

    <!-- Sidebar -->

    <div class="sidebar">

        <h2>Admin Panel</h2>

        <button onclick="showDashboard()">Dashboard</button>

        <button onclick="showRegions()">Region Management</button>

        <button onclick="showItemCodes()">Item Codes</button>

        <button onclick="showLeaders()">Leader Management</button>

        <button onclick="showReports()">Reports</button>

        <button onclick="logout()">Logout</button>

    </div>

    <!-- Main -->

    <div class="main">

        <h1>${pageTitle}</h1>

        ${pageContent}

    </div>

</div>

`;

}  