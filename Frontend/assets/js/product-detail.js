/* ==========================================================================
   SILICON HOUSE — Product Detail Page
   Displays a single product's full information: image gallery with thumbnails,
   price, stock indicator, quantity stepper, spec sheet, and add-to-cart.
   Handles both authenticated and guest states.
   ========================================================================== */

const $ = (id) => document.getElementById(id);

/** @type {Object|null} The loaded product data. */
let product = null;

/** @type {{ products: Array<Object> }} Cart snapshot for the badge count. */
let cartData = { products: [] };

/** @type {number} Current quantity selected in the stepper. */
let selectedQty = 1;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Shows a brief toast notification.
 * @param {string} message
 */
function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

/**
 * Formats a number as EGP currency.
 * @param {number} n
 * @returns {string}
 */
function money(n) {
  return (
    "EGP " + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 })
  );
}

/**
 * Unwraps a response envelope.
 * @param {Object|Array} payload
 * @returns {Object|Array}
 */
function unwrap(payload) {
  return payload && payload.data !== undefined ? payload.data : payload;
}

/**
 * Builds the visual stock-level tick indicator.
 * @param {number} qty
 * @returns {string} HTML
 */
function stockTicksHTML(qty) {
  const level = qty <= 5 ? 1 : qty <= 20 ? 3 : 5;
  const cls = qty <= 5 ? "low" : "ok";
  let ticks = "";
  for (let i = 0; i < 5; i++) {
    ticks += `<span class="tick ${i < level ? "on " + cls : ""}"></span>`;
  }
  return `<div class="ticks">${ticks}</div><span class="stock-label">${qty} in stock</span>`;
}

/**
 * Updates the footer API status indicator.
 * @param {boolean} reachable
 */
async function checkApiStatus(reachable) {
  const el = $("apiStatus");
  el.textContent = reachable ? "online" : "offline";
  el.className = reachable ? "online" : "offline";
}

// ---------------------------------------------------------------------------
// Authentication UI
// ---------------------------------------------------------------------------

/**
 * Toggles guest vs. signed-in navigation, shows greeting and admin link.
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

$("signOutBtn").addEventListener("click", () => {
  clearSession();
  cartData = { products: [] };
  updateCartUI();
  updateAuthUI();
  showToast("Signed out");
});

// ---------------------------------------------------------------------------
// Product Loading & Rendering
// ---------------------------------------------------------------------------

/** Reads the `id` query parameter from the URL. */
function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

/** Fetches the product from the backend and renders the detail view. */
async function loadProduct() {
  const id = getProductIdFromUrl();
  if (!id) {
    showErrorState();
    return;
  }

  try {
    const payload = await window.SiliconHouseApi.get(`/products/${id}`);

    product = unwrap(payload);
    checkApiStatus(true);
    renderProduct();
  } catch (err) {
    checkApiStatus(false);
    showErrorState();
  }
}

/** Shows a generic error state when the product cannot be loaded. */
function showErrorState() {
  $("loadingState").classList.add("hidden");
  $("errorState").classList.remove("hidden");
  $("productContent").classList.add("hidden");
}

/** Populates every element on the page with the product data. */
function renderProduct() {
  const images =
    product.images && product.images.length ? product.images : [{ url: "" }];

  document.title = `${product.name} — SILICON HOUSE`;
  $("breadcrumbCategory").textContent = product.category;

  $("mainImage").src = images[0].url;
  $("mainImage").alt = product.name;

  $("pdThumbs").innerHTML = images
    .map(
      (img, i) =>
        `<img src="${img.url}" data-idx="${i}" class="${i === 0 ? "active" : ""}" alt="${product.name} ${i + 1}" />`,
    )
    .join("");

  document.querySelectorAll(".pd-thumbs img").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      $("mainImage").src = thumb.src;
      document
        .querySelectorAll(".pd-thumbs img")
        .forEach((t) => t.classList.remove("active"));
      thumb.classList.add("active");
    });
  });

  $("pdCategory").textContent = product.category;
  $("pdName").textContent = product.name;
  $("pdPrice").textContent = Number(product.price).toLocaleString("en-US");
  $("pdCurrency").textContent = product.currency || "EGP";
  $("pdStockRow").innerHTML = stockTicksHTML(product.quantity);
  $("pdDescription").textContent = product.description;

  $("specCategory").textContent = product.category;
  $("specStock").textContent = `${product.quantity} units`;
  $("specCurrency").textContent = product.currency || "EGP";
  $("specId").textContent = product._id.slice(-8).toUpperCase();

  selectedQty = 1;
  $("qtyValue").textContent = selectedQty;

  if (product.quantity === 0) {
    $("addToCartBtn").disabled = true;
    $("addToCartBtn").textContent = "Out of stock";
  }

  $("loadingState").classList.add("hidden");
  $("productContent").classList.remove("hidden");
}

// ---------------------------------------------------------------------------
// Quantity Stepper
// ---------------------------------------------------------------------------

$("qtyInc").addEventListener("click", () => {
  if (!product) return;
  if (selectedQty < product.quantity) {
    selectedQty += 1;
    $("qtyValue").textContent = selectedQty;
  }
});
$("qtyDec").addEventListener("click", () => {
  if (selectedQty > 1) {
    selectedQty -= 1;
    $("qtyValue").textContent = selectedQty;
  }
});

// ---------------------------------------------------------------------------
// Add to Cart
// ---------------------------------------------------------------------------

$("addToCartBtn").addEventListener("click", async () => {
  if (!product) return;

  if (!isLoggedIn()) {
    showToast("Sign in to add items to your cart");
    setTimeout(() => (window.location.href = "auth/login.html"), 1200);
    return;
  }

  try {
    const payload = await authFetch("/cart", {
      method: "POST",
      body: JSON.stringify({ productId: product._id, quantity: selectedQty }),
    });
    cartData = unwrap(payload);
    updateCartUI();
    showToast("Added to cart");
  } catch (err) {
    showToast(err.message);
  }
});

// ---------------------------------------------------------------------------
// Cart Badge Sync
// ---------------------------------------------------------------------------

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

function updateCartUI() {
  const items = cartData.products || [];
  $("cartCount").textContent = items.reduce((sum, i) => sum + i.quantity, 0);
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

loadProduct();

if (typeof isLoggedIn === "function") {
  updateAuthUI();
  if (isLoggedIn()) loadCart();
} else {
  console.error("auth.js did not load — check the <script> tag and file path");
}