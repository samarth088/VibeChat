// js/pages/chat.js

(function () {
  // ====== SAFETY CHECK ======
  if (!window.App || !App.state || !App.api || !App.socket) {
    console.error("Core modules missing");
    return;
  }

  // ====== DOM REFERENCES ======
  const chatListEl = document.querySelector(".chat-list");
  const messagesEl = document.querySelector(".messages");
  const formEl = document.querySelector(".chat-input");
  const inputEl = formEl.querySelector("input");
  const headerTitleEl = document.querySelector(".chat-header .title");

  // ====== LOCAL CACHE ======
  let activeChatId = null;

  // ====== HELPERS ======
  function createMessageBubble(message, isOutgoing) {
    const div = document.createElement("div");
    div.className = `message ${isOutgoing ? "outgoing" : "incoming"}`;
    div.textContent = message.content;
    return div;
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // ====== RENDER FUNCTIONS ======
  function renderChatList(chats) {
    chatListEl.innerHTML = "";

    Object.values(chats).forEach(chat => {
      const item = document.createElement("div");
      item.className = "chat-item";
      if (chat.id === activeChatId) item.classList.add("active");

      item.innerHTML = `
        <div class="chat-name">${chat.name}</div>
        <div class="chat-last">${chat.lastMessage || ""}</div>
      `;

      item.onclick = () => selectChat(chat.id);
      chatListEl.appendChild(item);
    });
  }

  function renderMessages(chatId, messagesMap) {
    messagesEl.innerHTML = "";

    const msgs = Object.values(messagesMap)
      .filter(m => m.chatId === chatId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    msgs.forEach(msg => {
      const bubble = createMessageBubble(
        msg,
        msg.senderId === App.state.getState().currentUser?.id
      );
      messagesEl.appendChild(bubble);
    });

    scrollToBottom();
  }

  // ====== CHAT SELECTION ======
  async function selectChat(chatId) {
    activeChatId = chatId;
    App.state.setState({ ui: { activeChatId: chatId } });

    const state = App.state.getState();
    const chat = state.chats[chatId];
    if (!chat) return;

    headerTitleEl.textContent = chat.name;

    // Load messages if not already present
    const hasMessages = Object.values(state.messages)
      .some(m => m.chatId === chatId);

    if (!hasMessages) {
      try {
        const res = await App.api.fetchMessages(chatId);
        App.state.upsertMessages(res);
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    }

    renderMessages(chatId, App.state.getState().messages);
  }

  // ====== SEND MESSAGE ======
  async function sendMessage(text) {
    if (!activeChatId || !text) return;

    const user = App.state.getState().currentUser;
    const tempId = "temp_" + Date.now();

    // Optimistic UI
    const optimisticMsg = {
      id: tempId,
      chatId: activeChatId,
      senderId: user.id,
      content: text,
      createdAt: new Date().toISOString(),
      status: "sending"
    };

    App.state.upsertMessages(optimisticMsg);
    renderMessages(activeChatId, App.state.getState().messages);

    // Try socket first
    try {
      App.socket.emit("send_message", {
        chatId: activeChatId,
        content: text,
        tempId
      });
    } catch (e) {
      // fallback to REST
      try {
        const saved = await App.api.sendMessageREST(activeChatId, text);
        App.state.upsertMessages(saved);
      } catch (err) {
        console.error("Message send failed", err);
      }
    }
  }

  // ====== SOCKET EVENTS ======
  App.socket.on("message", (msg) => {
    App.state.upsertMessages(msg);

    if (msg.chatId === activeChatId) {
      const bubble = createMessageBubble(msg, false);
      messagesEl.appendChild(bubble);
      scrollToBottom();
    }
  });

  // ====== FORM HANDLER ======
  formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = "";
    sendMessage(text);
  });

  // ====== STATE SUBSCRIPTIONS ======
  App.state.subscribeKey("chats", (chats) => {
    renderChatList(chats);
  });

  // ====== INITIAL LOAD ======
  async function init() {
    try {
      const chats = await App.api.fetchChats();
      App.state.upsertChats(chats);

      // Auto select first chat
      const first = chats[0];
      if (first) selectChat(first.id);

    } catch (err) {
      console.error("Init failed", err);
    }
  }

  init();
})();
