const API_BASE = "http://localhost:3000";

const $ = (id) => document.getElementById(id);

let cartData = { products: [] };

// ---------------------------------------------------------------------
// Guard: checkout is an authenticated-only page.
// ---------------------------------------------------------------------
if (typeof isLoggedIn !== "function" || !isLoggedIn()) {
  window.location.href = "auth/login.html";
}

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

function escapeHTML(value = "") {
  const node = document.createElement("span");
  node.textContent = String(value);
  return node.innerHTML;
}

function updateHeader() {
  const user = getUser();
  if (user) $("userGreeting").textContent = `Hi, ${user.name}`;
}

function showCheckoutError(message) {
  $("checkoutErrorText").textContent = message;
  $("checkoutError").classList.add("show");
}
function hideCheckoutError() {
  $("checkoutError").classList.remove("show");
}

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

// ---------------------------------------------------------------------
// Load cart + render order summary
// ---------------------------------------------------------------------
async function loadCartSummary() {
  try {
    const payload = await authFetch("/cart");
    cartData = unwrap(payload) || { products: [] };
    $("cartCount").textContent = (cartData.products || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    renderSummary();
  } catch (err) {
    $("summaryItems").innerHTML = `<p class="summary-empty">Couldn't load your cart.</p>`;
    showCheckoutError(friendlyError(err.message));
  }
}

function renderSummary() {
  const items = cartData.products || [];

  if (items.length === 0) {
    $("summaryItems").innerHTML = `<p class="summary-empty">Your cart is empty.</p>`;
    $("summarySubtotal").textContent = money(0);
    $("summaryTotal").textContent = money(0);
    $("placeOrderBtn").disabled = true;
    return;
  }

  let subtotal = 0;
  $("summaryItems").innerHTML = items.map((item) => {
    const product = item.productId && item.productId.name ? item.productId : null;
    const name = product ? product.name : "Product";
    subtotal += item.totalPrice;

    return `
      <div class="summary-line">
        <span class="name">${escapeHTML(name)} <span class="qty">&times;${item.quantity}</span></span>
        <span class="price">${money(item.totalPrice)}</span>
      </div>`;
  }).join("");

  $("summarySubtotal").textContent = money(subtotal);
  $("summaryTotal").textContent = money(subtotal);
  $("placeOrderBtn").disabled = false;
}

// ---------------------------------------------------------------------
// Shipping field validation
// (Backend doesn't require these, but a checkout without a street or
// city isn't a real order — enforce it client-side for a sane UX.)
// ---------------------------------------------------------------------
const requiredFields = ["street", "city", "country"];

function validateField(field) {
  const value = $(field).value.trim();
  return value.length > 0 ? "" : "This field is required";
}

function renderFieldState(field) {
  const wrap = document.querySelector(`.field[data-field="${field}"]`);
  const error = validateField(field);
  wrap.classList.toggle("error", !!error);
  const errEl = wrap.querySelector(".field-error");
  if (errEl) errEl.textContent = error;
  return error;
}

requiredFields.forEach((field) => {
  $(field).addEventListener("blur", () => renderFieldState(field));
  $(field).addEventListener("input", () => {
    hideCheckoutError();
    document.querySelector(`.field[data-field="${field}"]`).classList.remove("error");
  });
});

// ---------------------------------------------------------------------
// Checkout stages — collect the address before showing payment options.
// ---------------------------------------------------------------------
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
backToShippingBtn.textContent = "← Edit shipping";
paymentBlock.appendChild(backToShippingBtn);

const shippingPrompt = document.createElement("p");
shippingPrompt.className = "summary-prompt";
shippingPrompt.textContent = "Complete shipping details to continue.";
$("placeOrderBtn").before(shippingPrompt);

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

// ---------------------------------------------------------------------
// Payment option cards — toggle .active and handle sub-panel visibility
// ---------------------------------------------------------------------
document.querySelectorAll('input[name="paymentMethod"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    // Standard visual active class cleanup loop
    document.querySelectorAll(".payment-option").forEach((opt) => opt.classList.remove("active"));
    radio.closest(".payment-option").classList.add("active");

    /* ==========================================================================
       ADDED: Dynamic sub-drawer panel show/hide visibility toggles
       ========================================================================== */
    const cardPanel = $("cardDetailsPanel");
    if (cardPanel) {
      if (radio.value === "credit_card") {
        // Smoothly reveal panel by peeling off the utility hidden CSS class style
        cardPanel.classList.remove("hidden");
      } else {
        // Snap panel out of layout stream if option chosen is alternate form
        cardPanel.classList.add("hidden");
        
        // Clean up remaining red validation styling borders if they change methods halfway
        ["cardName", "cardNumber", "cardExpiry", "cardCvv"].forEach((f) => {
          const wrap = document.querySelector(`.field[data-field="${f}"]`);
          if (wrap) wrap.classList.remove("error", "valid");
        });
      }
    }
  });
});

function getSelectedPaymentMethod() {
  const checked = document.querySelector('input[name="paymentMethod"]:checked');
  return checked ? checked.value : "cash_on_delivery";
}

/* ==========================================================================
   ADDED: CREDIT CARD INPUT MASKING & LIVE BRAND RECOGNITION
   ========================================================================== */

