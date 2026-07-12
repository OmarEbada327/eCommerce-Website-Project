// Base URL for API communications
const API_BASE = "http://localhost:3000";

// DOM element references
const form = document.getElementById("loginForm");
const fields = ["email", "password"];
// Tracks whether the user has interacted with/visited specific fields
const touched = {};

// Restores previously saved email from localStorage if "Remember Me" was checked
window.addEventListener("DOMContentLoaded", () => {
  const savedEmail = localStorage.getItem("silicon_house_remembered_email");
  if (savedEmail) {
    const emailInput = document.getElementById("email");
    emailInput.value = savedEmail;
    document.getElementById("rememberMe").checked = true;
    
    touched["email"] = true;
    renderFieldState("email");
  }
});

// Validates field values based on specific input criteria
function validate(field, value) {
  switch (field) {
    case "email":
      // Validates standard email formats using RegExp
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Enter a valid email address";
    case "password":
      // Validates that the password field is not empty
      return value.length > 0 ? "" : "Enter your password";
    default:
      return "";
  }
}

// Updates the UI visual states (validation classes, error dots, error messages) for fields
function renderFieldState(field) {
  const wrap = document.querySelector(`.field[data-field="${field}"]`);
  const value = document.getElementById(field).value;
  const error = validate(field, value);

  // Reset existing validation styling classes
  wrap.classList.remove("valid", "error");
  const dot = wrap.querySelector(".pin-dot");
  dot.classList.remove("valid", "error");

  // Only display validation styles if the user has interacted with the field
  if (touched[field]) {
    if (error) {
      wrap.classList.add("error");
      dot.classList.add("error");
    } else if (value.length > 0) {
      wrap.classList.add("valid");
      dot.classList.add("valid");
    }
  }

  // Inject or update error message text if applicable
  const errEl = wrap.querySelector(".field-error");
  if (errEl && error) errEl.textContent = error;
  return error;
}

// Attaches input listeners for real-time validation and blur listeners for blur validation tracking
fields.forEach((field) => {
  const input = document.getElementById(field);
  input.addEventListener("input", () => {
    hideServerError();
    renderFieldState(field);
  });
  input.addEventListener("blur", () => {
    touched[field] = true;
    renderFieldState(field);
  });
});

// Controls password visibility toggling (mask/unmask) and manages SVG icons dynamically
document.querySelectorAll(".toggle-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.getAttribute("data-toggle");
    const input = document.getElementById(targetId);
    const isHidden = input.type === "password";
    
    input.type = isHidden ? "text" : "password";
    
    if (isHidden) {
      // SVG configuration for hidden password status (crossed-eye icon view)
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>`;
    } else {
      // SVG configuration for visible password status (normal eye icon view)
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>`;
    }
  });
});

// Displays authentication/server response error panels
function showServerError(message) {
  document.getElementById("serverErrorText").textContent = message;
  document.getElementById("serverError").classList.add("show");
}

// Hides authentication/server response error panels
function hideServerError() {
  document.getElementById("serverError").classList.remove("show");
}

// Map generic or raw backend error messages into client-friendly statements
function friendlyError(rawMessage) {
  if (!rawMessage) return "Something went wrong. Please try again.";

  if (rawMessage.toLowerCase().includes("invalid email or password")) {
    return "That email or password isn't right. Please try again.";
  }
  if (rawMessage.toLowerCase().includes("not authorized")) {
    return "Your session isn't valid. Please sign in again.";
  }
  return rawMessage;
}

// Manages button text strings, arrow indicators, and disabled attributes during submission cycles
function setSubmitting(isSubmitting) {
  const btn = document.getElementById("submitBtn");
  document.getElementById("submitLabel").textContent = isSubmitting ? "Signing in..." : "Sign in";
  document.getElementById("submitArrow").style.display = isSubmitting ? "none" : "inline-block";
  btn.disabled = isSubmitting;
}

// Handles form submission intercept, local validation enforcement, API fetch requests, and state persistence
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Mark all fields as touched and trigger manual validation sweeps
  fields.forEach((f) => (touched[f] = true));
  const errors = fields.map((f) => renderFieldState(f));

  // Determine if any layout elements failed client validation parameters
  const firstErrorIndex = errors.findIndex((err) => err !== "");
  if (firstErrorIndex !== -1) {
    document.getElementById(fields[firstErrorIndex]).focus();
    return;
  }

  // Activate loading/submitting states
  setSubmitting(true);
  hideServerError();

  const payload = {
    email: document.getElementById("email").value,
    password: document.getElementById("password").value,
  };

  try {
    // Initiate POST request authentication to backend API routes
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Sign in failed");

    // Persist login session tokens and identity details inside localStorage
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("authUser", JSON.stringify(data.user));

    // Handle "Remember Me" preferences state validation
    const rememberMeCheckbox = document.getElementById("rememberMe");
    if (rememberMeCheckbox.checked) {
      localStorage.setItem("silicon_house_remembered_email", document.getElementById("email").value);
    } else {
      localStorage.removeItem("silicon_house_remembered_email");
    }

    // Success redirect out to home interface
    window.location.href = "../../index.html";
  } catch (err) {
    // Render errors to the client UI layout
    showServerError(friendlyError(err.message));
    document.querySelector('.field[data-field="password"]').classList.add("error");
  } finally {
    // Terminate submission cycle status states
    setSubmitting(false);
  }
});