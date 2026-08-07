// ==========================================
// SUPABASE CONNECTION
// ==========================================

const SUPABASE_URL = "https://tibtcvummtlumcbvbqqn.supabase.co";
const SUPABASE_KEY = "sb_publishable_8T3oavIqmiKJ1gtUk481iA_MNduWJkU";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// ===============================
// SEARCH
// ===============================

const searchInput = document.getElementById("search");

searchInput.addEventListener("input", function () {

    const searchText = searchInput.value.trim().toLowerCase();

    const sections = document.querySelectorAll("main > section");

    sections.forEach(function (section) {

        const table = section.querySelector("table");

        if (!table) return;

        const rows = table.querySelectorAll("tr");

        let foundItem = false;

        rows.forEach(function (row, index) {

            // Always keep the table header
            if (index === 0) {
                row.style.display = "";
                return;
            }

            if (!row.cells[0]) return;

            const itemName = row.cells[0].textContent
                .trim()
                .toLowerCase();

            const price = row.cells[1]
                ? row.cells[1].textContent.trim().toLowerCase()
                : "";

            // Empty search = show everything
            if (searchText === "") {

                row.style.display = "";
                foundItem = true;

            }

            // Search item name or price
            else if (
                itemName.includes(searchText) ||
                price.includes(searchText)
            ) {

                row.style.display = "";
                foundItem = true;

            }

            else {

                row.style.display = "none";

            }

        });


        // Hide the entire category if nothing matched
        if (searchText !== "" && !foundItem) {

            section.style.display = "none";

        } else {

            section.style.display = "";

        }

    });

});
// ==========================================
// LOAD PRODUCTS FROM SUPABASE
// ==========================================

async function loadProducts() {

    const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .order("id", { ascending: true });

    if (error) {
        console.error("Load error:", error);
        alert("Database error: " + error.message);
        return;
    }

    console.log("Products loaded:", data);


    // Clear existing rows
    document.querySelectorAll("table").forEach(function(table) {

        const rows = table.querySelectorAll("tr");

        rows.forEach(function(row, index) {

            // Keep the first row because it contains Item / Price
            if (index > 0) {
                row.remove();
            }

        });

    });


    // Add products from Supabase
    data.forEach(function(product) {

        // Find the table using the category name
        const table = document.getElementById(product.category);

        if (!table) {

            console.warn(
                "Table not found:",
                product.category
            );

            return;

        }


        const row = document.createElement("tr");

        row.dataset.id = product.id;


        row.innerHTML = `
            <td>${product.item_name}</td>
            <td>${product.price}</td>
            <td>
                <button class="editBtn">✏️</button>
                <button class="deleteBtn">🗑</button>
            </td>
        `;


        table.appendChild(row);


        addEditFunction(row);
        addDeleteFunction(row);

    });


    updateTotalItems();

}
// ==========================================
// FIRST-TIME SETUP
// ==========================================

async function seedDatabaseIfEmpty() {

    const { data, error } = await supabaseClient
        .from("products")
        .select("id")
        .limit(1);

    if (error) {

        console.error("Database check error:", error);

        return;

    }

    // Database already has products
    if (data.length > 0) {

        return;

    }


    // Get products currently written in HTML
    const products = [];

    document.querySelectorAll("table[id]").forEach(function (table) {

        const category = table.id;

        table.querySelectorAll("tbody tr").forEach(function (row) {

            const itemName = row.cells[0].textContent.trim();
            const price = row.cells[1].textContent.trim();

            if (itemName && price) {

                products.push({
                    item_name: itemName,
                    price: price,
                    category: category
                });

            }

        });

    });


    if (products.length === 0) return;


    // Put the existing HTML products into Supabase
    const { error: insertError } = await supabaseClient
        .from("products")
        .insert(products);

    if (insertError) {

        console.error("First-time setup error:", insertError);

        alert("Could not add your existing products to Supabase.");

        return;

    }

}


// ==========================================
// ADD ITEM
// ==========================================

const addButton = document.getElementById("addButton");

addButton.addEventListener("click", async function () {

    const itemName = document
        .getElementById("itemName")
        .value
        .trim();

    const itemPrice = document
        .getElementById("itemPrice")
        .value
        .trim();

    const category = document
        .getElementById("category")
        .value;


    if (itemName === "" || itemPrice === "") {

        alert("Please fill in all fields.");

        return;

    }


    const { error } = await supabaseClient
        .from("products")
        .insert({

            item_name: itemName,
            price: "₱" + itemPrice,
            category: category

        });


    if (error) {

        console.error("Add error:", error);

        alert("Could not add item.");

        return;

    }


    // Clear inputs
    document.getElementById("itemName").value = "";
    document.getElementById("itemPrice").value = "";


    updateLastUpdated();

    await loadProducts();

});


