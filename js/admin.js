// Slice Pizza & Cafe - Master Control Room Logic (V3)
let siteConfig = {};
let failedAttempts = 0;
let lockUntil = 0;
let previousOrderCount = 0;
let orderPollingInterval = null;

const DEFAULT_HASH = "8151325dcd94bc66427387fa920f66cf3008be5eeeb339893d9b4b0d0696b998"; // sha256 for 'admin1234'

document.addEventListener("DOMContentLoaded", async () => {
  siteConfig = getSiteConfig();
  checkAuthSession();
});

// ---------------- AUTH ----------------
function checkAuthSession() {
  const isAuth = sessionStorage.getItem("slice_admin_auth_v3");
  if (isAuth === "true") {
    showDashboard();
  }
}

async function handleSecureLogin(e) {
  e.preventDefault();

  const now = Date.now();
  if (now < lockUntil) {
    alert("Account temporarily locked for security. Wait for cooldown!");
    return;
  }

  const passInput = document.getElementById("admin-pass-input").value.trim();
  const inputHash = await hashSHA256(passInput);
  const currentHash = localStorage.getItem("slice_admin_hash_v3") || DEFAULT_HASH;

  if (inputHash === currentHash) {
    sessionStorage.setItem("slice_admin_auth_v3", "true");
    failedAttempts = 0;
    showDashboard();
  } else {
    failedAttempts++;
    if (failedAttempts >= 4) {
      lockUntil = Date.now() + 30000;
      startLockoutTimer(30);
    } else {
      alert(`Galat Password! (Attempt ${failedAttempts}/4). Default: admin1234`);
    }
  }
}

function startLockoutTimer(sec) {
  const banner = document.getElementById("lockout-banner");
  const timer = document.getElementById("lockout-timer");
  const btn = document.getElementById("login-btn");
  banner.classList.remove("hidden");
  btn.disabled = true;

  let remaining = sec;
  const interval = setInterval(() => {
    remaining--;
    timer.innerText = remaining;
    if (remaining <= 0) {
      clearInterval(interval);
      banner.classList.add("hidden");
      btn.disabled = false;
      failedAttempts = 0;
    }
  }, 1000);
}

function showDashboard() {
  document.getElementById("auth-screen").classList.add("hidden");
  document.getElementById("dashboard-screen").classList.remove("hidden");
  
  renderOrdersQueue();
  renderCategoryTags();
  populateCategorySelect();
  renderAdminMenu();
  renderAdminBanners();
  renderAdminCustomers();
  populateSettingsForms();

  // Start Order Monitoring with Audio Alert
  startOrderPolling();
}

function handleAdminLogout() {
  if (orderPollingInterval) clearInterval(orderPollingInterval);
  sessionStorage.removeItem("slice_admin_auth_v3");
  window.location.reload();
}

function testNotificationSound() {
  playOrderNotificationSound();
  alert("🔔 Sound Test: Chime notification played successfully!");
}

// ---------------- TAB SWITCHING ----------------
function switchTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
  document.getElementById(tabId).classList.remove("hidden");

  const tabBtns = [
    { id: "btn-tab-orders", match: "tab-orders" },
    { id: "btn-tab-menu", match: "tab-menu" },
    { id: "btn-tab-banners", match: "tab-banners" },
    { id: "btn-tab-customers", match: "tab-customers" },
    { id: "btn-tab-settings", match: "tab-settings" }
  ];

  tabBtns.forEach(b => {
    const btn = document.getElementById(b.id);
    if (b.match === tabId) {
      btn.className = "px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white flex items-center gap-2 shadow-lg";
    } else {
      btn.className = "px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center gap-2";
    }
  });
}

// ---------------- ORDER POLLING & AUDIO BELL ----------------
function startOrderPolling() {
  const currentOrders = getAllOrders();
  previousOrderCount = currentOrders.length;

  if (orderPollingInterval) clearInterval(orderPollingInterval);
  orderPollingInterval = setInterval(() => {
    const latestOrders = getAllOrders();
    if (latestOrders.length > previousOrderCount) {
      // New Order Received! Play Audio Sound & Update UI
      playOrderNotificationSound();
      renderOrdersQueue();
      alert(`🔔 NEW ORDER RECEIVED! Order #${latestOrders[0].id} for ₹${latestOrders[0].total}`);
    }
    previousOrderCount = latestOrders.length;
  }, 3000); // Check every 3 seconds
}

