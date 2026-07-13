function saveSession(token, user, remember) {
  const activeStorage = remember ? localStorage : sessionStorage;
  const otherStorage = remember ? sessionStorage : localStorage;

  activeStorage.setItem("authToken", token);
  activeStorage.setItem("authUser", JSON.stringify(user));

  // Clear the other storage so a stale session can't linger there
  // from a previous login with the opposite "remember me" choice.
  otherStorage.removeItem("authToken");
  otherStorage.removeItem("authUser");
}

function getToken() {
  return localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
}

function getUser() {
  const raw = localStorage.getItem("authUser") || sessionStorage.getItem("authUser");
  return raw ? JSON.parse(raw) : null;
}

function isLoggedIn() {
  return !!getToken();
}

function clearSession() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
  sessionStorage.removeItem("authToken");
  sessionStorage.removeItem("authUser");
}

// Convenience wrapper for authenticated fetch calls elsewhere.
// Usage: authFetch("/cart", { method: "POST", body: JSON.stringify(...) })
async function authFetch(path, options = {}) {
  if (!window.SiliconHouseApi) throw new Error("API client is not loaded");
  const token = getToken();
  const headers = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  return window.SiliconHouseApi.request(path, { ...options, headers });
}
