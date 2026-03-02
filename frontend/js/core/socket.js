// js/core/socket.js
// FINAL SAFE VERSION

(function () {

  const cfg = window.ENV || {};
  let socket = null;

  function getUserId() {
    const sess = window.VibeState?.session;
    if (!sess) return null;

    // Support both structures safely
    if (sess.id) return sess.id;
    if (sess.user && sess.user.id) return sess.user.id;

    return null;
  }

  function connect(token, onMessage) {

    if (!cfg.API_URL) {
      console.error("Socket: API_URL missing");
      return null;
    }

    if (typeof io === "undefined") {
      console.error("Socket.IO client not loaded.");
      return null;
    }

    if (socket && socket.connected) {
      return socket;
    }

    socket = io(cfg.API_URL, {
      auth: { token: token },
      transports: ["websocket"]
    });

    socket.on("connect", function () {
      console.log("🟢 Socket connected:", socket.id);

      const userId = getUserId();
      if (userId) {
        socket.emit("register", userId);
      }
    });

    socket.on("disconnect", function () {
      console.log("🔴 Socket disconnected");
    });

    socket.on("private-message", function (msg) {
      if (onMessage) {
        onMessage({
          type: "private-message",
          data: msg
        });
      }
    });

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

  function sendPrivateMessage(text) {

    if (!socket || !socket.connected) return false;

    const from = getUserId();
    const to   = window.VibeState?.currentChat?.userId;

    if (!from || !to) return false;

    socket.emit("private-message", { from, to, text });

    return true;
  }

  window.VibeSocket = {
    connect: connect,
    sendPrivateMessage: sendPrivateMessage,
    get socket() { return socket; }
  };

})();