// ---------------- TAB 1: LIVE ORDERS QUEUE ----------------
function renderOrdersQueue() {
  const container = document.getElementById("admin-orders-list-container");
  const tabCount = document.getElementById("tab-count-orders");
  const orders = getAllOrders();

  if (tabCount) tabCount.innerText = orders.length;
  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="py-12 text-center text-slate-500 space-y-2">
        <i class="fa-solid fa-receipt text-4xl mb-2 text-slate-700"></i>
        <p class="text-sm font-bold">Koi naya order nahi hai abhi.</p>
        <p class="text-xs">Website par jaise hi order aayega, yahan bell sound ke sath live show hoga.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map(order => {
    const statusColors = {
      "Received": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      "Preparing": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "Out for Delivery": "bg-purple-500/20 text-purple-400 border-purple-500/30",
      "Delivered": "bg-green-500/20 text-green-400 border-green-500/30"
    };

    return `
      <div class="bg-slate-800/80 rounded-2xl border border-slate-700 p-5 space-y-4">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-700 pb-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-black rounded-lg">#${order.id}</span>
              <span class="px-2.5 py-1 border text-xs font-bold rounded-lg ${statusColors[order.status] || 'bg-slate-700'}">
                ● Status: ${order.status}
              </span>
            </div>
            <h4 class="text-base font-bold text-white mt-1.5">${order.name} &bull; <span class="font-mono text-green-400">${order.phone}</span></h4>
            <p class="text-xs text-slate-400">Order Time: ${order.date}</p>
          </div>

          <div class="text-right">
            <span class="text-xs text-slate-400 block">Total Amount</span>
            <span class="text-xl font-black text-amber-400">₹${order.total}</span>
          </div>
        </div>

        <!-- Details & Items -->
        <div class="grid sm:grid-cols-2 gap-3 text-xs bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
          <div>
            <p class="text-slate-400 font-semibold uppercase">Order Type & Delivery:</p>
            <p class="text-slate-200 mt-0.5"><strong>${order.orderType}</strong> - ${order.address}</p>
            <p class="text-slate-400 mt-1">Payment: <strong class="text-white">${order.paymentMethod}</strong></p>
          </div>
          <div>
            <p class="text-slate-400 font-semibold uppercase">Items Ordered:</p>
            <p class="text-slate-200 mt-0.5">${order.itemsSummary || 'Pizza items'}</p>
          </div>
        </div>

        <!-- Status Change Controller -->
        <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-400">Update Status:</span>
            <select onchange="updateOrderStatus('${order.id}', this.value)" class="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-red-500">
              <option value="Received" ${order.status === 'Received' ? 'selected' : ''}>⏳ Received</option>
              <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>🔥 Preparing in Kitchen</option>
              <option value="Out for Delivery" ${order.status === 'Out for Delivery' ? 'selected' : ''}>🛵 Out for Delivery / Ready</option>
              <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>✅ Delivered / Completed</option>
            </select>
          </div>

          <div class="flex gap-2">
            <button onclick="openWhatsAppChat('${order.phone}', '${order.id}', '${order.status}')" class="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1">
              <i class="fa-brands fa-whatsapp"></i> WhatsApp Notify
            </button>
            <button onclick="printAdminBill('${order.id}')" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1">
              <i class="fa-solid fa-print"></i> Print Bill
            </button>
          </div>
        </div>

      </div>
    `;
  }).join("");
}

function updateOrderStatus(id, newStatus) {
  const orders = getAllOrders();
  const found = orders.find(o => o.id === id);
  if (found) {
    found.status = newStatus;
    saveOrdersList(orders);
    renderOrdersQueue();
    alert(`Order #${id} status updated to: ${newStatus}`);
  }
}

function openWhatsAppChat(phone, orderId, status) {
  const targetPhone = phone.startsWith("91") ? phone : "91" + phone;
  const msg = `Hello! Update regarding your Slice Pizza & Cafe Order #${orderId}: Your order is now *${status}*. Thank you!`;
  window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, '_blank');
}