// ==========================================
// DELETE ITEM
// ==========================================

function addDeleteFunction(row) {

    const deleteButton = row.querySelector(".deleteBtn");

    deleteButton.addEventListener("click", async function () {

        const confirmDelete = confirm(
            "Are you sure you want to delete this item?"
        );

        if (!confirmDelete) return;


        const productId = row.dataset.id;


        const { error } = await supabaseClient
            .from("products")
            .delete()
            .eq("id", productId);


        if (error) {

            console.error("Delete error:", error);

            alert("Could not delete item.");

            return;

        }


        updateLastUpdated();

        await loadProducts();

    });

}


// ==========================================
// EDIT ITEM - INLINE
// ==========================================

function addEditFunction(row) {

    const editButton = row.querySelector(".editBtn");


    editButton.addEventListener("click", async function () {

        const itemCell = row.cells[0];
        const priceCell = row.cells[1];


        // ==================================
        // SAVE EDIT
        // ==================================

        if (editButton.textContent === "💾") {

            const itemInput = itemCell.querySelector("input");
            const priceInput = priceCell.querySelector("input");


            const newItem = itemInput.value.trim();
            const newPrice = priceInput.value.trim();


            if (newItem === "" || newPrice === "") {

                alert("Item name and price cannot be empty.");

                return;

            }


            const productId = row.dataset.id;


            const { error } = await supabaseClient
                .from("products")
                .update({

                    item_name: newItem,
                    price: "₱" + newPrice

                })
                .eq("id", productId);


            if (error) {

                console.error("Update error:", error);

                alert("Could not update item.");

                return;

            }


            itemCell.textContent = newItem;
            priceCell.textContent = "₱" + newPrice;

            editButton.textContent = "✏️";


            updateLastUpdated();

            return;

        }


        // ==================================
        // START EDITING
        // ==================================

        const currentItem = itemCell.textContent;

        const currentPrice = priceCell.textContent
            .replace("₱", "")
            .trim();


        itemCell.innerHTML = "";

        priceCell.innerHTML = "";


        const itemInput = document.createElement("input");

        itemInput.type = "text";
        itemInput.value = currentItem;


        const priceInput = document.createElement("input");

        priceInput.type = "number";
        priceInput.value = currentPrice;


        itemCell.appendChild(itemInput);
        priceCell.appendChild(priceInput);


        editButton.textContent = "💾";


        itemInput.focus();

    });

}


// ==========================================
// TOTAL ITEMS
// ==========================================

function updateTotalItems() {

    const total = document.querySelectorAll("tbody tr").length;

    document.getElementById("totalItems").textContent = total;

}


// ==========================================
// LAST UPDATED
// ==========================================

function updateLastUpdated() {

    const now = new Date();

    document.getElementById("lastUpdated").textContent =
        now.toLocaleString();

}


// ==========================================
// REALTIME UPDATES
// ==========================================

supabaseClient
    .channel("products-changes")

    .on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "products"
        },

        function () {

            loadProducts();

        }
    )

    .subscribe();


// ==========================================
// START WEBSITE
// ==========================================

async function startApp() {

    await loadProducts();

    updateTotalItems();

    updateLastUpdated();

}

// Start
startApp();

// ===============================
// DARK MODE
// ===============================

const darkModeBtn = document.getElementById("darkModeBtn");

if (darkModeBtn) {

    // Remember the user's choice
    if (localStorage.getItem("darkMode") === "true") {
        document.body.classList.add("dark-mode");
        darkModeBtn.textContent = "☀️ Light Mode";
    }


    darkModeBtn.addEventListener("click", function () {

        document.body.classList.toggle("dark-mode");

        const isDark =
            document.body.classList.contains("dark-mode");

        localStorage.setItem("darkMode", isDark);


        if (isDark) {
            darkModeBtn.textContent = "☀️ Light Mode";
        } else {
            darkModeBtn.textContent = "🌙 Dark Mode";
        }

    });

}   

// ===============================
// CLEAR ALL ITEMS
// ===============================

const clearAllButton = document.getElementById("clearAll");

if (clearAllButton) {

    clearAllButton.addEventListener("click", async function () {

        const confirmed = confirm(
            "Are you sure you want to delete ALL items?"
        );

        if (!confirmed) return;


        // Delete every product from Supabase
        const { error } = await supabaseClient
            .from("products")
            .delete()
            .not("id", "is", null);


        if (error) {

            console.error("Clear all error:", error);

            alert("Could not clear items: " + error.message);

            return;

        }


        // Remove products from the webpage
        document.querySelectorAll("table").forEach(function (table) {

            table.querySelectorAll("tr").forEach(function (row, index) {

                // Keep the header
                if (index > 0) {
                    row.remove();
                }

            });

        });


        // Update counter
        updateTotalItems();


        alert("All items have been cleared!");

    });

}
