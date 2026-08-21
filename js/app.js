let siteConfig = {};
let cart = [];
let activeCategory = "All";
let searchQuery = "";
let currentSlideIndex = 0;
let slideInterval = null;
let pendingWhatsAppMessage = "";
let lastGeneratedOrderId = "";
let detectedUserLocation = "";

document.addEventListener("DOMContentLoaded", async () => {
  siteConfig = await fetchCloudConfig();
  renderAnnouncement();
  applySocialAndBrandLinks();
  initHeroSlider();
  renderCategories();
  renderMenu();
  loadCartFromStorage();
  updateCartUI();

  try {
    const bc = new BroadcastChannel("slice_sync_v7");
    bc.onmessage = async (ev) => {
      if (ev.data && ev.data.type === "CONFIG_UPDATED") {
        siteConfig = await fetchCloudConfig();
        renderAnnouncement();
        applySocialAndBrandLinks();
        renderCategories();
        renderMenu();
      }
    };
  } catch (e) {}
});

function renderAnnouncement() {
  const bar = document.getElementById("announcement-bar");
  const topPhone = document.getElementById("top-phone-display");
  if (bar && siteConfig.announcement) {
    const spanEl = bar.querySelector("span:first-child");
    if (spanEl) spanEl.innerText = siteConfig.announcement;
  }
  if (topPhone) {
    const clean = (siteConfig.phone || '7256804904').replace(/[^0-9]/g, '');
    topPhone.innerHTML = `<i class="fa-solid fa-phone mr-1"></i> Call / WhatsApp: +${clean}`;
  }
}

function applySocialAndBrandLinks() {
  const navInsta = document.getElementById("nav-instagram-link");
  const footerInsta = document.getElementById("footer-instagram-link");
  const footerWa = document.getElementById("footer-whatsapp-link");
  const footerPhone = document.getElementById("footer-phone-display");

  const cleanPhone = (siteConfig.phone || '7256804904').replace(/[^0-9]/g, '');

  if (navInsta) navInsta.href = siteConfig.instagramUrl || "https://instagram.com/";
  if (footerInsta) footerInsta.href = siteConfig.instagramUrl || "https://instagram.com/";
  if (footerWa) footerWa.href = `https://wa.me/${cleanPhone}`;
  if (footerPhone) footerPhone.innerText = `+${cleanPhone}`;
}

function initHeroSlider() {
  const track = document.getElementById("hero-slider-track");
  const dotsContainer = document.getElementById("slider-dots");
  if (!track || !siteConfig.banners || siteConfig.banners.length === 0) return;

  track.innerHTML = siteConfig.banners.map((b, idx) => `
    <div class="hero-slide absolute inset-0 transition-opacity duration-1000 flex items-center ${idx === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'}" data-slide="${idx}">
      <img src="${b.image}" 
           onerror="this.src='https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200'"
           class="absolute inset-0 w-full h-full object-cover brightness-[0.45]" alt="${b.title}">
      <div class="relative z-10 max-w-2xl px-6 sm:px-12 md:px-16 text-white space-y-4">
        <span class="inline-block px-3 py-1 bg-red-600 text-white rounded-full text-xs font-black tracking-wider uppercase">${b.badge || 'Featured'}</span>
        <h2 class="text-2xl sm:text-4xl md:text-5xl font-black leading-tight drop-shadow-md">${b.title}</h2>
        <p class="text-xs sm:text-base text-gray-200 line-clamp-2 max-w-lg">${b.subtitle || ''}</p>
        <div class="pt-2">
          <button onclick="handleSlideOrderClick('${b.targetItemId || '1'}')" class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-amber-500 hover:scale-105 transition rounded-full font-bold text-xs sm:text-sm text-white shadow-xl">
            <i class="fa-solid fa-utensils"></i> Order This Item
          </button>
        </div>
      </div>
    </div>
  `).join("");

  if (dotsContainer) {
    dotsContainer.innerHTML = siteConfig.banners.map((_, idx) => `
      <button onclick="goToSlide(${idx})" class="slider-dot w-2.5 h-2.5 rounded-full transition-all ${idx === 0 ? 'bg-amber-400 w-8' : 'bg-white/50'}"></button>
    `).join("");
  }

  startAutoSlide();
}