function printAdminBill(id) {
  const orders = getAllOrders();
  const order = orders.find(o => o.id === id);
  if (!order) return;

  const w = window.open('', '_blank', 'width=600,height=700');
  w.document.write(`
    <html>
    <head>
      <title>KITCHEN BILL #${order.id}</title>
      <style>body { font-family: monospace; padding: 20px; color: #000; } .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; } .row { display: flex; justify-content: space-between; margin: 4px 0; } </style>
    </head>
    <body onload="window.print()">
      <div class="header">
        <h2>🍕 SLICE PIZZA & CAFE</h2>
        <p>KITCHEN & DISPATCH INVOICE</p>
        <p>Order ID: #${order.id} | ${order.date}</p>
      </div>
      <p><strong>Customer:</strong> ${order.name} (${order.phone})</p>
      <p><strong>Type:</strong> ${order.orderType}</p>
      <p><strong>Address:</strong> ${order.address}</p>
      <hr style="border: 1px dashed #000">
      <p><strong>ITEMS:</strong></p>
      ${order.cart.map(i => `<div class="row"><span>${i.name} x ${i.qty}</span><span>₹${i.price * i.qty}</span></div>`).join("")}
      <hr style="border: 1px dashed #000">
      <div class="row" style="font-weight: bold; font-size: 16px;">
        <span>TOTAL BILL</span>
        <span>₹${order.total}</span>
      </div>
      <p><strong>Payment Mode:</strong> ${order.paymentMethod}</p>
    </body>
    </html>
  `);
  w.document.close();
}

function clearCompletedOrders() {
  if (confirm("Delivered orders ko list se hatayein?")) {
    let orders = getAllOrders();
    orders = orders.filter(o => o.status !== "Delivered");
    saveOrdersList(orders);
    renderOrdersQueue();
  }
}

// ---------------- TAB 2: CATEGORY & MENU MANAGEMENT ----------------
function renderCategoryTags() {
  const container = document.getElementById("admin-categories-tags");
  if (!container) return;

  const cats = siteConfig.categories || ["Veg Pizza", "Non-Veg Pizza", "Burgers", "Cafe & Shakes", "Snacks & Sides"];

  container.innerHTML = cats.map(cat => `
    <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold">
      <span>${cat}</span>
      <button onclick="deleteCategory('${cat}')" class="text-red-400 hover:text-red-300 ml-1">
        <i class="fa-solid fa-xmark text-[10px]"></i>
      </button>
    </span>
  `).join("");
}

function populateCategorySelect() {
  const select = document.getElementById("menu-item-category");
  if (!select) return;

  const cats = siteConfig.categories || ["Veg Pizza", "Non-Veg Pizza", "Burgers", "Cafe & Shakes", "Snacks & Sides"];
  select.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join("");
}

function addNewCategory() {
  const input = document.getElementById("new-category-input");
  const val = input.value.trim();
  if (!val) return;

  if (!siteConfig.categories) siteConfig.categories = [];
  if (!siteConfig.categories.includes(val)) {
    siteConfig.categories.push(val);
    saveSiteConfig(siteConfig);
    renderCategoryTags();
    populateCategorySelect();
    input.value = "";
  }
}

function deleteCategory(cat) {
  if (confirm(`Category '${cat}' ko delete karein?`)) {
    siteConfig.categories = siteConfig.categories.filter(c => c !== cat);
    saveSiteConfig(siteConfig);
    renderCategoryTags();
    populateCategorySelect();
  }
}

