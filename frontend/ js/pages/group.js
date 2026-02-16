// js/pages/group.js
(function () {
  if (!window.App || !App.state || !App.socket) {
    console.error("Core missing");
    return;
  }

  const groupListEl = document.querySelector(".group-list");
  const messagesEl = document.querySelector(".messages");
  const formEl = document.querySelector(".chat-input");
  const inputEl = formEl.querySelector("input");

  let activeGroupId = null;

  function renderMessages(groupId) {
    const state = App.state.getState();
    messagesEl.innerHTML = "";

    Object.values(state.messages)
      .filter(m => m.chatId === groupId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .forEach(m => {
        const div = document.createElement("div");
        div.className = "message " + (m.senderId === state.currentUser?.id ? "outgoing" : "incoming");
        div.innerHTML = `<div class="sender">${m.senderName || ""}</div>${m.content}`;
        messagesEl.appendChild(div);
      });

    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  groupListEl?.addEventListener("click", (e) => {
    const item = e.target.closest(".group-item");
    if (!item) return;
    activeGroupId = item.dataset.id;
    renderMessages(activeGroupId);
  });

  formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = inputEl.value.trim();
    if (!text || !activeGroupId) return;

    App.socket.emit("send_group_message", {
      groupId: activeGroupId,
      content: text
    });

    inputEl.value = "";
  });

  App.socket.on("group_message", (msg) => {
    App.state.upsertMessages(msg);
    if (msg.chatId === activeGroupId) renderMessages(activeGroupId);
  });
})();
