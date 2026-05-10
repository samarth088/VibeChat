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
    /* ■■■ Auth ■■■ */
    login: async function (payload) {
      return request("POST", "/auth/login", {
        identifier: payload.identifier || payload.email,
        password: payload.password
      });
    },
    sendOTP: async function (email) {
      return request("POST", "/auth/send-otp", { email: email });
    },
    verifyOTP: async function (email, otp) {
      return request("POST", "/auth/verify-otp", { email: email, otp: otp });
    },
    verifyOTPAndSignup: async function (payload) {
      return request("POST", "/auth/verify-otp", {
        email: payload.email,
        otp: payload.otp,
        fullname: payload.fullname,
        username: payload.username,
        password: payload.password
      });
    },

    /* ■■■ Profile ■■■ */
    getMyProfile: async function (token) {
      var data = await request("GET", "/users/me", null, token);
      return data.user || data;
    },
    updateProfile: async function (payload, token) {
      var data = await request("PUT", "/users/me", payload, token);
      return data.user || data;
    },

    /* ■■■ Change Password ■■■ */
    changePassword: async function (currentPassword, newPassword, token) {
      return request("PATCH", "/users/change-password", {
        currentPassword: currentPassword,
        newPassword: newPassword
      }, token);
    },

    /* ■■■ User search ■■■ */
    searchUsers: async function (query, token) {
      var encoded = encodeURIComponent(query);
      var data = await request("GET", "/users/search?uid=" + encoded, null, token);
      return data.user ? [data.user] : [];
    },
    getAllUsers: async function (token) {
      var data = await request("GET", "/users/all", null, token);
      return data.users || [];
    },

    /* ■■■ Chats ■■■ */
    getChats: async function (token) {
      var data = await request("GET", "/chats", null, token);
      return data.chats || [];
    },
    openOrCreateChat: async function (userId, token) {
      return request("POST", "/chats", { userId: userId }, token);
    },
    getMessages: async function (roomId, token) {
      var data = await request("GET", "/chats/" + roomId + "/messages", null, token);
      return data.messages || [];
    },
    sendMessage: async function (roomId, content, token) {
      return request("POST", "/chats/" + roomId + "/messages", { content: content }, token);
    },
    markSeen: async function (roomId, token) {
      return request("PATCH", "/chats/" + roomId + "/seen", null, token).catch(function () {});
    },

    /* ■■■ Groups ■■■ */
    getGroups: async function (token) {
      var data = await request("GET", "/groups", null, token);
      return data.groups || data || [];
    },
    createGroup: async function (payload, token) {
      return request("POST", "/groups", payload, token);
    }
  };
})();
