// Base URL configuration for communicating with the backend API

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
    const payload = await window.SiliconHouseApi.get("/products");

    allProducts = unwrap(payload);
    checkApiStatus(true);
    renderProducts();
  } catch (err) {
    checkApiStatus(false);
    $("productGrid").innerHTML = `<p class="empty-msg">Couldn't reach the backend. Is it running at ${window.SiliconHouseApi.baseUrl}?</p>`;
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
        <a class="product-card-img" href="pages/product-detail.html?id=${p._id}">
          <img src="${images[0].url}" alt="${p.name}" data-idx="0" />
          ${dots}
        </a>
        <a class="product-card-body" href="pages/product-detail.html?id=${p._id}">
          <span class="product-card-category">${p.category}</span>
          <h3 class="product-card-title">${p.name}</h3>
          ${stockTicksHTML(p.quantity)}
        </a>
        <div class="product-card-footer">
          <div class="product-card-price">${money(p.price)}<small>${p.currency || "EGP"}</small></div>
          <button class="add-to-cart-btn" data-id="${p._id}">+</button>
        </div>
      </div>`;
  }).join("");

  // Binds submission add actions across the dynamic cart button grids
  document.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      addToCart(btn.dataset.id);
    });
  });
}

// Binds link components inside navigation tabs to coordinate category switching routines
document.querySelectorAll(".category-nav a").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    activeCategory = link.dataset.category;
    document.querySelectorAll(".category-nav a").forEach((l) => l.classList.remove("active"));
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


// Keeps the header cart-count badge in sync with the server's cart state.
// Full cart contents now live on their own page (pages/cart.html).
function updateCartUI() {
  const items = cartData.products || [];
  $("cartCount").textContent = items.reduce((sum, i) => sum + i.quantity, 0);
}

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
