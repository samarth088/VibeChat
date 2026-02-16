// js/ui/modal.js
(function () {
  const backdrop = document.getElementById("modalRoot");
  const content = document.getElementById("modalContent");

  if (!backdrop || !content) return;

  function open(html) {
    content.innerHTML = html;
    backdrop.classList.remove("hidden");
  }

  function close() {
    backdrop.classList.add("hidden");
    content.innerHTML = "";
  }

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });

  window.App = window.App || {};
  App.modal = { open, close };
})();
