// Slice Pizza & Cafe - Frontend & WhatsApp Ordering Logic (V3)
let siteConfig = {};
let cart = [];
let activeCategory = "All";
let searchQuery = "";
let currentSlideIndex = 0;
let slideInterval = null;
let pendingWhatsAppMessage = "";
let lastGeneratedOrderId = "";

document.addEventListener("DOMContentLoaded", () => {
  siteConfig = getSiteConfig();
  renderAnnouncement();
  applySocialAndBrandLinks();
  initHeroSlider();
  renderCategories();
  renderMenu();
  loadCartFromStorage();
  updateCartUI();
});

function renderAnnouncement() {
  const bar = document.getElementById("announcement-bar");
  const topPhone = document.getElementById("top-phone-display");
  if (bar && siteConfig.announcement) {
    bar.querySelector("span:first-child").innerText = siteConfig.announcement;
  }
  if (topPhone) {
    topPhone.innerHTML = `<i class="fa-solid fa-phone mr-1"></i> Call / WhatsApp: +${siteConfig.phone || '917667610195'}`;
  }
}

function applySocialAndBrandLinks() {
  const navInsta = document.getElementById("nav-instagram-link");
  const footerInsta = document.getElementById("footer-instagram-link");
  const footerWa = document.getElementById("footer-whatsapp-link");
  const footerPhone = document.getElementById("footer-phone-display");

  if (navInsta) navInsta.href = siteConfig.instagramUrl || "https://instagram.com/";
  if (footerInsta) footerInsta.href = siteConfig.instagramUrl || "https://instagram.com/";
  if (footerWa) footerWa.href = `https://wa.me/${siteConfig.phone || '917667610195'}`;
  if (footerPhone) footerPhone.innerText = `+${siteConfig.phone || '917667610195'}`;
}