// Event Handlers for handling input formatting masks
if ($("cardNumber")) {
  
  // 1. Live Space Formatter & Brand Network Parser
  $("cardNumber").addEventListener("input", (e) => {
    // Use regular expressions to strip any non-digit string entries immediately
    let value = e.target.value.replace(/\D/g, "");
    const badge = $("cardBrandBadge");

    // Live Card Identification Pattern Parsing System
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

    // Input Mask: Smoothly split up numeric strings into chunks of 4 digits using space characters
    let formatted = value.match(/.{1,4}/g)?.join(" ") || "";
    e.target.value = formatted;
  });

  // 2. Automated Expiration Date Slash (/) Masking Insertion
  $("cardExpiry").addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Restrict entry strictly to numeric strings
    
    if (value.length > 2) {
      // Injects the design forward slash mark automatically between Month and Year values
      e.target.value = value.substring(0, 2) + "/" + value.substring(2, 4);
    } else {
      e.target.value = value;
    }
  });

  // 3. Strict CVV Digit Restriction Safety Mask
  $("cardCvv").addEventListener("input", (e) => {
    // Completely drops text alphabetic keys out of string contents immediately on input
    e.target.value = e.target.value.replace(/\D/g, "");
  });
}

/* ==========================================================================
   ADDED: LUHN CHECKSUM ALGORITHM & INLINE SYSTEM FIELD VALIDATION
   ========================================================================== */

/**
 * Validates a credit card number using the Luhn Algorithm (Mod 10).
 * Reverses the digits, doubles every second number, and checks if the sum is a multiple of 10.
 */
function validateLuhnFormula(digits) {
  let cleanStr = digits.replace(/\s+/g, ""); // Strip whitespace out of calculation parameters
  if (!/^\d{15,16}$/.test(cleanStr)) return false; // Fail early if explicit length bounds aren't met

  let totalSum = 0;
  let shouldDouble = false;
  
  // Run loop backward from right-side values mapping coordinates to left tracking nodes
  for (let i = cleanStr.length - 1; i >= 0; i--) {
    let currentDigit = parseInt(cleanStr.charAt(i), 10);
    
    if (shouldDouble) {
      currentDigit *= 2;
      if (currentDigit > 9) currentDigit -= 9; // Optimization: Subtracting 9 gets the same result as adding the digits of a 2-digit number (e.g., 14 -> 1+4=5, 14-9=5)
    }
    
    totalSum += currentDigit;
    shouldDouble = !shouldDouble; // Invert doubling cycle flag modifier toggle state step
  }
  
  return totalSum % 10 === 0;
}

function validateCardNumberFormat(digits) {
  const cleanStr = digits.replace(/\s+/g, "");
  return /^\d{15,19}$/.test(cleanStr);
}

/**
 * Validates the input state fields across the credit card block area container.
 * Injects/clears visual error structures dynamically based on pass states.
 */
function validateCreditCardFields() {
  let isValid = true;

  // 1. Verify Cardholder Name String Length
  const nameWrap = document.querySelector('.field[data-field="cardName"]');
  const nameValue = $("cardName").value.trim();
  if (nameValue.length < 3) {
    nameWrap.classList.add("error");
    isValid = false;
  } else {
    nameWrap.classList.remove("error");
  }

  // 2. This checkout does not submit card data to a payment processor, so
  // accept a complete card format rather than rejecting demo/test numbers.
  const numberWrap = document.querySelector('.field[data-field="cardNumber"]');
  if (!validateCardNumberFormat($("cardNumber").value)) {
    numberWrap.classList.add("error");
    isValid = false;
  } else {
    numberWrap.classList.remove("error");
  }

  // 3. Verify Expiration Schema Mechanics & Date Timelines
  const expiryWrap = document.querySelector('.field[data-field="cardExpiry"]');
  const expMatch = $("cardExpiry").value.match(/^(0[1-9]|1[0-2])\/([0-9]{2})$/);
  
  if (!expMatch) {
    expiryWrap.classList.add("error");
    isValid = false;
  } else {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = parseInt(new Date().getFullYear().toString().substring(2), 10);
    const parsedMonth = parseInt(expMatch[1], 10);
    const parsedYear = parseInt(expMatch[2], 10);
    
    // Fail execution loops if year target scales backward or falls short under active parameters month scopes
    if (parsedYear < currentYear || (parsedYear === currentYear && parsedMonth < currentMonth)) {
      expiryWrap.classList.add("error");
      isValid = false;
    } else {
      expiryWrap.classList.remove("error");
    }
  }

  // 4. Verify CVV Security Code Value Structure Sizing Boundaries
  const cvvWrap = document.querySelector('.field[data-field="cardCvv"]');
  if ($("cardCvv").value.length < 3) {
    cvvWrap.classList.add("error");
    isValid = false;
  } else {
    cvvWrap.classList.remove("error");
  }

  return isValid;
}

// ---------------------------------------------------------------------
// Place order
// ---------------------------------------------------------------------
function setPlacingOrder(isPlacing) {
  const btn = $("placeOrderBtn");
  $("placeOrderLabel").textContent = isPlacing ? "Placing order..." : "Place order";
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

  /* ==========================================================================
     ADDED: Conditional Credit Card Intercept Validation Routine Block
     ========================================================================== */
  if (getSelectedPaymentMethod() === "credit_card") {
    // Block server connection pipelines early if fields contain formatting or logical evaluation errors
    if (!validateCreditCardFields()) {
      showCheckoutError("Please fix your missing or invalid card details.");
      return; // Halts execution path immediately to safeguard your server inputs
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

updateHeader();
setCheckoutStage("shipping");
loadCartSummary();
