(() => {
  const header = document.querySelector(".site-nav");
  const toggle = document.querySelector(".mobile-menu-toggle");
  if (!header || !toggle) return;

  function setOpen(open) {
    header.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute(
      "aria-label",
      open ? "Close navigation menu" : "Open navigation menu",
    );
  }

  toggle.addEventListener("click", () =>
    setOpen(!header.classList.contains("menu-open")),
  );
  document.addEventListener("click", (event) => {
    if (
      header.classList.contains("menu-open") &&
      !header.contains(event.target)
    )
      setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 640) setOpen(false);
  });
})();
