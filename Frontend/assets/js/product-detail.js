const API_BASE = "http://localhost:3000";
const $ = (id) => document.getElementById(id);

let product = null;
let cartData = { products: [] };
let selectedQty = 1;

// ---------------------------------------------------------------------
// Helpers 
// ---------------------------------------------------------------------
function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function money(n) {
  return "EGP " + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 });
}

function unwrap(payload) {
  return payload && payload.data !== undefined ? payload.data : payload;
}

function stockTicksHTML(qty) {
  const level = qty <= 5 ? 1 : qty <= 20 ? 3 : 5;
  const cls = qty <= 5 ? "low" : "ok";
  let ticks = "";
  for (let i = 0; i < 5; i++) {
    ticks += `<span class="tick ${i < level ? "on " + cls : ""}"></span>`;
  }
  return `<div class="ticks">${ticks}</div><span class="stock-label">${qty} in stock</span>`;
}

async function checkApiStatus(reachable) {
  const el = $("apiStatus");
  el.textContent = reachable ? "online" : "offline";
  el.className = reachable ? "online" : "offline";
}

// ---------------------------------------------------------------------
// Auth UI 
// ---------------------------------------------------------------------
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

$("signOutBtn").addEventListener("click", () => {
  clearSession();
  cartData = { products: [] };
  updateCartUI();
  updateAuthUI();
  showToast("Signed out");
});

// ---------------------------------------------------------------------
// Get the product id from the URL
// ---------------------------------------------------------------------
function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

// ---------------------------------------------------------------------
// Load + render the product
// ---------------------------------------------------------------------
async function loadProduct() {
  const id = getProductIdFromUrl();
  if (!id) {
    showErrorState();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/products/${id}`);
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.message || "Product not found");

    product = unwrap(payload);
    checkApiStatus(true);
    renderProduct();
  } catch (err) {
    checkApiStatus(false);
    showErrorState();
  }
}

function showErrorState() {
  $("loadingState").classList.add("hidden");
  $("errorState").classList.remove("hidden");
  $("productContent").classList.add("hidden");
}

function renderProduct() {
  const images = (product.images && product.images.length) ? product.images : [{ url: "" }];

  document.title = `${product.name} — SILICON HOUSE`;
  $("breadcrumbCategory").textContent = product.category;

  $("mainImage").src = images[0].url;
  $("mainImage").alt = product.name;

  $("pdThumbs").innerHTML = images.map((img, i) =>
    `<img src="${img.url}" data-idx="${i}" class="${i === 0 ? "active" : ""}" alt="${product.name} ${i + 1}" />`
  ).join("");

  document.querySelectorAll(".pd-thumbs img").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      $("mainImage").src = thumb.src;
      document.querySelectorAll(".pd-thumbs img").forEach((t) => t.classList.remove("active"));
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

// ---------------------------------------------------------------------
// Quantity stepper (bounded by available stock)
// ---------------------------------------------------------------------
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

// ---------------------------------------------------------------------
// Add to cart
// ---------------------------------------------------------------------
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

// ---------------------------------------------------------------------
// Cart drawer 
// ---------------------------------------------------------------------
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


loadProduct();

if (typeof isLoggedIn === "function") {
  updateAuthUI();
  if (isLoggedIn()) loadCart();
} else {
  console.error("auth.js did not load — check the <script> tag and file path");
}