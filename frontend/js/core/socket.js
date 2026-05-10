// js/core/socket.js
// VibeChat — API wrapper + Real-time Socket.io client
// Load order: env.js → state.js → api.js → socket.js

(function () {
  var cfg = window.ENV || {};
  cfg.DEV_MODE = !!cfg.DEV_MODE;
  if (!cfg.API_URL) cfg.API_URL = "";

  function getSession() {
    return window.VibeState && window.VibeState.loadSession
      ? window.VibeState.loadSession()
      : null;
  }

  function getToken(token) {
    if (token) return token;
    var sess = getSession();
    return sess && sess.token ? sess.token : "";
  }

  function fetchJSON(url, opts) {
    return fetch(url, opts).then(async function (res) {
      var data = {};
      try { data = await res.json(); } catch (e) {}

      if (!res.ok) {
        throw new Error(data.message || data.error || ("HTTP " + res.status));
      }

      return data;
    });
  }

  window.VibeAPI = {
    sendMessage: function (chatId, text, token) {
      return fetchJSON(cfg.API_URL + "/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + getToken(token)
        },
        body: JSON.stringify({
          chatId: chatId,
          text: text
        })
      });
    },

    login: function (data) {
      var identifier = data.identifier;
      var password = data.password;

      if (cfg.DEV_MODE) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            var userId = Math.floor(Math.random() * 90000) + 1;
            resolve({
              token: "dev-token-" + userId,
              user: {
                id: userId,
                uid: "vibe_demo_" + userId,
                name: identifier,
                username: identifier,
                email: identifier + "@demo.local",
                avatar: "",
                bio: "🚀 Living on vibes."
              }
            });
          }, 500);
        });
      }

      return fetchJSON(cfg.API_URL + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifier,
          password: password
        })
      });
    },

    sendOTP: function (email) {
      if (!email) {
        return Promise.reject(new Error("Email is required"));
      }

      return fetchJSON(cfg.API_URL + "/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email })
      });
    },

    verifyOTPAndSignup: function (data) {
      return fetchJSON(cfg.API_URL + "/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          otp: data.otp
        })
      }).then(function () {
        return fetchJSON(cfg.API_URL + "/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.fullname,
            email: data.email,
            password: data.password
          })
        });
      });
    },

    searchUsers: function (query) {
      if (!query) return Promise.resolve([]);

      var q = String(query).trim();

      return fetchJSON(cfg.API_URL + "/users/search?uid=" + encodeURIComponent(q), {
        headers: {
          "Authorization": "Bearer " + getToken()
        }
      }).then(function (res) {
        if (!res.success || !res.user) return [];

        return [{
          userId: res.user.id,
          uid: res.user.uid,
          name: res.user.name || "",
          username: res.user.username || res.user.name,
          avatar: res.user.avatar || "",
          bio: res.user.bio || "",
          isOnline: !!res.user.isOnline,
          lastSeen: res.user.lastSeen || null
        }];
      });
    },

    getUserById: function (userId) {
      return fetchJSON(cfg.API_URL + "/users/search?uid=" + encodeURIComponent(userId), {
        headers: {
          "Authorization": "Bearer " + getToken()
        }
      }).then(function (res) {
        if (!res.success || !res.user) {
          throw new Error("User not found");
        }

        return {
          userId: res.user.id,
          uid: res.user.uid,
          username: res.user.username,
          name: res.user.name,
          bio: res.user.bio || "",
          avatar: res.user.avatar || "",
          isOnline: !!res.user.isOnline,
          lastSeen: res.user.lastSeen || null
        };
      });
    },

    // ADDED
    getMyProfile: function (token) {
      return fetchJSON(cfg.API_URL + "/users/me", {
        headers: {
          "Authorization": "Bearer " + getToken(token)
        }
      }).then(function (res) {
        if (!res.success || !res.user) {
          throw new Error("Failed to load profile");
        }
        return res.user;
      });
    },

    // ADDED
    updateProfile: function (data, token) {
      return fetchJSON(cfg.API_URL + "/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + getToken(token)
        },
        body: JSON.stringify(data || {})
      }).then(function (res) {
        if (!res.success || !res.user) {
          throw new Error("Profile update failed");
        }
        return res.user;
      });
    },

    // ADDED
    updateAvatar: function (avatar, token) {
      return this.updateProfile({ avatar: avatar }, token);
    },

    openChatWith: function (userId, token) {
      return fetchJSON(cfg.API_URL + "/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + getToken(token)
        },
        body: JSON.stringify({
          userId: userId
        })
      }).then(function (res) {
        if (!res.roomId) {
          throw new Error("Chat creation failed");
        }
        return { roomId: res.roomId };
      });
    },

    // FIX: chat.js openChatFromSearch calls openOrCreateChat — was missing here
    // socket.js overwrites window.VibeAPI after api.js, so this must exist here too
    openOrCreateChat: function (userId, token) {
      return fetchJSON(cfg.API_URL + "/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + getToken(token)
        },
        body: JSON.stringify({
          userId: userId
        })
      }).then(function (res) {
        if (!res.roomId) {
          throw new Error("Chat creation failed");
        }
        return { roomId: res.roomId };
      });
    },

    // FIX: chat.js also calls getChats, getMessages, sendMessage, markSeen
    // These were in api.js but socket.js overwrites VibeAPI — add them here too
    getChats: function (token) {
      return fetchJSON(cfg.API_URL + "/chats", {
        headers: { "Authorization": "Bearer " + getToken(token) }
      }).then(function (res) { return res.chats || []; });
    },

    getMessages: function (roomId, token) {
      return fetchJSON(cfg.API_URL + "/chats/" + roomId + "/messages", {
        headers: { "Authorization": "Bearer " + getToken(token) }
      }).then(function (res) { return res.messages || []; });
    },

    sendMessage: function (roomId, content, token) {
      return fetchJSON(cfg.API_URL + "/chats/" + roomId + "/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + getToken(token)
        },
        body: JSON.stringify({ content: content })
      });
    },

    markSeen: function (roomId, token) {
      return fetchJSON(cfg.API_URL + "/chats/" + roomId + "/seen", {
        method: "PATCH",
        headers: { "Authorization": "Bearer " + getToken(token) }
      }).catch(function () {});
    }

  };
})();

