/* ==========================================================================
   SILICON HOUSE — Responsive Navigation Toggle
   Drives the mobile hamburger-menu behaviour for both the customer-facing
   (.site-nav) and admin (.admin-nav) headers. Uses aria-expanded for
   accessibility and collapses the menu automatically on resize past the
   toggle button's CSS breakpoint.
   ========================================================================== */

(() => {
  /**
   * The navigation header — matches either the customer or admin variant.
   * @type {Element|null}
   */
  const header = document.querySelector(".site-nav, .admin-nav");

  /**
   * The hamburger button inside the header.
   * @type {Element|null}
   */
  const toggle = document.querySelector(".mobile-menu-toggle");

  // Bail early if the markup is incomplete (should never happen on real pages).
  if (!header || !toggle) return;

  /**
   * Opens or closes the mobile navigation menu by toggling a `.menu-open`
   * class on the header and updating the toggle button's ARIA attributes.
   *
   * @param {boolean} open – true to open the menu, false to close it.
   */
  function setOpen(open) {
    header.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute(
      "aria-label",
      open ? "Close navigation menu" : "Open navigation menu",
    );
  }

  // Toggle on hamburger click.
  toggle.addEventListener("click", () =>
    setOpen(!header.classList.contains("menu-open")),
  );

  // Close when the user clicks outside the header (click-away dismiss).
  document.addEventListener("click", (event) => {
    if (
      header.classList.contains("menu-open") &&
      !header.contains(event.target)
    )
      setOpen(false);
  });

  // Close on Escape key for keyboard accessibility.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });

  // Collapse the menu if the viewport grows enough that the toggle button
  // is hidden by its own CSS `display: none` breakpoint.
  window.addEventListener("resize", () => {
    if (window.getComputedStyle(toggle).display === "none") setOpen(false);
  });
})();