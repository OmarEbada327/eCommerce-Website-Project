// ---------------------------------------------------------------------
// Point this at your running backend.
// ---------------------------------------------------------------------
const API_BASE = "http://localhost:3000";

const form = document.getElementById("registerForm");
const fields = ["name", "email", "phone", "password", "confirmPassword"];
const touched = {};

function validate(field, value) {
  switch (field) {
    case "name":
      return value.trim().length >= 2 ? "" : "Enter at least 2 characters";
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Enter a valid email address";
    case "phone":
      return /^[0-9+\s-]{8,15}$/.test(value) ? "" : "Enter a valid phone number";
    case "password":
      return value.length >= 6 ? "" : "Use at least 6 characters";
    case "confirmPassword":
      return value === document.getElementById("password").value ? "" : "Passwords don't match";
    default:
      return "";
  }
}

function renderFieldState(field) {
  const wrap = document.querySelector(`.field[data-field="${field}"]`);
  const value = document.getElementById(field).value;
  const error = validate(field, value);

  wrap.classList.remove("valid", "error");
  if (touched[field] && value.length > 0) {
    wrap.classList.add(error ? "error" : "valid");
  }
  const dot = wrap.querySelector(".pin-dot");
  dot.classList.remove("valid", "error");
  if (touched[field] && value.length > 0) {
    dot.classList.add(error ? "error" : "valid");
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
    if (field === "password") renderFieldState("confirmPassword");
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
    const confirmInput = document.getElementById("confirmPassword");
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    if (confirmInput) confirmInput.type = isHidden ? "text" : "password";
  });
});

function showServerError(message) {
  document.getElementById("serverErrorText").textContent = message;
  document.getElementById("serverError").classList.add("show");
}
function hideServerError() {
  document.getElementById("serverError").classList.remove("show");
}

function setSubmitting(isSubmitting) {
  const btn = document.getElementById("submitBtn");
  document.getElementById("submitLabel").textContent = isSubmitting ? "Creating account..." : "Create account";
  document.getElementById("submitArrow").style.display = isSubmitting ? "none" : "inline-block";
  btn.disabled = isSubmitting;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  fields.forEach((f) => (touched[f] = true));
  const errors = fields.map((f) => renderFieldState(f));
  const isValid = errors.every((err) => err === "");
  if (!isValid) return;

  setSubmitting(true);
  hideServerError();

  const payload = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    password: document.getElementById("password").value,
  };

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");

    document.getElementById("formSection").classList.add("hide");
    document.getElementById("successCard").classList.add("show");
  } catch (err) {
    showServerError(err.message || "Something went wrong. Try again.");
  } finally {
    setSubmitting(false);
  }
});