// ─── VibeSocket — Real-time Socket.io client ───────────────────────
(function () {
  var _socket = null;
  var _onMessage = null;

  window.VibeSocket = {

    connect: function (token, onMessageCallback) {
      if (_socket && _socket.connected) return; // already connected

      var cfg = window.ENV || {};
      var wsUrl = cfg.WS_URL || cfg.API_URL.replace("/api", "") || "";

      _onMessage = onMessageCallback;

      _socket = io(wsUrl, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000
      });

      _socket.on("connect", function () {
        console.log("🟢 Socket connected");
        // Register user so backend knows who this socket belongs to
        var sess = window.VibeState && window.VibeState.loadSession
          ? window.VibeState.loadSession() : null;
        if (sess && sess.userId) {
          _socket.emit("register", sess.userId);
        }
      });

      // Incoming message from another user
      _socket.on("message", function (data) {
        if (!_onMessage) return;
        _onMessage({
          type: "message",
          _id: data._id,
          room: data.roomId || data.room,
          sender: data.sender && data.sender._id ? data.sender._id : data.sender,
          content: data.content || data.text || "",
          text: data.content || data.text || "",
          createdAt: data.createdAt
        });
      });

      // Message status update (delivered/seen)
      _socket.on("message:status", function (data) {
        if (!_onMessage) return;
        _onMessage({
          type: "status",
          msgId: data.msgId,
          status: data.status,
          room: data.roomId || data.room
        });
      });

      // Seen event
      _socket.on("message:seen", function (data) {
        if (!_onMessage) return;
        _onMessage({
          type: "seen",
          room: data.roomId || data.room,
          by: data.by
        });
      });

      // Online/offline presence
      _socket.on("presence", function (data) {
        if (!_onMessage) return;
        _onMessage({
          type: "presence",
          userId: data.userId,
          isOnline: data.isOnline,
          lastSeen: data.lastSeen
        });
      });

      _socket.on("disconnect", function () {
        console.log("🔴 Socket disconnected");
      });

      _socket.on("connect_error", function (err) {
        console.warn("Socket error:", err.message);
      });
    },

    // Join a chat room to receive its messages
    joinRoom: function (roomId) {
      if (_socket && roomId) {
        _socket.emit("join", String(roomId));
      }
    },

    // Send message via socket (fast — no HTTP round trip)
    sendMessage: function (roomId, toUserId, text) {
      if (_socket && _socket.connected) {
        _socket.emit("message", {
          roomId: roomId,
          to: toUserId,
          text: text
        });
        return true; // sent via socket
      }
      return false; // fallback to HTTP
    },

    disconnect: function () {
      if (_socket) {
        _socket.disconnect();
        _socket = null;
      }
    }
  };
})();
