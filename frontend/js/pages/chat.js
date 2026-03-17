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

  function tickFor(status) {
    if (status === "seen") return "✓✓";
    return "✓";
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
        headers: {
          Authorization: "Bearer " + sess.token
        }
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

    if (!otherUser && Array.isArray(raw.participants)) {
      otherUser = raw.participants.find(function (p) {
        var pid = String(p._id || p.id || p.userId || "");
        return pid !== me;
      });
    }

    var chatId = raw._id || raw.id || raw.chatId || raw.roomId;
    var userId = otherUser ? (otherUser._id || otherUser.id || otherUser.userId) : null;
    var username = otherUser ? (otherUser.username || otherUser.name || "User") : "User";

    return {
      roomId: String(chatId),
      userId: String(userId || ""),
      username: username,
      isOnline: !!(otherUser && otherUser.isOnline),
      lastSeenAt: otherUser ? otherUser.lastSeenAt : null,
      unreadCount: raw.unreadCount || 0,
      preview:
        (raw.lastMessage && (raw.lastMessage.content || raw.lastMessage.text)) ||
        raw.preview ||
        "Tap to chat",
      time:
        (raw.lastMessage && (raw.lastMessage.createdAt || raw.lastMessage.updatedAt)) ||
        raw.updatedAt ||
        raw.createdAt ||
        null
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
            '<span class="conv-time">' + esc(chat.time ? formatTime(chat.time) : "Now") + "</span>" +
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
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>' +
        "</button>" +
      "</div>";

    phone.appendChild(page);

    renderUserStatus(userObj);
    loadMessages(roomId);

    qid("chatBackBtn").addEventListener("click", function () {
      page.remove();
    });

    qid("chatSendBtn").addEventListener("click", function () {
      _send(roomId, userObj);
    });

    qid("chatInput").addEventListener("keydown", function (e) {
      if (e.key === "Enter") _send(roomId, userObj);
    });

    if (window.VibeSocket && window.VibeSocket.joinRoom) {
      window.VibeSocket.joinRoom(roomId);
    }
  }

  async function loadMessages(roomId) {
    try {
      var sess = getSession();

      var res = await fetch(window.ENV.API_URL + "/chats/" + roomId + "/messages", {
        headers: {
          Authorization: "Bearer " + (sess && sess.token)
        }
      });

      var data = await res.json();

      if (!res.ok) {
        console.error("Messages fetch failed:", data);
        return;
      }

      var myId = String(sess.userId);

      msgStore[roomId] = (data.messages || []).map(function (m) {
        var senderId =
          typeof m.sender === "object"
            ? String(m.sender._id || m.sender.id || "")
            : String(m.sender || "");

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
        (msg.isMe ? "16px 16px 3px 16px" : "16px 16px 16px 3px") +
        ";" +
        "background:" +
        (msg.isMe
          ? "linear-gradient(135deg,#0065cc,#0045aa)"
          : "rgba(255,255,255,0.07)") +
        ";" +
        "border:1px solid " +
        (msg.isMe
          ? "rgba(0,120,255,0.25)"
          : "rgba(255,255,255,0.07)") +
        ";" +
        "color:#fff;font-size:14px;line-height:1.45;word-break:break-word;" +
        '">' +
        "<div>" +
        esc(msg.text) +
        "</div>" +
        '<div style="font-size:10px;color:rgba(255,255,255,0.38);margin-top:3px;text-align:right;display:flex;align-items:center;justify-content:flex-end;gap:3px;">' +
        msg.time +
        (msg.isMe
          ? '<span style="color:rgba(100,180,255,0.7);">' +
            getTick(msg.status) +
            "</span>"
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

    try {
      var res = await fetch(window.ENV.API_URL + "/chats/" + roomId + "/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + (sess && sess.token)
        },
        body: JSON.stringify({ content: text })
      });

      var data = await res.json();

      if (!res.ok) {
        console.error("Send message failed:", data);
        return;
      }

      var m = data.message;

      if (!msgStore[roomId]) msgStore[roomId] = [];

      msgStore[roomId].push({
        id: m._id,
        text: m.content,
        isMe: true,
        time: new Date(m.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        }),
        status: m.status || "sent",
        createdAt: m.createdAt
      });

      var preview = qs('[data-userid="' + userObj.userId + '"] .conv-preview');
      if (preview) preview.textContent = text;

      var timeEl = qs('[data-userid="' + userObj.userId + '"] .conv-time');
      if (timeEl) {
        timeEl.textContent = new Date(m.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        });
      }

      var dmList = qid("dmContent");
      var item = qs('[data-userid="' + userObj.userId + '"]');
      if (dmList && item) dmList.insertBefore(item, dmList.firstChild);

      if (input) input.value = "";

      var btn = qid("chatSendBtn");
      if (btn) {
        btn.style.transform = "scale(0.88)";
        setTimeout(function () {
          btn.style.transform = "";
        }, 120);
      }

      _renderMsgs(roomId);
    } catch (err) {
      console.error("Send message error:", err);
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

          if (msg.type === "message" && msg.room) {
            if (!msgStore[msg.room]) msgStore[msg.room] = [];

            msgStore[msg.room].push({
              id: msg._id || Date.now(),
              text: msg.text || msg.content,
              isMe: false,
              time: nowTime(),
              status: msg.status || "sent"
            });

            if (currentRoomId === msg.room) {
              _renderMsgs(msg.room);
              await markSeen(msg.room);
            }

            await refreshDMList();
          }

          if (msg.type === "seen" && msg.room) {
            if (msgStore[msg.room]) {
              msgStore[msg.room] = msgStore[msg.room].map(function (m) {
                if (m.isMe) m.status = "seen";
                return m;
              });
            }

            if (currentRoomId === msg.room) _renderMsgs(msg.room);
            await refreshDMList();
          }

          if (msg.type === "presence" && msg.roomId && chatMeta[msg.roomId]) {
            chatMeta[msg.roomId].isOnline = !!msg.isOnline;
            chatMeta[msg.roomId].lastSeenAt = msg.lastSeenAt || null;
            if (currentRoomId === msg.roomId) {
              renderUserStatus(chatMeta[msg.roomId]);
            }
            await refreshDMList();
          }
        });
      }
    } catch (e) {
      console.error("[Socket]", e);
    }
  });
})();
