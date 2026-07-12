// Base URL for API communications
const API_BASE = "http://localhost:3000";

// DOM element references and configuration
const form = document.getElementById("registerForm");
const fields = ["name", "email", "phone", "password", "confirmPassword"];
// Tracks whether the user has interacted with/visited specific fields
const touched = {};

// Validates field values based on specific input criteria
function validate(field, value) {
  switch (field) {
    case "name":
      // Validates that the name has at least 2 characters excluding leading/trailing spaces
      return value.trim().length >= 2 ? "" : "Enter at least 2 characters";
    case "email":
      // Validates standard email formats using RegExp
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Enter a valid email address";
    case "phone":
      // Validates that the value matches a standard Egyptian phone number after removing spaces/dashes
      return /^01[0125][0-9]{8}$/.test(value.replace(/[\s-]/g, "")) ? "" : "Enter a valid Egyptian phone number (e.g. 01012345678)";
    case "password":
      // Validates minimum password length constraint
      return value.length >= 6 ? "" : "Use at least 6 characters";
    case "confirmPassword":
      // Validates that the confirmation field matches the original password input field value
      return value === document.getElementById("password").value ? "" : "Passwords don't match";
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
    // Re-evaluate confirmation field in real-time if the main password field is changing
    if (field === "password") renderFieldState("confirmPassword");
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
    if (!input) return;
    
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

// Displays registration/server response error panels
function showServerError(message) {
  document.getElementById("serverErrorText").textContent = message;
  document.getElementById("serverError").classList.add("show");
}

// Hides registration/server response error panels
function hideServerError() {
  document.getElementById("serverError").classList.remove("show");
}

// Map generic or raw backend error messages into client-friendly statements
function friendlyError(rawMessage) {
  if (!rawMessage) return "Something went wrong. Please try again.";
  // Detect unique index errors for email inside MongoDB/Mongoose responses
  if (rawMessage.includes("E11000") && rawMessage.includes("email")) {
    return "An account with this email already exists.";
  }
  if (rawMessage.includes("E11000")) {
    return "That value is already in use.";
  }
  if (rawMessage.toLowerCase().includes("validation failed")) {
    return "Please check your details and try again.";
  }
  return rawMessage;
}

// Manages button text strings, arrow indicators, and disabled attributes during submission cycles
function setSubmitting(isSubmitting) {
  const btn = document.getElementById("submitBtn");
  document.getElementById("submitLabel").textContent = isSubmitting ? "Creating account..." : "Create account";
  document.getElementById("submitArrow").style.display = isSubmitting ? "none" : "inline-block";
  btn.disabled = isSubmitting;
}

// Handles form submission intercept, local validation enforcement, API fetch requests, and state transitions
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Force all fields to be marked as touched when clicking create account
  fields.forEach((f) => (touched[f] = true));
  
  // Validate and render error UI for everything immediately
  const errors = fields.map((f) => renderFieldState(f));

  // Determine if any layout elements failed client validation parameters
  const firstErrorIndex = errors.findIndex((err) => err !== "");
  if (firstErrorIndex !== -1) {
    // Automatically jump the user's cursor to the first input field that failed
    document.getElementById(fields[firstErrorIndex]).focus();
    return; // Stops the form from submitting
  }

  // Activate loading/submitting states
  setSubmitting(true);
  hideServerError();

  // Construct data object package to send to the server
  const payload = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value.replace(/[\s-]/g, ""),
    password: document.getElementById("password").value,
  };

  try {
    // Initiate POST request authentication to backend API routes
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");

    // Toggle UI views to indicate a complete and successful setup card state
    document.getElementById("formSection").classList.add("hide");
    document.getElementById("successCard").classList.add("show");

    // Success redirect out to login interface after delay
    setTimeout(() => {
      window.location.href = "./login.html";
    }, 2000);
  } catch (err) {
    // Render errors to the client UI layout
    const message = friendlyError(err.message);
    showServerError(message);

    // Apply error container status highlight specifically to the email block if designated
    if (err.message && err.message.includes("email")) {
      document.querySelector('.field[data-field="email"]').classList.add("error");
    }
  } finally {
    // Terminate submission cycle status states
    setSubmitting(false);
  }
});