function renderAdminMenu() {
  const tbody = document.getElementById("admin-menu-table-body");
  const countEl = document.getElementById("stat-menu-count");
  if (!tbody) return;

  if (countEl) countEl.innerText = siteConfig.menu.length;

  tbody.innerHTML = siteConfig.menu.map(item => `
    <tr class="hover:bg-slate-800/50 transition">
      <td class="py-3.5 pr-3">
        <div class="flex items-center gap-3">
          <img src="${item.image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600'}" class="w-10 h-10 rounded-lg object-cover" alt="${item.name}">
          <div>
            <p class="font-bold text-white">${item.name}</p>
            <p class="text-xs text-slate-400 line-clamp-1">${item.desc || ''}</p>
          </div>
        </div>
      </td>
      <td class="py-3.5 px-3">
        <span class="px-2.5 py-1 bg-slate-800 rounded-lg text-xs font-semibold text-slate-300 border border-slate-700">${item.category}</span>
      </td>
      <td class="py-3.5 px-3 font-bold text-amber-400">₹${item.price}</td>
      <td class="py-3.5 px-3">
        <button onclick="toggleMenuStock('${item.id}')" class="px-2.5 py-1 rounded-full text-xs font-bold ${item.inStock !== false ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}">
          ${item.inStock !== false ? 'In Stock' : 'Out of Stock'}
        </button>
      </td>
      <td class="py-3.5 pl-3 text-right space-x-2">
        <button onclick="editMenuItem('${item.id}')" class="p-2 text-blue-400 hover:bg-slate-800 rounded-lg" title="Edit Item">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button onclick="deleteMenuItem('${item.id}')" class="p-2 text-red-400 hover:bg-slate-800 rounded-lg" title="Delete Item">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    </tr>
  `).join("");
}

function handleSaveMenuItem(e) {
  e.preventDefault();
  const id = document.getElementById("menu-item-id").value;
  const name = document.getElementById("menu-item-name").value.trim();
  const price = parseFloat(document.getElementById("menu-item-price").value);
  const category = document.getElementById("menu-item-category").value;
  const image = document.getElementById("menu-item-image").value.trim();
  const desc = document.getElementById("menu-item-desc").value.trim();
  const inStock = document.getElementById("menu-item-instock").checked;

  if (id) {
    const idx = siteConfig.menu.findIndex(i => i.id === id);
    if (idx !== -1) {
      siteConfig.menu[idx] = { ...siteConfig.menu[idx], name, price, category, image, desc, inStock };
    }
  } else {
    siteConfig.menu.unshift({
      id: "m_" + Date.now(),
      name,
      price,
      category,
      image: image || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600",
      desc,
      inStock
    });
  }

  saveSiteConfig(siteConfig);
  resetMenuForm();
  renderAdminMenu();
  alert("Menu item save ho gaya!");
}

function editMenuItem(id) {
  const item = siteConfig.menu.find(i => i.id === id);
  if (!item) return;

  document.getElementById("menu-item-id").value = item.id;
  document.getElementById("menu-item-name").value = item.name;
  document.getElementById("menu-item-price").value = item.price;
  document.getElementById("menu-item-category").value = item.category;
  document.getElementById("menu-item-image").value = item.image || "";
  document.getElementById("menu-item-desc").value = item.desc || "";
  document.getElementById("menu-item-instock").checked = item.inStock !== false;

  document.getElementById("menu-form-heading").innerHTML = `<i class="fa-solid fa-pen text-blue-400"></i> Edit Item: ${item.name}`;
  document.getElementById("menu-submit-btn").innerText = "Update Item";
  document.getElementById("cancel-menu-edit-btn").classList.remove("hidden");
}

function resetMenuForm() {
  document.getElementById("menu-item-form").reset();
  document.getElementById("menu-item-id").value = "";
  document.getElementById("menu-form-heading").innerHTML = `<i class="fa-solid fa-circle-plus text-red-500"></i> Naya Item Add Karein`;
  document.getElementById("menu-submit-btn").innerText = "➕ Save Item to Menu";
  document.getElementById("cancel-menu-edit-btn").classList.add("hidden");
}

function deleteMenuItem(id) {
  if (confirm("Is menu item ko delete karein?")) {
    siteConfig.menu = siteConfig.menu.filter(i => i.id !== id);
    saveSiteConfig(siteConfig);
    renderAdminMenu();
  }
}

function toggleMenuStock(id) {
  const item = siteConfig.menu.find(i => i.id === id);
  if (item) {
    item.inStock = item.inStock === false ? true : false;
    saveSiteConfig(siteConfig);
    renderAdminMenu();
  }
}

