// js/ui/header.js
(function () {
  if (!window.App || !App.state) return;

  const backBtn = document.getElementById("backBtn");
  const titleEl = document.querySelector(".chat-header .title");
  const voiceBtn = document.getElementById("voiceCallBtn");
  const videoBtn = document.getElementById("videoCallBtn");

  backBtn?.addEventListener("click", () => {
    // mobile back to list
    document.body.classList.remove("chat-open");
  });

  voiceBtn?.addEventListener("click", () => {
    const chatId = App.state.getState().ui.activeChatId;
    if (chatId) window.location.href = `call.html?type=voice&chat=${chatId}`;
  });

  videoBtn?.addEventListener("click", () => {
    const chatId = App.state.getState().ui.activeChatId;
    if (chatId) window.location.href = `call.html?type=video&chat=${chatId}`;
  });

  // Update header title when chat changes
  App.state.subscribeKey("ui", (ui) => {
    const chat = App.state.getState().chats[ui.activeChatId];
    if (chat && titleEl) titleEl.textContent = chat.name;
  });
})();
