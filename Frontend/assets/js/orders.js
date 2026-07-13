const $ = (id) => document.getElementById(id);
const cancellingOrderIds = new Set();

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

if (typeof isLoggedIn !== "function" || !isLoggedIn())
  window.location.href = "auth/login.html";

function unwrap(payload) {
  return payload && payload.data !== undefined ? payload.data : payload;
}
function money(value) {
  return (
    "EGP " +
    Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })
  );
}
function escapeHTML(value = "") {
  const node = document.createElement("span");
  node.textContent = value;
  return node.innerHTML;
}
function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat("en-EG", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "—";
}
function paymentLabel(method) {
  return (
    {
      credit_card: "Credit card",
      paypal: "PayPal",
      cash_on_delivery: "Cash on delivery",
    }[method] ||
    method ||
    "—"
  );
}

function updateHeader() {
  const user = getUser();
  if (user) {
    const isAdmin = user.role === "admins";
    $("userGreeting").textContent = `Hi, ${user.name}`;
    $("adminLink").style.display = isAdmin ? "inline-flex" : "none";
    $("allOrdersAdminLink").style.display = isAdmin ? "inline-flex" : "none";
  }
}
function productInfo(item) {
  return item.productId && typeof item.productId === "object"
    ? item.productId
    : {};
}
function itemMarkup(item) {
  const product = productInfo(item),
    image = product.images && product.images[0] && product.images[0].url;
  const name = product.name || "Product no longer available";
  return `<div class="order-item">${image ? `<img class="order-item-image" src="${escapeHTML(image)}" alt="${escapeHTML(name)}">` : '<div class="order-item-image-placeholder"></div>'}<div class="order-item-info"><p class="order-item-name">${escapeHTML(name)}</p><p class="order-item-meta">Quantity: ${Number(item.quantity || 0)}</p></div>${product.price != null ? `<span class="order-item-price">${money(product.price * item.quantity)}</span>` : ""}</div>`;
}
function renderOrders(orders) {
  $("ordersLoading").classList.add("hidden");
  if (!orders.length) {
    $("ordersEmpty").classList.remove("hidden");
    return;
  }
  $("ordersList").innerHTML = orders
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((order) => {
      const status = String(order.status || "pending").toLowerCase();
      const address = order.shippingAddress || {};
      const destination =
        [address.city, address.country].filter(Boolean).join(", ") ||
        "Address not available";
      return `<article class="order-card"><div class="order-top"><div><span class="order-label">Order</span><span class="order-value">#${escapeHTML(
        String(order._id || "")
          .slice(-8)
          .toUpperCase(),
      )}</span></div><div><span class="order-label">Placed</span><span class="order-value">${formatDate(order.createdAt)}</span></div><div><span class="order-label">Total</span><span class="order-total">${money(order.totalPrice)}</span></div><span class="status status-${escapeHTML(status)}">${escapeHTML(status)}</span></div><div class="order-body">${(order.products || []).map(itemMarkup).join("")}<div class="order-details"><span><strong>Delivery:</strong> ${escapeHTML(destination)}</span><span><strong>Payment:</strong> ${escapeHTML(paymentLabel(order.paymentMethod))}</span></div></div></article>`;
    })
    .join("");
  $("ordersList").classList.remove("hidden");

  orders.forEach((order, index) => {
    const status = String(order.status || "pending").toLowerCase();
    if (!["pending", "processing"].includes(status)) return;

    const button = document.createElement("button");
    button.className = "cancel-order-btn";
    button.type = "button";
    button.dataset.orderId = order._id;
    button.disabled = cancellingOrderIds.has(order._id);
    button.textContent = button.disabled ? "Cancelling..." : "Cancel order";
    document
      .querySelectorAll(".order-card")
      [index].querySelector(".order-details")
      .appendChild(button);
  });
}
async function loadCartCount() {
  try {
    const cart = unwrap(await authFetch("/cart")) || {};
    $("cartCount").textContent = (cart.products || []).reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0,
    );
  } catch (_) {
    $("cartCount").textContent = "0";
  }
}
async function loadOrders() {
  $("ordersError").classList.add("hidden");
  $("ordersEmpty").classList.add("hidden");
  $("ordersList").classList.add("hidden");
  $("ordersLoading").classList.remove("hidden");
  try {
    renderOrders(unwrap(await authFetch("/orders/mine")) || []);
    $("apiStatus").textContent = "online";
    $("apiStatus").className = "online";
  } catch (error) {
    $("ordersLoading").classList.add("hidden");
    $("ordersErrorText").textContent =
      error.message || "Please check that the backend is running.";
    $("ordersError").classList.remove("hidden");
    $("apiStatus").textContent = "offline";
    $("apiStatus").className = "offline";
  }
}
$("signOutBtn").addEventListener("click", () => {
  clearSession();
  window.location.href = "../index.html";
});
$("retryBtn").addEventListener("click", loadOrders);
$("ordersList").addEventListener("click", async (event) => {
  const button = event.target.closest(".cancel-order-btn");
  if (!button || button.disabled) return;

  const orderId = button.dataset.orderId;
  if (!window.confirm("Cancel this order? This cannot be undone.")) return;

  cancellingOrderIds.add(orderId);
  button.disabled = true;
  button.textContent = "Cancelling...";
  try {
    await authFetch(`/orders/${orderId}/cancel`, { method: "PATCH" });
    showToast("Order cancelled");
    await loadOrders();
  } catch (error) {
    showToast(error.message || "Could not cancel this order");
    button.disabled = false;
    button.textContent = "Cancel order";
  } finally {
    cancellingOrderIds.delete(orderId);
  }
});
updateHeader();
loadCartCount();
loadOrders();
