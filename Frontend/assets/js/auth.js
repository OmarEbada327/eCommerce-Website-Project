/* ==========================================================================
   SILICON HOUSE — Authentication Utilities
   Token and session management for JWT-based authentication.
   Supports both localStorage (persistent / "Remember me") and
   sessionStorage (tab-scoped) storage strategies.
   Exposes helper functions consumed by every page script.
   ========================================================================== */

/**
 * Persists the JWT token and user object to the active storage backend,
 * and cleans up the unused storage to keep state consistent.
 *
 * @param {string} token    – The JWT returned by the backend.
 * @param {Object} user     – The authenticated user { name, email, role, ... }.
 * @param {boolean} remember – true → localStorage, false → sessionStorage.
 */
function saveSession(token, user, remember) {
  const activeStorage = remember ? localStorage : sessionStorage;
  const otherStorage = remember ? sessionStorage : localStorage;

  activeStorage.setItem("authToken", token);
  activeStorage.setItem("authUser", JSON.stringify(user));

  otherStorage.removeItem("authToken");
  otherStorage.removeItem("authUser");
}

/**
 * Retrieves the JWT from whichever storage holds it.
 *
 * @returns {string|null} The bearer token, or null if the user isn't logged in.
 */
function getToken() {
  return (
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
  );
}

/**
 * Retrieves and parses the serialised user profile.
 *
 * @returns {Object|null} The user object, or null if no session exists.
 */
function getUser() {
  const raw =
    localStorage.getItem("authUser") || sessionStorage.getItem("authUser");
  return raw ? JSON.parse(raw) : null;
}

/**
 * Quick check for an active session.
 *
 * @returns {boolean} true if a token is present in any storage.
 */
function isLoggedIn() {
  return !!getToken();
}

/**
 * Destroys the session by removing credentials from both localStorage
 * and sessionStorage. Call on sign-out or token expiry.
 */
function clearSession() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
  sessionStorage.removeItem("authToken");
  sessionStorage.removeItem("authUser");
}

/**
 * Wrapper around the raw API client that automatically attaches the
 * Authorization header if a session exists.
 *
 * @param {string} path         – API endpoint path.
 * @param {Object} [options]    – Fetch options (method, body, headers, etc.).
 * @returns {Promise<Object>}   – The JSON response from the backend.
 */
async function authFetch(path, options = {}) {
  if (!window.SiliconHouseApi) throw new Error("API client is not loaded");
  const token = getToken();
  const headers = {
    ...(options.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  return window.SiliconHouseApi.request(path, { ...options, headers });
}