function handleSlideOrderClick(itemId) {
  const menuEl = document.getElementById("menu-section");
  if (menuEl) menuEl.scrollIntoView({ behavior: "smooth" });
  setTimeout(() => {
    openItemCustomization(itemId);
  }, 400);
}

function startAutoSlide() {
  if (slideInterval) clearInterval(slideInterval);
  slideInterval = setInterval(() => {
    nextSlide();
  }, 4500);
}

function showSlide(index) {
  const slides = document.querySelectorAll(".hero-slide");
  const dots = document.querySelectorAll(".slider-dot");
  if (slides.length === 0) return;

  if (index >= slides.length) index = 0;
  if (index < 0) index = slides.length - 1;
  currentSlideIndex = index;

  slides.forEach((s, idx) => {
    if (idx === currentSlideIndex) {
      s.classList.remove("opacity-0", "z-0");
      s.classList.add("opacity-100", "z-10");
    } else {
      s.classList.remove("opacity-100", "z-10");
      s.classList.add("opacity-0", "z-0");
    }
  });

  dots.forEach((d, idx) => {
    if (idx === currentSlideIndex) {
      d.className = "slider-dot w-8 h-2.5 rounded-full bg-amber-400 transition-all";
    } else {
      d.className = "slider-dot w-2.5 h-2.5 rounded-full bg-white/50 transition-all";
    }
  });
}

function nextSlide() { showSlide(currentSlideIndex + 1); startAutoSlide(); }
function prevSlide() { showSlide(currentSlideIndex - 1); startAutoSlide(); }
function goToSlide(idx) { showSlide(idx); startAutoSlide(); }

function renderCategories() {
  const container = document.getElementById("category-pills");
  if (!container) return;

  const categories = ["All", ...(siteConfig.categories || ["Veg Pizza", "Non-Veg Pizza", "Burgers", "Cafe & Shakes", "Snacks & Sides"])];
  
  container.innerHTML = categories.map(cat => {
    const isActive = cat === activeCategory;
    const activeClass = isActive ? "bg-red-600 text-white shadow-md shadow-red-200" : "bg-gray-100 text-gray-700 hover:bg-gray-200";
    return `
      <button onclick="selectCategory('${cat}')" class="px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeClass}">
        ${cat === 'All' ? '🍕 All Items' : cat}
      </button>
    `;
  }).join("");
}

function selectCategory(cat) {
  activeCategory = cat;
  renderCategories();
  renderMenu();
}

function handleSearch(val) {
  searchQuery = val.toLowerCase().trim();
  renderMenu();
}

