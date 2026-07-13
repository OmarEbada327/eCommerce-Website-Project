/* Shared API client for SILICON HOUSE.
   Change baseUrl here when deploying the frontend to another environment. */
(() => {
  const baseUrl = "http://localhost:3000";

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

  window.SiliconHouseApi = Object.freeze({
    baseUrl,
    request,
    get: (path, options = {}) => request(path, { ...options, method: "GET" }),
    post: (path, body, options = {}) => request(path, { ...options, method: "POST", body: JSON.stringify(body) }),
    put: (path, body, options = {}) => request(path, { ...options, method: "PUT", body: JSON.stringify(body) }),
    patch: (path, body, options = {}) => request(path, { ...options, method: "PATCH", body: JSON.stringify(body) }),
    del: (path, options = {}) => request(path, { ...options, method: "DELETE" }),
  });
})();
