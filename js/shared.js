const CONFIG_KEY = "slice_site_config_v5";
const ORDERS_KEY = "slice_orders_list_v5";

const DEFAULT_SITE_CONFIG = {
  shopName: "Slice Pizza & Cafe",
  phone: "917667610195",
  announcement: "🔥 Freshly Baked Hand-Tossed Pizzas & Cafe Specials! Free Delivery on all local orders!",
  upiId: "7667610195@upi",
  customQrUrl: "",
  instagramUrl: "https://instagram.com/",
  facebookUrl: "https://facebook.com/",
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
      targetItemId: "6"
    },
    {
      id: "b3",
      badge: "Juicy Bites 🍔",
      title: "Crisp Double Patty Maharaja Burgers",
      subtitle: "Layered with English cheddar, fresh lettuce & house secret cocktail sauce.",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&auto=format&fit=crop&q=80",
      targetItemId: "5"
    },
    {
      id: "b4",
      badge: "Desi Fusion 🧀",
      title: "Tandoori Paneer & Peri Peri Specials",
      subtitle: "Smoky tandoori paneer tikka toppings loaded with spicy jalapeño bursts.",
      image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=1200&auto=format&fit=crop&q=80",
      targetItemId: "3"
    },
    {
      id: "b5",
      badge: "Sides & Dips 🥖",
      title: "Stuffed Cheesy Garlic Breadsticks",
      subtitle: "Golden baked crust infused with garlic herb butter and gooey dip.",
      image: "https://images.unsplash.com/photo-1619895092538-128341789043?w=1200&auto=format&fit=crop&q=80",
      targetItemId: "8"
    },
    {
      id: "b6",
      badge: "Chef Special 🎉",
      title: "Spicy Peri-Peri Smoked Chicken Pizza",
      subtitle: "Smoked chicken chunks, peri peri sauce, red paprika & extra cheese.",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&auto=format&fit=crop&q=80",
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
      name: "Spicy Peri-Peri Chicken Pizza",
      category: "Non-Veg Pizza",
      price: 319,
      prices: { regular: 319, medium: 469, large: 629 },
      hasSizes: true,
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80",
      desc: "Smoked chicken chunks, peri peri sauce, red paprika & jalapenos.",
      inStock: true
    },
    {
      id: "5",
      name: "Crispy Veg Maharaja Burger",
      category: "Burgers",
      price: 119,
      hasSizes: false,
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
      desc: "Double patty, melted cheese slice, lettuce, tomato & cafe mayo.",
      inStock: true
    },
    {
      id: "6",
      name: "Cold Coffee with Ice Cream",
      category: "Cafe & Shakes",
      price: 120,
      hasSizes: false,
      image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80",
      desc: "Thick brewed espresso blended with vanilla ice cream and chocolate drizzle.",
      inStock: true
    },
    {
      id: "7",
      name: "Chocolate Oreo Shake",
      category: "Cafe & Shakes",
      price: 130,
      hasSizes: false,
      image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80",
      desc: "Loaded with crushed Oreo cookies, chocolate syrup & whipped cream.",
      inStock: true
    },
    {
      id: "8",
      name: "Cheesy Garlic Breadsticks",
      category: "Snacks & Sides",
      price: 139,
      hasSizes: false,
      image: "https://images.unsplash.com/photo-1619895092538-128341789043?w=600&auto=format&fit=crop&q=80",
      desc: "Freshly baked bread with garlic butter, stuffed cheese & oregano herbs.",
      inStock: true
    }
  ],
  customers: [
    {
      id: "c1",
      name: "Rohan Verma",
      role: "Patna Resident",
      rating: 5,
      comment: "Best pizza in town! The cheese burst crust and Farmhouse toppings are always fresh and piping hot.",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
    },
    {
      id: "c2",
      name: "Pooja Singh",
      role: "Cafe Regular",
      rating: 5,
      comment: "Cold coffee with ice cream is out of this world! Perfect place for evening hangout.",
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80"
    }
  ]
};

async function hashSHA256(text) {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getSiteConfig() {
  const saved = localStorage.getItem(CONFIG_KEY);
  if (saved) {
    try {
      return { ...DEFAULT_SITE_CONFIG, ...JSON.parse(saved) };
    } catch(e) {
      return DEFAULT_SITE_CONFIG;
    }
  }
  localStorage.setItem(CONFIG_KEY, JSON.stringify(DEFAULT_SITE_CONFIG));
  return DEFAULT_SITE_CONFIG;
}

function saveSiteConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  try {
    const bc = new BroadcastChannel("slice_sync_channel_v5");
    bc.postMessage({ type: "CONFIG_UPDATED", config });
  } catch(e) {}
}

function getAllOrders() {
  const saved = localStorage.getItem(ORDERS_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch(e) { return []; }
  }
  return [];
}

function saveOrdersList(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  try {
    const bc = new BroadcastChannel("slice_sync_channel_v5");
    bc.postMessage({ type: "ORDER_PLACED", orders });
  } catch(e) {}
}

function playOrderNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.18);
    gain2.gain.setValueAtTime(0.5, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 1.0);
  } catch(e) {}
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}