function renderMenu() {
  const grid = document.getElementById("menu-grid");
  const emptyState = document.getElementById("empty-state");
  const countDisplay = document.getElementById("items-count-display");
  if (!grid) return;

  let filtered = (siteConfig.menu || []).filter(item => {
    const matchCat = activeCategory === "All" || item.category === activeCategory;
    const matchSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery) || (item.desc && item.desc.toLowerCase().includes(searchQuery));
    return matchCat && matchSearch;
  });

  if (countDisplay) {
    countDisplay.innerText = `${filtered.length} Items Available`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  grid.innerHTML = filtered.map(item => {
    const isOut = item.inStock === false;

    return `
      <div class="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group ${isOut ? 'opacity-60 grayscale' : ''}">
        <div onclick="openItemCustomization('${item.id}')" class="relative overflow-hidden h-48 bg-gray-100 cursor-pointer">
          <img src="${item.image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600'}" 
               alt="${item.name}" 
               class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          <div class="absolute top-3 left-3 flex flex-wrap gap-1">
            <span class="px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[10px] font-extrabold text-gray-800 uppercase tracking-wider shadow-sm">
              ${item.category}
            </span>
          </div>
          <div class="absolute bottom-2 right-2 px-2.5 py-1 bg-black/60 backdrop-blur-md text-white rounded-lg text-[10px] font-bold flex items-center gap-1">
            <i class="fa-solid fa-sliders"></i> Customize
          </div>
          ${isOut ? `<div class="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-extrabold text-xs tracking-wider uppercase">Sold Out</div>` : ''}
        </div>

        <div class="p-5 flex-1 flex flex-col justify-between">
          <div onclick="openItemCustomization('${item.id}')" class="cursor-pointer">
            <h3 class="font-bold text-gray-900 text-base group-hover:text-red-600 transition-colors">${item.name}</h3>
            <p class="text-gray-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">${item.desc || 'Freshly prepared on order with authentic recipe.'}</p>
          </div>

          <div class="pt-4 mt-2 border-t border-gray-50 flex items-center justify-between">
            <div>
              <span class="text-xs text-gray-400 font-semibold block">Starts from</span>
              <span class="text-xl font-black text-gray-950">₹${item.price}</span>
            </div>
            ${isOut ? `
              <span class="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl">Out of Stock</span>
            ` : `
              <button onclick="openItemCustomization('${item.id}')" class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-red-200">
                <i class="fa-solid fa-plus text-[10px]"></i> Select
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

let currentModalItem = null;
let selectedSize = "regular";
let selectedAddons = [];

function openItemCustomization(id) {
  const item = siteConfig.menu.find(i => i.id === id);
  if (!item || item.inStock === false) return;

  currentModalItem = item;
  selectedSize = "regular";
  selectedAddons = [];

  const viewContainer = document.getElementById("selected-item-view");
  const relatedGrid = document.getElementById("related-items-grid");
  const modal = document.getElementById("item-details-modal");

  const prices = item.prices || { regular: item.price, medium: item.price + 100, large: item.price + 200 };
  const isPizza = item.category.toLowerCase().includes("pizza") || item.hasSizes;

  viewContainer.innerHTML = `
    <div class="grid sm:grid-cols-2 gap-6 items-start">
      <div>
        <img src="${item.image}" class="w-full h-56 object-cover rounded-2xl shadow-md border" alt="${item.name}">
        <span class="inline-block mt-3 px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full">${item.category}</span>
        <h3 class="text-2xl font-black text-gray-900 mt-1">${item.name}</h3>
        <p class="text-xs text-gray-600 mt-1">${item.desc || 'Fresh handmade dough & 100% pure dairy mozzarella cheese.'}</p>
      </div>

      <div class="space-y-4">
        ${isPizza ? `
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">1. Choose Size:</label>
            <div class="grid grid-cols-3 gap-2">
              <button type="button" onclick="chooseSize('regular', ${prices.regular})" id="size-btn-regular" class="size-btn p-2.5 rounded-xl border-2 border-red-600 bg-red-50 text-center text-xs font-bold text-gray-900">
                Regular<br><span class="text-red-600 font-extrabold">₹${prices.regular}</span>
              </button>
              <button type="button" onclick="chooseSize('medium', ${prices.medium})" id="size-btn-medium" class="size-btn p-2.5 rounded-xl border border-gray-200 text-center text-xs font-bold text-gray-700">
                Medium<br><span class="text-gray-900 font-extrabold">₹${prices.medium}</span>
              </button>
              <button type="button" onclick="chooseSize('large', ${prices.large})" id="size-btn-large" class="size-btn p-2.5 rounded-xl border border-gray-200 text-center text-xs font-bold text-gray-700">
                Large<br><span class="text-gray-900 font-extrabold">₹${prices.large}</span>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">2. Extra Crust & Toppings:</label>
            <div class="space-y-2 text-xs">
              <label class="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border cursor-pointer">
                <div class="flex items-center gap-2">
                  <input type="checkbox" onchange="toggleAddon('Cheese Burst Crust', 50, this.checked)" class="rounded text-red-600">
                  <span class="font-bold text-gray-800">Cheese Burst Crust</span>
                </div>
                <span class="font-extrabold text-red-600">+₹50</span>
              </label>
              <label class="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border cursor-pointer">
                <div class="flex items-center gap-2">
                  <input type="checkbox" onchange="toggleAddon('Extra Mozzarella Cheese', 30, this.checked)" class="rounded text-red-600">
                  <span class="font-bold text-gray-800">Extra Mozzarella Cheese</span>
                </div>
                <span class="font-extrabold text-red-600">+₹30</span>
              </label>
              <label class="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border cursor-pointer">
                <div class="flex items-center gap-2">
                  <input type="checkbox" onchange="toggleAddon('Spicy Jalapeno & Olives', 25, this.checked)" class="rounded text-red-600">
                  <span class="font-bold text-gray-800">Spicy Jalapeno & Olives</span>
                </div>
                <span class="font-extrabold text-red-600">+₹25</span>
              </label>
            </div>
          </div>
        ` : ''}

        <div class="pt-2 border-t flex items-center justify-between">
          <div>
            <span class="text-xs text-gray-400 font-semibold block">Total Price</span>
            <span class="text-2xl font-black text-red-600" id="modal-calculated-price">₹${prices.regular || item.price}</span>
          </div>
          <button onclick="confirmAddToCart()" class="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-2">
            <i class="fa-solid fa-cart-plus"></i> Add to Cart
          </button>
        </div>
      </div>
    </div>
  `;

  const related = (siteConfig.menu || []).filter(i => i.id !== id && (i.category === item.category || i.category.includes("Snacks") || i.category.includes("Cafe"))).slice(0, 4);

  relatedGrid.innerHTML = related.map(rel => `
    <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
      <img src="${rel.image}" class="w-14 h-14 object-cover rounded-xl" alt="${rel.name}">
      <div class="flex-1">
        <h5 class="text-xs font-bold text-gray-900 leading-tight">${rel.name}</h5>
        <p class="text-xs text-red-600 font-extrabold">₹${rel.price}</p>
      </div>
      <button onclick="openItemCustomization('${rel.id}')" class="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700">
        + View
      </button>
    </div>
  `).join("");

  modal.classList.remove("hidden");
}

function chooseSize(sizeName, basePrice) {
  selectedSize = sizeName;
  document.querySelectorAll(".size-btn").forEach(btn => {
    btn.className = "size-btn p-2.5 rounded-xl border border-gray-200 text-center text-xs font-bold text-gray-700";
  });
  const selectedBtn = document.getElementById(`size-btn-${sizeName}`);
  if (selectedBtn) {
    selectedBtn.className = "size-btn p-2.5 rounded-xl border-2 border-red-600 bg-red-50 text-center text-xs font-bold text-gray-900";
  }
  recalculateModalPrice();
}

function toggleAddon(name, price, checked) {
  if (checked) {
    selectedAddons.push({ name, price });
  } else {
    selectedAddons = selectedAddons.filter(a => a.name !== name);
  }
  recalculateModalPrice();
}

function recalculateModalPrice() {
  if (!currentModalItem) return;
  const prices = currentModalItem.prices || { regular: currentModalItem.price, medium: currentModalItem.price + 100, large: currentModalItem.price + 200 };
  let base = prices[selectedSize] || currentModalItem.price;
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const total = base + addonsTotal;
  const priceEl = document.getElementById("modal-calculated-price");
  if (priceEl) priceEl.innerText = `₹${total}`;
  return total;
}

function confirmAddToCart() {
  if (!currentModalItem) return;
  const finalItemPrice = recalculateModalPrice();
  const addonsSummary = selectedAddons.map(a => a.name).join(", ");
  
  const cartEntryId = `${currentModalItem.id}_${selectedSize}_${selectedAddons.map(a=>a.name).sort().join('_')}`;

  const displayName = currentModalItem.category.toLowerCase().includes("pizza") || currentModalItem.hasSizes
    ? `${currentModalItem.name} (${selectedSize.toUpperCase()})${addonsSummary ? ' + ' + addonsSummary : ''}`
    : currentModalItem.name;

  const existing = cart.find(c => c.cartEntryId === cartEntryId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      cartEntryId,
      id: currentModalItem.id,
      name: displayName,
      price: finalItemPrice,
      image: currentModalItem.image,
      qty: 1
    });
  }

  saveCart();
  updateCartUI();
  closeItemModal();
  showToast(`${displayName} cart me add ho gaya! 🍕`);
}

function closeItemModal() {
  document.getElementById("item-details-modal").classList.add("hidden");
}

function updateItemQty(cartEntryId, delta) {
  const index = cart.findIndex(c => c.cartEntryId === cartEntryId || c.id === cartEntryId);
  if (index === -1) return;

  cart[index].qty += delta;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }

  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem("slice_pizza_cart_v5", JSON.stringify(cart));
}

