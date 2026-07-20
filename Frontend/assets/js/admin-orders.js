/* ==========================================================================
   SILICON HOUSE — Admin: Order Management
   Provides a full order-management dashboard: view all orders, search,
   filter by status, and update order statuses (pending → processing →
   shipped → delivered / cancelled). Requires admin privileges.
   ========================================================================== */

const $ = (id) => document.getElementById(id);

/** Ordered list of possible order statuses. */
const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

/** @type {Array<Object>} The full order list fetched from the backend. */
let allOrders = [];

/** @type {string|null} Order _id currently having its status saved. */
let updatingOrderId = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Unwraps a response envelope.
 * @param {Object|Array} payload
 * @returns {Object|Array}
 */
function unwrap(payload) {
  return payload && payload.data !== undefined ? payload.data : payload;
}

/** Escapes unsafe characters for HTML interpolation. */
function escapeHTML(value = "") {
  const node = document.createElement("span");
  node.textContent = String(value);
  return node.innerHTML;
}

/**
 * Formats a number as EGP currency.
 * @param {number} value
 * @returns {string}
 */
function money(value) {
  return `EGP ${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

/**
 * Formats an ISO date string for display.
 * @param {string} value
 * @returns {string}
 */
function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat("en-EG", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
}

/**
 * Normalises an order's status to lowercase.
 * @param {Object} order
 * @returns {string}
 */
function statusOf(order) {
  return String(order.status || "pending").toLowerCase();
}

/** Shows a brief toast notification. */
function showToast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  setTimeout(() => $("toast").classList.remove("show"), 2200);
}

/**
 * Generates a user-friendly error from a raw message.
 * @param {string} message
 * @returns {string}
 */
function friendlyError(message) {
  return String(message || "Could not load orders.")
    .toLowerCase()
    .includes("admin only")
    ? "Only admin accounts can manage orders."
    : message;
}

// ---------------------------------------------------------------------------
// Access Guard — this page is admin-only.
// ---------------------------------------------------------------------------

/**
 * Verifies the current user is an admin. Shows a notice and redirects if not.
 * @returns {boolean} true if the user is an admin.
 */
function enforceAdminAccess() {
  const user = typeof getUser === "function" ? getUser() : null;
  const allowed =
    typeof isLoggedIn === "function" &&
    isLoggedIn() &&
    user &&
    user.role === "admins";
  if (!allowed) {
    $("accessNotice").classList.remove("hidden");
    $("ordersWorkspace").style.display = "none";
    setTimeout(() => {
      window.location.href = user ? "../../index.html" : "../auth/login.html";
    }, 1800);
  }
  return allowed;
}

// ---------------------------------------------------------------------------
// Data Access
// ---------------------------------------------------------------------------

/**
 * Extracts the user sub-object from an order.
 * @param {Object} order
 * @returns {Object}
 */
function customer(order) {
  return order.user && typeof order.user === "object" ? order.user : {};
}

// ---------------------------------------------------------------------------
// Dashboard Summary
// ---------------------------------------------------------------------------

/** Updates the summary cards at the top of the admin dashboard. */
function renderSummary() {
  $("totalOrders").textContent = allOrders.length;
  $("pendingOrders").textContent = allOrders.filter((order) =>
    ["pending", "processing"].includes(statusOf(order)),
  ).length;
  $("shippedOrders").textContent = allOrders.filter(
    (order) => statusOf(order) === "shipped",
  ).length;
}

// ---------------------------------------------------------------------------
// Search & Filter
// ---------------------------------------------------------------------------

/**
 * Applies the current search query and status filter to the order list.
 * @returns {Array<Object>} Filtered orders.
 */
function filteredOrders() {
  const query = $("orderSearch").value.trim().toLowerCase();
  const filter = $("statusFilter").value;
  return allOrders.filter((order) => {
    const user = customer(order);
    const matchesQuery =
      !query ||
      [order._id, user.name, user.email, user.phone].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query),
      );
    return matchesQuery && (!filter || statusOf(order) === filter);
  });
}

// ---------------------------------------------------------------------------
// Order Table Rendering
// ---------------------------------------------------------------------------

/** Renders the orders table with status editor, summary cards, and filters. */
function renderOrders() {
  const orders = filteredOrders();
  renderSummary();
  if (!orders.length) {
    $("ordersTableBody").innerHTML =
      '<tr><td colspan="6" class="empty-row">No orders match these filters.</td></tr>';
    return;
  }
  $("ordersTableBody").innerHTML = orders
    .map((order) => {
      const user = customer(order),
        status = statusOf(order),
        products = order.products || [];
      const itemText = products
        .map(
          (item) =>
            `${item.productId && item.productId.name ? item.productId.name : "Product"} × ${Number(item.quantity || 0)}`,
        )
        .join(", ");
      const address = order.shippingAddress || {};
      const destination =
        [address.city, address.country].filter(Boolean).join(", ") ||
        "No address";
      const isUpdating = updatingOrderId === order._id;
      return `<tr><td data-label="Order"><strong>#${escapeHTML(
        String(order._id || "")
          .slice(-8)
          .toUpperCase(),
      )}</strong><span class="order-meta">${formatDate(order.createdAt)}</span></td><td data-label="Customer"><strong>${escapeHTML(user.name || "Unknown customer")}</strong><span class="order-meta">${escapeHTML(user.email || user.phone || destination)}</span></td><td class="order-items" data-label="Items" title="${escapeHTML(itemText)}">${escapeHTML(products.length)} item${products.length === 1 ? "" : "s"}<span class="order-meta">${escapeHTML(destination)}</span></td><td class="col-num" data-label="Total">${money(order.totalPrice)}</td><td data-label="Status"><span class="order-status status-${escapeHTML(status)}">${escapeHTML(status)}</span></td><td class="col-actions" data-label="Update"><div class="status-editor"><select class="status-select" data-order-id="${escapeHTML(order._id)}" aria-label="Status for order ${escapeHTML(String(order._id).slice(-8))}">${STATUSES.map((value) => `<option value="${value}"${value === status ? " selected" : ""}>${value}</option>`).join("")}</select><button class="save-status-btn" data-order-id="${escapeHTML(order._id)}" type="button"${isUpdating ? " disabled" : ""}>${isUpdating ? "Saving…" : "Save"}</button></div></td></tr>`;
    })
    .join("");
}

// ---------------------------------------------------------------------------
// Order Loading
// ---------------------------------------------------------------------------

/** Fetches all orders from the backend and renders the table. */
async function loadOrders() {
  $("ordersError").classList.add("hidden");
  $("ordersTableBody").innerHTML =
    '<tr><td colspan="6" class="loading-row">Loading orders…</td></tr>';
  try {
    allOrders = unwrap(await authFetch("/orders")) || [];
    renderOrders();
  } catch (error) {
    $("ordersError").textContent = friendlyError(error.message);
    $("ordersError").classList.remove("hidden");
    $("ordersTableBody").innerHTML =
      '<tr><td colspan="6" class="empty-row">Orders could not be loaded.</td></tr>';
  }
}

// ---------------------------------------------------------------------------
// Event Handlers
// ---------------------------------------------------------------------------

$("signOutBtn").addEventListener("click", () => {
  clearSession();
  window.location.href = "../../index.html";
});

$("refreshOrdersBtn").addEventListener("click", loadOrders);
$("orderSearch").addEventListener("input", renderOrders);
$("statusFilter").addEventListener("change", renderOrders);

/** Handles status-save button clicks — updates order status on the backend. */
$("ordersTableBody").addEventListener("click", async (event) => {
  const button = event.target.closest(".save-status-btn");
  if (!button || button.disabled) return;
  const orderId = button.dataset.orderId;
  const select = document.querySelector(
    `.status-select[data-order-id="${orderId}"]`,
  );
  if (!select) return;
  updatingOrderId = orderId;
  renderOrders();
  try {
    await authFetch(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: select.value }),
    });
    showToast("Order status updated");
    await loadOrders();
  } catch (error) {
    showToast(friendlyError(error.message || "Could not update order status"));
  } finally {
    updatingOrderId = null;
    renderOrders();
  }
});

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

if (enforceAdminAccess()) loadOrders();