// Slice Pizza & Cafe - Admin Panel Logic
const DEFAULT_PIN = "1234"; // Default Security PIN

let menuData = [];

document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  loadAdminMenu();
});

// Authentication
function checkAuth() {
  const isAuth = sessionStorage.getItem("slice_admin_auth");
  if (isAuth === "true") {
    showDashboard();
  }
}

function handleAdminLogin(e) {
  e.preventDefault();
  const inputPin = document.getElementById("admin-pin-input").value.trim();
  const savedPin = localStorage.getItem("slice_admin_pin") || DEFAULT_PIN;

  if (inputPin === savedPin) {
    sessionStorage.setItem("slice_admin_auth", "true");
    showDashboard();
  } else {
    alert("Galat PIN! Default PIN: 1234 try karein.");
  }
}

function showDashboard() {
  document.getElementById("auth-screen").classList.add("hidden");
  document.getElementById("dashboard-screen").classList.remove("hidden");
  renderAdminTable();
  updateStats();
}

function handleAdminLogout() {
  sessionStorage.removeItem("slice_admin_auth");
  window.location.reload();
}

// Data Management
function loadAdminMenu() {
  const saved = localStorage.getItem("slice_pizza_menu");
  if (saved) {
    try {
      menuData = JSON.parse(saved);
    } catch (e) {
      menuData = [];
    }
  } else {
    menuData = [];
  }
}

function saveMenuToStorage() {
  localStorage.setItem("slice_pizza_menu", JSON.stringify(menuData));
  renderAdminTable();
  updateStats();
}

// Render Admin Table
function renderAdminTable() {
  const tbody = document.getElementById("admin-items-table-body");
  if (!tbody) return;

  if (menuData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="py-8 text-center text-gray-400 font-medium">Koi item nahi hai. Naya item add karein.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = menuData.map(item => `
    <tr class="hover:bg-slate-50 transition">
      <td class="py-3.5 pr-3">
        <div class="flex items-center gap-3">
          <img src="${item.image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600'}" class="w-10 h-10 rounded-lg object-cover shadow-sm" alt="${item.name}">
          <div>
            <p class="font-bold text-gray-900">${item.name}</p>
            <p class="text-xs text-gray-400 line-clamp-1">${item.desc || ''}</p>
          </div>
        </div>
      </td>
      <td class="py-3.5 px-3">
        <span class="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-gray-700">${item.category}</span>
      </td>
      <td class="py-3.5 px-3 font-bold text-gray-900">₹${item.price}</td>
      <td class="py-3.5 px-3">
        <button onclick="toggleItemStock('${item.id}')" class="px-2.5 py-1 rounded-full text-xs font-bold ${item.inStock !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
          ${item.inStock !== false ? 'In Stock' : 'Out of Stock'}
        </button>
      </td>
      <td class="py-3.5 pl-3 text-right space-x-2">
        <button onclick="editItem('${item.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit Item">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button onclick="deleteItem('${item.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete Item">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    </tr>
  `).join("");
}

// Add or Edit Item
function handleSaveItem(e) {
  e.preventDefault();

  const id = document.getElementById("form-item-id").value;
  const name = document.getElementById("item-name").value.trim();
  const price = parseFloat(document.getElementById("item-price").value);
  const category = document.getElementById("item-category").value;
  const image = document.getElementById("item-image").value.trim();
  const desc = document.getElementById("item-desc").value.trim();
  const inStock = document.getElementById("item-instock").checked;

  if (id) {
    // Update existing item
    const index = menuData.findIndex(i => i.id === id);
    if (index !== -1) {
      menuData[index] = { ...menuData[index], name, price, category, image, desc, inStock };
    }
  } else {
    // Create new item
    const newItem = {
      id: Date.now().toString(),
      name,
      price,
      category,
      image: image || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600",
      desc,
      inStock
    };
    menuData.unshift(newItem);
  }

  saveMenuToStorage();
  resetFormToCreate();
  alert("Item successfully save ho gaya!");
}

function editItem(id) {
  const item = menuData.find(i => i.id === id);
  if (!item) return;

  document.getElementById("form-item-id").value = item.id;
  document.getElementById("item-name").value = item.name;
  document.getElementById("item-price").value = item.price;
  document.getElementById("item-category").value = item.category;
  document.getElementById("item-image").value = item.image || "";
  document.getElementById("item-desc").value = item.desc || "";
  document.getElementById("item-instock").checked = item.inStock !== false;

  document.getElementById("form-heading").innerHTML = `<i class="fa-solid fa-pen text-blue-600"></i> Edit Item: ${item.name}`;
  document.getElementById("form-submit-btn").innerText = "Update Item";
  document.getElementById("cancel-edit-btn").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetFormToCreate() {
  document.getElementById("item-form").reset();
  document.getElementById("form-item-id").value = "";
  document.getElementById("form-heading").innerHTML = `<i class="fa-solid fa-circle-plus text-red-600"></i> Naya Item Add Karein`;
  document.getElementById("form-submit-btn").innerText = "➕ Save Item to Live Website";
  document.getElementById("cancel-edit-btn").classList.add("hidden");
}

function deleteItem(id) {
  if (confirm("Kya aap sach me is item ko delete karna chahte hain?")) {
    menuData = menuData.filter(i => i.id !== id);
    saveMenuToStorage();
  }
}

function toggleItemStock(id) {
  const item = menuData.find(i => i.id === id);
  if (item) {
    item.inStock = item.inStock === false ? true : false;
    saveMenuToStorage();
  }
}

function updateStats() {
  document.getElementById("stat-total-items").innerText = menuData.length;
  const cats = new Set(menuData.map(i => i.category));
  document.getElementById("stat-total-cats").innerText = cats.size;
}

function exportMenuBackup() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(menuData, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "slice_pizza_menu_backup.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function restoreDefaultMenu() {
  if (confirm("Sample menu reset karein? Purana menu replace ho jayega.")) {
    localStorage.removeItem("slice_pizza_menu");
    window.location.reload();
  }
}
