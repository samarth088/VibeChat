// js/ui/menu.js
(function () {
  const menuBtn = document.getElementById("menuBtn");
  const menu = document.getElementById("chatMenu");

  if (!menuBtn || !menu) return;

  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("hidden");
  });

  document.addEventListener("click", () => {
    menu.classList.add("hidden");
  });

  menu.addEventListener("click", (e) => {
    const action = e.target.dataset.action;
    if (!action) return;

    const chatId = App.state.getState().ui.activeChatId;

    switch (action) {
      case "mute":
        alert("Muted (dummy)");
        break;
      case "clear":
        App.state.setState({ messages: {} });
        break;
      case "delete":
        alert("Delete chat requires backend");
        break;
    }

    menu.classList.add("hidden");
  });
})();
