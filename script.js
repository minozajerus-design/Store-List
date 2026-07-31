// ===============================
// SEARCH
// ===============================

const searchInput = document.getElementById("search");

searchInput.addEventListener("input", function () {

    const filter = searchInput.value.toLowerCase();

    const tables = document.querySelectorAll("table");

    tables.forEach(function (table) {

        const rows = table.querySelectorAll("tbody tr");

        rows.forEach(function (row) {

            const itemName = row.cells[0].textContent.toLowerCase();

            if (itemName.includes(filter)) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }

        });

    });

});

// ===============================
// ADD ITEM
// ===============================

const addButton = document.getElementById("addButton");

addButton.addEventListener("click", function () {

    const itemName = document.getElementById("itemName").value.trim();
    const itemPrice = document.getElementById("itemPrice").value.trim();
    const category = document.getElementById("category").value;

    if (itemName === "" || itemPrice === "") {
        alert("Please fill in all fields.");
        return;
    }

    const table = document
        .getElementById(category)
        .querySelector("tbody");

    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${itemName}</td>
        <td>₱${itemPrice}</td>
        <td>
            <button class="editBtn">✏️</button>
            <button class="deleteBtn">🗑</button>
        </td>
    `;

    table.appendChild(row);

addDeleteFunction(row);
addEditFunction(row);

updateTotalItems();
updateLastUpdated();

saveData();
    document.getElementById("itemName").value = "";
    document.getElementById("itemPrice").value = "";
    
});

// ===============================
// DELETE ITEM
// ===============================

function addDeleteFunction(row) {

    const deleteButton = row.querySelector(".deleteBtn");

    deleteButton.addEventListener("click", function () {

        const confirmDelete = confirm("Delete this item?");

        if (confirmDelete) {
            row.remove();

updateTotalItems();
updateLastUpdated();

saveData();
        }

    });

}

// Add delete function to existing buttons

document.querySelectorAll("tbody tr").forEach(function (row) {
    addDeleteFunction(row);
});

// ===============================
// UPDATE TOTAL ITEMS
// ===============================

function updateTotalItems() {

    const total = document.querySelectorAll("tbody tr").length;

    document.getElementById("totalItems").textContent = total;

}

// ===============================
// LAST UPDATED
// ===============================

function updateLastUpdated() {

    const now = new Date();

    document.getElementById("lastUpdated").textContent =
        now.toLocaleString();

}

// Show values when page loads
updateTotalItems();
updateLastUpdated();
// ===============================
// EDIT ITEM
// ===============================

// ===============================
// EDIT ITEM (INLINE)
// ===============================

function addEditFunction(row) {

    const editButton = row.querySelector(".editBtn");

    editButton.addEventListener("click", function () {

        const itemCell = row.cells[0];
        const priceCell = row.cells[1];

        // Already editing?
        if (editButton.textContent === "💾") {

            const itemInput = itemCell.querySelector("input");
            const priceInput = priceCell.querySelector("input");

            itemCell.textContent = itemInput.value;
            priceCell.textContent = "₱" + priceInput.value;

            editButton.textContent = "✏️";

            updateLastUpdated();
            saveData();

            return;
        }

        // Start editing
        const item = itemCell.textContent;
        const price = priceCell.textContent.replace("₱", "");

        itemCell.innerHTML =
            `<input type="text" value="${item}">`;

        priceCell.innerHTML =
            `<input type="number" value="${price}">`;

        editButton.textContent = "💾";

    });

}

// Add edit to existing rows
document.querySelectorAll("tbody tr").forEach(function(row){

    addEditFunction(row);

});

// ===============================
// SAVE TO LOCAL STORAGE
// ===============================

function saveData() {

    const data = {};

    document.querySelectorAll("table").forEach(function(table){

        const tableId = table.id;

        data[tableId] = [];

        table.querySelectorAll("tbody tr").forEach(function(row){

            data[tableId].push({

                item: row.cells[0].textContent,
                price: row.cells[1].textContent

            });

        });

    });

    localStorage.setItem("storeData", JSON.stringify(data));

}

// ===============================
// LOAD FROM LOCAL STORAGE
// ===============================

function loadData(){

    const savedData = localStorage.getItem("storeData");

    if(!savedData) return;

    const data = JSON.parse(savedData);

    Object.keys(data).forEach(function(tableId){

        const tbody = document
            .getElementById(tableId)
            .querySelector("tbody");

        tbody.innerHTML = "";

        data[tableId].forEach(function(product){

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${product.item}</td>
                <td>${product.price}</td>
                <td>
                    <button class="editBtn">✏️</button>
                    <button class="deleteBtn">🗑</button>
                </td>
            `;

            tbody.appendChild(row);

            addDeleteFunction(row);
            addEditFunction(row);

        });

    });

    updateTotalItems();
    updateLastUpdated();

}

// Load data when page opens
loadData();

// ===============================
// CLEAR ALL ITEMS
// ===============================

const clearButton = document.getElementById("clearAll");

clearButton.addEventListener("click", function () {

    const confirmClear = confirm(
        "Are you sure you want to delete ALL items?"
    );

    if (!confirmClear) return;

    document.querySelectorAll("tbody").forEach(function (tbody) {

        tbody.innerHTML = "";

    });

    updateTotalItems();
    updateLastUpdated();
    saveData();

});