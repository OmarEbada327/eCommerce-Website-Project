/* ==========================================================================
   SILICON HOUSE — Storefront Home Page
   Drives the main product catalog: fetches products from the backend,
   renders them in a responsive grid, handles real-time search and
   category filtering, and manages the cart badge count.
   ========================================================================== */

/**
 * Shorthand for document.getElementById — keeps the rest of the code terse.
 * @param {string} id
 * @returns {HTMLElement|null}
 */
const $ = (id) => document.getElementById(id);

/** @type {Array<Object>} Full product list fetched from the backend. */
let allProducts = [];

/** @type {{ products: Array<Object> }} Client-side cart snapshot for the badge. */
let cartData = { products: [] };

/** @type {string} Currently selected category slug (empty string = "All"). */
let activeCategory = "";

/** @type {string} Current search query — re-evaluated on every keystroke. */
let searchQuery = "";

// ---------------------------------------------------------------------------
// UI Helpers
// ---------------------------------------------------------------------------

/**
 * Displays a brief toast notification at the bottom of the viewport.
 * Automatically hides after 2.2 seconds.
 *
 * @param {string} message – The text to show.
 */
function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

/**
 * Formats a numeric value as an EGP currency string.
 *
 * @param {number} n – The raw price.
 * @returns {string} e.g. "EGP 24,999.00".
 */
function money(n) {
  return (
    "EGP " + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 })
  );
}

/**
 * Unwraps a response envelope — handles both `{ data: [...] }` and
 * flat array/object responses from the backend.
 *
 * @param {Object|Array} payload – The raw API response.
 * @returns {Object|Array} The meaningful data inside the envelope.
 */
function unwrap(payload) {
  return payload && payload.data !== undefined ? payload.data : payload;
}

/**
 * Builds the visual stock-level indicator: five tick marks that light up
 * green (ok) or red (low) depending on the available quantity.
 *
 * @param {number} qty – Units in stock.
 * @returns {string} HTML string for the stock-row element.
 */
function stockTicksHTML(qty) {
  const level = qty <= 5 ? 1 : qty <= 20 ? 3 : 5;
  const cls = qty <= 5 ? "low" : "ok";
  let ticks = "";
  for (let i = 0; i < 5; i++) {
    ticks += `<span class="tick ${i < level ? "on " + cls : ""}"></span>`;
  }
  return `<div class="stock-row"><div class="ticks">${ticks}</div><span class="stock-label">${qty} in stock</span></div>`;
}

// ---------------------------------------------------------------------------
// Authentication UI
// ---------------------------------------------------------------------------

/**
 * Toggles between guest and signed-in navigation states. Shows the user
 * greeting badge inline, and reveals the Admin link only for admins.
 */
function updateAuthUI() {
  const loggedIn = isLoggedIn();
  const user = getUser();

  $("guestActions").style.display = loggedIn ? "none" : "flex";
  $("userActions").style.display = loggedIn ? "flex" : "none";

  const greetingEl = $("userGreeting");
  if (loggedIn && user) {
    greetingEl.textContent = `Hi, ${user.name}`;
    greetingEl.style.display = "inline-flex";
    $("adminLink").style.display =
      user.role === "admins" ? "inline-flex" : "none";
  } else {
    greetingEl.style.display = "none";
    $("adminLink").style.display = "none";
  }
}

/** Handles sign-out: clears session, resets cart, refreshes UI. */
$("signOutBtn").addEventListener("click", () => {
  clearSession();
  cartData = { products: [] };
  updateCartUI();
  updateAuthUI();
  showToast("Signed out");
});

// ---------------------------------------------------------------------------
// API Status
// ---------------------------------------------------------------------------

/**
 * Updates the footer indicator to show whether the backend is reachable.
 *
 * @param {boolean} reachable – Whether the last API call succeeded.
 */
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

// ---------------------------------------------------------------------------
// Product Catalog
// ---------------------------------------------------------------------------

/** Fetches all products from the backend and renders the grid. */
async function loadProducts() {
  try {
    const payload = await window.SiliconHouseApi.get("/products");

    allProducts = unwrap(payload);
    checkApiStatus(true);
    renderProducts();
  } catch (err) {
    checkApiStatus(false);
    $("productGrid").innerHTML =
      `<p class="empty-msg">Couldn't reach the backend. Is it running at ${window.SiliconHouseApi.baseUrl}?</p>`;
  }
}

/**
 * Applies the active category filter and search query, then rebuilds
 * the product grid markup. This is called on every filter change.
 */
function renderProducts() {
  let list = allProducts;

  // Filter by category.
  if (activeCategory) {
    list = list.filter((p) => p.category === activeCategory);
  }
  // Filter by search query (case-insensitive, matches product name).
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q));
  }

  $("catalogTitle").textContent = activeCategory
    ? activeCategory
    : "All products";

  if (list.length === 0) {
    $("productGrid").innerHTML = `<p class="empty-msg">No products match.</p>`;
    return;
  }

  // Generate card HTML for each product.
  $("productGrid").innerHTML = list
    .map((p) => {
      const images = p.images && p.images.length ? p.images : [{ url: "" }];
      const dots =
        images.length > 1
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
    })
    .join("");

  // Attach click handlers to each "Add to cart" button.
  document.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      addToCart(btn.dataset.id);
    });
  });
}

/** Category-navigation click handler — updates the filter and re-renders. */
document.querySelectorAll(".category-nav a").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    activeCategory = link.dataset.category;
    document
      .querySelectorAll(".category-nav a")
      .forEach((l) => l.classList.remove("active"));
    link.classList.add("active");
    renderProducts();
  });
});

/** Search-input handler — filters products by name on every keystroke. */
$("searchInput").addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderProducts();
});

// ---------------------------------------------------------------------------
// Cart Operations
// ---------------------------------------------------------------------------

/**
 * Adds a single unit of a product to the cart. Redirects unauthenticated
 * users to the sign-in page.
 *
 * @param {string} productId – The product's _id.
 */
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

/** Fetches the latest cart state from the backend to keep the badge in sync. */
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

/** Updates the cart-count badge in the header. */
function updateCartUI() {
  const items = cartData.products || [];
  $("cartCount").textContent = items.reduce((sum, i) => sum + i.quantity, 0);
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

loadProducts();

// Guard against missing auth.js (e.g. a failed script load).
if (typeof isLoggedIn === "function") {
  try {
    updateAuthUI();
    if (isLoggedIn()) loadCart();
  } catch (err) {
    console.error("Auth check failed:", err);
  }
} else {
  console.error(
    "auth.js did not load — check the <script> tag and file path in index.html",
  );
}