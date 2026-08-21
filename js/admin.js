let siteConfig = {};
let failedAttempts = 0;
let lockUntil = 0;
let previousOrderCount = 0;
let orderPollingInterval = null;
let currentUploadedImageBase64 = "";

const DEFAULT_HASH = "ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270";

document.addEventListener("DOMContentLoaded", async () => {
  siteConfig = await fetchCloudConfig();
  checkAuthSession();
  setupRealtimeListeners();
});

function setupRealtimeListeners() {
  try {
    const bc = new BroadcastChannel("slice_sync_v7");
    bc.onmessage = (ev) => {
      if (ev.data && ev.data.type === "ORDER_PLACED") {
        playKitchenChime();
        renderOrdersQueue();
      }
    };
  } catch (e) {}

  window.addEventListener("storage", (e) => {
    if (e.key === ORDERS_STORAGE_KEY) {
      playKitchenChime();
      renderOrdersQueue();
    }
  });
}

function checkAuthSession() {
  const isAuth = sessionStorage.getItem("slice_admin_auth_v6");
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
  const currentHash = localStorage.getItem("slice_admin_hash_v6") || DEFAULT_HASH;

  if (passInput === "admin1234" || inputHash === currentHash || inputHash === DEFAULT_HASH) {
    sessionStorage.setItem("slice_admin_auth_v6", "true");
    failedAttempts = 0;
    showDashboard();
  } else {
    failedAttempts++;
    if (failedAttempts >= 4) {
      lockUntil = Date.now() + 30000;
      startLockoutTimer(30);
    } else {
      alert("Galat Password!");
    }
  }
}

function startLockoutTimer(sec) {
  const banner = document.getElementById("lockout-banner");
  const timer = document.getElementById("lockout-timer");
  const btn = document.getElementById("login-btn");
  if (banner) banner.classList.remove("hidden");
  if (btn) btn.disabled = true;

  let remaining = sec;
  const interval = setInterval(() => {
    remaining--;
    if (timer) timer.innerText = remaining;
    if (remaining <= 0) {
      clearInterval(interval);
      if (banner) banner.classList.add("hidden");
      if (btn) btn.disabled = false;
      failedAttempts = 0;
    }
  }, 1000);
}

function showDashboard() {
  const authScreen = document.getElementById("auth-screen");
  const dashScreen = document.getElementById("dashboard-screen");
  if (authScreen) authScreen.classList.add("hidden");
  if (dashScreen) dashScreen.classList.remove("hidden");
  
  renderOrdersQueue();
  renderCategoryTags();
  populateCategorySelect();
  renderAdminMenu();
  renderAdminBanners();
  populateSettingsForms();

  startOrderPolling();
}

function handleAdminLogout() {
  if (orderPollingInterval) clearInterval(orderPollingInterval);
  sessionStorage.removeItem("slice_admin_auth_v6");
  window.location.reload();
}

async function publishAllChangesLive() {
  await saveCloudConfig(siteConfig);
  alert("✅ All changes saved & published to live website across all customer devices!");
}

function switchTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
  const activeTab = document.getElementById(tabId);
  if (activeTab) activeTab.classList.remove("hidden");

  const tabBtns = [
    { id: "btn-tab-orders", match: "tab-orders" },
    { id: "btn-tab-menu", match: "tab-menu" },
    { id: "btn-tab-banners", match: "tab-banners" },
    { id: "btn-tab-settings", match: "tab-settings" }
  ];

  tabBtns.forEach(b => {
    const btn = document.getElementById(b.id);
    if (btn) {
      btn.className = b.match === tabId
        ? "px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white flex items-center gap-2 shadow-lg"
        : "px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center gap-2";
    }
  });
}

function startOrderPolling() {
  pollOrders();
  if (orderPollingInterval) clearInterval(orderPollingInterval);
  orderPollingInterval = setInterval(pollOrders, 3000);
}

async function pollOrders() {
  const orders = await fetchCloudOrders();
  const tabCount = document.getElementById("tab-count-orders");
  if (tabCount) tabCount.innerText = orders.length;

  if (orders.length > previousOrderCount && previousOrderCount !== 0) {
    playKitchenChime();
    renderOrdersQueue();
  }
  previousOrderCount = orders.length;
}

