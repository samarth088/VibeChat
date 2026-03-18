// js/core/socket.js
// Socket.IO client with auto-reconnect

(function () {
  const cfg = window.ENV || { WS_URL: '', DEV_MODE: true };
  let socket = null;
  let onMessageHandler = null;

  function connect(token, onMessage) {
    onMessageHandler = onMessage;

    // DEV MODE
    if (!cfg.WS_URL || cfg.DEV_MODE) {
      console.info('VibeSocket: DEV_MODE — no real socket.');
      window.VibeSocket.send = function (payload) {
        console.log('[DEV send]', payload);
        setTimeout(function () {
          if (onMessageHandler) onMessageHandler({ type: 'echo', payload });
        }, 300);
        return true;
      };
      window.VibeSocket.emit = window.VibeSocket.send;
      return null;
    }

    // Already connected
    if (socket && socket.connected) return socket;

    // ✅ Socket.IO connect (backend Socket.IO use karta hai, raw WebSocket nahi)
    if (typeof io === 'undefined') {
      console.error('[VibeSocket] Socket.IO (io) not loaded! Add socket.io CDN to HTML.');
      return null;
    }

    socket = io(cfg.WS_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: Infinity
    });

    socket.on('connect', function () {
      console.log('[Socket.IO] connected:', socket.id);

      // ✅ Session se userId leke register karo
      var sess = window.VibeState && window.VibeState.loadSession
        ? window.VibeState.loadSession()
        : null;
      if (sess && sess.userId) {
        socket.emit('register', sess.userId);
      }
    });

    socket.on('disconnect', function (reason) {
      console.warn('[Socket.IO] disconnected:', reason);
    });

    socket.on('connect_error', function (err) {
      console.error('[Socket.IO] connect error:', err.message);
    });

    // ✅ Backend "private-message" event sunna
    socket.on('private-message', function (data) {
      if (onMessageHandler) {
        onMessageHandler({
          type: 'private-message',
          chat: data.chat,
          sender: data.sender,
          text: data.content,
          content: data.content,
          createdAt: data.createdAt
        });
      }
    });

    // ✅ Backend "message-sent" confirm
    socket.on('message-sent', function (data) {
      if (onMessageHandler) {
        onMessageHandler({
          type: 'message-sent',
          chat: data.chat,
          content: data.content,
          createdAt: data.createdAt
        });
      }
    });

    // ✅ Unread update
    socket.on('unread-update', function (data) {
      if (onMessageHandler) {
        onMessageHandler({
          type: 'unread-update',
          chatId: data.chatId,
          unread: data.unread
        });
      }
    });

    // ✅ Seen event
    socket.on('message-seen', function (data) {
      if (onMessageHandler) {
        onMessageHandler({
          type: 'seen',
          msgId: data.msgId
        });
      }
    });

    // ✅ Online/offline presence
    socket.on('user-online', function (userId) {
      if (onMessageHandler) {
        onMessageHandler({ type: 'user-online', userId });
      }
    });

    socket.on('user-offline', function (data) {
      if (onMessageHandler) {
        onMessageHandler({ type: 'user-offline', userId: data.userId, lastSeen: data.lastSeen });
      }
    });

    window.VibeSocket.send = function (event, payload) {
      if (!socket || !socket.connected) return false;
      socket.emit(event, payload);
      return true;
    };

    window.VibeSocket.emit = window.VibeSocket.send;

    return socket;
  }

  window.VibeSocket = {
    connect: connect,
    send: function () {},
    emit: function () {}
  };

})();
