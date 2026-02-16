// js/ui/tabs.js
(function () {
  const tabs = document.querySelectorAll(".tabs button");
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const target = tab.dataset.tab;

      switch (target) {
        case "chat":
          window.location.href = "chat.html";
          break;
        case "group":
          window.location.href = "group.html";
          break;
        case "call":
          window.location.href = "call.html";
          break;
      }
    });
  });
})();
