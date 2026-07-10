
const API_BASE = "http://localhost:3000";

const form = document.getElementById("loginForm");
const fields = ["email", "password"];
const touched = {};

window.addEventListener("DOMContentLoaded", () => {
  const savedEmail = localStorage.getItem("silicon_house_remembered_email");
  if (savedEmail) {
    const emailInput = document.getElementById("email");
    emailInput.value = savedEmail;
    document.getElementById("rememberMe").checked = true;
    
    // Mark it as touched and render its valid state on load
    touched["email"] = true;
    renderFieldState("email");
  }
});

function validate(field, value) {
  switch (field) {
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Enter a valid email address";
    case "password":
      return value.length > 0 ? "" : "Enter your password";
    default:
      return "";
  }
}

function renderFieldState(field) {
  const wrap = document.querySelector(`.field[data-field="${field}"]`);
  const value = document.getElementById(field).value;
  const error = validate(field, value);

  // 1. Reset all states first
  wrap.classList.remove("valid", "error");
  const dot = wrap.querySelector(".pin-dot");
  dot.classList.remove("valid", "error");

  // 2. Apply states cleanly if touched
  if (touched[field]) {
    if (error) {
      // If there's an error, it's ALWAYS an error (even if empty)
      wrap.classList.add("error");
      dot.classList.add("error");
    } else if (value.length > 0) {
      // Only mark it valid if it has content and no errors
      wrap.classList.add("valid");
      dot.classList.add("valid");
    }
  }

  const errEl = wrap.querySelector(".field-error");
  if (errEl && error) errEl.textContent = error;
  return error;
}

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

document.querySelectorAll(".toggle-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.getAttribute("data-toggle");
    const input = document.getElementById(targetId);
    const isHidden = input.type === "password";
    
    // Toggle password character type
    input.type = isHidden ? "text" : "password";
    
    // Swap icon dynamically between Eye and Eye-Off (Slashed)
    if (isHidden) {
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>`;
    } else {
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>`;
    }
  });
});

function showServerError(message) {
  document.getElementById("serverErrorText").textContent = message;
  document.getElementById("serverError").classList.add("show");
}
function hideServerError() {
  document.getElementById("serverError").classList.remove("show");
}

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

function setSubmitting(isSubmitting) {
  const btn = document.getElementById("submitBtn");
  document.getElementById("submitLabel").textContent = isSubmitting ? "Signing in..." : "Sign in";
  document.getElementById("submitArrow").style.display = isSubmitting ? "none" : "inline-block";
  btn.disabled = isSubmitting;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  fields.forEach((f) => (touched[f] = true));
  const errors = fields.map((f) => renderFieldState(f));

  const firstErrorIndex = errors.findIndex((err) => err !== "");
  if (firstErrorIndex !== -1) {
    // Automatically jump the user's cursor to the first input field that failed
    document.getElementById(fields[firstErrorIndex]).focus();
    return; // Stops the form from submitting
  }

  setSubmitting(true);
  hideServerError();

  const payload = {
    email: document.getElementById("email").value,
    password: document.getElementById("password").value,
  };

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Sign in failed");

    localStorage.setItem("authToken", data.token);
    localStorage.setItem("authUser", JSON.stringify(data.user));

    const rememberMeCheckbox = document.getElementById("rememberMe");
    if (rememberMeCheckbox.checked) {
      localStorage.setItem("silicon_house_remembered_email", document.getElementById("email").value);
    } else {
      localStorage.removeItem("silicon_house_remembered_email");
    }

    window.location.href = "../index.html";
  } catch (err) {
    showServerError(friendlyError(err.message));
    document.querySelector('.field[data-field="password"]').classList.add("error");
  } finally {
    setSubmitting(false);
  }
});