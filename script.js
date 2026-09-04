// ==========================================
// SUPABASE CONNECTION
// ==========================================

const SUPABASE_URL = "https://tibtcvummtlumcbvbqqn.supabase.co";
const SUPABASE_KEY = "sb_publishable_8T3oavIqmiKJ1gtUk481iA_MNduWJkU";

let supabaseClient = null;

try {

    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

} catch (err) {

    console.error("Could not connect to Supabase:", err);
    alert("Could not connect to the database. Check your internet connection and reload the page.");

}

// ===============================
// CATEGORY FILTER
// ===============================

const categoryFilter = document.querySelector(".category-filter");

if (categoryFilter) {

    const filterButtons = categoryFilter.querySelectorAll(".filter-btn");

    const categorySections = [
        document.getElementById("snacksSection"),
        document.getElementById("drinksSection"),
        document.getElementById("cigarettesSection"),
        document.getElementById("noodlesSection")
    ].filter(Boolean);

    filterButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const filter = button.dataset.filter;

            // Highlight the selected button only
            filterButtons.forEach(function (btn) {
                btn.classList.toggle("active", btn === button);
            });

            // Show only the matching category ("all" shows everything)
            categorySections.forEach(function (section) {

                if (filter === "all" || section.id === filter) {
                    section.style.display = "";
                } else {
                    section.style.display = "none";
                }

            });

            // Clear any active search so it doesn't fight with the filter
            if (searchInput.value !== "") {
                searchInput.value = "";
                searchInput.dispatchEvent(new Event("input"));
            }

        });

    });

}

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

            const itemName = row.cells[1].textContent
                .trim()
                .toLowerCase();
                const price = row.cells[2]
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
    <td class="picture-cell">
        ${
            product.image_url
                ? `<img src="${product.image_url}" class="product-image" alt="${product.item_name}">`
                : `<span class="no-picture"></span>`
        }
    </td>

<td class="product-name">${product.item_name}</td>

