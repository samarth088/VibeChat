// =============================
// Chat Page Logic
// =============================

if (!State.currentUser) {
  window.location.href = "index.html";
  }

  initSocket();

  const socket = getSocket();

  const chatList = document.getElementById("chatList");
  const chatBody = document.getElementById("chatBody");
  const sendBtn = document.getElementById("sendBtn");
  const messageInput = document.getElementById("messageInput");

  let activeUserId = null;

  // Load users
  async function loadUsers() {
    const users = await API.getUsers();

      users.forEach(user => {
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

                                                  // Send message
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

                                                                                            // Receive message
                                                                                            if (socket) {
                                                                                              socket.on("private-message", msg => {
                                                                                                  renderMessage(msg);
                                                                                                    });

                                                                                                      socket.on("message-sent", msg => {
                                                                                                          renderMessage(msg);
                                                                                                            });
                                                                                                            }

                                                                                                            // Render
                                                                                                            function renderMessage(msg) {

                                                                                                              const div = document.createElement("div");
                                                                                                                div.className = "msg " + 
                                                                                                                    (msg.sender === State.currentUser.id ? "me" : "other");

                                                                                                                      div.innerHTML = `
                                                                                                                          <div class="bubble">
                                                                                                                                ${msg.text}
                                                                                                                                      <div class="meta">
                                                                                                                                              <small>${new Date(msg.createdAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</small>
                                                                                                                                                    </div>
                                                                                                                                                        </div>
                                                                                                                                                          `;

                                                                                                                                                            chatBody.appendChild(div);
                                                                                                                                                              chatBody.scrollTop = chatBody.scrollHeight;
                                                                                                                                                              }
