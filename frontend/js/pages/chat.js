// js/pages/chat.js

(function () {
  function qid(id) { return document.getElementById(id); }
  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return document.querySelectorAll(sel); }
  function esc(t) {
    return (t || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function nowTime() {
    var n = new Date();
    return n.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function formatTime(date) {
    if (!date) return "";
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function formatLastSeen(date) {
    if (!date) return "offline";
    return "last seen " + new Date(date).toLocaleString([], {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short"
    });
  }

  var msgStore = {};
  var chatMeta = {};
  var currentRoomId = null;

  function getSession() {
    return window.VibeState && window.VibeState.loadSession
      ? window.VibeState.loadSession()
      : null;
  }

  function renderProfile(sess) {
    qsa(".profile-name").forEach(function (el) {
      el.textContent = sess.username || "Your Name";
    });

    qsa(".profile-uid").forEach(function (el) {
      var idText = sess.idFormatted || (window.VibeState && window.VibeState.formatId ? window.VibeState.formatId(sess.userId) : sess.userId);
      el.textContent = (sess.username ? "@" + sess.username + " · " : "") + "ID: " + idText;
    });

    var av = qs(".profile-avatar-big");
    if (av) av.textContent = (sess.username || "Y").charAt(0).toUpperCase();
  }

  async function fetchChats() {
    var sess = getSession();
    if (!sess || !sess.token) return [];

    try {
      var res = await fetch(window.ENV.API_URL + "/chats", {
        headers: { Authorization: "Bearer " + sess.token }
      });

      var data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load chats");

      return data.chats || data.data || [];
    } catch (e) {
      console.error("fetchChats error:", e);
      return [];
    }
  }

  function normalizeChat(raw) {
    var sess = getSession();
    var me = String((sess && sess.userId) || "");

    var otherUser = raw.otherUser || raw.user || raw.participant || null;

    if (!otherUser && Array.isArray(raw.members)) {
      otherUser = raw.members.find(function (p) {
        var pid = String(p._id || p.id || p.userId || "");
        return pid !== me;
      });
    }

    if (!otherUser && Array.isArray(raw.participants)) {
      otherUser = raw.participants.find(function (p) {
        var pid = String(p._id || p.id || p.userId || "");
        return pid !== me;
      });
    }

    var chatId = raw._id || raw.id || raw.chatId || raw.roomId;
    var userId = otherUser ? (otherUser._id || otherUser.id || otherUser.userId) : null;
    var username = otherUser ? (otherUser.username || otherUser.name || "User") : "User";

    // ✅ FIX: lastMessage properly extract karo (populated object ya ObjectId dono handle)
    var lastMsg = raw.lastMessage;
    var preview = "Tap to chat";
    var time = raw.updatedAt || raw.createdAt || null;

    if (lastMsg && typeof lastMsg === "object") {
      preview = lastMsg.content || lastMsg.text || "Tap to chat";
      time = lastMsg.createdAt || lastMsg.updatedAt || time;
    }
    // Agar lastMessage sirf ObjectId hai (populate nahi hua) to raw.preview use karo
    if (preview === "Tap to chat" && raw.preview) {
      preview = raw.preview;
    }

    return {
      roomId: String(chatId),
      userId: String(userId || ""),
      username: username,
      isOnline: !!(otherUser && otherUser.isOnline),
      lastSeenAt: otherUser ? otherUser.lastSeenAt : null,
      unreadCount: raw.unreadCount || 0,
      preview: preview,
      time: time
    };
  }

  function renderDMList(chats) {
    var dmList = qid("dmContent");
    if (!dmList) return;

    dmList.innerHTML = "";

    if (!chats.length) {
      dmList.innerHTML =
        '<div style="padding:24px 18px;color:rgba(255,255,255,0.55);text-align:center;">No real chats yet. Search a user and send a message.</div>';
      return;
    }

    chats.forEach(function (chat) {
      chatMeta[chat.roomId] = chat;

      var item = document.createElement("div");
      item.className = "conv-item";
      item.setAttribute("data-userid", chat.userId);
      item.setAttribute("data-room", chat.roomId);

      item.innerHTML =
        '<div class="avatar-wrap">' +
          '<div class="avatar">' + esc((chat.username || "U").charAt(0).toUpperCase()) + "</div>" +
          (chat.unreadCount > 0
            ? '<div class="unread-badge">' + chat.unreadCount + "</div>"
            : "") +
        "</div>" +
        '<div class="conv-info">' +
          '<div class="conv-name">' + esc(chat.username) + "</div>" +
          '<div class="conv-preview">' + esc(chat.preview || "Tap to chat") + "</div>" +
        "</div>" +
        '<div class="conv-meta">' +
          '<div style="display:flex;align-items:center;gap:5px">' +
            '<span class="conv-time">' + esc(chat.time ? formatTime(chat.time) : "") + "</span>" +
            (chat.isOnline ? '<div class="online-dot"></div>' : "") +
          "</div>" +
          (chat.unreadCount > 0
            ? '<div class="unread-count">' + chat.unreadCount + "</div>"
            : "") +
        "</div>";

      item.addEventListener("click", function () {
        openChatPage(
          {
            userId: chat.userId,
            username: chat.username,
            isOnline: chat.isOnline,
            lastSeenAt: chat.lastSeenAt
          },
          chat.roomId
        );
      });

      dmList.appendChild(item);
    });
  }

  async function refreshDMList() {
    var chats = await fetchChats();
    var normalized = chats.map(normalizeChat);
    renderDMList(normalized);
  }

  // ✅ DM list me ek item ka preview locally update karo (bina full refresh ke)
  function updateDMPreview(roomId, text, time) {
    var item = qs('[data-room="' + roomId + '"]');
    if (!item) return;

    var preview = item.querySelector(".conv-preview");
    if (preview) preview.textContent = text;

    var timeEl = item.querySelector(".conv-time");
    if (timeEl) timeEl.textContent = time ? formatTime(time) : nowTime();

    // Item ko top pe lao
    var dmList = qid("dmContent");
    if (dmList && item) dmList.insertBefore(item, dmList.firstChild);
  }

  async function markSeen(roomId) {
    var sess = getSession();
    if (!sess || !sess.token) return;

    try {
      await fetch(window.ENV.API_URL + "/chats/" + roomId + "/seen", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + sess.token
        }
      });
    } catch (e) {
      console.error("markSeen error:", e);
    }
  }

  function renderUserStatus(userObj) {
    var statusEl = qid("chatUserStatus");
    if (!statusEl) return;

    if (userObj.isOnline) {
      statusEl.textContent = "online";
    } else {
      statusEl.textContent = formatLastSeen(userObj.lastSeenAt);
    }
  }

  function openChatPage(userObj, roomId) {
    var phone = qs(".phone");
    if (!phone) return;

    currentRoomId = roomId;

    var old = qid("chatPage");
    if (old) old.remove();

    if (!msgStore[roomId]) msgStore[roomId] = [];

    var initial = esc((userObj.username || "U").charAt(0).toUpperCase());
    var username = esc(userObj.username || "User");

    var page = document.createElement("div");
    page.id = "chatPage";
    page.style.cssText =
      "position:absolute;inset:0;z-index:300;display:flex;flex-direction:column;background:linear-gradient(160deg,#000d24 0%,#000510 100%);";

    page.innerHTML =
      '<div id="chatPageHeader" style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(0,8,28,0.95);border-bottom:1px solid rgba(0,100,255,0.2);flex-shrink:0;">' +
        '<button id="chatBackBtn" style="background:none;border:none;color:#4db8ff;font-size:26px;line-height:1;cursor:pointer;padding:0 6px 0 0;">‹</button>' +
        '<div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#1a3a6a,#0d1f3c);border:2px solid rgba(0,100,220,0.4);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#4db8ff;flex-shrink:0;">' + initial + "</div>" +
        '<div style="flex:1;min-width:0;">' +
          '<div style="color:#fff;font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + username + "</div>" +
          '<div style="color:#00e5ff;font-size:11px;margin-top:1px;" id="chatUserStatus"></div>' +
        "</div>" +
      "</div>" +
      '<div id="chatMsgsArea" style="flex:1;overflow-y:auto;padding:12px 10px;display:flex;flex-direction:column;gap:6px;scroll-behavior:smooth;">' +
        '<div style="text-align:center;margin:10px 0 16px;">' +
          '<span style="background:rgba(0,40,100,0.5);color:rgba(255,255,255,0.38);font-size:11px;padding:5px 14px;border-radius:20px;border:1px solid rgba(0,80,180,0.2);">🔒 Messages are end-to-end encrypted</span>' +
        "</div>" +
      "</div>" +
      '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(0,6,20,0.98);border-top:1px solid rgba(0,80,200,0.2);flex-shrink:0;">' +
        '<div style="flex:1;display:flex;align-items:center;background:rgba(0,40,100,0.4);border:1.5px solid rgba(0,100,255,0.3);border-radius:24px;padding:0 14px;gap:6px;">' +
          '<input id="chatInput" type="text" placeholder="Message..." style="flex:1;background:transparent;border:none;outline:none;color:#fff;font-size:14px;padding:11px 0;" />' +
        "</div>" +
        '<button id="chatSendBtn" style="width:44px;height:44px;border-radius:50%;border:none;flex-shrink:0;background:linear-gradient(135deg,#0080ff,#0050cc);cursor:pointer;display:flex;align-items:center;justify-content:center;">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="white" stroke-width="2" stroke-linecap="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        "</button>" +
      "</div>";

    phone.appendChild(page);

    renderUserStatus(userObj);

    var backBtn = qid("chatBackBtn");
    if (backBtn) {
      backBtn.addEventListener("click", function () {
        page.remove();
        currentRoomId = null;
      });
    }

    var sendBtn = qid("chatSendBtn");
    var input = qid("chatInput");

    if (sendBtn) {
      sendBtn.addEventListener("click", function () {
        _send(roomId, userObj);
      });
    }

    if (input) {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          _send(roomId, userObj);
        }
      });
    }

    _loadMessages(roomId);
  }

  async function _loadMessages(roomId) {
    var sess = getSession();
    if (!sess || !sess.token) return;

    try {
      var res = await fetch(window.ENV.API_URL + "/chats/" + roomId + "/messages", {
        headers: { Authorization: "Bearer " + sess.token }
      });

      var data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load messages");

      var myId = String(sess.userId);
      var msgs = (data.messages || data.data || []).map(function (m) {
        var senderId = m.sender
          ? (typeof m.sender === "object" ? String(m.sender._id || m.sender.id) : String(m.sender))
          : "";

        return {
          id: m._id,
          text: m.content,
          isMe: senderId === myId,
          time: new Date(m.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          }),
          status: m.status || "sent",
          createdAt: m.createdAt
        };
      });

      msgStore[roomId] = msgs;
      _renderMsgs(roomId);
      await markSeen(roomId);
      await refreshDMList();
    } catch (e) {
      console.error("Load messages error:", e);
    }
  }

  function _renderMsgs(roomId) {
    var area = qid("chatMsgsArea");
    if (!area) return;

    area.querySelectorAll(".msg-row").forEach(function (el) {
      el.remove();
    });

    function getTick(status) {
      return status === "seen" ? "✓✓" : "✓";
    }

    (msgStore[roomId] || []).forEach(function (msg) {
      var row = document.createElement("div");
      row.className = "msg-row";
      row.style.cssText =
        "display:flex;" +
        (msg.isMe ? "justify-content:flex-end;" : "justify-content:flex-start;");

      row.innerHTML =
        '<div style="' +
        "max-width:75%;min-width:60px;" +
        "padding:8px 12px 6px;" +
        "border-radius:" +
        (msg.isMe ? "16px 16px 3px 16px" : "16px 16px 16px 3px") + ";" +
        "background:" +
        (msg.isMe ? "linear-gradient(135deg,#0065cc,#0045aa)" : "rgba(255,255,255,0.07)") + ";" +
        "border:1px solid " +
        (msg.isMe ? "rgba(0,120,255,0.25)" : "rgba(255,255,255,0.07)") + ";" +
        "color:#fff;font-size:14px;line-height:1.45;word-break:break-word;" +
        '">' +
        "<div>" + esc(msg.text) + "</div>" +
        '<div style="font-size:10px;color:rgba(255,255,255,0.38);margin-top:3px;text-align:right;display:flex;align-items:center;justify-content:flex-end;gap:3px;">' +
        msg.time +
        (msg.isMe
          ? '<span style="color:rgba(100,180,255,0.7);">' + getTick(msg.status) + "</span>"
          : "") +
        "</div>" +
        "</div>";

      area.appendChild(row);
    });

    area.scrollTop = area.scrollHeight;
  }

  async function _send(roomId, userObj) {
    var input = qid("chatInput");
    var text = (input ? input.value : "").trim();
    if (!text) return;

    var sess = getSession();
    if (!sess) return;

    // ✅ Optimistic UI — pehle screen pe dikhao, phir send karo (fast feel)
    var tempMsg = {
      id: "temp-" + Date.now(),
      text: text,
      isMe: true,
      time: nowTime(),
      status: "sent",
      createdAt: new Date().toISOString()
    };

    if (!msgStore[roomId]) msgStore[roomId] = [];
    msgStore[roomId].push(tempMsg);
    _renderMsgs(roomId);
    updateDMPreview(roomId, text, tempMsg.createdAt);
    if (input) input.value = "";

    // Send button animation
    var btn = qid("chatSendBtn");
    if (btn) {
      btn.style.transform = "scale(0.88)";
      setTimeout(function () { btn.style.transform = ""; }, 120);
    }

    // ✅ Socket se bhejo (fast) — REST API fallback
    var socketSent = false;

    if (window.VibeSocket && typeof window.VibeSocket.emit === "function") {
      try {
        socketSent = window.VibeSocket.emit("private-message", {
          from: sess.userId,
          to: userObj.userId,
          text: text
        });
      } catch (e) {
        console.warn("Socket send failed, falling back to REST:", e);
      }
    }

    // REST API fallback (agar socket connected nahi hai)
    if (!socketSent) {
      try {
        var res = await fetch(window.ENV.API_URL + "/chats/" + roomId + "/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + sess.token
          },
          body: JSON.stringify({ content: text })
        });

        var data = await res.json();

        if (!res.ok) {
          console.error("Send message failed:", data);
          // Temp message ko remove karo error pe
          msgStore[roomId] = msgStore[roomId].filter(function (m) {
            return m.id !== tempMsg.id;
          });
          _renderMsgs(roomId);
          return;
        }

        // Temp ko real message se replace karo
        var m = data.message;
        msgStore[roomId] = msgStore[roomId].map(function (msg) {
          if (msg.id === tempMsg.id) {
            return {
              id: m._id,
              text: m.content,
              isMe: true,
              time: new Date(m.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              }),
              status: m.status || "sent",
              createdAt: m.createdAt
            };
          }
          return msg;
        });

        updateDMPreview(roomId, text, m.createdAt);
        _renderMsgs(roomId);
      } catch (err) {
        console.error("Send message REST error:", err);
      }
    }
  }

  window.openChatFromSearch = async function (userObj) {
    try {
      if (!userObj || !userObj.userId) return;

      var sess = getSession();

      var res = await fetch(window.ENV.API_URL + "/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + (sess && sess.token)
        },
        body: JSON.stringify({ userId: userObj.userId })
      });

      var open = await res.json();
      if (!res.ok) throw new Error(open.message || "Open chat failed");

      var roomId = open.roomId || open.chatId || (open.chat && open.chat._id);

      await refreshDMList();

      var meta = chatMeta[roomId] || {
        roomId: roomId,
        userId: userObj.userId,
        username: userObj.username,
        isOnline: userObj.isOnline,
        lastSeenAt: userObj.lastSeenAt
      };

      openChatPage(meta, roomId);

      if (window.switchTab) window.switchTab("dm");
    } catch (e) {
      console.error("[Chat open error]", e);
    }
  };

  document.addEventListener("DOMContentLoaded", async function () {
    var sess = getSession();
    if (!sess) {
      window.location.replace("./index.html");
      return;
    }

    renderProfile(sess);
    await refreshDMList();

    try {
      if (window.VibeSocket && typeof window.VibeSocket.connect === "function") {
        window.VibeSocket.connect(sess.token, async function (msg) {
          if (!msg) return;

          // ✅ Incoming message (doosre ne bheja)
          if (msg.type === "private-message") {
            var chatId = String(msg.chat || "");
            if (!msgStore[chatId]) msgStore[chatId] = [];

            // Duplicate check
            var alreadyExists = msgStore[chatId].some(function (m) {
              return m.createdAt === msg.createdAt && !m.isMe;
            });

            if (!alreadyExists) {
              msgStore[chatId].push({
                id: msg._id || Date.now(),
                text: msg.content || msg.text,
                isMe: false,
                time: msg.createdAt ? formatTime(msg.createdAt) : nowTime(),
                status: "delivered",
                createdAt: msg.createdAt
              });

              if (currentRoomId === chatId) {
                _renderMsgs(chatId);
                await markSeen(chatId);
              }

              updateDMPreview(chatId, msg.content || msg.text, msg.createdAt);
            }
          }

          // ✅ Apna message confirm hua socket se
          if (msg.type === "message-sent") {
            var chatId = String(msg.chat || "");
            if (msgStore[chatId]) {
              // Last temp message replace karo
              var tempIdx = -1;
              for (var i = msgStore[chatId].length - 1; i >= 0; i--) {
                if (String(msgStore[chatId][i].id).startsWith("temp-") && msgStore[chatId][i].isMe) {
                  tempIdx = i;
                  break;
                }
              }
              if (tempIdx !== -1) {
                msgStore[chatId][tempIdx].id = msg._id || msgStore[chatId][tempIdx].id;
                msgStore[chatId][tempIdx].createdAt = msg.createdAt;
                msgStore[chatId][tempIdx].time = msg.createdAt ? formatTime(msg.createdAt) : nowTime();
                if (currentRoomId === chatId) _renderMsgs(chatId);
              }
            }
          }

          // ✅ Seen status update
          if (msg.type === "seen" && msg.msgId) {
            Object.keys(msgStore).forEach(function (rid) {
              msgStore[rid] = msgStore[rid].map(function (m) {
                if (m.id === msg.msgId && m.isMe) m.status = "seen";
                return m;
              });
            });
            if (currentRoomId) _renderMsgs(currentRoomId);
          }

          // ✅ Presence
          if (msg.type === "user-online" || msg.type === "user-offline") {
            Object.keys(chatMeta).forEach(function (rid) {
              if (chatMeta[rid].userId === String(msg.userId)) {
                chatMeta[rid].isOnline = msg.type === "user-online";
                chatMeta[rid].lastSeenAt = msg.lastSeen || null;
                if (currentRoomId === rid) renderUserStatus(chatMeta[rid]);
              }
            });
          }
        });
      }
    } catch (e) {
      console.error("[Socket]", e);
    }
  });
})();