// ---------------- HERO AUTO SLIDER ----------------
function initHeroSlider() {
  const track = document.getElementById("hero-slider-track");
  const dotsContainer = document.getElementById("slider-dots");
  if (!track || !siteConfig.banners || siteConfig.banners.length === 0) return;

  track.innerHTML = siteConfig.banners.map((b, idx) => `
    <div class="hero-slide absolute inset-0 transition-opacity duration-1000 flex items-center ${idx === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'}" data-slide="${idx}">
      <img src="${b.image}" class="absolute inset-0 w-full h-full object-cover brightness-50" alt="${b.title}">
      <div class="relative z-10 max-w-2xl px-6 sm:px-12 md:px-16 text-white space-y-4">
        <span class="inline-block px-3 py-1 bg-red-600 text-white rounded-full text-xs font-black tracking-wider uppercase">${b.badge || 'Featured'}</span>
        <h2 class="text-2xl sm:text-4xl md:text-5xl font-black leading-tight drop-shadow-md">${b.title}</h2>
        <p class="text-xs sm:text-base text-gray-200 line-clamp-2 max-w-lg">${b.subtitle || ''}</p>
        <div class="pt-2">
          <a href="#menu-section" class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-amber-500 hover:scale-105 transition rounded-full font-bold text-xs sm:text-sm text-white shadow-xl">
            <i class="fa-solid fa-utensils"></i> Order This Now
          </a>
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

function nextSlide() {
  showSlide(currentSlideIndex + 1);
  startAutoSlide();
}

function prevSlide() {
  showSlide(currentSlideIndex - 1);
  startAutoSlide();
}

function goToSlide(idx) {
  showSlide(idx);
  startAutoSlide();
}

// ---------------- MENU & CATEGORIES ----------------
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

  let filtered = siteConfig.menu.filter(item => {
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
    const cartItem = cart.find(c => c.id === item.id);
    const qty = cartItem ? cartItem.qty : 0;
    const isOut = item.inStock === false;

    return `
      <div class="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group ${isOut ? 'opacity-60 grayscale' : ''}">
        
        <!-- Image Click opens Detail Modal + Related Items -->
        <div onclick="openItemDetails('${item.id}')" class="relative overflow-hidden h-48 bg-gray-100 cursor-pointer">
          <img src="${item.image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600'}" 
               alt="${item.name}" 
               class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          
          <div class="absolute top-3 left-3 flex flex-wrap gap-1">
            <span class="px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[10px] font-extrabold text-gray-800 uppercase tracking-wider shadow-sm">
              ${item.category}
            </span>
          </div>

          <div class="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md text-white rounded-lg text-[10px] font-bold">
            <i class="fa-solid fa-eye mr-1"></i> View Details
          </div>

          ${isOut ? `<div class="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-extrabold text-xs tracking-wider uppercase">Sold Out</div>` : ''}
        </div>

        <div class="p-5 flex-1 flex flex-col justify-between">
          <div onclick="openItemDetails('${item.id}')" class="cursor-pointer">
            <h3 class="font-bold text-gray-900 text-base group-hover:text-red-600 transition-colors">${item.name}</h3>
            <p class="text-gray-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">${item.desc || 'Freshly prepared on order with authentic recipe.'}</p>
          </div>

          <div class="pt-4 mt-2 border-t border-gray-50 flex items-center justify-between">
            <div>
              <span class="text-xs text-gray-400 font-semibold block">Price</span>
              <span class="text-xl font-black text-gray-950">₹${item.price}</span>
            </div>

            ${isOut ? `
              <span class="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl">Out of Stock</span>
            ` : qty > 0 ? `
              <div class="flex items-center gap-2 bg-red-50 border border-red-200 rounded-full p-1">
                <button onclick="updateItemQty('${item.id}', -1)" class="w-7 h-7 rounded-full bg-white text-red-600 font-black shadow-sm flex items-center justify-center hover:bg-red-600 hover:text-white transition">
                  <i class="fa-solid fa-minus text-xs"></i>
                </button>
                <span class="font-bold text-sm text-red-700 px-1">${qty}</span>
                <button onclick="updateItemQty('${item.id}', 1)" class="w-7 h-7 rounded-full bg-red-600 text-white font-black shadow-sm flex items-center justify-center hover:bg-red-700 transition">
                  <i class="fa-solid fa-plus text-xs"></i>
                </button>
              </div>
            ` : `
              <button onclick="addToCart('${item.id}')" class="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-600 text-red-600 hover:text-white font-bold text-xs transition flex items-center gap-1.5">
                <i class="fa-solid fa-plus text-[10px]"></i> Add
              </button>
            `}
          </div>

        </div>

      </div>
    `;
  }).join("");
}

// ---------------- ITEM DETAIL MODAL + RELATED ITEMS RECOMMENDER ----------------
function openItemDetails(id) {
  const item = siteConfig.menu.find(i => i.id === id);
  if (!item) return;

  const viewContainer = document.getElementById("selected-item-view");
  const relatedGrid = document.getElementById("related-items-grid");
  const modal = document.getElementById("item-details-modal");

  viewContainer.innerHTML = `
    <div class="grid sm:grid-cols-2 gap-6 items-center">
      <img src="${item.image}" class="w-full h-56 object-cover rounded-2xl shadow-md" alt="${item.name}">
      <div class="space-y-3">
        <span class="px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full">${item.category}</span>
        <h3 class="text-2xl font-black text-gray-900">${item.name}</h3>
        <p class="text-sm text-gray-600">${item.desc || 'Prepared freshly with 100% genuine ingredients and fresh handmade dough.'}</p>
        <div class="text-2xl font-black text-red-600 pt-1">₹${item.price}</div>
        <button onclick="addToCart('${item.id}'); closeItemModal();" class="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition">
          🛒 Add to Cart Now
        </button>
      </div>
    </div>
  `;

  // Find related items (Same category or popular sides)
  const related = siteConfig.menu.filter(i => i.id !== id && (i.category === item.category || i.category === "Snacks & Sides" || i.category === "Cafe & Shakes")).slice(0, 4);

  relatedGrid.innerHTML = related.map(rel => `
    <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
      <img src="${rel.image}" class="w-14 h-14 object-cover rounded-xl" alt="${rel.name}">
      <div class="flex-1">
        <h5 class="text-xs font-bold text-gray-900 leading-tight">${rel.name}</h5>
        <p class="text-xs text-red-600 font-extrabold">₹${rel.price}</p>
      </div>
      <button onclick="addToCart('${rel.id}')" class="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700">
        + Add
      </button>
    </div>
  `).join("");

  modal.classList.remove("hidden");
}

function closeItemModal() {
  document.getElementById("item-details-modal").classList.add("hidden");
}

// ---------------- CART SYSTEM ----------------
function addToCart(id) {
  const item = siteConfig.menu.find(i => i.id === id);
  if (!item || item.inStock === false) return;

  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }

  saveCart();
  updateCartUI();
  renderMenu();
  showToast(`${item.name} cart me add ho gaya! 🍕`);
}

function updateItemQty(id, delta) {
  const index = cart.findIndex(c => c.id === id);
  if (index === -1) return;

  cart[index].qty += delta;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }

  saveCart();
  updateCartUI();
  renderMenu();
}

function saveCart() {
  localStorage.setItem("slice_pizza_cart", JSON.stringify(cart));
}

function loadCartFromStorage() {
  const saved = localStorage.getItem("slice_pizza_cart");
  if (saved) {
    try { cart = JSON.parse(saved); } catch (e) { cart = []; }
  }
}

function updateCartUI() {
  const totalCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

  const navBadge = document.getElementById("nav-cart-badge");
  const mobileBadge = document.getElementById("mobile-cart-badge");
  const mobileTotal = document.getElementById("mobile-cart-total");
  const mobileFloating = document.getElementById("mobile-floating-cart");

  if (navBadge) navBadge.innerText = totalCount;
  if (mobileBadge) mobileBadge.innerText = totalCount;
  if (mobileTotal) mobileTotal.innerText = totalPrice;

  if (mobileFloating) {
    if (totalCount > 0) mobileFloating.classList.remove("hidden");
    else mobileFloating.classList.add("hidden");
  }

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
              <h4 class="text-sm font-bold text-gray-900 leading-tight">${item.name}</h4>
              <p class="text-xs text-gray-500 font-semibold">₹${item.price} × ${item.qty} = <span class="text-red-600 font-bold">₹${item.price * item.qty}</span></p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="updateItemQty('${item.id}', -1)" class="w-6 h-6 rounded-full bg-white text-gray-700 shadow-sm flex items-center justify-center hover:bg-red-600 hover:text-white transition text-xs font-bold">-</button>
            <span class="font-bold text-xs text-gray-900">${item.qty}</span>
            <button onclick="updateItemQty('${item.id}', 1)" class="w-6 h-6 rounded-full bg-white text-gray-700 shadow-sm flex items-center justify-center hover:bg-red-600 hover:text-white transition text-xs font-bold">+</button>
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
  if (val === "Dine-in") {
    label.innerText = "Table Number *";
    textarea.placeholder = "Table No. 1, 2, 3...";
  } else if (val === "Takeaway") {
    label.innerText = "Pickup Instructions / Notes";
    textarea.placeholder = "Parcel time, no onions, extra oregano etc...";
  } else {
    label.innerText = "Delivery Address *";
    textarea.placeholder = "House no, Building, Street, Landmark...";
  }
}

// ---------------- PLACE ORDER, RECORD TO ADMIN QUEUE & DISPATCH ----------------
function handlePlaceOrder(e) {
  e.preventDefault();
  if (cart.length === 0) {
    alert("Pehle cart me items add karein!");
    return;
  }

  const name = document.getElementById("cust-name").value.trim();
  const phone = document.getElementById("cust-phone").value.trim();
  const orderType = document.getElementById("cust-order-type").value;
  const paymentMethod = document.getElementById("cust-payment-type").value;
  const address = document.getElementById("cust-address").value.trim();
  const email = document.getElementById("cust-email").value.trim();
  const total = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

  const orderId = "ORD" + Math.floor(100000 + Math.random() * 900000);
  lastGeneratedOrderId = orderId;

  // Save to Master Orders List (For Admin and Track page)
  const newOrder = {
    id: orderId,
    name,
    phone,
    orderType,
    paymentMethod,
    address,
    email,
    total,
    status: "Received", // Status flow: Received -> Preparing -> Out for Delivery -> Delivered
    date: new Date().toLocaleString(),
    cart: [...cart],
    itemsSummary: cart.map(i => `${i.name} (${i.qty})`).join(", ")
  };

  const existingOrders = getAllOrders();
  existingOrders.unshift(newOrder);
  saveOrdersList(existingOrders);

  // Store phone for auto track
  localStorage.setItem("slice_last_order_phone", phone);

  // WhatsApp Message
  let msg = `🍕 *NEW ORDER #${orderId} - ${siteConfig.shopName.toUpperCase()}* 🍕\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🆔 *Order ID:* #${orderId}\n`;
  msg += `👤 *Customer:* ${name}\n`;
  msg += `📞 *Phone:* ${phone}\n`;
  msg += `🛵 *Type:* ${orderType}\n`;
  msg += `📍 *Address/Table:* ${address}\n`;
  msg += `💳 *Payment:* ${paymentMethod}\n`;
  if (email) msg += `✉️ *Email:* ${email}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📋 *ORDER ITEMS:*
`;

  cart.forEach((item, idx) => {
    msg += `${idx + 1}. ${item.name}\n   ↳ ${item.qty} × ₹${item.price} = *₹${item.price * item.qty}*\n`;
  });

  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `💰 *TOTAL AMOUNT: ₹${total}*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📍 Live Tracking Link: https://wa.me/${siteConfig.phone || '917667610195'}\n`;
  msg += `_Order placed directly via website._`;

  pendingWhatsAppMessage = msg;

  if (paymentMethod === "UPI / QR Code Scan") {
    openUpiModal(total);
  } else {
    completeOrderProcess(msg, newOrder);
  }
}

function openUpiModal(amount) {
  const modal = document.getElementById("upi-modal");
  const amountDisplay = document.getElementById("upi-amount-display");
  const qrImg = document.getElementById("upi-qr-image");
  const upiIdDisplay = document.getElementById("upi-id-display");
  
  const upiId = siteConfig.upiId || "7667610195@upi";
  amountDisplay.innerText = amount;
  if (upiIdDisplay) upiIdDisplay.innerText = `UPI ID: ${upiId}`;

  // If custom QR is provided in admin settings, use it, else generate dynamically
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
  const existingOrders = getAllOrders();
  const found = existingOrders.find(o => o.id === lastGeneratedOrderId);
  completeOrderProcess(pendingWhatsAppMessage + `\n✅ *Payment Status:* Paid Online via UPI QR`, found);
}

function completeOrderProcess(message, orderObj) {
  const targetPhone = siteConfig.phone || "917667610195";
  const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");

  // Show Invoice Bill to customer
  if (orderObj) {
    showInvoiceModal(orderObj);
  }

  cart = [];
  saveCart();
  updateCartUI();
  renderMenu();
  toggleCartModal(false);
  showToast("Order Placed Successfully! Kitchen notified 🚀");
}

function showInvoiceModal(order) {
  const modal = document.getElementById("invoice-modal");
  const placeholder = document.getElementById("invoice-content-placeholder");
  if (!modal || !placeholder) return;

  placeholder.innerHTML = `
    <div class="text-center pb-3 border-b border-dashed border-gray-300">
      <h3 class="text-2xl font-black text-gray-900">🍕 ${siteConfig.shopName}</h3>
      <p class="text-xs text-gray-500">Official Kitchen Order Invoice</p>
      <span class="inline-block mt-2 px-3 py-1 bg-red-100 text-red-700 text-xs font-black rounded-full">Order ID: #${order.id}</span>
    </div>

    <div class="text-xs space-y-1 py-2 border-b border-dashed border-gray-300 text-gray-700">
      <div class="flex justify-between"><span>Customer:</span> <strong>${order.name}</strong></div>
      <div class="flex justify-between"><span>Phone:</span> <strong>${order.phone}</strong></div>
      <div class="flex justify-between"><span>Type:</span> <strong>${order.orderType}</strong></div>
      <div class="flex justify-between"><span>Address:</span> <span>${order.address}</span></div>
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
      Aap is order ka live status <a href="track.html" class="text-red-600 underline font-bold">Track Order</a> page par dekh sakte hain.
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
