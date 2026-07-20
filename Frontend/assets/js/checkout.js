/* ==========================================================================
   SILICON HOUSE — Checkout Page
   Two-stage checkout flow: (1) shipping address, (2) payment method.
   Validates required fields, supports credit card input masking, Luhn
   verification, and live card brand detection. Places the order via the
   backend and redirects to the orders page on success.
   This page is authenticated-only.
   ========================================================================== */

const $ = (id) => document.getElementById(id);

/** @type {{ products: Array<Object> }} The cart snapshot used for summary. */
let cartData = { products: [] };

// ---------------------------------------------------------------------------
// Guard: checkout requires an active session.
// ---------------------------------------------------------------------------
if (typeof isLoggedIn !== "function" || !isLoggedIn()) {
  window.location.href = "auth/login.html";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Shows a brief toast notification. */
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

/** Escapes unsafe characters for HTML interpolation. */
function escapeHTML(value = "") {
  const node = document.createElement("span");
  node.textContent = String(value);
  return node.innerHTML;
}

// ---------------------------------------------------------------------------
// Navigation Header
// ---------------------------------------------------------------------------

/**
 * Updates the greeting badge in the header.
 */
function updateHeader() {
  const user = getUser();
  const greetingEl = $("userGreeting");
  if (user) {
    greetingEl.textContent = `Hi, ${user.name}`;
    greetingEl.style.display = "inline-flex";
  } else {
    greetingEl.style.display = "none";
  }
}

// ---------------------------------------------------------------------------
// Error Display
// ---------------------------------------------------------------------------

/** Shows a checkout error banner above the place-order button. */
function showCheckoutError(message) {
  $("checkoutErrorText").textContent = message;
  $("checkoutError").classList.add("show");
}
function hideCheckoutError() {
  $("checkoutError").classList.remove("show");
}

/**
 * Generates a user-friendly error message from a raw server response.
 * @param {string} rawMessage
 * @returns {string}
 */
function friendlyError(rawMessage) {
  if (!rawMessage) return "Something went wrong. Please try again.";
  if (rawMessage.toLowerCase().includes("cart is empty")) {
    return "Your cart is empty — add something before checking out.";
  }
  if (rawMessage.toLowerCase().includes("not authorized")) {
    return "Your session has expired. Please sign in again.";
  }
  return rawMessage;
}

// ---------------------------------------------------------------------------
// Cart Summary Loading
// ---------------------------------------------------------------------------

/** Fetches the cart from the backend and renders the summary sidebar. */
async function loadCartSummary() {
  try {
    const payload = await authFetch("/cart");
    cartData = unwrap(payload) || { products: [] };
    $("cartCount").textContent = (cartData.products || []).reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0,
    );
    renderSummary();
  } catch (err) {
    $("summaryItems").innerHTML =
      `<p class="summary-empty">Couldn't load your cart.</p>`;
    showCheckoutError(friendlyError(err.message));
  }
}

/** Renders the order summary sidebar with line items and totals. */
function renderSummary() {
  const items = cartData.products || [];

  if (items.length === 0) {
    $("summaryItems").innerHTML =
      `<p class="summary-empty">Your cart is empty.</p>`;
    $("summarySubtotal").textContent = money(0);
    $("summaryTotal").textContent = money(0);
    $("placeOrderBtn").disabled = true;
    return;
  }

  let subtotal = 0;
  $("summaryItems").innerHTML = items
    .map((item) => {
      const product =
        item.productId && item.productId.name ? item.productId : null;
      const name = product ? product.name : "Product";
      subtotal += item.totalPrice;

      return `
      <div class="summary-line">
        <span class="name">${escapeHTML(name)} <span class="qty">&times;${item.quantity}</span></span>
        <span class="price">${money(item.totalPrice)}</span>
      </div>`;
    })
    .join("");

  $("summarySubtotal").textContent = money(subtotal);
  $("summaryTotal").textContent = money(subtotal);
  $("placeOrderBtn").disabled = false;
}

