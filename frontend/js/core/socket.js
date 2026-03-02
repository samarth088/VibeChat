// js/core/socket.js
// Minimal WebSocket client with auto-reconnect — non-module

(function () {
  const cfg = window.ENV || { WS_URL: '', DEV_MODE: true };
  let ws = null;
  let onMessageHandler = null;
  let reconnectTimer = null;
  const RECONNECT_DELAY = 2000;

  function buildUrl(token) {
    if (!cfg.WS_URL) return '';
    return cfg.WS_URL + (token ? '?token=' + encodeURIComponent(token) : '');
  }

  function connect(token, onMessage) {
    onMessageHandler = onMessage;

    // DEV MODE — no real WebSocket, provide stubs
    if (!cfg.WS_URL || cfg.DEV_MODE) {
      console.info('VibeSocket: DEV_MODE — no real WebSocket.');
      window.sendWS = function (payload) {
        console.log('[DEV sendWS]', payload);
        setTimeout(function () {
          if (onMessageHandler) onMessageHandler({ type: 'echo', payload: payload });
        }, 300);
        return true;
      };
      window.VibeSocket.send     = window.sendWS;
      window.VibeSocket.joinRoom = function (roomId) {
        console.log('[DEV joinRoom]', roomId);
      };
      return null;
    }

    // Already open — skip reconnect
    if (ws && ws.readyState === WebSocket.OPEN) return ws;

    ws = new WebSocket(buildUrl(token));

    ws.onopen = function () {
      console.log('[WS] connected');
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    };

    ws.onmessage = function (e) {
      let data = e.data;
      try { data = JSON.parse(e.data); } catch (_) {}
      if (onMessageHandler) onMessageHandler(data);
    };

    ws.onclose = function () {
      console.warn('[WS] closed — reconnecting in', RECONNECT_DELAY, 'ms');
      reconnectTimer = setTimeout(function () {
        connect(token, onMessageHandler);
      }, RECONNECT_DELAY);
    };

    ws.onerror = function (err) {
      console.error('[WS] error', err);
    };

    window.sendWS = function (data) {
      if (!ws || ws.readyState !== WebSocket.OPEN) return false;
      try { ws.send(JSON.stringify(data)); return true; } catch (e) { return false; }
    };

    window.VibeSocket.send = window.sendWS;
    window.VibeSocket.joinRoom = function (roomId) {
      return window.sendWS({ type: 'join', room: roomId });
    };

    return ws;
  }

  // Export
  window.VibeSocket = {
    connect:  connect,
    send:     function () {},
    joinRoom: function () {}
  };
  window.sendWS = function () { return false; };

})();
