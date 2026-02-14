// js/core/socket.js
(function () {
  if (!window.App) window.App = {};
  const cfg = (window.APP_CONFIG && window.APP_CONFIG.socketUrl) ? window.APP_CONFIG : { socketUrl: "" };

  let ws = null;
  let connected = false;
  let attempts = 0;
  const listeners = {}; // event -> Set(callback)

  // ping/pong
  let pingTimer = null;

  function _emitLocal(event, data) {
    const set = listeners[event];
    if (!set) return;
    set.forEach(cb => {
      try { cb(data); } catch (err) { console.error("socket listener err", err); }
    });
  }

  function onMessageRaw(raw) {
    try {
      const msg = JSON.parse(raw);
      if (msg && msg.event) {
        _emitLocal(msg.event, msg.data);
      }
    } catch (err) {
      console.warn("Invalid ws message", raw);
    }
  }

  function startPing() {
    stopPing();
    pingTimer = setInterval(() => {
      try { ws && ws.send(JSON.stringify({ event: '__ping' })); } catch (e) {}
    }, 25000);
  }
  function stopPing() { if (pingTimer) { clearInterval(pingTimer); pingTimer = null; } }

  function connect(token) {
    if (connected || ws) return;
    attempts = 0;
    const urlBase = cfg.socketUrl || (window.location.origin.replace(/^http/, 'ws'));
    // attach token as query param (if provided) — backend should validate
    const url = token ? `${urlBase}?token=${encodeURIComponent(token)}` : urlBase;
    _open(url);
  }

  function _open(url) {
    attempts++;
    ws = new WebSocket(url);
    ws.addEventListener('open', () => {
      connected = true;
      attempts = 0;
      console.info("WS connected");
      _emitLocal('__connected', true);
      startPing();
    });

    ws.addEventListener('message', (ev) => {
      const text = typeof ev.data === 'string' ? ev.data : null;
      if (!text) return;
      // handle control messages
      try {
        const parsed = JSON.parse(text);
        if (parsed && parsed.event === '__pong') return; // ignore
      } catch (e) {}
      onMessageRaw(text);
    });

    ws.addEventListener('close', (ev) => {
      connected = false;
      _emitLocal('__connected', false);
      stopPing();
      ws = null;
      // reconnect with exponential backoff
      const maxAttempts = (window.APP_CONFIG && window.APP_CONFIG.reconnectMaxAttempts) || 10;
      if (attempts <= maxAttempts) {
        const delay = Math.min(30000, 500 * Math.pow(1.8, attempts)); // growth
        console.info(`WS closed — reconnecting in ${Math.round(delay)}ms (attempt ${attempts})`);
        setTimeout(() => {
          // reuse same url (token must be preserved by caller)
          const token = localStorage.getItem('auth_token');
          const newUrl = (cfg.socketUrl || (window.location.origin.replace(/^http/, 'ws'))) + (token ? `?token=${encodeURIComponent(token)}` : '');
          _open(newUrl);
        }, delay);
      } else {
        console.warn("Max WS reconnect attempts reached.");
      }
    });

    ws.addEventListener('error', (err) => {
      console.warn("WS error", err);
      // will trigger close
    });
  }

  function emit(event, data = {}) {
    const payload = JSON.stringify({ event, data });
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    } else {
      console.warn("WS not open — emit buffered? (not implemented)");
    }
  }

  function on(event, cb) {
    if (!listeners[event]) listeners[event] = new Set();
    listeners[event].add(cb);
    return () => off(event, cb);
  }

  function off(event, cb) {
    if (!listeners[event]) return;
    listeners[event].delete(cb);
  }

  function disconnect() {
    try {
      stopPing();
      if (ws) ws.close();
    } catch (e) {}
    ws = null;
    connected = false;
  }

  function isConnected() {
    return !!(ws && ws.readyState === WebSocket.OPEN);
  }

  window.App.socket = {
    connect,
    emit,
    on,
    off,
    disconnect,
    isConnected
  };
})();