// ---------------------------------------------------------------------------
// Shipping Field Validation
// ---------------------------------------------------------------------------

const requiredFields = ["street", "city", "country"];
const optionalFields = ["state", "zip"];

/**
 * Updates the pin-dot indicator for a form field.
 * @param {string} field – The field name.
 * @param {string|null} state – "valid", "error", or null to clear.
 */
function setDotState(field, state) {
  const wrap = document.querySelector(`.field[data-field="${field}"]`);
  const dot = wrap && wrap.querySelector(".pin-dot");
  if (!dot) return;
  dot.classList.remove("valid", "error");
  if (state) dot.classList.add(state);
}

/**
 * Checks that a required field has a non-empty value.
 * @param {string} field
 * @returns {string} Empty string if valid, error message if not.
 */
function validateField(field) {
  const value = $(field).value.trim();
  return value.length > 0 ? "" : "This field is required";
}

/**
 * Applies visual valid/error state to a field wrapper.
 * @param {string} field
 * @returns {string} The validation error message (empty if valid).
 */
function renderFieldState(field) {
  const wrap = document.querySelector(`.field[data-field="${field}"]`);
  const error = validateField(field);
  wrap.classList.toggle("error", !!error);
  const errEl = wrap.querySelector(".field-error");
  if (errEl) errEl.textContent = error;
  setDotState(field, error ? "error" : "valid");
  return error;
}

requiredFields.forEach((field) => {
  $(field).addEventListener("blur", () => renderFieldState(field));
  $(field).addEventListener("input", () => {
    hideCheckoutError();
    renderFieldState(field);
  });
});

// Pre-fill Egypt as the default country and mark it valid immediately.
renderFieldState("country");

optionalFields.forEach((field) => {
  const input = $(field);
  if (!input) return;
  const update = () => setDotState(field, input.value.trim() ? "valid" : null);
  input.addEventListener("input", update);
  input.addEventListener("blur", update);
});

// ---------------------------------------------------------------------------
// Checkout Stage Navigation (Shipping → Payment)
// ---------------------------------------------------------------------------

const checkoutBlocks = document.querySelectorAll(".checkout-forms .form-block");
const shippingBlock = checkoutBlocks[0];
const paymentBlock = checkoutBlocks[1];
const checkoutSteps = document.querySelectorAll(".checkout-steps .step");

const continueToPaymentBtn = document.createElement("button");
continueToPaymentBtn.type = "button";
continueToPaymentBtn.className = "submit-btn stage-action";
continueToPaymentBtn.textContent = "Continue to payment";
shippingBlock.appendChild(continueToPaymentBtn);

const backToShippingBtn = document.createElement("button");
backToShippingBtn.type = "button";
backToShippingBtn.className = "btn-ghost-small back-stage-btn";
backToShippingBtn.textContent = "\u2190 Edit shipping";
paymentBlock.appendChild(backToShippingBtn);

const shippingPrompt = document.createElement("p");
shippingPrompt.className = "summary-prompt";
shippingPrompt.textContent = "Complete shipping details to continue.";
$("placeOrderBtn").before(shippingPrompt);

/**
 * Switches the visible checkout stage.
 * @param {"shipping"|"payment"} stage
 */