<td class="product-price">${product.price}</td>

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

    const itemName = document.getElementById("itemName").value.trim();
    const itemPrice = document.getElementById("itemPrice").value.trim();
    const category = document.getElementById("category").value;

    // Picture is OPTIONAL
    const imageInput = document.getElementById("productImage");
    const file = imageInput ? imageInput.files[0] : null;

    // Only name and price are required
    if (itemName === "" || itemPrice === "") {
        alert("Please fill in the item name and price.");
        return;
    }

    let imageUrl = null;

    // ==========================================
    // UPLOAD PICTURE ONLY IF ONE WAS SELECTED
    // ==========================================

    if (file) {

        const fileName = Date.now() + "-" + file.name;

        const { error: uploadError } = await supabaseClient
            .storage
            .from("product-images")
            .upload(fileName, file);

        if (uploadError) {
            console.error("Image upload error:", uploadError);
            alert("Could not upload picture.");
            return;
        }

        const { data: publicUrlData } = supabaseClient
            .storage
            .from("product-images")
            .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
    }

    // ==========================================
    // SAVE PRODUCT
    // ==========================================

    const { error } = await supabaseClient
        .from("products")
        .insert({
            item_name: itemName,
            price: "₱" + itemPrice,
            category: category,
            image_url: imageUrl
        });

    if (error) {
        console.error("Add error:", error);
        alert("Could not add item.");
        return;
    }

    // Clear form
    document.getElementById("itemName").value = "";
    document.getElementById("itemPrice").value = "";

    productImage.value = "";
    uploadImageText.textContent = "📷 No image selected";

    updateLastUpdated();

    await loadProducts();

    if (imageInput) {
        imageInput.value = "";
    }

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
let currentlyEditingRow = null;

  function addEditFunction(row) {

    const editButton = row.querySelector(".editBtn");

    editButton.addEventListener("click", async function () {
        // Switch from another item being edited
if (
    editButton.textContent !== "💾" &&
    currentlyEditingRow &&
    currentlyEditingRow !== row
) {
    const oldRow = currentlyEditingRow;

    const oldItemCell = oldRow.cells[1];
    const oldPriceCell = oldRow.cells[2];
    const oldPictureCell = oldRow.cells[0];

    const backup = oldRow._editBackup;

    if (backup) {
        oldItemCell.textContent = backup.item;
        oldPriceCell.textContent = backup.price;
        oldPictureCell.innerHTML = backup.picture;

        oldRow.querySelector(".editBtn").textContent = "✏️";
    }

    currentlyEditingRow = null;
}


        const itemCell = row.cells[1];
        const priceCell = row.cells[2];
        const pictureCell = row.cells[0];

        // ==================================
        // SAVE EDIT
        // ==================================

        if (editButton.textContent === "💾") {

            const itemInput = itemCell.querySelector("input");
            const priceInput = priceCell.querySelector("input");
            const imageInput = pictureCell.querySelector("input[type='file']");


            const newItem = itemInput.value.trim();
            const newPrice = priceInput.value.trim();


            if (newItem === "" || newPrice === "") {

                alert("Item name and price cannot be empty.");

                return;

            }


            const productId = row.dataset.id;


           let newImageUrl = null;

if (imageInput && imageInput.files.length > 0) {

    const file = imageInput.files[0];
    const fileName = Date.now() + "-" + file.name;

    const { error: uploadError } = await supabaseClient
        .storage
        .from("product-images")
        .upload(fileName, file);

    if (uploadError) {
        console.error("Image upload error:", uploadError);
        alert("Could not upload new picture.");
        return;
    }

    const { data: publicUrlData } = supabaseClient
        .storage
        .from("product-images")
        .getPublicUrl(fileName);

         newImageUrl = publicUrlData.publicUrl;
          }

                 const updateData = {
                item_name: newItem,
                price: "₱" + newPrice
              };

             if (newImageUrl) {
                updateData.image_url = newImageUrl;
         }

            const { error } = await supabaseClient
             .from("products")
             .update(updateData)
             .eq("id", productId);

            if (error) {
                console.error("Update error:", error);
                alert("Could not update item.");
                return;

            }
            
            const currentScroll = window.scrollY;

            await loadProducts();

            currentlyEditingRow = null;

            window.scrollTo({
             top: currentScroll,
             behavior: "instant"
            });


            // Update picture on the page immediately
            if (newImageUrl) {
            pictureCell.innerHTML = `
              <img
               src="${newImageUrl}"
             class="product-image"
              alt="${newItem}"
                  >
               `;
               }
               const cancelImageButton = document.createElement("button");

cancelImageButton.type = "button";
cancelImageButton.textContent = "✕ Cancel";
cancelImageButton.className = "cancel-image-btn";



             editButton.textContent = "✏️";


            updateLastUpdated();

            return;

        }


        // ==================================
        // START EDITING
        // ==================================
       
         // Save the original state so we can restore it if switching rows
   if (!row._editBackup) {
      row._editBackup = {
          item: itemCell.textContent,
          price: priceCell.textContent,
          picture: pictureCell.innerHTML
      };
   }

        const currentItem = itemCell.textContent;

        const currentPrice = priceCell.textContent
            .replace("₱", "")
            .trim();

        const currentPicture = pictureCell.querySelector("img");    

        itemCell.innerHTML = "";
        priceCell.innerHTML = "";

        const imageInput = document.createElement("input");
        imageInput.type = "file";
        imageInput.accept = "image/*";
        imageInput.style.display = "none";
        imageInput.addEventListener("change", function () {

    const file = imageInput.files[0];

    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    pictureCell.innerHTML = `
        <img
            src="${previewUrl}"
            class="product-image"
            alt="Selected picture"
        >
    `;

const cancelImageButton = document.createElement("button");

cancelImageButton.type = "button";
cancelImageButton.textContent = "✕ Cancel";
cancelImageButton.className = "cancel-image-btn";

cancelImageButton.addEventListener("click", function () {
    imageInput.value = "";

    if (currentPicture) {
        pictureCell.innerHTML = `
            <img
                src="${currentPicture.src}"
                class="product-image"
                alt="Product picture"
            >
        `;
    } else {
        pictureCell.innerHTML = `
            <span class="no-picture"></span>
        `;
    }

    pictureCell.appendChild(imageButton);
    pictureCell.appendChild(imageInput);
});

pictureCell.appendChild(cancelImageButton);

    pictureCell.appendChild(imageButton);
    pictureCell.appendChild(imageInput);
});

      const imageButton = document.createElement("button");
      imageButton.type = "button";
      imageButton.textContent = currentPicture
      ? "🖼️ Change image"
      : "📷 Add image";

     imageButton.className = "edit-image-btn";

     imageButton.addEventListener("click", function () {
      imageInput.click();
        });

        pictureCell.appendChild(imageButton);
        pictureCell.appendChild(imageInput);


        const itemInput = document.createElement("input");

        itemInput.type = "text";
        itemInput.value = currentItem;


        const priceInput = document.createElement("input");

        priceInput.type = "number";
        priceInput.value = currentPrice;


        itemCell.appendChild(itemInput);
        priceCell.appendChild(priceInput);


        editButton.textContent = "💾";
        currentlyEditingRow = row;
        itemInput.focus();
        

    });

}


// ==========================================
// TOTAL ITEMS
// ==========================================

function updateTotalItems() {

    const totalEl = document.getElementById("totalItems");

    if (!totalEl) return;

    const total = document.querySelectorAll("tbody tr").length;

    totalEl.textContent = total;

}


// ==========================================
// LAST UPDATED
// ==========================================

function updateLastUpdated() {

    const lastUpdatedEl = document.getElementById("lastUpdated");

    if (!lastUpdatedEl) return;

    const now = new Date();

    lastUpdatedEl.textContent = now.toLocaleString();

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
// EDIT MODE
// ===============================

const editModeBtn = document.getElementById("editModeBtn");

if (editModeBtn) {

    let editMode = false;

    editModeBtn.addEventListener("click", function () {

        editMode = !editMode;

        document.body.classList.toggle("edit-mode", editMode);

        if (editMode) {

            editModeBtn.textContent = "🔒 Done Editing";

        } else {

            editModeBtn.textContent = "✏️ Edit Mode";

        }

    });

}

// ===============================
// CLEAR ALL ITEMS REMOVED (was in Store Information section)
// ===============================

const productImage = document.getElementById("productImage");
const uploadImageText = document.getElementById("uploadImageText");

productImage.addEventListener("change", function () {

    if (productImage.files.length > 0) {
        uploadImageText.textContent = "✅ Image added";
    } else {
        uploadImageText.textContent = "📷 Choose Product Image";
    }

});

const imagePopup = document.getElementById("imagePopup");
const popupImage = document.getElementById("popupImage");
const closeImagePopup = document.getElementById("closeImagePopup");

document.addEventListener("click", function (event) {
    if (event.target.classList.contains("product-image")) {
        popupImage.src = event.target.src;
        imagePopup.style.display = "block";
    }
});

closeImagePopup.addEventListener("click", function () {
    imagePopup.style.display = "none";
    popupImage.src = "";
});
