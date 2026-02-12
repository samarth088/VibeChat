// =============================
// IMPORTS
// =============================
import { API } from "../core/api.js";
import { State } from "../core/state.js";
import { initSocket, getSocket } from "../core/socket.js";

// =============================
// AUTH CHECK
// =============================
if (!State.currentUser) {
  window.location.href = "../../index.html";
}

// =============================
// INIT SOCKET
// =============================
initSocket();
const socket = getSocket();

// =============================
// DOM
// =============================
const chatList = document.getElementById("chatList");
const chatBody = document.getElementById("chatBody");
const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("messageInput");

let activeUserId = null;

// =============================
// LOAD USERS
// =============================
async function loadUsers() {
  const users = await API.getUsers();

  users.forEach(user => {
    if (user._id === State.currentUser.id) return;

    const li = document.createElement("li");
    li.innerText = user.username;
    li.dataset.id = user._id;

    li.onclick = () => {
      activeUserId = user._id;
      chatBody.innerHTML = "";
      document.getElementById("chatHeader").innerText = user.username;
    };

    chatList.appendChild(li);
  });
}

loadUsers();

// =============================
// SEND MESSAGE
// =============================
if (sendBtn) {
  sendBtn.onclick = () => {
    const text = messageInput.value.trim();
    if (!text || !activeUserId) return;

    socket.emit("private-message", {
      from: State.currentUser.id,
      to: activeUserId,
      text
    });

    messageInput.value = "";
  };
}

// =============================
// RECEIVE MESSAGE
// =============================
if (socket) {
  socket.on("private-message", msg => {
    renderMessage(msg);
  });

  socket.on("message-sent", msg => {
    renderMessage(msg);
  });
}

// =============================
// RENDER MESSAGE
// =============================
function renderMessage(msg) {

  const isMe = msg.from === State.currentUser.id;

  const div = document.createElement("div");
  div.className = "msg " + (isMe ? "me" : "other");

  div.innerHTML = `
    <div class="bubble">
      ${msg.text}
      <div class="meta">
        <small>${new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })}</small>
      </div>
    </div>
  `;

  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
}
