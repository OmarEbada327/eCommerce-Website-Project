/* ==========================================================================
   SILICON HOUSE — API Client
   Centralised HTTP client for communicating with the Express backend.
   Exposes a frozen `window.SiliconHouseApi` object with convenience methods
   for GET, POST, PUT, PATCH, and DELETE requests. Supports both JSON and
   FormData payloads automatically.
   ========================================================================== */

(() => {
  /** The root URL of the Express backend server. */
  const baseUrl = "http://localhost:3000";

  /**
   * Core request handler — sends an HTTP request and parses the JSON response.
   * Automatically sets 'Content-Type: application/json' unless the body is
   * FormData (letting the browser set the multipart boundary).
   *
   * @param {string} path  – The API endpoint path (e.g. "/products").
   * @param {Object} [options] – Fetch options (method, headers, body, etc.).
   * @returns {Promise<Object>} The parsed JSON response body.
   * @throws {Error} If the server returns a non-2xx status.
   */
  async function request(path, options = {}) {
    const isFormData = options.body instanceof FormData;
    const headers = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    };

    const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  }

  /**
   * Immutable public API surface. Every method returns a Promise that resolves
   * to the server's JSON response.
   */
  window.SiliconHouseApi = Object.freeze({
    baseUrl,
    request,
    get: (path, options = {}) => request(path, { ...options, method: "GET" }),
    post: (path, body, options = {}) =>
      request(path, { ...options, method: "POST", body: JSON.stringify(body) }),
    put: (path, body, options = {}) =>
      request(path, { ...options, method: "PUT", body: JSON.stringify(body) }),
    patch: (path, body, options = {}) =>
      request(path, {
        ...options,
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    del: (path, options = {}) =>
      request(path, { ...options, method: "DELETE" }),
  });
})();