// ---------------- TAB 3: TOP 6 SLIDES ----------------
function renderAdminBanners() {
  const container = document.getElementById("admin-banners-grid");
  if (!container) return;

  container.innerHTML = siteConfig.banners.map((b, idx) => `
    <div class="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden flex flex-col justify-between">
      <div class="relative h-36">
        <img src="${b.image}" class="w-full h-full object-cover" alt="${b.title}">
        <span class="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-amber-400 rounded-md text-[10px] font-bold">Slide #${idx + 1}</span>
      </div>
      <div class="p-4 space-y-2">
        <input type="text" value="${b.badge || ''}" onchange="updateBannerField('${b.id}', 'badge', this.value)" placeholder="Badge (Ex: Special 🍕)" class="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white">
        <input type="text" value="${b.title}" onchange="updateBannerField('${b.id}', 'title', this.value)" placeholder="Slide Title" class="w-full px-2.5 py-1.5 text-xs font-bold bg-slate-900 border border-slate-700 rounded-lg text-white">
        <input type="text" value="${b.subtitle || ''}" onchange="updateBannerField('${b.id}', 'subtitle', this.value)" placeholder="Slide Subtitle" class="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-300">
        <input type="url" value="${b.image}" onchange="updateBannerField('${b.id}', 'image', this.value)" placeholder="Image URL" class="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-blue-400">
      </div>
    </div>
  `).join("");
}

function updateBannerField(id, field, val) {
  const banner = siteConfig.banners.find(b => b.id === id);
  if (banner) {
    banner[field] = val;
    saveSiteConfig(siteConfig);
  }
}

// ---------------- TAB 4: CUSTOMERS ----------------
function renderAdminCustomers() {
  const container = document.getElementById("admin-customers-grid");
  if (!container) return;

  container.innerHTML = siteConfig.customers.map(c => `
    <div class="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex flex-col justify-between space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <img src="${c.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" class="w-9 h-9 rounded-full object-cover border border-amber-400">
          <div>
            <p class="font-bold text-white text-xs">${c.name}</p>
            <p class="text-[10px] text-slate-400">${c.role || 'Customer'}</p>
          </div>
        </div>
        <button onclick="deleteCustomerReview('${c.id}')" class="text-red-400 hover:text-red-300 p-1 text-xs">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
      <p class="text-xs text-slate-300 italic">"${c.comment}"</p>
      <span class="text-amber-400 text-xs">Rating: ${'★'.repeat(c.rating || 5)}</span>
    </div>
  `).join("");
}

function deleteCustomerReview(id) {
  if (confirm("Is customer review ko delete karein?")) {
    siteConfig.customers = siteConfig.customers.filter(c => c.id !== id);
    saveSiteConfig(siteConfig);
    renderAdminCustomers();
  }
}

// ---------------- TAB 5: UPI, SETTINGS & PASSWORD ----------------
function populateSettingsForms() {
  document.getElementById("setting-upi-id").value = siteConfig.upiId || "7667610195@upi";
  document.getElementById("setting-custom-qr").value = siteConfig.customQrUrl || "";
  document.getElementById("setting-phone").value = siteConfig.phone || "917667610195";
  document.getElementById("setting-instagram").value = siteConfig.instagramUrl || "";
  document.getElementById("setting-announcement").value = siteConfig.announcement || "";
}

function handleSaveUpiSettings(e) {
  e.preventDefault();
  siteConfig.upiId = document.getElementById("setting-upi-id").value.trim();
  siteConfig.customQrUrl = document.getElementById("setting-custom-qr").value.trim();

  saveSiteConfig(siteConfig);
  alert("UPI & QR Settings update ho gayi!");
}

function handleSaveContactSettings(e) {
  e.preventDefault();
  siteConfig.phone = document.getElementById("setting-phone").value.trim();
  siteConfig.instagramUrl = document.getElementById("setting-instagram").value.trim();
  siteConfig.announcement = document.getElementById("setting-announcement").value.trim();

  saveSiteConfig(siteConfig);
  alert("Contacts, Instagram & Announcement update ho gayi!");
}

async function handleChangePassword(e) {
  e.preventDefault();
  const curr = document.getElementById("curr-pass").value.trim();
  const next = document.getElementById("new-pass").value.trim();

  const currentSavedHash = localStorage.getItem("slice_admin_hash_v3") || DEFAULT_HASH;
  const currHash = await hashSHA256(curr);

  if (currHash !== currentSavedHash) {
    alert("Current password galat hai!");
    return;
  }

  const newHash = await hashSHA256(next);
  localStorage.setItem("slice_admin_hash_v3", newHash);
  e.target.reset();
  alert("Master Admin Password update ho gaya!");
}
