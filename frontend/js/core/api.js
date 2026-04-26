// js/core/api.js
// VibeChat — centralized REST API calls

(function () {

  function getBase() {
    var cfg = window.ENV || {};
    return String(cfg.API_URL || "").replace(/\/+$/, "");
  }

  async function request(method, path, body, token) {
    var url = getBase() + path;

    var headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = "Bearer " + token;

    var opts = { method: method, headers: headers };

    if (body !== undefined && body !== null) {
      opts.body = JSON.stringify(body);
    }

    var res = await fetch(url, opts);
    var data = await res.json().catch(function () { return {}; });

    if (!res.ok) {
      var msg = data.message || data.error || ("Request failed: " + res.status);
      throw new Error(msg);
    }

    return data;
  }

  window.VibeAPI = {

    /* ─── Auth ─── */

    login: async function (payload) {
      return request("POST", "/auth/login", payload);
    },

    signup: async function (payload) {
      return request("POST", "/auth/register", payload);
    },

    // ✅ SEND OTP
    sendOTP: async function (email) {
      return request("POST", "/auth/send-otp", { email: email });
    },

    // ✅ VERIFY OTP (optional but recommended)
    verifyOTP: async function (email, otp) {
      return request("POST", "/auth/verify-otp", { email: email, otp: otp });
    },

    /* ─── Profile ─── */

    getMyProfile: async function (token) {
      var data = await request("GET", "/users/me", null, token);
      return data.user || data;
    },

    updateProfile: async function (payload, token) {
      var data = await request("PATCH", "/users/me", payload, token);
      return data.user || data;
    },

    /* ─── User search ─── */

    searchUsers: async function (query, token) {
      var encoded = encodeURIComponent(query);
      var data = await request("GET", "/users/search?q=" + encoded, null, token);
      return data.users || data.results || data || [];
    },

    getUserById: async function (userId, token) {
      var data = await request("GET", "/users/" + userId, null, token);
      return data.user || data;
    },

    /* ─── Chats ─── */

    getChats: async function (token) {
      var data = await request("GET", "/chats", null, token);
      return data.chats || data.data || [];
    },

    openOrCreateChat: async function (userId, token) {
      return request("POST", "/chats", { userId: userId }, token);
    },

    getMessages: async function (roomId, token) {
      var data = await request("GET", "/chats/" + roomId + "/messages", null, token);
      return data.messages || data || [];
    },

    sendMessage: async function (roomId, content, token) {
      return request("POST", "/chats/" + roomId + "/messages", { content: content }, token);
    },

    markSeen: async function (roomId, token) {
      return request("PATCH", "/chats/" + roomId + "/seen", null, token).catch(function () {});
    },

    /* ─── Groups ─── */

    getGroups: async function (token) {
      var data = await request("GET", "/groups", null, token);
      return data.groups || data || [];
    },

    createGroup: async function (payload, token) {
      return request("POST", "/groups", payload, token);
    }

  };

})();