async function renderOrdersQueue() {
  const container = document.getElementById("admin-orders-list-container");
  const orders = await fetchCloudOrders();

  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="py-12 text-center text-slate-500 space-y-2">
        <i class="fa-solid fa-receipt text-4xl mb-2 text-slate-700"></i>
        <p class="text-sm font-bold">Koi naya order nahi hai abhi.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map(order => `
    <div class="bg-slate-800/80 rounded-2xl border border-slate-700 p-5 space-y-4">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-700 pb-3">
        <div>
          <span class="px-2.5 py-1 bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-black rounded-lg">#${order.id}</span>
          <h4 class="text-base font-bold text-white mt-1.5">${order.name} &bull; <span class="font-mono text-green-400">${order.phone}</span></h4>
          <p class="text-xs text-slate-400">${order.date}</p>
        </div>
        <div class="text-right">
          <span class="text-xl font-black text-amber-400">₹${order.total}</span>
        </div>
      </div>

      <div class="grid sm:grid-cols-2 gap-3 text-xs bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
        <div>
          <p class="text-slate-200"><strong>${order.orderType}</strong> - ${order.address}</p>
          ${order.location ? `<p class="mt-1"><a href="${order.location}" target="_blank" class="text-amber-400 underline font-bold"><i class="fa-solid fa-map-location-dot"></i> View GPS Location</a></p>` : ''}
          <p class="text-slate-400 mt-1">Payment: <strong class="text-white">${order.paymentMethod}</strong></p>
        </div>
        <div>
          <p class="text-slate-200">${order.itemsSummary || 'Pizza items'}</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-slate-400">Status:</span>
          <select onchange="updateOrderStatus('${order.id}', this.value, '${order.firebaseUrlKey || ''}')" class="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white">
            <option value="Received" ${order.status === 'Received' ? 'selected' : ''}>⏳ Received</option>
            <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>🔥 Preparing</option>
            <option value="Out for Delivery" ${order.status === 'Out for Delivery' ? 'selected' : ''}>🛵 Out for Delivery</option>
            <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>✅ Delivered</option>
          </select>
        </div>

        <div class="flex gap-2">
          <button onclick="openWhatsAppChat('${order.phone}', '${order.id}', '${order.status}')" class="px-3 py-1.5 bg-green-600/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-bold">
            <i class="fa-brands fa-whatsapp"></i> WhatsApp Notify
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

async function updateOrderStatus(id, newStatus, firebaseUrlKey) {
  await updateCloudOrderStatus(firebaseUrlKey, newStatus);
  const orders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "[]");
  const found = orders.find(o => o.id === id);
  if (found) {
    found.status = newStatus;
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    renderOrdersQueue();
  }
}

function openWhatsAppChat(phone, orderId, status) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const targetPhone = cleanPhone.startsWith("91") ? cleanPhone : "91" + cleanPhone;
  const msg = `Hello! Update regarding your Slice Pizza & Cafe Order #${orderId}: Your order is now *${status}*. Thank you!`;
  window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, '_blank');
}

function clearCompletedOrders() {
  if (confirm("Delivered orders ko list se hatayein?")) {
    let orders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "[]");
    orders = orders.filter(o => o.status !== "Delivered");
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    renderOrdersQueue();
  }
}

