// Slice Pizza & Cafe - Frontend & WhatsApp Ordering Logic
const WHATSAPP_NUMBER = "917667610195"; // Shop WhatsApp Number
const SHOP_NAME = "Slice Pizza & Cafe";

// Default Initial Menu
const DEFAULT_MENU = [
  {
    id: "1",
    name: "Classic Margherita Pizza",
    category: "Veg Pizza",
    price: 149,
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80",
    desc: "Fresh basil, 100% mozzarella cheese & rich herb tomato sauce.",
    inStock: true
  },
  {
    id: "2",
    name: "Farmhouse Deluxe Pizza",
    category: "Veg Pizza",
    price: 269,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
    desc: "Crisp capsicum, sweet corn, mushroom, onion & extra cheese.",
    inStock: true
  },
  {
    id: "3",
    name: "Paneer Makhani Cheese Burst",
    category: "Veg Pizza",
    price: 299,
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&auto=format&fit=crop&q=80",
    desc: "Tandoori paneer cubes, spicy makhani gravy base & melted cheese.",
    inStock: true
  },
  {
    id: "4",
    name: "Spicy Peri-Peri Chicken Pizza",
    category: "Non-Veg Pizza",
    price: 319,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80",
    desc: "Smoked chicken chunks, peri peri sauce, red paprika & jalapenos.",
    inStock: true
  },
  {
    id: "5",
    name: "Crispy Veg Maharaja Burger",
    category: "Burgers",
    price: 119,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
    desc: "Double patty, melted cheese slice, lettuce, tomato & cafe mayo.",
    inStock: true
  },
  {
    id: "6",
    name: "Cold Coffee with Ice Cream",
    category: "Cafe & Shakes",
    price: 120,
    image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80",
    desc: "Thick brewed espresso blended with vanilla ice cream and chocolate drizzle.",
    inStock: true
  },
  {
    id: "7",
    name: "Chocolate Oreo Shake",
    category: "Cafe & Shakes",
    price: 130,
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80",
    desc: "Loaded with crushed Oreo cookies, chocolate syrup & whipped cream.",
    inStock: true
  },
  {
    id: "8",
    name: "Cheesy Garlic Breadsticks",
    category: "Snacks & Sides",
    price: 139,
    image: "https://images.unsplash.com/photo-1619895092538-128341789043?w=600&auto=format&fit=crop&q=80",
    desc: "Freshly baked bread with garlic butter, stuffed cheese & oregano herbs.",
    inStock: true
  }
];

// State
let menuData = [];
let cart = [];
let activeCategory = "All";
let searchQuery = "";
let pendingWhatsAppMessage = "";

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadMenuData();
  renderCategories();
  renderMenu();
  loadCartFromStorage();
  updateCartUI();
});

// Load Menu from localStorage or Default
function loadMenuData() {
  const saved = localStorage.getItem("slice_pizza_menu");
  if (saved) {
    try {
      menuData = JSON.parse(saved);
    } catch (e) {
      menuData = DEFAULT_MENU;
    }
  } else {
    menuData = DEFAULT_MENU;
    localStorage.setItem("slice_pizza_menu", JSON.stringify(DEFAULT_MENU));
  }
}

// Render Categories
function renderCategories() {
  const container = document.getElementById("category-pills");
  if (!container) return;

  const categories = ["All", ...new Set(menuData.map(item => item.category))];
  
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

// Render Menu Cards
function renderMenu() {
  const grid = document.getElementById("menu-grid");
  const emptyState = document.getElementById("empty-state");
  const countDisplay = document.getElementById("items-count-display");
  if (!grid) return;

  let filtered = menuData.filter(item => {
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
        
        <!-- Image & Badges -->
        <div class="relative overflow-hidden h-48 bg-gray-100">
          <img src="${item.image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600'}" 
               alt="${item.name}" 
               class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          
          <div class="absolute top-3 left-3 flex flex-wrap gap-1">
            <span class="px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[10px] font-extrabold text-gray-800 uppercase tracking-wider shadow-sm">
              ${item.category}
            </span>
          </div>

          ${isOut ? `<div class="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-extrabold text-xs tracking-wider uppercase">Sold Out</div>` : ''}
        </div>

        <!-- Info -->
        <div class="p-5 flex-1 flex flex-col justify-between">
          <div>
            <h3 class="font-bold text-gray-900 text-base group-hover:text-red-600 transition-colors">${item.name}</h3>
            <p class="text-gray-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">${item.desc || 'Freshly prepared on order with authentic recipe.'}</p>
          </div>

          <!-- Price & Action Button -->
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

// Cart Operations
function addToCart(id) {
  const item = menuData.find(i => i.id === id);
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

  // Badge Updates
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

  // Cart Drawer Content
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

// Cart Drawer Open/Close
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

// Place Order & WhatsApp Redirect
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

  // Construct Beautiful WhatsApp Message
  let msg = `🍕 *NEW ORDER - ${SHOP_NAME.toUpperCase()}* 🍕
`;
  msg += `━━━━━━━━━━━━━━━━━━━━━
`;
  msg += `👤 *Customer:* ${name}
`;
  msg += `📞 *Phone:* ${phone}
`;
  msg += `🛵 *Type:* ${orderType}
`;
  msg += `📍 *Address/Table:* ${address}
`;
  msg += `💳 *Payment:* ${paymentMethod}
`;
  if (email) msg += `✉️ *Email:* ${email}
`;
  msg += `━━━━━━━━━━━━━━━━━━━━━
`;
  msg += `📋 *ORDER ITEMS:*
`;

  cart.forEach((item, idx) => {
    msg += `${idx + 1}. ${item.name}
   ↳ ${item.qty} × ₹${item.price} = *₹${item.price * item.qty}*
`;
  });

  msg += `━━━━━━━━━━━━━━━━━━━━━
`;
  msg += `💰 *TOTAL AMOUNT: ₹${total}*
`;
  msg += `━━━━━━━━━━━━━━━━━━━━━
`;
  msg += `⏱️ Time: ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
`;
  msg += `_Order placed directly via website._`;

  pendingWhatsAppMessage = msg;

  // If Online UPI is selected, show QR Modal first
  if (paymentMethod === "UPI / QR Code Scan") {
    openUpiModal(total);
  } else {
    sendWhatsAppNow(msg);
  }
}

function openUpiModal(amount) {
  const modal = document.getElementById("upi-modal");
  const amountDisplay = document.getElementById("upi-amount-display");
  const qrImg = document.getElementById("upi-qr-image");
  
  amountDisplay.innerText = amount;
  // Generate UPI QR (BHIM/GPay/PhonePe format)
  const upiString = `upi://pay?pa=7667610195@upi&pn=SlicePizzaCafe&am=${amount}&cu=INR`;
  qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiString)}`;
  
  modal.classList.remove("hidden");
}

function closeUpiModal() {
  document.getElementById("upi-modal").classList.add("hidden");
}

function proceedToWhatsAppAfterPayment() {
  closeUpiModal();
  sendWhatsAppNow(pendingWhatsAppMessage + `
✅ *Payment Status:* Paid Online via UPI QR`);
}

function sendWhatsAppNow(message) {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");

  // Reset Cart
  cart = [];
  saveCart();
  updateCartUI();
  renderMenu();
  toggleCartModal(false);
  showToast("Order WhatsApp par send ho gaya! 🚀");
}

// Toast
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
