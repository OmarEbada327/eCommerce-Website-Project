/* ==========================================================================
   SILICON HOUSE — Shopping Cart Page
   Manages the full cart view: displays line items with quantity stepper,
   remove and clear actions, subtotal calculation, and checkout handoff.
   This page is authenticated-only — unauthenticated visitors are redirected
   to the login page.
   ========================================================================== */

/** Shorthand for document.getElementById. */
const $ = (id) => document.getElementById(id);

/** @type {{ products: Array<Object> }} The live cart state from the backend. */
let cartData = { products: [] };

/** @type {string|null} Product ID pending removal confirmation. */
let pendingRemovePid = null;

/** @type {string|null} The last quantity-adjusted product ID (for pulse animation). */
let lastChangedPid = null;

/** @type {boolean} Prevents concurrent cart mutations. */
let cartBusy = false;

// ---------------------------------------------------------------------------
// Guard: this page requires an active session.
// ---------------------------------------------------------------------------
if (typeof isLoggedIn !== "function" || !isLoggedIn()) {
  window.location.href = "auth/login.html";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Shows a temporary toast notification at the bottom of the screen.
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
 * Unwraps a response envelope: `{ data: [...] }` versus flat response.
 * @param {Object|Array} payload
 * @returns {Object|Array}
 */
function unwrap(payload) {
  return payload && payload.data !== undefined ? payload.data : payload;
}

/**
 * Escapes a string for safe HTML interpolation.
 * @param {string} [value=""]
 * @returns {string}
 */
function escapeHTML(value = "") {
  const node = document.createElement("span");
  node.textContent = String(value);
  return node.innerHTML;
}

/**
 * Merges newly fetched cart items with the existing client-side product
 * detail objects so that product name, price, and images stay available
 * even when the server returns a minimal productId string.
 *
 * @param {Object} newCartData – Fresh cart payload from the API.
 * @returns {Object} Merged cart data.
 */
function mergeProductDetails(newCartData) {
  if (!newCartData?.products || !cartData?.products) return newCartData;
  newCartData.products.forEach((newItem) => {
    if (typeof newItem.productId !== "string") return;
    const oldItem = cartData.products.find(
      (old) => pidOf(old) === newItem.productId,
    );
    if (oldItem && typeof oldItem.productId === "object")
      newItem.productId = oldItem.productId;
  });
  return newCartData;
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
 * Toggles guest vs. signed-in navigation and shows the greeting + admin link.
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

/** Sign-out: clear session and redirect to homepage. */
$("signOutBtn").addEventListener("click", () => {
  clearSession();
  window.location.href = "../index.html";
});

// ---------------------------------------------------------------------------
// Cart Loading & Rendering
// ---------------------------------------------------------------------------

/** Fetches the current cart from the backend and renders it. */
async function loadCart() {
  try {
    const payload = await authFetch("/cart");
    cartData = unwrap(payload) || { products: [] };
    checkApiStatus(true);
    renderCart();
  } catch (err) {
    checkApiStatus(false);
    $("cartLoadingState").classList.add("hidden");
    $("cartEmptyState").classList.remove("hidden");
    $("cartEmptyState").querySelector(".empty-title").textContent =
      "Couldn't load your cart";
    $("cartEmptyState").querySelector(".empty-sub").textContent =
      "Check your connection and try refreshing.";
  }
}

/**
 * Extracts a product ID from a cart item, regardless of whether the
 * server populated `productId` as a string or a populated object.
 *
 * @param {Object} item
 * @returns {string}
 */
function pidOf(item) {
  return item.productId && item.productId._id
    ? item.productId._id
    : item.productId;
}

/** Renders the cart grid, skeleton state, or empty state. */
function renderCart() {
  const items = cartData.products || [];
  $("cartCount").textContent = items.reduce((sum, i) => sum + i.quantity, 0);
  $("cartLoadingState").classList.add("hidden");

  if (items.length === 0) {
    $("cartEmptyState").classList.remove("hidden");
    $("cartGrid").classList.add("hidden");
    return;
  }

  $("cartEmptyState").classList.add("hidden");
  $("cartGrid").classList.remove("hidden");
  $("cartItemCount").textContent =
    `${items.length} item${items.length === 1 ? "" : "s"}`;

  let subtotal = 0;
  $("cartItemsList").innerHTML = items
    .map((item) => {
      const product =
        item.productId && item.productId.name ? item.productId : null;
      const pid = pidOf(item);
      const name = product ? product.name : "Product";
      const category = product ? product.category : "";
      const unitPrice = product
        ? product.price
        : item.totalPrice / item.quantity;
      const thumb =
        product &&
        product.images &&
        product.images.length &&
        product.images[0].url
          ? `<img class="cart-row-thumb" src="${escapeHTML(product.images[0].url)}" alt="${escapeHTML(name)}" />`
          : `<div class="cart-row-thumb-placeholder"></div>`;

      subtotal += item.totalPrice;

      return `
      <div class="cart-row${pid === lastChangedPid ? " qty-pulse" : ""}" data-pid="${escapeHTML(pid)}" data-name="${escapeHTML(name)}">
        ${thumb}
        <div class="cart-row-info">
          <span class="cart-row-category">${escapeHTML(category)}</span>
          <p class="cart-row-name">${escapeHTML(name)}</p>
          <p class="cart-row-unit-price">${money(unitPrice)} each</p>
        </div>
        <div class="cart-row-qty">
          <div class="qty-stepper">
            <button class="qty-dec" type="button" ${cartBusy ? "disabled" : ""}>-</button>
            <span>${item.quantity}</span>
            <button class="qty-inc" type="button" ${cartBusy ? "disabled" : ""}>+</button>
          </div>
        </div>
        <div class="cart-row-total">${money(item.totalPrice)}</div>
        <button class="cart-row-remove" type="button" title="Remove" ${cartBusy ? "disabled" : ""}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>`;
    })
    .join("");

  $("cartSubtotal").textContent = money(subtotal);
  $("cartGrandTotal").textContent = money(subtotal);

  if (lastChangedPid) {
    setTimeout(() => {
      document
        .querySelectorAll(".cart-row.qty-pulse")
        .forEach((el) => el.classList.remove("qty-pulse"));
    }, 500);
    lastChangedPid = null;
  }

  // Bind quantity stepper buttons
  document.querySelectorAll(".qty-inc").forEach((btn) => {
    btn.addEventListener("click", () =>
      changeQty(btn.closest(".cart-row").dataset.pid, 1),
    );
  });
  document.querySelectorAll(".qty-dec").forEach((btn) => {
    btn.addEventListener("click", () =>
      changeQty(btn.closest(".cart-row").dataset.pid, -1),
    );
  });
  document.querySelectorAll(".cart-row-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = btn.closest(".cart-row");
      openRemoveModal(row.dataset.pid, row.dataset.name);
    });
  });
}