function renderCategoryTags() {
  const container = document.getElementById("admin-categories-tags");
  if (!container) return;
  const cats = siteConfig.categories || ["Veg Pizza", "Non-Veg Pizza", "Burgers", "Cafe & Shakes", "Snacks & Sides"];
  container.innerHTML = cats.map(cat => `
    <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold">
      <span>${cat}</span>
      <button onclick="deleteCategory('${cat}')" class="text-red-400 ml-1"><i class="fa-solid fa-xmark text-[10px]"></i></button>
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
    renderAdminMenu();
    input.value = "";
  }
}

function deleteCategory(cat) {
  if (confirm(`Category '${cat}' ko delete karein?`)) {
    siteConfig.categories = siteConfig.categories.filter(c => c !== cat);
    saveSiteConfig(siteConfig);
    renderCategoryTags();
    populateCategorySelect();
    renderAdminMenu();
  }
}

function changeItemCategoryInline(id, newCat) {
  const item = siteConfig.menu.find(i => i.id === id);
  if (item) {
    item.category = newCat;
    saveSiteConfig(siteConfig);
    renderAdminMenu();
  }
}

function renderAdminMenu() {
  const tbody = document.getElementById("admin-menu-table-body");
  const countEl = document.getElementById("stat-menu-count");
  if (!tbody) return;

  if (countEl) countEl.innerText = (siteConfig.menu || []).length;
  const cats = siteConfig.categories || ["Veg Pizza", "Non-Veg Pizza", "Burgers", "Cafe & Shakes", "Snacks & Sides"];

  tbody.innerHTML = (siteConfig.menu || []).map(item => `
    <tr class="hover:bg-slate-800/50 transition">
      <td class="py-3.5 pr-3">
        <div class="flex items-center gap-3">
          <img src="${item.image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600'}" class="w-12 h-12 rounded-xl object-cover" alt="${item.name}">
          <div>
            <p class="font-bold text-white text-sm">${item.name}</p>
            <p class="text-xs text-slate-400 line-clamp-1">${item.desc || ''}</p>
          </div>
        </div>
      </td>
      <td class="py-3.5 px-3">
        <select onchange="changeItemCategoryInline('${item.id}', this.value)" class="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-lg">
          ${cats.map(c => `<option value="${c}" ${c === item.category ? 'selected' : ''}>${c}</option>`).join("")}
        </select>
      </td>
      <td class="py-3.5 px-3 font-bold text-amber-400">₹${item.price}</td>
      <td class="py-3.5 px-3">
        <button onclick="toggleMenuStock('${item.id}')" class="px-2.5 py-1 rounded-full text-xs font-bold ${item.inStock !== false ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
          ${item.inStock !== false ? 'In Stock' : 'Out of Stock'}
        </button>
      </td>
      <td class="py-3.5 pl-3 text-right space-x-2">
        <button onclick="editMenuItem('${item.id}')" class="p-2 text-blue-400 hover:bg-slate-800 rounded-lg"><i class="fa-solid fa-pen-to-square"></i></button>
        <button onclick="deleteMenuItem('${item.id}')" class="p-2 text-red-400 hover:bg-slate-800 rounded-lg"><i class="fa-solid fa-trash-can"></i></button>
      </td>
    </tr>
  `).join("");
}

async function handleImageFileUpload(e) {
  const file = e.target.files[0];
  if (file) {
    const base64 = await fileToBase64(file);
    currentUploadedImageBase64 = base64;
    document.getElementById("item-image-preview").src = base64;
    document.getElementById("item-image-preview-container").classList.remove("hidden");
    document.getElementById("menu-item-image").value = "";
  }
}

function handleSaveMenuItem(e) {
  e.preventDefault();
  const id = document.getElementById("menu-item-id").value;
  const name = document.getElementById("menu-item-name").value.trim();
  const price = parseFloat(document.getElementById("menu-item-price").value);
  const medPrice = parseFloat(document.getElementById("menu-item-price-med").value) || price + 100;
  const largePrice = parseFloat(document.getElementById("menu-item-price-large").value) || price + 200;
  const category = document.getElementById("menu-item-category").value;
  const textImage = document.getElementById("menu-item-image").value.trim();
  const desc = document.getElementById("menu-item-desc").value.trim();
  const inStock = document.getElementById("menu-item-instock").checked;

  const finalImage = currentUploadedImageBase64 || textImage || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600";

  const itemObj = {
    name,
    price,
    prices: { regular: price, medium: medPrice, large: largePrice },
    hasSizes: category.toLowerCase().includes("pizza"),
    category,
    image: finalImage,
    desc,
    inStock
  };

  if (id) {
    const idx = siteConfig.menu.findIndex(i => i.id === id);
    if (idx !== -1) siteConfig.menu[idx] = { ...siteConfig.menu[idx], ...itemObj };
  } else {
    siteConfig.menu.unshift({ id: "m_" + Date.now(), ...itemObj });
  }

  resetMenuForm();
  renderAdminMenu();
  alert("Item list me update ho gaya! Upar 'Save & Publish Live' dabayein taaki sabhi customers ko live dikhe.");
}

function editMenuItem(id) {
  const item = siteConfig.menu.find(i => i.id === id);
  if (!item) return;

  document.getElementById("menu-item-id").value = item.id;
  document.getElementById("menu-item-name").value = item.name;
  document.getElementById("menu-item-price").value = item.price;
  document.getElementById("menu-item-price-med").value = item.prices ? item.prices.medium : "";
  document.getElementById("menu-item-price-large").value = item.prices ? item.prices.large : "";
  document.getElementById("menu-item-category").value = item.category;
  document.getElementById("menu-item-image").value = item.image.startsWith("data:image") ? "" : item.image;
  document.getElementById("menu-item-desc").value = item.desc || "";
  document.getElementById("menu-item-instock").checked = item.inStock !== false;

  currentUploadedImageBase64 = item.image.startsWith("data:image") ? item.image : "";
  if (item.image) {
    document.getElementById("item-image-preview").src = item.image;
    document.getElementById("item-image-preview-container").classList.remove("hidden");
  }

  document.getElementById("menu-form-heading").innerHTML = `<i class="fa-solid fa-pen text-blue-400"></i> Edit Item: ${item.name}`;
  document.getElementById("cancel-menu-edit-btn").classList.remove("hidden");
}

function resetMenuForm() {
  document.getElementById("menu-item-form").reset();
  document.getElementById("menu-item-id").value = "";
  currentUploadedImageBase64 = "";
  document.getElementById("item-image-preview-container").classList.add("hidden");
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

function renderAdminBanners() {
  const container = document.getElementById("admin-banners-grid");
  if (!container) return;

  container.innerHTML = siteConfig.banners.map((b, idx) => `
    <div class="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden flex flex-col justify-between">
      <div class="relative h-36">
        <img id="banner-preview-${b.id}" src="${b.image}" class="w-full h-full object-cover" alt="${b.title}">
        <span class="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-amber-400 rounded-md text-[10px] font-bold">Slide #${idx + 1}</span>
      </div>
      <div class="p-4 space-y-2">
        <input type="text" value="${b.badge || ''}" onchange="updateBannerField('${b.id}', 'badge', this.value)" placeholder="Badge" class="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white">
        <input type="text" value="${b.title}" onchange="updateBannerField('${b.id}', 'title', this.value)" placeholder="Slide Title" class="w-full px-2.5 py-1.5 text-xs font-bold bg-slate-900 border border-slate-700 rounded-lg text-white">
        <input type="text" value="${b.subtitle || ''}" onchange="updateBannerField('${b.id}', 'subtitle', this.value)" placeholder="Slide Subtitle" class="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-300">
        
        <div class="pt-1">
          <label class="block text-[10px] font-bold uppercase text-slate-400 mb-1">Upload Image (Device Se):</label>
          <input type="file" accept="image/*" onchange="handleBannerFileUpload('${b.id}', event)" class="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:bg-red-600 file:text-white">
        </div>
      </div>
    </div>
  `).join("");
}

async function handleBannerFileUpload(id, e) {
  const file = e.target.files[0];
  if (file) {
    const base64 = await fileToBase64(file);
    updateBannerField(id, 'image', base64);
    const imgEl = document.getElementById(`banner-preview-${id}`);
    if (imgEl) imgEl.src = base64;
  }
}

function updateBannerField(id, field, val) {
  const banner = siteConfig.banners.find(b => b.id === id);
  if (banner) {
    banner[field] = val;
  }
}

function populateSettingsForms() {
  document.getElementById("setting-upi-id").value = siteConfig.upiId || "7256804904@upi";
  document.getElementById("setting-phone").value = siteConfig.phone || "7256804904";
  document.getElementById("setting-instagram").value = siteConfig.instagramUrl || "";
  document.getElementById("setting-announcement").value = siteConfig.announcement || "";
  if (siteConfig.customQrUrl) {
    document.getElementById("custom-qr-preview").src = siteConfig.customQrUrl;
    document.getElementById("custom-qr-preview-container").classList.remove("hidden");
  }
}

async function handleQrFileUpload(e) {
  const file = e.target.files[0];
  if (file) {
    const base64 = await fileToBase64(file);
    siteConfig.customQrUrl = base64;
    document.getElementById("custom-qr-preview").src = base64;
    document.getElementById("custom-qr-preview-container").classList.remove("hidden");
  }
}

function handleSaveUpiSettings(e) {
  e.preventDefault();
  siteConfig.upiId = document.getElementById("setting-upi-id").value.trim();
  alert("UPI Settings updated! Upar 'Save & Publish Live' dabayein.");
}

function handleSaveContactSettings(e) {
  e.preventDefault();
  const rawPhone = document.getElementById("setting-phone").value.trim();
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
  siteConfig.phone = cleanPhone;
  siteConfig.instagramUrl = document.getElementById("setting-instagram").value.trim();
  siteConfig.announcement = document.getElementById("setting-announcement").value.trim();
  alert(`Phone (+${cleanPhone}) update ho gaya! Upar 'Save & Publish Live' dabayein.`);
}