function loadCartFromStorage() {
  const saved = localStorage.getItem("slice_pizza_cart_v5");
  if (saved) {
    try { cart = JSON.parse(saved); } catch(e) { cart = []; }
  }
}

function updateCartUI() {
  const totalCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

  const navBadge = document.getElementById("nav-cart-badge");
  if (navBadge) navBadge.innerText = totalCount;

  const container = document.getElementById("cart-items-container");
  const subtotalEl = document.getElementById("cart-subtotal");
  const totalEl = document.getElementById("cart-total-amount");
  const subtitleEl = document.getElementById("cart-subtitle");

  if (subtotalEl) subtotalEl.innerText = totalPrice;
  if (totalEl) totalEl.innerText = totalPrice;
  if (subtitleEl) subtitleEl.innerText = `${totalCount} items added`;

  if (container) {
    if (cart.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12">
          <i class="fa-solid fa-cart-shopping text-gray-300 text-4xl mb-3"></i>
          <p class="text-sm font-bold text-gray-600">Aapka Cart Khali Hai</p>
          <p class="text-xs text-gray-400 mt-1">Menu se apne manpasand items add karein</p>
        </div>
      `;
    } else {
      container.innerHTML = cart.map(item => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
          <div class="flex items-center gap-3">
            <img src="${item.image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600'}" class="w-12 h-12 rounded-xl object-cover" alt="${item.name}">
            <div>
              <h4 class="text-xs font-bold text-gray-900 leading-tight">${item.name}</h4>
              <p class="text-xs text-gray-500 font-semibold">₹${item.price} × ${item.qty} = <span class="text-red-600 font-bold">₹${item.price * item.qty}</span></p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="updateItemQty('${item.cartEntryId || item.id}', -1)" class="w-6 h-6 rounded-full bg-white text-gray-700 shadow-sm flex items-center justify-center hover:bg-red-600 hover:text-white transition text-xs font-bold">-</button>
            <span class="font-bold text-xs text-gray-900">${item.qty}</span>
            <button onclick="updateItemQty('${item.cartEntryId || item.id}', 1)" class="w-6 h-6 rounded-full bg-white text-gray-700 shadow-sm flex items-center justify-center hover:bg-red-600 hover:text-white transition text-xs font-bold">+</button>
          </div>
        </div>
      `).join("");
    }
  }
}

