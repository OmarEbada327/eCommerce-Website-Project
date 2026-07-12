// Base URL configuration for communicating with the backend API
const API_BASE = "http://localhost:3000";

// Short helper utility to target and retrieve DOM elements by their unique IDs
const $ = (id) => document.getElementById(id);

// Global application state holders for catalog products, cart details, and active filters
let allProducts = [];
let cartData = { products: [] };
let activeCategory = "";
let searchQuery = "";

// Displays temporary popup notifications on screen for feedback notifications
function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

// Formats numerical price numbers into a standardized EGP currency string display format
function money(n) {
  return "EGP " + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 });
}

// Extracts data payload blocks safely regardless of the custom server response wrapper format
function unwrap(payload) {
  return payload && payload.data !== undefined ? payload.data : payload;
}

// Generates dynamic HTML components representing visual inventory levels using status ticks
function stockTicksHTML(qty) {
  const level = qty <= 5 ? 1 : qty <= 20 ? 3 : 5;
  const cls = qty <= 5 ? "low" : "ok";
  let ticks = "";
  for (let i = 0; i < 5; i++) {
    ticks += `<span class="tick ${i < level ? "on " + cls : ""}"></span>`;
  }
  return `<div class="stock-row"><div class="ticks">${ticks}</div><span class="stock-label">${qty} in stock</span></div>`;
}

// Toggles navigation actions and displays personalized greetings based on authorization data states
function updateAuthUI() {
  const loggedIn = isLoggedIn();
  const user = getUser();

  $("guestActions").style.display = loggedIn ? "none" : "flex";
  $("userActions").style.display = loggedIn ? "flex" : "none";

  if (loggedIn && user) {
    $("userGreeting").textContent = `Hi, ${user.name}`;
    $("adminLink").style.display = user.role === "admins" ? "inline-block" : "none";
  }
}

// Handles user session termination, purges memory cart states, and refreshes the layout UI panels
$("signOutBtn").addEventListener("click", () => {
  clearSession();
  cartData = { products: [] };
  updateCartUI();
  updateAuthUI();
  showToast("Signed out");
});

// Updates the footer status display element indicator to display the live state of backend connectivity
async function checkApiStatus(reachable) {
  const el = $("apiStatus");
  if (reachable) {
    el.textContent = "online";
    el.className = "online";
  } else {
    el.textContent = "offline";
    el.className = "offline";
  }
}

// Asynchronously fetches available inventory listings from the backend service layer
async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.message || "Failed to load products");

    allProducts = unwrap(payload);
    checkApiStatus(true);
    renderProducts();
  } catch (err) {
    checkApiStatus(false);
    $("productGrid").innerHTML = `<p class="empty-msg">Couldn't reach the backend. Is it running at ${API_BASE}?</p>`;
  }
}

// Handles data rendering patterns, filter evaluation pipelines, and DOM injection for catalog grids
function renderProducts() {
  let list = allProducts;

  // Filter catalog data rows if a specific navigation category option is selected
  if (activeCategory) {
    list = list.filter((p) => p.category === activeCategory);
  }
  // Filter catalog data rows dynamically based on the characters typed into search inputs
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q));
  }

  $("catalogTitle").textContent = activeCategory ? activeCategory : "All products";

  // Display empty matching fallback notices if zero inventory listings conform to constraints
  if (list.length === 0) {
    $("productGrid").innerHTML = `<p class="empty-msg">No products match.</p>`;
    return;
  }

  // Construct markup templates and inject them directly inside the catalog inner bounds
  $("productGrid").innerHTML = list.map((p) => {
    const images = (p.images && p.images.length) ? p.images : [{ url: "" }];
    const dots = images.length > 1
      ? `<div class="img-dots">${images.map((_, i) => `<span class="${i === 0 ? "active" : ""}"></span>`).join("")}</div>`
      : "";

    return `
      <div class="product-card" data-id="${p._id}">
        <div class="product-card-img">
          <img src="${images[0].url}" alt="${p.name}" data-idx="0" />
          ${dots}
        </div>
        <div class="product-card-body">
          <span class="product-card-category">${p.category}</span>
          <h3 class="product-card-title">${p.name}</h3>
          ${stockTicksHTML(p.quantity)}
          <div class="product-card-footer">
            <div class="product-card-price">${money(p.price)}<small>${p.currency || "EGP"}</small></div>
            <button class="add-to-cart-btn" data-id="${p._id}">+</button>
          </div>
        </div>
      </div>`;
  }).join("");

  // Binds click interactions to support carousels cycling across available product image panels
  document.querySelectorAll(".product-card-img img").forEach((img) => {
    img.addEventListener("click", () => {
      const card = img.closest(".product-card");
      const product = list.find((p) => p._id === card.dataset.id);
      if (!product.images || product.images.length < 2) return;
      const nextIdx = (parseInt(img.dataset.idx) + 1) % product.images.length;
      img.src = product.images[nextIdx].url;
      img.dataset.idx = nextIdx;
      card.querySelectorAll(".img-dots span").forEach((dot, i) => dot.classList.toggle("active", i === nextIdx));
    });
  });

  // Binds submission add actions across the dynamic cart button grids
  document.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
    btn.addEventListener("click", () => addToCart(btn.dataset.id));
  });
}

