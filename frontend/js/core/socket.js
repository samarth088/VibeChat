// js/core/socket.js
// Socket.io client loader + normalized events

(function () {
  var socket = null;
  var scriptPromise = null;
  var queuedRooms = [];
  var isConnecting = false;
  var currentHandler = function () {};

  function getBaseUrl() {
    var cfg = window.ENV || {};
    var raw = cfg.WS_URL || cfg.API_URL || window.location.origin;
    raw = String(raw || "").replace(/\/+$/, "");
    raw = raw.replace(/\/api$/, "");
    return raw;
  }

  function loadSocketClient() {
    if (window.io) {
      return Promise.resolve(window.io);
    }

    if (scriptPromise) {
      return scriptPromise;
    }

    scriptPromise = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = getBaseUrl() + "/socket.io/socket.io.js";
      script.async = true;

      script.onload = function () {
        if (window.io) {
          resolve(window.io);
        } else {
          reject(new Error("socket.io client not available"));
        }
      };

      script.onerror = function () {
        reject(new Error("Failed to load socket.io client"));
      };

      document.head.appendChild(script);
    });

    return scriptPromise;
  }

  function getSession() {
    return window.VibeState && window.VibeState.loadSession
      ? window.VibeState.loadSession()
      : null;
  }

  function emitToApp(payload) {
    try {
      if (typeof currentHandler === "function") {
        currentHandler(payload);
      }
    } catch (err) {
      console.error("VibeSocket callback error:", err);
    }
  }

  function bindEvents() {
    if (!socket) return;

    socket.on("connect", function () {
      var sess = getSession();
      if (sess && sess.userId) {
        socket.emit("register", sess.userId);
      }

      while (queuedRooms.length) {
        socket.emit("join", queuedRooms.shift());
      }
    });

    socket.on("message", function (data) {
      emitToApp({
        type: "message",
        room: String(data.room || data.chat || data.chatId || ""),
        _id: data._id || null,
        sender: data.sender || null,
        receiver: data.receiver || null,
        text: data.text || data.content || "",
        content: data.content || data.text || "",
        status: data.status || "sent",
        createdAt: data.createdAt || new Date().toISOString()
      });
    });

    socket.on("seen", function (data) {
      emitToApp({
        type: "seen",
        room: String(data.room || data.chatId || ""),
        userId: data.userId || null
      });
    });

    socket.on("presence", function (data) {
      emitToApp({
        type: "presence",
        userId: String(data.userId || ""),
        isOnline: !!data.isOnline,
        lastSeen: data.lastSeen || null
      });
    });

    // Compatibility
    socket.on("user-online", function (userId) {
      emitToApp({
        type: "presence",
        userId: String(userId || ""),
        isOnline: true,
        lastSeen: null
      });
    });

    socket.on("user-offline", function (data) {
      emitToApp({
        type: "presence",
        userId: String((data && data.userId) || ""),
        isOnline: false,
        lastSeen: data && data.lastSeen ? data.lastSeen : null
      });
    });

    socket.on("message-seen", function (data) {
      emitToApp({
        type: "seen",
        room: String((data && (data.room || data.chatId)) || "")
      });
    });

    socket.on("disconnect", function () {
      // silent
    });
  }

  window.VibeSocket = {
    connect: function (_token, onMessage) {
      currentHandler = typeof onMessage === "function" ? onMessage : function () {};

      if (socket && socket.connected) {
        var sess = getSession();
        if (sess && sess.userId) {
          socket.emit("register", sess.userId);
        }
        return socket;
      }

      if (isConnecting) {
        return null;
      }

      isConnecting = true;

      loadSocketClient()
        .then(function () {
          socket = window.io(getBaseUrl(), {
            transports: ["websocket", "polling"]
          });

          bindEvents();
        })
        .catch(function (err) {
          console.warn("VibeSocket disabled:", err.message || err);
        })
        .finally(function () {
          isConnecting = false;
        });

      return null;
    },

    send: function (eventName, data) {
      if (!socket || !socket.connected) return;
      socket.emit(eventName, data);
    },

    joinRoom: function (roomId) {
      if (!roomId) return;

      var room = String(roomId);

      if (socket && socket.connected) {
        socket.emit("join", room);
      } else if (queuedRooms.indexOf(room) === -1) {
        queuedRooms.push(room);
      }
    },

    disconnect: function () {
      if (!socket) return;
      socket.disconnect();
      socket = null;
    }
  };
})();