function toggleCartModal(show) {
  const modal = document.getElementById("cart-modal");
  if (!modal) return;
  if (show) modal.classList.remove("hidden");
  else modal.classList.add("hidden");
}

function handleOrderTypeChange(val) {
  const label = document.getElementById("address-label");
  const textarea = document.getElementById("cust-address");
  const locBtn = document.getElementById("get-location-btn");

  if (val === "Dine-in") {
    label.innerText = "Table Number *";
    textarea.placeholder = "Table No. 1, 2, 3...";
    if (locBtn) locBtn.classList.add("hidden");
  } else if (val === "Takeaway") {
    label.innerText = "Pickup Instructions / Notes";
    textarea.placeholder = "Parcel time, extra oregano etc...";
    if (locBtn) locBtn.classList.add("hidden");
  } else {
    label.innerText = "Delivery Address *";
    textarea.placeholder = "House no, Building, Street, Landmark...";
    if (locBtn) locBtn.classList.remove("hidden");
  }
}

function fetchCurrentLiveLocation() {
  const statusEl = document.getElementById("location-status-text");
  if (!navigator.geolocation) {
    alert("Geolocation browser me support nahi karta.");
    return;
  }

  statusEl.innerText = "Fetching GPS coordinates... 📍";
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
      detectedUserLocation = mapsUrl;
      statusEl.innerHTML = `<span class="text-green-600 font-bold">✅ Live GPS Captured! (WhatsApp par exact maps link attach ho jayega)</span>`;
      showToast("Live Location Captured! 📍");
    },
    (err) => {
      statusEl.innerHTML = `<span class="text-amber-600 font-bold">⚠️ GPS allow nahi hua. Aap WhatsApp chat par direct live location share kar sakte hain.</span>`;
    }
  );
}

