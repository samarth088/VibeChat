// config/env.js
// Global ENV config — non-module, loaded first in app.html
window.ENV = {
  API_URL: '',     // e.g. 'https://api.vibechat.com' — set when backend ready
  WS_URL:  '',     // e.g. 'wss://ws.vibechat.com'   — set when backend ready
  DEV_MODE: true   // true => use mock data, no real network calls
};
