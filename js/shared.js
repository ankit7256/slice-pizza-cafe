const CONFIG_STORAGE_KEY = "slice_site_config_v7";
const ORDERS_STORAGE_KEY = "slice_orders_list_v7";
const CLOUD_SYNC_URL = "https://slice-pizza-default-rtdb.firebaseio.com";

const DEFAULT_STORE_CONFIG = {
  shopName: "Slice Pizza & Cafe",
  phone: "7256804904",
  announcement: "🔥 Freshly Baked Hand-Tossed Pizzas & Cafe Specials! Free Delivery on all local orders!",
  upiId: "7256804904@upi",
  customQrUrl: "",
  instagramUrl: "https://instagram.com/",
  categories: ["Veg Pizza", "Non-Veg Pizza", "Burgers", "Cafe & Shakes", "Snacks & Sides"],
  banners: [
    {
      id: "b1",
      badge: "Gourmet Specialty 🍕",
      title: "Wood-Fired Crust & Melted Mozzarella",
      subtitle: "Authentic hand-tossed base with secret Italian herb tomato gravy.",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&auto=format&fit=crop&q=80",
      targetItemId: "1"
    },
    {
      id: "b2",
      badge: "Cafe Special ☕",
      title: "Thick Cold Coffee & Chocolate Shakes",
      subtitle: "Freshly brewed Arabica espresso blended with premium cream & ice cream.",
      image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=1200&auto=format&fit=crop&q=80",
      targetItemId: "5"
    },
    {
      id: "b3",
      badge: "Juicy Bites 🍔",
      title: "Crisp Double Patty Maharaja Burgers",
      subtitle: "Layered with English cheddar, fresh lettuce & house secret cocktail sauce.",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&auto=format&fit=crop&q=80",
      targetItemId: "4"
    }
  ],
  menu: [
    {
      id: "1",
      name: "Classic Margherita Pizza",
      category: "Veg Pizza",
      price: 149,
      prices: { regular: 149, medium: 249, large: 399 },
      hasSizes: true,
      image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80",
      desc: "Fresh basil, 100% mozzarella cheese & rich herb tomato sauce.",
      inStock: true
    },
    {
      id: "2",
      name: "Farmhouse Deluxe Pizza",
      category: "Veg Pizza",
      price: 269,
      prices: { regular: 269, medium: 399, large: 549 },
      hasSizes: true,
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
      desc: "Crisp capsicum, sweet corn, mushroom, onion & extra cheese.",
      inStock: true
    },
    {
      id: "3",
      name: "Paneer Makhani Cheese Burst",
      category: "Veg Pizza",
      price: 299,
      prices: { regular: 299, medium: 449, large: 599 },
      hasSizes: true,
      image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&auto=format&fit=crop&q=80",
      desc: "Tandoori paneer cubes, spicy makhani gravy base & melted cheese.",
      inStock: true
    },
    {
      id: "4",
      name: "Crispy Veg Maharaja Burger",
      category: "Burgers",
      price: 119,
      hasSizes: false,
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
      desc: "Double patty, melted cheese slice, lettuce, tomato & cafe mayo.",
      inStock: true
    },
    {
      id: "5",
      name: "Cold Coffee with Ice Cream",
      category: "Cafe & Shakes",
      price: 120,
      hasSizes: false,
      image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80",
      desc: "Thick brewed espresso blended with vanilla ice cream and chocolate drizzle.",
      inStock: true
    }
  ]
};

async function hashSHA256(text) {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function fetchCloudConfig() {
  try {
    const res = await fetch(`${CLOUD_SYNC_URL}/storeConfig.json`);
    if (res.ok) {
      const data = await res.json();
      if (data) {
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch (e) {}
  const local = localStorage.getItem(CONFIG_STORAGE_KEY);
  return local ? JSON.parse(local) : DEFAULT_STORE_CONFIG;
}

async function saveCloudConfig(config) {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  try {
    const bc = new BroadcastChannel("slice_sync_v7");
    bc.postMessage({ type: "CONFIG_UPDATED", config });
  } catch (e) {}
  try {
    await fetch(`${CLOUD_SYNC_URL}/storeConfig.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });
  } catch (e) {}
}

async function fetchCloudOrders() {
  try {
    const res = await fetch(`${CLOUD_SYNC_URL}/orders.json`);
    if (res.ok) {
      const data = await res.json();
      if (data) {
        const orderArr = Object.keys(data).map(k => ({ ...data[k], firebaseUrlKey: k }));
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orderArr));
        return orderArr.reverse();
      }
    }
  } catch (e) {}
  const local = localStorage.getItem(ORDERS_STORAGE_KEY);
  return local ? JSON.parse(local) : [];
}

async function postNewOrderToCloud(order) {
  const localOrders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "[]");
  localOrders.unshift(order);
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(localOrders));

  try {
    const bc = new BroadcastChannel("slice_sync_v7");
    bc.postMessage({ type: "ORDER_PLACED", order });
  } catch (e) {}

  try {
    await fetch(`${CLOUD_SYNC_URL}/orders.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });
  } catch (e) {}
}

async function updateCloudOrderStatus(orderKey, newStatus) {
  try {
    if (orderKey) {
      await fetch(`${CLOUD_SYNC_URL}/orders/${orderKey}/status.json`, {
        method: "PUT",
        body: JSON.stringify(newStatus)
      });
    }
  } catch (e) {}
}

function playKitchenChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.frequency.setValueAtTime(880, now + 0.18);
    gain2.gain.setValueAtTime(0.5, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 1.0);
  } catch (e) {}
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}