function setCheckoutStage(stage) {
  const paymentStage = stage === "payment";
  shippingBlock.classList.toggle("checkout-stage-hidden", paymentStage);
  paymentBlock.classList.toggle("checkout-stage-hidden", !paymentStage);
  shippingPrompt.classList.toggle("checkout-stage-hidden", paymentStage);
  $("placeOrderBtn").classList.toggle("checkout-stage-hidden", !paymentStage);

  checkoutSteps[1].classList.toggle("active", !paymentStage);
  checkoutSteps[1].classList.toggle("complete", paymentStage);
  checkoutSteps[2].classList.toggle("active", paymentStage);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

continueToPaymentBtn.addEventListener("click", () => {
  hideCheckoutError();
  const errors = requiredFields.map((field) => renderFieldState(field));
  if (errors.some(Boolean)) {
    showCheckoutError("Please fill in the required shipping fields.");
    return;
  }
  setCheckoutStage("payment");
});

backToShippingBtn.addEventListener("click", () => setCheckoutStage("shipping"));

// ---------------------------------------------------------------------------
// Payment Method Selection
// ---------------------------------------------------------------------------

document.querySelectorAll('input[name="paymentMethod"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    document
      .querySelectorAll(".payment-option")
      .forEach((opt) => opt.classList.remove("active"));
    radio.closest(".payment-option").classList.add("active");

    const cardPanel = $("cardDetailsPanel");
    if (cardPanel) {
      if (radio.value === "credit_card") {
        cardPanel.classList.remove("hidden");
      } else {
        cardPanel.classList.add("hidden");
        ["cardName", "cardNumber", "cardExpiry", "cardCvv"].forEach((f) => {
          const wrap = document.querySelector(`.field[data-field="${f}"]`);
          if (wrap) wrap.classList.remove("error", "valid");
          setDotState(f, null);
        });
      }
    }
  });
});

/** @returns {string} The currently selected payment method value. */
function getSelectedPaymentMethod() {
  const checked = document.querySelector('input[name="paymentMethod"]:checked');
  return checked ? checked.value : "cash_on_delivery";
}

// ---------------------------------------------------------------------------
// Credit Card Input Masking & Brand Detection
// ---------------------------------------------------------------------------

if ($("cardNumber")) {
  // Format card number with spaces and detect brand.
  $("cardNumber").addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    const badge = $("cardBrandBadge");

    if (value.startsWith("4")) {
      badge.textContent = "VISA";
      badge.className = "card-brand-badge visa";
    } else if (/^(5[1-5]|2[2-7])/.test(value)) {
      badge.textContent = "MASTERCARD";
      badge.className = "card-brand-badge mastercard";
    } else {
      badge.textContent = "UNKNOWN";
      badge.className = "card-brand-badge";
    }

    e.target.value = value.match(/.{1,4}/g)?.join(" ") || "";
  });

  // Insert "/" between month and year.
  $("cardExpiry").addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    e.target.value =
      value.length > 2
        ? value.substring(0, 2) + "/" + value.substring(2, 4)
        : value;
  });

  // Restrict CVV to digits only.
  $("cardCvv").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
  });
}

// ---------------------------------------------------------------------------
// Credit Card Validation (Luhn Algorithm)
// ---------------------------------------------------------------------------

/**
 * Validates a card number using the Luhn (Mod 10) checksum.
 * @param {string} digits – Raw digits (may include spaces).
 * @returns {boolean}
 */
function validateLuhnFormula(digits) {
  let cleanStr = digits.replace(/\s+/g, "");
  if (!/^\d{15,16}$/.test(cleanStr)) return false;

  let totalSum = 0;
  let shouldDouble = false;

  for (let i = cleanStr.length - 1; i >= 0; i--) {
    let currentDigit = parseInt(cleanStr.charAt(i), 10);
    if (shouldDouble) {
      currentDigit *= 2;
      if (currentDigit > 9) currentDigit -= 9;
    }
    totalSum += currentDigit;
    shouldDouble = !shouldDouble;
  }
  return totalSum % 10 === 0;
}

/** Checks if the card number has between 15 and 19 digits (after removing spaces). */
function validateCardNumberFormat(digits) {
  const cleanStr = digits.replace(/\s+/g, "");
  return /^\d{15,19}$/.test(cleanStr);
}

/** Sets the visual valid/error state for a credit card field. */
function applyFieldValidity(field, isValid) {
  const wrap = document.querySelector(`.field[data-field="${field}"]`);
  if (wrap) wrap.classList.toggle("error", !isValid);
  setDotState(field, isValid ? "valid" : "error");
}