async function handlePlaceOrder(e) {
  e.preventDefault();
  if (cart.length === 0) {
    alert("Cart empty hai!");
    return;
  }

  siteConfig = await fetchCloudConfig();

  const name = document.getElementById("cust-name").value.trim();
  const phone = document.getElementById("cust-phone").value.trim();
  const orderType = document.getElementById("cust-order-type").value;
  const paymentMethod = document.getElementById("cust-payment-type").value;
  const address = document.getElementById("cust-address").value.trim();
  const total = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

  const orderId = "ORD" + Math.floor(100000 + Math.random() * 900000);
  lastGeneratedOrderId = orderId;

  const newOrder = {
    id: orderId,
    name,
    phone,
    orderType,
    paymentMethod,
    address,
    location: detectedUserLocation || "",
    total,
    status: "Received",
    date: new Date().toLocaleString(),
    cart: [...cart],
    itemsSummary: cart.map(i => `${i.name} (${i.qty})`).join(", ")
  };

  await postNewOrderToCloud(newOrder);

  localStorage.setItem("slice_last_order_phone", phone);

  let msg = `🍕 *NEW ORDER #${orderId} - ${(siteConfig.shopName || 'SLICE PIZZA & CAFE').toUpperCase()}* 🍕\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🆔 *Order ID:* #${orderId}\n`;
  msg += `👤 *Customer:* ${name}\n`;
  msg += `📞 *Phone:* ${phone}\n`;
  msg += `🛵 *Type:* ${orderType}\n`;
  msg += `📍 *Address/Table:* ${address}\n`;
  if (detectedUserLocation) {
    msg += `🗺️ *Live GPS Map:* ${detectedUserLocation}\n`;
  }
  msg += `💳 *Payment:* ${paymentMethod}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📋 *ORDER ITEMS:*
`;

  cart.forEach((item, idx) => {
    msg += `${idx + 1}. ${item.name}\n   ↳ ${item.qty} × ₹${item.price} = *₹${item.price * item.qty}*\n`;
  });

  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `💰 *TOTAL AMOUNT: ₹${total}*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  if (paymentMethod === "UPI / QR Code Scan") {
    msg += `📲 *Payment Note:* Payment screenshot attached with this message.\n`;
  }
  msg += `_Order placed directly via website._`;

  pendingWhatsAppMessage = msg;

  if (paymentMethod === "UPI / QR Code Scan") {
    openUpiModal(total);
  } else {
    completeOrderProcess(msg, newOrder);
  }
}

function openUpiModal(amount) {
  siteConfig = getSiteConfig();
  const modal = document.getElementById("upi-modal");
  const amountDisplay = document.getElementById("upi-amount-display");
  const qrImg = document.getElementById("upi-qr-image");
  const upiIdDisplay = document.getElementById("upi-id-display");
  
  const upiId = siteConfig.upiId || "7256804904@upi";
  amountDisplay.innerText = amount;
  if (upiIdDisplay) upiIdDisplay.innerText = `UPI ID: ${upiId}`;

  if (siteConfig.customQrUrl && siteConfig.customQrUrl.trim() !== "") {
    qrImg.src = siteConfig.customQrUrl;
  } else {
    const upiString = `upi://pay?pa=${upiId}&pn=SlicePizzaCafe&am=${amount}&cu=INR`;
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiString)}`;
  }
  
  modal.classList.remove("hidden");
}

function closeUpiModal() {
  document.getElementById("upi-modal").classList.add("hidden");
}

function proceedToWhatsAppAfterPayment() {
  closeUpiModal();
  const existingOrders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "[]");
  const found = existingOrders.find(o => o.id === lastGeneratedOrderId);
  completeOrderProcess(pendingWhatsAppMessage, found);
}

function completeOrderProcess(message, orderObj) {
  const cleanPhone = (siteConfig.phone || "7256804904").replace(/[^0-9]/g, '');
  const targetPhone = cleanPhone.startsWith("91") ? cleanPhone : "91" + cleanPhone;
  const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");

  if (orderObj) {
    showInvoiceModal(orderObj);
  }

  cart = [];
  saveCart();
  updateCartUI();
  renderMenu();
  toggleCartModal(false);
  showToast("Order Placed! Kitchen notified 🚀");
}

function showInvoiceModal(order) {
  const modal = document.getElementById("invoice-modal");
  const placeholder = document.getElementById("invoice-content-placeholder");
  if (!modal || !placeholder) return;

  placeholder.innerHTML = `
    <div class="text-center pb-3 border-b border-dashed border-gray-300">
      <h3 class="text-2xl font-black text-gray-900">🍕 ${siteConfig.shopName || 'Slice Pizza & Cafe'}</h3>
      <p class="text-xs text-gray-500">Official Kitchen Order Invoice</p>
      <span class="inline-block mt-2 px-3 py-1 bg-red-100 text-red-700 text-xs font-black rounded-full">Order ID: #${order.id}</span>
    </div>

    <div class="text-xs space-y-1 py-2 border-b border-dashed border-gray-300 text-gray-700">
      <div class="flex justify-between"><span>Customer:</span> <strong>${order.name}</strong></div>
      <div class="flex justify-between"><span>Phone:</span> <strong>${order.phone}</strong></div>
      <div class="flex justify-between"><span>Type:</span> <strong>${order.orderType}</strong></div>
      <div class="flex justify-between"><span>Address:</span> <span>${order.address}</span></div>
      ${order.location ? `<div class="flex justify-between"><span>GPS Map:</span> <a href="${order.location}" target="_blank" class="text-blue-600 underline font-bold">Open GPS</a></div>` : ''}
      <div class="flex justify-between"><span>Payment:</span> <strong>${order.paymentMethod}</strong></div>
      <div class="flex justify-between"><span>Date:</span> <span>${order.date}</span></div>
    </div>

    <div class="space-y-2 py-2 text-xs">
      <p class="font-bold text-gray-800">ITEMS ORDERED:</p>
      ${order.cart.map(item => `
        <div class="flex justify-between text-gray-700">
          <span>${item.name} x ${item.qty}</span>
          <span class="font-bold">₹${item.price * item.qty}</span>
        </div>
      `).join("")}
    </div>

    <div class="pt-2 border-t-2 border-dashed border-gray-300 flex justify-between items-center text-base font-black text-gray-900">
      <span>GRAND TOTAL</span>
      <span class="text-red-600 text-lg">₹${order.total}</span>
    </div>

    <div class="text-center pt-2 text-[11px] text-gray-400">
      Track status on <a href="track.html" class="text-red-600 underline font-bold">Track Order</a> page.
    </div>
  `;

  modal.classList.remove("hidden");
}

function closeInvoiceModal() {
  document.getElementById("invoice-modal").classList.add("hidden");
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toast-msg");
  if (!toast) return;

  toastMsg.innerText = msg;
  toast.classList.remove("translate-y-20", "opacity-0");
  setTimeout(() => {
    toast.classList.add("translate-y-20", "opacity-0");
  }, 3000);
}