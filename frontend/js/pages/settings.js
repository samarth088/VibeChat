(function () {
  function qid(id) { return document.getElementById(id); }
  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return document.querySelectorAll(sel); }

  function esc(t) {
    return String(t || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escAttr(t) {
    return String(t || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function nowTime() {
    var n = new Date();
    return n.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function formatTime(date) {
    if (!date) return "";
    var d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function timeAgoText(date) {
    if (!date) return "Offline";

    var d = new Date(date);
    if (isNaN(d.getTime())) return "Offline";

    var diffSec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));

    if (diffSec < 60) return "Last seen just now";
    if (diffSec < 3600) return "Last seen " + Math.floor(diffSec / 60) + " minute" + (Math.floor(diffSec / 60) > 1 ? "s" : "") + " ago";
    if (diffSec < 86400) return "Last seen " + Math.floor(diffSec / 3600) + " hour" + (Math.floor(diffSec / 3600) > 1 ? "s" : "") + " ago";

    return "Last seen " + d.toLocaleString([], {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function getSession() {
    return window.VibeState && window.VibeState.loadSession
      ? window.VibeState.loadSession()
      : null;
  }

  function saveSessionSafe(sess) {
    if (window.VibeState && typeof window.VibeState.saveSession === "function") {
      window.VibeState.saveSession(sess);
    }
  }

  function sortChatsByLatest(list) {
    return (list || []).sort(function (a, b) {
      var ta = a && a.time ? new Date(a.time).getTime() : 0;
      var tb = b && b.time ? new Date(b.time).getTime() : 0;
      return tb - ta;
    });
  }

  var msgStore = {};
  var chatMeta = {};
  var currentRoomId = null;
  var currentChatUser = null;

  function renderProfile(sess) {
    qsa(".profile-name").forEach(function (el) {
      el.textContent = sess.name || sess.username || "Your Name";
    });

    qsa(".profile-uid").forEach(function (el) {
      var idText =
        sess.idFormatted ||
        (window.VibeState && window.VibeState.formatId
          ? window.VibeState.formatId(sess.userId)
          : (sess.uid || sess.userId));

      el.textContent =
        (sess.username ? "@" + sess.username + " · " : "") +
        "ID: " +
        idText;
    });

    qsa(".profile-bio").forEach(function (el) {
      el.textContent = sess.bio || "No bio yet";
    });

    var av = qs(".profile-avatar-big");
    if (av) {
      if (sess.avatar) {
        av.innerHTML = '<img src="' + escAttr(sess.avatar) + '" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
      } else {
        av.textContent = (sess.username || sess.name || "Y").charAt(0).toUpperCase();
      }
    }
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

      if (!res.ok) {
        throw new Error(data.message || "Failed to load chats");
      }

      return data.chats || data.data || [];
    } catch (e) {
      console.error("fetchChats error:", e);
      return [];
    }
  }

  function normalizeChat(raw) {
    var sess = getSession();
    var me = String((sess && sess.userId) || "");

    var participants = raw.participants || raw.members || [];
    var otherUser = raw.otherUser || raw.user || raw.participant || null;

    if (!otherUser && Array.isArray(participants)) {
      otherUser =
        participants.find(function (p) {
          var pid = String(p._id || p.id || p.userId || "");
          return pid !== me;
        }) || null;
    }

    var chatId = raw._id || raw.id || raw.chatId || raw.roomId;
    var userId = otherUser
      ? (otherUser._id || otherUser.id || otherUser.userId)
      : null;

    var username = otherUser
      ? (otherUser.username || otherUser.name || "User")
      : "User";

    var unreadMap = raw.unreadCounts || {};
    var myUnread = 0;

    try {
      if (typeof unreadMap.get === "function") {
        myUnread = Number(unreadMap.get(me) || 0);
      } else {
        myUnread = Number(unreadMap[me] || raw.unreadCount || 0);
      }
    } catch (e) {
      myUnread = Number(raw.unreadCount || 0);
    }

    return {
      roomId: String(chatId || ""),
      userId: String(userId || ""),
      username: username,
      name: otherUser ? (otherUser.name || username) : username,
      avatar: otherUser ? (otherUser.avatar || "") : "",
      bio: otherUser ? (otherUser.bio || "") : "",
      isOnline: !!(otherUser && otherUser.isOnline),
      lastSeenAt: otherUser ? (otherUser.lastSeen || otherUser.lastSeenAt || null) : null,
      unreadCount: myUnread,
      preview:
        (raw.lastMessage && (raw.lastMessage.content || raw.lastMessage.text)) ||
        raw.preview ||
        "Tap to chat",
      time:
        (raw.lastMessage &&
          (raw.lastMessage.createdAt || raw.lastMessage.updatedAt)) ||
        raw.updatedAt ||
        raw.createdAt ||
        null
    };
  }

  function getAvatarHtml(chat) {
    if (chat.avatar) {
      return (
        '<div class="avatar">' +
          '<img src="' + escAttr(chat.avatar) + '" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">' +
        "</div>"
      );
    }

    return (
      '<div class="avatar">' +
        esc((chat.username || chat.name || "U").charAt(0).toUpperCase()) +
      "</div>"
    );
  }

  function renderDMList(chats) {
    var dmList = qid("dmContent");
    if (!dmList) return;

    dmList.innerHTML = "";
    chats = sortChatsByLatest(chats);

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
          getAvatarHtml(chat) +
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
            name: chat.name,
            avatar: chat.avatar,
            bio: chat.bio,
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
    renderDMList(chats.map(normalizeChat));
  }

  async function markSeen(roomId) {
    var sess = getSession();
    if (!sess || !sess.token || !roomId) return;

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

    if (userObj && userObj.isOnline) {
      statusEl.textContent = "Online";
      statusEl.style.color = "#2ee67e";
    } else {
      statusEl.textContent = timeAgoText(userObj && userObj.lastSeenAt);
      statusEl.style.color = "rgba(255,255,255,0.65)";
    }
  }

  function updateChatListItem(roomId, userObj, text, createdAt) {
    if (!roomId) return;

    chatMeta[roomId] = chatMeta[roomId] || {};
    chatMeta[roomId].preview = text || "";
    chatMeta[roomId].time = createdAt || new Date().toISOString();

    if (userObj && typeof userObj.isOnline !== "undefined") {
      chatMeta[roomId].isOnline = !!userObj.isOnline;
    }

    if (userObj && userObj.lastSeenAt) {
      chatMeta[roomId].lastSeenAt = userObj.lastSeenAt;
    }

    var item = qs('[data-room="' + roomId + '"]');
    var dmList = qid("dmContent");

    if (!item || !dmList) return;

    var previewEl = item.querySelector(".conv-preview");
    var timeEl = item.querySelector(".conv-time");

    if (previewEl) previewEl.textContent = text || "";
    if (timeEl) timeEl.textContent = formatTime(createdAt || new Date().toISOString());

    dmList.insertBefore(item, dmList.firstChild);
  }

  function replaceTempMessage(roomId, tempId, realMessage, myId) {
    if (!msgStore[roomId]) return;

    msgStore[roomId] = msgStore[roomId].map(function (m) {
      if (m.id !== tempId) return m;

      var senderId =
        typeof realMessage.sender === "object"
          ? String(realMessage.sender._id || realMessage.sender.id || "")
          : String(realMessage.sender || "");

      return {
        id: String(realMessage._id),
        text: realMessage.content || "",
        isMe: senderId === String(myId),
        time: formatTime(realMessage.createdAt),
        status: realMessage.status || "sent",
        createdAt: realMessage.createdAt
      };
    });
  }

  function markTempFailed(roomId, tempId) {
    if (!msgStore[roomId]) return;

    msgStore[roomId] = msgStore[roomId].map(function (m) {
      if (m.id !== tempId) return m;

      return {
        id: m.id,
        text: m.text,
        isMe: m.isMe,
        time: m.time,
        status: "failed",
        createdAt: m.createdAt
      };
    });
  }

  function getHeaderAvatar(userObj) {
    if (userObj.avatar) {
      return (
        '<div style="width:42px;height:42px;border-radius:50%;overflow:hidden;border:2px solid rgba(0,100,220,0.4);flex-shrink:0;">' +
          '<img src="' + escAttr(userObj.avatar) + '" alt="avatar" style="width:100%;height:100%;object-fit:cover;">' +
        "</div>"
      );
    }

    return (
      '<div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#1a3a6a,#0d1f3c);border:2px solid rgba(0,100,220,0.4);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#4db8ff;flex-shrink:0;">' +
        esc((userObj.username || userObj.name || "U").charAt(0).toUpperCase()) +
      "</div>"
    );
  }

  function openChatPage(userObj, roomId) {
    var phone = qs(".phone");
    if (!phone || !roomId) return;

    currentRoomId = roomId;
    currentChatUser = userObj || null;

    var old = qid("chatPage");
    if (old) old.remove();

    if (!msgStore[roomId]) msgStore[roomId] = [];

    var username = esc(userObj.username || userObj.name || "User");

    var page = document.createElement("div");
    page.id = "chatPage";
    page.style.cssText =
      "position:absolute;inset:0;z-index:300;display:flex;flex-direction:column;background:linear-gradient(160deg,#000d24 0%,#000510 100%);";

    page.innerHTML =
      '<div id="chatPageHeader" style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(0,8,28,0.95);border-bottom:1px solid rgba(0,100,255,0.2);flex-shrink:0;">' +
        '<button id="chatBackBtn" style="background:none;border:none;color:#4db8ff;font-size:26px;line-height:1;cursor:pointer;padding:0 6px 0 0;">‹</button>' +
        getHeaderAvatar(userObj) +
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
      currentRoomId = null;
      currentChatUser = null;
    });

    qid("chatSendBtn").addEventListener("click", function () {
      sendMessage(roomId, userObj);
    });

    qid("chatInput").addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        sendMessage(roomId, userObj);
      }
    });

    if (window.VibeSocket && typeof window.VibeSocket.joinRoom === "function") {
      window.VibeSocket.joinRoom(roomId);
    }
  }

  async function loadMessages(roomId) {
    try {
      var sess = getSession();
      if (!sess || !sess.token || !roomId) return;

      var res = await fetch(window.ENV.API_URL + "/chats/" + roomId + "/messages", {
        headers: {
          Authorization: "Bearer " + sess.token
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
          id: String(m._id),
          text: m.content || "",
          isMe: senderId === myId,
          time: formatTime(m.createdAt),
          status: m.status || "sent",
          createdAt: m.createdAt
        };
      });

      renderMsgs(roomId);
      await markSeen(roomId);
      await refreshDMList();
    } catch (e) {
      console.error("Load messages error:", e);
    }
  }

  function renderMsgs(roomId) {
    var area = qid("chatMsgsArea");
    if (!area) return;

    area.querySelectorAll(".msg-row").forEach(function (el) {
      el.remove();
    });

    function getTick(status) {
      if (status === "seen") return "✓✓";
      if (status === "sending") return "⌛";
      if (status === "failed") return "!";
      if (status === "delivered") return "✓✓";
      return "✓";
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
          "<div>" + esc(msg.text) + "</div>" +
          '<div style="font-size:10px;color:rgba(255,255,255,0.38);margin-top:3px;text-align:right;display:flex;align-items:center;justify-content:flex-end;gap:3px;">' +
            esc(msg.time || "") +
            (msg.isMe
              ? '<span style="color:rgba(100,180,255,0.7);">' + esc(getTick(msg.status)) + "</span>"
              : "") +
          "</div>" +
        "</div>";

      area.appendChild(row);
    });

    area.scrollTop = area.scrollHeight;
  }

  async function sendMessage(roomId, userObj) {
    var input = qid("chatInput");
    var text = (input ? input.value : "").trim();

    if (!text) return;

    var sess = getSession();
    if (!sess || !sess.token) return;

    if (!msgStore[roomId]) msgStore[roomId] = [];

    var tempId = "temp_" + Date.now();
    var nowIso = new Date().toISOString();

    msgStore[roomId].push({
      id: tempId,
      text: text,
      isMe: true,
      time: formatTime(nowIso),
      status: "sending",
      createdAt: nowIso
    });

    updateChatListItem(roomId, userObj, text, nowIso);

    if (input) input.value = "";
    renderMsgs(roomId);

    var btn = qid("chatSendBtn");
    if (btn) {
      btn.disabled = true;
      btn.style.opacity = "0.7";
    }

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
        throw new Error(data.message || "Send failed");
      }

      var m = data.message || {};

      replaceTempMessage(roomId, tempId, m, sess.userId);
      updateChatListItem(roomId, userObj, m.content || text, m.createdAt || nowIso);

      renderMsgs(roomId);
      await refreshDMList();
    } catch (err) {
      console.error("Send message error:", err);
      markTempFailed(roomId, tempId);
      renderMsgs(roomId);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = "";
      }
    }
  }

  window.openChatFromSearch = async function (userObj) {
    try {
      if (!userObj || !userObj.userId) return;

      var sess = getSession();
      if (!sess || !sess.token) return;

      var res = await fetch(window.ENV.API_URL + "/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + sess.token
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
        username: userObj.username || userObj.name,
        name: userObj.name || userObj.username,
        avatar: userObj.avatar || "",
        bio: userObj.bio || "",
        isOnline: !!userObj.isOnline,
        lastSeenAt: userObj.lastSeen || userObj.lastSeenAt || null
      };

      openChatPage(meta, roomId);

      if (window.switchTab) window.switchTab("dm");
    } catch (e) {
      console.error("[Chat open error]", e);
    }
  };

  function handleSocketMessage(msg) {
    var sess = getSession();
    if (!msg || !sess) return;

    if (msg.type === "message" && msg.room) {
      var senderId = String(msg.sender || "");

      if (senderId === String(sess.userId)) {
        return;
      }

      if (!msgStore[msg.room]) msgStore[msg.room] = [];

      var exists = msgStore[msg.room].some(function (m) {
        return String(m.id) === String(msg._id || "");
      });

      if (!exists) {
        msgStore[msg.room].push({
          id: String(msg._id || Date.now()),
          text: msg.text || msg.content || "",
          isMe: false,
          time: formatTime(msg.createdAt || new Date().toISOString()) || nowTime(),
          status: msg.status || "sent",
          createdAt: msg.createdAt || new Date().toISOString()
        });
      }

      if (chatMeta[msg.room]) {
        chatMeta[msg.room].preview = msg.text || msg.content || "";
        chatMeta[msg.room].time = msg.createdAt || new Date().toISOString();
      }

      updateChatListItem(
        msg.room,
        chatMeta[msg.room] || {},
        msg.text || msg.content || "",
        msg.createdAt || new Date().toISOString()
      );

      if (currentRoomId === msg.room) {
        renderMsgs(msg.room);
        markSeen(msg.room);
      }

      refreshDMList();
    }

    if (msg.type === "seen" && msg.room) {
      if (msgStore[msg.room]) {
        msgStore[msg.room] = msgStore[msg.room].map(function (m) {
          if (m.isMe) {
            m.status = "seen";
          }
          return m;
        });
      }

      if (currentRoomId === msg.room) {
        renderMsgs(msg.room);
      }

      refreshDMList();
    }

    if (msg.type === "presence" && msg.userId) {
      Object.keys(chatMeta).forEach(function (roomId) {
        if (String(chatMeta[roomId].userId) === String(msg.userId)) {
          chatMeta[roomId].isOnline = !!msg.isOnline;
          chatMeta[roomId].lastSeenAt = msg.lastSeen || null;
        }
      });

      if (currentRoomId && chatMeta[currentRoomId] && String(chatMeta[currentRoomId].userId) === String(msg.userId)) {
        currentChatUser = chatMeta[currentRoomId];
        renderUserStatus(currentChatUser);
      }

      refreshDMList();
    }
  }

  document.addEventListener("profile:updated", function (e) {
    var updated = (e && e.detail) || {};
    var sess = getSession() || {};

    if (updated.name) sess.name = updated.name;
    if (updated.username) sess.username = updated.username;
    if (typeof updated.bio === "string") sess.bio = updated.bio;
    if (typeof updated.avatar === "string") sess.avatar = updated.avatar;

    saveSessionSafe(sess);
    renderProfile(sess);
  });

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
        window.VibeSocket.connect(sess.token, handleSocketMessage);
      }
    } catch (e) {
      console.error("[Socket]", e);
    }

    setInterval(function () {
      if (currentRoomId && currentChatUser) {
        renderUserStatus(currentChatUser);
      }
    }, 60000);
  });
})();