// Binds link components inside navigation tabs to coordinate category switching routines
document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    activeCategory = link.dataset.category;
    document.querySelectorAll(".nav-links a").forEach((l) => l.classList.remove("active"));
    link.classList.add("active");
    renderProducts();
  });
});

// Captures input strokes inside search entries to update results lists in real-time
$("searchInput").addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderProducts();
});

// Sends requests to save additions inside cart storage configurations on server instances
async function addToCart(productId) {
  if (!isLoggedIn()) {
    showToast("Sign in to add items to your cart");
    setTimeout(() => (window.location.href = "pages/auth/login.html"), 1200);
    return;
  }

  try {
    const payload = await authFetch("/cart", {
      method: "POST",
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    cartData = unwrap(payload);
    updateCartUI();
    showToast("Added to cart");
  } catch (err) {
    showToast(err.message);
  }
}

// Fetches persisted user cart details safely from connected storage api services
async function loadCart() {
  if (!isLoggedIn()) return;
  try {
    const payload = await authFetch("/cart");
    cartData = unwrap(payload) || { products: [] };
    updateCartUI();
  } catch (err) {
    cartData = { products: [] };
    updateCartUI();
  }
}

// Scans local collection states to map matching object entities according to standard query ids
function findLocalProduct(id) {
  return allProducts.find((p) => p._id === id);
}

// Redraws the layout parameters inside cart slide out layouts and computes summary totals
function updateCartUI() {
  const items = cartData.products || [];
  $("cartCount").textContent = items.reduce((sum, i) => sum + i.quantity, 0);

  if (items.length === 0) {
    $("cartItems").innerHTML = `<p class="cart-empty">Cart is empty.</p>`;
    $("cartTotal").textContent = money(0);
    return;
  }

  let total = 0;
  $("cartItems").innerHTML = items.map((item) => {
    const pid = item.productId && item.productId._id ? item.productId._id : item.productId;
    const product = (item.productId && item.productId.name) ? item.productId : findLocalProduct(pid);
    const name = product ? product.name : "Product";
    total += item.totalPrice;

    return `
      <div class="cart-line" data-pid="${pid}">
        <div class="cart-line-top"><span>${name}</span><span>${money(item.totalPrice)}</span></div>
        <div class="cart-line-qty">
          <div class="qty-stepper">
            <button class="qty-dec">-</button>
            <span>${item.quantity}</span>
            <button class="qty-inc">+</button>
          </div>
          <button class="remove-line-btn">Remove</button>
        </div>
      </div>`;
  }).join("");
  $("cartTotal").textContent = money(total);

  // Wire increment actions across line items within cart drawers
  document.querySelectorAll(".qty-inc").forEach((btn) => {
    btn.addEventListener("click", () => changeQty(btn.closest(".cart-line").dataset.pid, 1));
  });
  // Wire decrement actions across line items within cart drawers
  document.querySelectorAll(".qty-dec").forEach((btn) => {
    btn.addEventListener("click", () => changeQty(btn.closest(".cart-line").dataset.pid, -1));
  });
  // Wire delete item removal actions inside line layout nodes
  document.querySelectorAll(".remove-line-btn").forEach((btn) => {
    btn.addEventListener("click", () => removeLine(btn.closest(".cart-line").dataset.pid));
  });
}

// Requests line configuration adjustment updates for existing line elements inside cart records
async function changeQty(productId, delta) {
  const item = cartData.products.find((i) => {
    const pid = i.productId && i.productId._id ? i.productId._id : i.productId;
    return pid === productId;
  });
  const newQty = (item ? item.quantity : 0) + delta;
  if (newQty <= 0) return removeLine(productId);

  try {
    const payload = await authFetch("/cart", {
      method: "PUT",
      body: JSON.stringify({ productId, quantity: newQty }),
    });
    cartData = unwrap(payload);
    updateCartUI();
  } catch (err) {
    showToast(err.message);
  }
}

// Sends line omission command pipelines down to backend persistent state nodes
async function removeLine(productId) {
  try {
    const payload = await authFetch("/cart/" + productId, { method: "DELETE" });
    cartData = unwrap(payload);
    updateCartUI();
  } catch (err) {
    showToast(err.message);
  }
}

// Opens the sliding layout pane to render cart contents
$("cartBtn").addEventListener("click", () => {
  $("cartOverlay").classList.add("open");
  loadCart();
});
// Closes the sliding layout pane to dismiss cart visibility
$("cartClose").addEventListener("click", () => $("cartOverlay").classList.remove("open"));
// Monitors background structural bounds to support overlay backdrop dismiss options
$("cartOverlay").addEventListener("click", (e) => {
  if (e.target.id === "cartOverlay") $("cartOverlay").classList.remove("open");
});

// Validates cart balances prior to sending operations further down to final checkouts
$("checkoutBtn").addEventListener("click", () => {
  if (cartData.products.length === 0) {
    showToast("Your cart is empty");
    return;
  }
  window.location.href = "pages/checkout.html";
});

// Kickstart data ingestion tasks on compilation cycles
loadProducts();

// Verifies availability dependencies across identity scripts during setup intervals
if (typeof isLoggedIn === "function") {
  try {
    updateAuthUI();
    if (isLoggedIn()) loadCart();
  } catch (err) {
    console.error("Auth check failed:", err);
  }
} else {
  console.error("auth.js did not load — check the <script> tag and file path in index.html");
}