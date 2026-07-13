const $ = (id) => document.getElementById(id);

// Must match what the backend actually accepts (uploadMiddleware.js /
// multer-storage-cloudinary's allowedFormats), so bad files get stopped
// here instead of round-tripping to the server first.
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_COUNT = 5;

let allProducts = [];
let editingId = null; // null = create mode, otherwise the product's _id
let deleteTargetId = null;

// ---------------------------------------------------------------------
// Helpers (same patterns used across the other pages)
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

function friendlyError(rawMessage) {
  if (!rawMessage) return "Something went wrong. Please try again.";
  if (rawMessage.toLowerCase().includes("not authorized")) {
    return "Your session has expired. Please sign in again.";
  }
  if (rawMessage.toLowerCase().includes("admin only")) {
    return "Only admin accounts can do this.";
  }
  return rawMessage;
}

// ---------------------------------------------------------------------
// Access guard — this whole page is admin-only.
// Runs before anything else on the page.
// ---------------------------------------------------------------------
function enforceAdminAccess() {
  const loggedIn = typeof isLoggedIn === "function" && isLoggedIn();
  const user = typeof getUser === "function" ? getUser() : null;
  const isAdmin = loggedIn && user && user.role === "admins";

  if (!isAdmin) {
    $("accessNotice").classList.remove("hidden");
    $("openAddBtn").style.display = "none";
    document.querySelector(".admin-table-wrap").style.display = "none";
    setTimeout(() => {
      window.location.href = loggedIn ? "../../index.html" : "../auth/login.html";
    }, 1800);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------
$("signOutBtn").addEventListener("click", () => {
  clearSession();
  window.location.href = "../../index.html";
});

// ---------------------------------------------------------------------
// Load + render product table
// ---------------------------------------------------------------------
async function loadProducts() {
  try {
    const payload = await authFetch("/products");
    allProducts = unwrap(payload) || [];
    renderTable();
  } catch (err) {
    $("productTableBody").innerHTML =
      `<tr><td colspan="6" class="empty-row">Couldn't load products: ${friendlyError(err.message)}</td></tr>`;
  }
}

function renderTable() {
  if (allProducts.length === 0) {
    $("productTableBody").innerHTML = `<tr><td colspan="6" class="empty-row">No products yet. Add your first one.</td></tr>`;
    return;
  }

  $("productTableBody").innerHTML = allProducts.map((p) => {
    const thumb = (p.images && p.images.length && p.images[0].url)
      ? `<img class="row-thumb" src="${p.images[0].url}" alt="${p.name}" />`
      : `<div class="row-thumb-placeholder"></div>`;

    const stockClass = p.quantity <= 5 ? "low" : "ok";

    return `
      <tr data-id="${p._id}">
        <td class="col-img">${thumb}</td>
        <td>${p.name}</td>
        <td><span class="row-category">${p.category}</span></td>
        <td class="col-num">${money(p.price)}</td>
        <td class="col-num"><span class="stock-pill ${stockClass}">${p.quantity}</span></td>
        <td class="col-actions">
          <div class="row-actions">
            <button class="icon-btn edit-btn" title="Edit" data-id="${p._id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
            </button>
            <button class="icon-btn danger delete-btn" title="Delete" data-id="${p._id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
  }).join("");

  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => openEditModal(btn.dataset.id));
  });
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => openDeleteModal(btn.dataset.id));
  });
}

// ---------------------------------------------------------------------
// Add/Edit modal
// ---------------------------------------------------------------------
const formFields = ["name", "price", "quantity", "category", "description"];
const touched = {};

function validateField(field) {
  const value = $(field).value;
  switch (field) {
    case "name":
      return value.trim().length >= 2 ? "" : "Enter a product name";
    case "price":
      return value !== "" && Number(value) >= 0 ? "" : "Enter a valid price";
    case "quantity":
      return value !== "" && Number.isInteger(Number(value)) && Number(value) >= 0 ? "" : "Enter a valid quantity";
    case "category":
      return value ? "" : "Choose a category";
    case "description":
      return value.trim().length >= 10 ? "" : "Enter at least 10 characters";
    default:
      return "";
  }
}

function renderFieldState(field) {
  const wrap = document.querySelector(`.field[data-field="${field}"]`);
  const error = validateField(field);
  wrap.classList.toggle("error", touched[field] ? !!error : false);
  const errEl = wrap.querySelector(".field-error");
  if (errEl && error) errEl.textContent = error;
  return error;
}

formFields.forEach((field) => {
  $(field).addEventListener("input", () => {
    hideFormError();
    renderFieldState(field);
  });
  $(field).addEventListener("blur", () => {
    touched[field] = true;
    renderFieldState(field);
  });
});

function validateImages(required) {
  const files = Array.from($("images").files);

  if (files.length === 0) {
    return required ? "At least one image is required" : "";
  }
  if (files.length > MAX_IMAGE_COUNT) {
    return `You can upload up to ${MAX_IMAGE_COUNT} images at once`;
  }
  const badType = files.find((f) => !ALLOWED_IMAGE_TYPES.includes(f.type));
  if (badType) {
    return `"${badType.name}" isn't a supported format — use JPG, PNG, or WEBP`;
  }
  const tooBig = files.find((f) => f.size > MAX_IMAGE_SIZE);
  if (tooBig) {
    return `"${tooBig.name}" is over 5MB — please use a smaller file`;
  }
  return "";
}

function renderImagesFieldState() {
  const wrap = document.querySelector('.field[data-field="images"]');
  const error = validateImages(!editingId);
  wrap.classList.toggle("error", !!error);
  const errEl = wrap.querySelector(".field-error");
  if (errEl) errEl.textContent = error || "At least one image is required";
  return error;
}

$("images").addEventListener("change", () => {
  hideFormError();
  renderImagesFieldState();
});

function showFormError(message) {
  $("formErrorText").textContent = message;
  $("formError").classList.add("show");
}
function hideFormError() {
  $("formError").classList.remove("show");
}

function resetForm() {
  $("productForm").reset();
  $("productId").value = "";
  formFields.forEach((f) => {
    touched[f] = false;
    document.querySelector(`.field[data-field="${f}"]`).classList.remove("error");
  });
  document.querySelector('.field[data-field="images"]').classList.remove("error");
  hideFormError();
}

function openAddModal() {
  editingId = null;
  resetForm();
  $("modalTitle").textContent = "Add product";
  $("saveBtnLabel").textContent = "Save product";
  $("imagesLabel").textContent = "Images (up to 5) — required";
  $("existingImagesNote").classList.add("hidden");
  $("productModalOverlay").classList.add("open");
}

function openEditModal(id) {
  const product = allProducts.find((p) => p._id === id);
  if (!product) return;

  editingId = id;
  resetForm();
  $("productId").value = id;
  $("name").value = product.name;
  $("price").value = product.price;
  $("quantity").value = product.quantity;
  $("category").value = product.category;
  $("description").value = product.description;

  $("modalTitle").textContent = "Edit product";
  $("saveBtnLabel").textContent = "Save changes";
  $("imagesLabel").textContent = "Images (up to 5) — optional";
  $("existingImagesNote").classList.remove("hidden");
  $("productModalOverlay").classList.add("open");
}

function closeProductModal() {
  $("productModalOverlay").classList.remove("open");
}

$("openAddBtn").addEventListener("click", openAddModal);
$("modalClose").addEventListener("click", closeProductModal);
$("productModalOverlay").addEventListener("click", (e) => {
  if (e.target.id === "productModalOverlay") closeProductModal();
});

// ---------------------------------------------------------------------
// Submit create/edit
// ---------------------------------------------------------------------
function setSaving(isSaving) {
  $("saveBtn").disabled = isSaving;
  $("saveBtnLabel").textContent = isSaving
    ? "Saving..."
    : (editingId ? "Save changes" : "Save product");
}

$("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  formFields.forEach((f) => (touched[f] = true));
  const errors = formFields.map((f) => renderFieldState(f));

  const imagesInput = $("images");
  const imagesError = renderImagesFieldState();
  if (imagesError) errors.push(imagesError);

  if (errors.some((err) => err !== "")) {
    return;
  }

  setSaving(true);
  hideFormError();

  const formData = new FormData();
  formData.append("name", $("name").value.trim());
  formData.append("price", $("price").value);
  formData.append("quantity", $("quantity").value);
  formData.append("category", $("category").value);
  formData.append("description", $("description").value.trim());
  for (const file of imagesInput.files) {
    formData.append("images", file);
  }

  try {
    if (editingId) {
      await authFetch(`/products/${editingId}`, { method: "PUT", body: formData });
      showToast("Product updated");
    } else {
      await authFetch("/products", { method: "POST", body: formData });
      showToast("Product created");
    }
    closeProductModal();
    await loadProducts();
  } catch (err) {
    showFormError(friendlyError(err.message));
  } finally {
    setSaving(false);
  }
});

// ---------------------------------------------------------------------
// Delete modal
// ---------------------------------------------------------------------
function openDeleteModal(id) {
  const product = allProducts.find((p) => p._id === id);
  if (!product) return;
  deleteTargetId = id;
  $("deleteProductName").textContent = product.name;
  $("deleteModalOverlay").classList.add("open");
}
function closeDeleteModal() {
  $("deleteModalOverlay").classList.remove("open");
  deleteTargetId = null;
}

$("deleteModalClose").addEventListener("click", closeDeleteModal);
$("cancelDeleteBtn").addEventListener("click", closeDeleteModal);
$("deleteModalOverlay").addEventListener("click", (e) => {
  if (e.target.id === "deleteModalOverlay") closeDeleteModal();
});

$("confirmDeleteBtn").addEventListener("click", async () => {
  if (!deleteTargetId) return;
  try {
    await authFetch(`/products/${deleteTargetId}`, { method: "DELETE" });
    showToast("Product deleted");
    closeDeleteModal();
    await loadProducts();
  } catch (err) {
    showToast(friendlyError(err.message));
  }
});

// ---------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------
if (enforceAdminAccess()) {
  loadProducts();
}
