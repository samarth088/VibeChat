// js/core/socket.js
// Socket.IO client — production ready

(function () {

  const cfg = window.ENV || {};
  let socket = null;

  function connect(token, onMessage) {

    if (!cfg.API_URL) {
      console.error("Socket: API_URL missing");
      return;
    }

    // Load socket.io client if not loaded
    if (typeof io === "undefined") {
      console.error("Socket.IO client not loaded. Add CDN in app.html");
      return;
    }

    socket = io(cfg.API_URL, {
      auth: { token: token },
      transports: ["websocket"]
    });

    socket.on("connect", function () {
      console.log("🟢 Socket connected:", socket.id);

      // register user
      if (window.VibeState.session?.user?.id) {
        socket.emit("register", window.VibeState.session.user.id);
      }
    });

    socket.on("private-message", function (msg) {
      if (onMessage) onMessage({ type: "private-message", data: msg });
    });

    socket.on("message-sent", function (msg) {
      if (onMessage) onMessage({ type: "message-sent", data: msg });
    });

    socket.on("message-seen", function (msg) {
      if (onMessage) onMessage({ type: "message-seen", data: msg });
    });

    socket.on("disconnect", function () {
      console.log("🔴 Socket disconnected");
    });

    window.sendWS = function (payload) {
      if (!socket) return false;

      // Map old format to backend event
      if (payload.type === "message") {
        socket.emit("private-message", {
          from: window.VibeState.session.user.id,
          to: window.VibeState.currentChat?.userId,
          text: payload.text
        });
        return true;
      }

      return false;
    };

    window.VibeSocket = {
      connect: connect,
      send: window.sendWS,
      joinRoom: function () {}
    };

    return socket;
  }

  window.VibeSocket = {
    connect: connect,
    send: function () {},
    joinRoom: function () {}
  };

})();
