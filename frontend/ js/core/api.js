// js/core/api.js
(function () {
  if (!window.App) window.App = {};
  const cfg = (window.APP_CONFIG && window.APP_CONFIG.baseUrl) ? window.APP_CONFIG : { baseUrl: "" };

  // helper: get headers (if token present in localStorage)
  function getAuthHeaders() {
    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("auth_token");
    if (token) headers["Authorization"] = "Bearer " + token;
    return headers;
  }

  async function request(path, opts = {}) {
    const url = (cfg.baseUrl ? cfg.baseUrl.replace(/\/$/, "") : "") + path;
    const final = {
      credentials: opts.credentials || 'include', // prefer include to allow httpOnly cookie if server sets it
      method: opts.method || 'GET',
      headers: Object.assign({}, opts.headers || {}, (opts.json !== false ? getAuthHeaders() : {})),
      body: opts.body
    };
    if (opts.json !== false && opts.body && typeof opts.body !== 'string') {
      final.body = JSON.stringify(opts.body);
    }
    try {
      const res = await fetch(url, final);
      const contentType = res.headers.get('content-type') || '';
      let payload = null;
      if (contentType.includes('application/json')) payload = await res.json();
      else payload = await res.text();

      if (!res.ok) {
        const err = new Error(payload && payload.message ? payload.message : ('Request failed: ' + res.status));
        err.status = res.status;
        err.payload = payload;
        throw err;
      }
      return payload;
    } catch (err) {
      // normalize error
      console.error("API error", err);
      throw err;
    }
  }

  // AUTH
  async function login(email, password) {
    const res = await request('/auth/login', { method: 'POST', body: { email, password }});
    // backend should set httpOnly cookie; if it returns token, optionally store (not recommended but supported)
    if (res && res.token) localStorage.setItem('auth_token', res.token);
    return res;
  }

  async function signup(name, email, password) {
    const res = await request('/auth/signup', { method: 'POST', body: { name, email, password }});
    if (res && res.token) localStorage.setItem('auth_token', res.token);
    return res;
  }

  async function logout() {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('auth_token');
    }
  }

  // DATA
  async function fetchChats() {
    return await request('/chats');
  }

  async function fetchMessages(chatId, page = 1, pageSize = 50) {
    return await request(`/chats/${encodeURIComponent(chatId)}/messages?page=${page}&size=${pageSize}`);
  }

  async function sendMessageREST(chatId, content, attachments = []) {
    return await request(`/chats/${encodeURIComponent(chatId)}/messages`, {
      method: 'POST',
      body: { content, attachments }
    });
  }

  // token helper (in case you need to set one manually)
  function setAuthToken(token) {
    if (!token) return;
    localStorage.setItem('auth_token', token);
  }
  function clearAuthToken() {
    localStorage.removeItem('auth_token');
  }

  window.App.api = {
    cfg,
    request,
    login,
    signup,
    logout,
    fetchChats,
    fetchMessages,
    sendMessageREST,
    setAuthToken,
    clearAuthToken
  };
})();