/** @returns {boolean} */
function isCardNameValid() {
  return $("cardName").value.trim().length >= 3;
}
/** @returns {boolean} */
function isCardNumberValid() {
  return validateCardNumberFormat($("cardNumber").value);
}
/** @returns {boolean} */
function isCardExpiryValid() {
  const expMatch = $("cardExpiry").value.match(/^(0[1-9]|1[0-2])\/([0-9]{2})$/);
  if (!expMatch) return false;

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = parseInt(
    new Date().getFullYear().toString().substring(2),
    10,
  );
  const parsedMonth = parseInt(expMatch[1], 10);
  const parsedYear = parseInt(expMatch[2], 10);

  return !(
    parsedYear < currentYear ||
    (parsedYear === currentYear && parsedMonth < currentMonth)
  );
}
/** @returns {boolean} */
function isCardCvvValid() {
  return $("cardCvv").value.length >= 3;
}

/** Validates all credit card fields and applies visual feedback. @returns {boolean} */
function validateCreditCardFields() {
  let isValid = true;

  if (!isCardNameValid()) isValid = false;
  applyFieldValidity("cardName", isCardNameValid());

  if (!isCardNumberValid()) isValid = false;
  applyFieldValidity("cardNumber", isCardNumberValid());

  if (!isCardExpiryValid()) isValid = false;
  applyFieldValidity("cardExpiry", isCardExpiryValid());

  if (!isCardCvvValid()) isValid = false;
  applyFieldValidity("cardCvv", isCardCvvValid());

  return isValid;
}

// Live per-field validation on blur.
if ($("cardName")) {
  $("cardName").addEventListener("blur", () =>
    applyFieldValidity("cardName", isCardNameValid()),
  );
  $("cardNumber").addEventListener("blur", () =>
    applyFieldValidity("cardNumber", isCardNumberValid()),
  );
  $("cardExpiry").addEventListener("blur", () =>
    applyFieldValidity("cardExpiry", isCardExpiryValid()),
  );
  $("cardCvv").addEventListener("blur", () =>
    applyFieldValidity("cardCvv", isCardCvvValid()),
  );

  ["cardName", "cardNumber", "cardExpiry", "cardCvv"].forEach((field) => {
    $(field).addEventListener("input", () => {
      hideCheckoutError();
      document
        .querySelector(`.field[data-field="${field}"]`)
        .classList.remove("error");
      setDotState(field, null);
    });
  });
}

// ---------------------------------------------------------------------------
// Order Placement
// ---------------------------------------------------------------------------

/**
 * Toggles the "Placing order..." state on the submit button.
 * @param {boolean} isPlacing
 */
function setPlacingOrder(isPlacing) {
  const btn = $("placeOrderBtn");
  $("placeOrderLabel").textContent = isPlacing
    ? "Placing order..."
    : "Place order";
  btn.disabled = isPlacing;
}

$("placeOrderBtn").addEventListener("click", async () => {
  hideCheckoutError();

  if (cartData.products.length === 0) {
    showCheckoutError("Your cart is empty.");
    return;
  }

  const errors = requiredFields.map((f) => renderFieldState(f));
  if (errors.some((e) => e !== "")) {
    showCheckoutError("Please fill in the required shipping fields.");
    return;
  }

  if (getSelectedPaymentMethod() === "credit_card") {
    if (!validateCreditCardFields()) {
      showCheckoutError("Please fix your missing or invalid card details.");
      return;
    }
  }

  setPlacingOrder(true);

  const shippingAddress = {
    street: $("street").value.trim(),
    city: $("city").value.trim(),
    state: $("state").value.trim(),
    zip: $("zip").value.trim(),
    country: $("country").value.trim(),
  };

  try {
    await authFetch("/orders/checkout", {
      method: "POST",
      body: JSON.stringify({
        paymentMethod: getSelectedPaymentMethod(),
        shippingAddress,
      }),
    });

    showToast("Order placed! Redirecting...");
    setTimeout(() => {
      window.location.href = "orders.html";
    }, 1500);
  } catch (err) {
    showCheckoutError(friendlyError(err.message));
    setPlacingOrder(false);
  }
});

$("signOutBtn").addEventListener("click", () => {
  clearSession();
  window.location.href = "../index.html";
});

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

updateHeader();
setCheckoutStage("shipping");
loadCartSummary();