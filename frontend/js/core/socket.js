// js/core/socket.js
// Clean Stable Socket.IO Client

(function () {

  const cfg = window.ENV || {};
  let socket = null;

  function connect(token, onMessage) {

    if (!cfg.API_URL) {
      console.error("Socket: API_URL missing");
      return null;
    }

    if (typeof io === "undefined") {
      console.error("Socket.IO client not loaded.");
      return null;
    }

    // Prevent multiple connections
    if (socket && socket.connected) {
      return socket;
    }

    socket = io(cfg.API_URL, {
      auth: { token: token },
      transports: ["websocket"]
    });

    socket.on("connect", function () {
      console.log("🟢 Socket connected:", socket.id);

      const userId = window.VibeState?.session?.user?.id;
      if (userId) {
        socket.emit("register", userId);
      }
    });

    socket.on("disconnect", function () {
      console.log("🔴 Socket disconnected");
    });

    // ===== RECEIVE PRIVATE MESSAGE =====
    socket.on("private-message", function (msg) {
      if (onMessage) {
        onMessage({
          type: "private-message",
          data: msg
        });
      }
    });

    // ===== MESSAGE SAVED CONFIRM =====
    socket.on("message-sent", function (msg) {
      if (onMessage) {
        onMessage({
          type: "message-sent",
          data: msg
        });
      }
    });

    socket.on("message-seen", function (msg) {
      if (onMessage) {
        onMessage({
          type: "message-seen",
          data: msg
        });
      }
    });

    return socket;
  }

  // ===== SEND FUNCTION =====
  function sendPrivateMessage(text) {

    if (!socket || !socket.connected) return false;

    const from = window.VibeState?.session?.user?.id;
    const to   = window.VibeState?.currentChat?.userId;

    if (!from || !to) return false;

    socket.emit("private-message", { from, to, text });

    return true;
  }

  // ===== EXPORT GLOBAL =====
  window.VibeSocket = {
    connect: connect,
    get socket() { return socket; },
    sendPrivateMessage: sendPrivateMessage
  };

})();