// ---------------------------------------------------------------------------
// Quantity Changes
// ---------------------------------------------------------------------------

/**
 * Adjusts the quantity for a given product. Deletes the item if the new
 * quantity would be zero or negative.
 *
 * @param {string} productId
 * @param {number} delta – +1 or -1.
 */
async function changeQty(productId, delta) {
  if (cartBusy) return;
  const item = cartData.products.find((i) => pidOf(i) === productId);
  const newQty = (item ? item.quantity : 0) + delta;

  const row = document.querySelector(`.cart-row[data-pid="${productId}"]`);

  if (newQty <= 0) {
    openRemoveModal(productId, row ? row.dataset.name : "this item");
    return;
  }

  try {
    cartBusy = true;
    renderCart();
    const payload = await authFetch("/cart", {
      method: "PUT",
      body: JSON.stringify({ productId, quantity: newQty }),
    });
    cartData = mergeProductDetails(unwrap(payload)) || { products: [] };
    lastChangedPid = productId;
    renderCart();
  } catch (err) {
    showToast(err.message);
  } finally {
    cartBusy = false;
    renderCart();
  }
}

// ---------------------------------------------------------------------------
// Remove Item (with confirmation modal)
// ---------------------------------------------------------------------------

/** Opens the remove-item confirmation modal. */
function openRemoveModal(productId, name) {
  pendingRemovePid = productId;
  $("removeItemName").textContent = name;
  $("removeModalOverlay").classList.add("open");
}
function closeRemoveModal() {
  $("removeModalOverlay").classList.remove("open");
  pendingRemovePid = null;
}

$("removeModalClose").addEventListener("click", closeRemoveModal);
$("cancelRemoveBtn").addEventListener("click", closeRemoveModal);
$("removeModalOverlay").addEventListener("click", (e) => {
  if (e.target.id === "removeModalOverlay") closeRemoveModal();
});

/** Confirms removal — deletes the cart line item on the server. */
$("confirmRemoveBtn").addEventListener("click", async () => {
  if (!pendingRemovePid || cartBusy) return;
  const pid = pendingRemovePid;
  cartBusy = true;
  closeRemoveModal();

  const row = document.querySelector(`.cart-row[data-pid="${pid}"]`);
  if (row) row.classList.add("removing");

  try {
    await new Promise((resolve) => setTimeout(resolve, 220)); // let fade-out play
    const payload = await authFetch("/cart/" + pid, { method: "DELETE" });
    cartData = mergeProductDetails(unwrap(payload)) || { products: [] };
    showToast("Item removed");
  } catch (err) {
    showToast(err.message);
  } finally {
    cartBusy = false;
    renderCart();
  }
});

// ---------------------------------------------------------------------------
// Clear Cart (with confirmation modal)
// ---------------------------------------------------------------------------

$("clearCartBtn").addEventListener("click", () => {
  $("clearModalOverlay").classList.add("open");
});
function closeClearModal() {
  $("clearModalOverlay").classList.remove("open");
}
$("clearModalClose").addEventListener("click", closeClearModal);
$("cancelClearBtn").addEventListener("click", closeClearModal);
$("clearModalOverlay").addEventListener("click", (e) => {
  if (e.target.id === "clearModalOverlay") closeClearModal();
});

/** Confirms clear — empties the entire cart on the server. */
$("confirmClearBtn").addEventListener("click", async () => {
  if (cartBusy) return;
  closeClearModal();
  try {
    cartBusy = true;
    const payload = await authFetch("/cart", { method: "DELETE" });
    cartData = unwrap(payload) || { products: [] };
    showToast("Cart cleared");
  } catch (err) {
    showToast(err.message);
  } finally {
    cartBusy = false;
    renderCart();
  }
});

// ---------------------------------------------------------------------------
// Checkout Handoff
// ---------------------------------------------------------------------------

$("proceedCheckoutBtn").addEventListener("click", () => {
  if (!cartData.products || cartData.products.length === 0) {
    showToast("Your cart is empty");
    return;
  }
  window.location.href = "checkout.html";
});

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

updateAuthUI();
loadCart();