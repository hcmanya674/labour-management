// =====================================================
// ADMIN LAYOUT
// =====================================================
// Sidebar is optional.
// Default: NO SIDEBAR
//
// Usage:
// loadAdminLayout("Region Management", content);
// loadAdminLayout("Dashboard", content, true);
// =====================================================


function loadAdminLayout(
    pageTitle,
    pageContent,
    showSidebar = false
) {

    // =================================================
    // SIDEBAR
    // =================================================

    const sidebarHTML = showSidebar
        ? `

            <div class="sidebar">

                <h2>Admin Panel</h2>

                <button
                    type="button"
                    onclick="showDashboard()"
                >
                    Dashboard
                </button>


                <button
                    type="button"
                    onclick="showRegions()"
                >
                    Region Management
                </button>


                <button
                    type="button"
                    onclick="showItemCodes()"
                >
                    Item Codes
                </button>


                <button
                    type="button"
                    onclick="showLeaders()"
                >
                    Leader Management
                </button>


                <button
                    type="button"
                    onclick="showAssignItems()"
                >
                    Assign Items
                </button>


                <button
                    type="button"
                    onclick="showReports()"
                >
                    Reports
                </button>


                <button
                    type="button"
                    onclick="logout()"
                >
                    Logout
                </button>

            </div>

        `
        : "";


    // =================================================
    // MAIN PAGE
    // =================================================

    document.body.innerHTML = `

        <div class="container">

            ${sidebarHTML}


            <div class="main">
            

                ${pageContent}

            </div>

        </div>

    `;


    // =================================================
    // INITIALIZE CURRENT PAGE
    // =================================================

    if (
        typeof initializePage === "function"
    ) {

        initializePage();

    }

}
