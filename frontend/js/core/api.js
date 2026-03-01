(function () {

  var cfg = window.ENV || {};
  cfg.DEV_MODE = !!cfg.DEV_MODE;
  if (!cfg.API_URL) cfg.API_URL = '';

  function fetchJSON(url, opts) {
    return fetch(url, opts).then(async function (res) {
      var data = {};
      try { data = await res.json(); } catch (e) {}
      if (!res.ok) throw new Error(data.message || ('HTTP ' + res.status));
      return data;
    });
  }

  function authHeader() {
    var token = (window.VibeState.session && window.VibeState.session.token) || '';
    return { 'Authorization': 'Bearer ' + token };
  }

  window.VibeAPI = {

    // ─────────────────────────────────────────
    // LOGIN
    // ─────────────────────────────────────────
    login: function (data) {
      return fetchJSON(cfg.API_URL + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.identifier,
          password: data.password
        })
      });
    },

    // ─────────────────────────────────────────
    // SEND OTP
    // ─────────────────────────────────────────
    sendOTP: function (email) {
      if (!email) return Promise.reject(new Error("Email is required"));
      return fetchJSON(cfg.API_URL + '/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      });
    },

    // ─────────────────────────────────────────
    // VERIFY OTP + SIGNUP
    // ─────────────────────────────────────────
    verifyOTPAndSignup: function (data) {
      return fetchJSON(cfg.API_URL + '/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          otp: data.otp
        })
      }).then(function () {
        return fetchJSON(cfg.API_URL + '/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.fullname,
            email: data.email,
            password: data.password
          })
        });
      });
    },

    // ─────────────────────────────────────────
    // SEARCH USERS
    // ─────────────────────────────────────────
    searchUsers: function (query) {
      if (!query) return Promise.resolve([]);

      var q = String(query).trim();

      return fetchJSON(cfg.API_URL + '/users/search?uid=' + encodeURIComponent(q), {
        headers: authHeader()
      }).then(function (res) {

        if (!res.success || !res.user) return [];

        return [{
          userId:   res.user.id,
          uid:      res.user.uid,
          idFormatted: res.user.uid,   // 🔥 FIXED — no more #00000
          name:     res.user.name,
          username: res.user.username || res.user.name,
          avatar:   res.user.avatar || '',
          online:   res.user.online || false
        }];
      });
    },

    // ─────────────────────────────────────────
    // GET USER BY ID
    // ─────────────────────────────────────────
    getUserById: function (userId) {
      return fetchJSON(cfg.API_URL + '/users/' + encodeURIComponent(userId), {
        headers: authHeader()
      });
    },

    // ─────────────────────────────────────────
    // OPEN CHAT (FIXED ENDPOINT)
    // ─────────────────────────────────────────
    openChatWith: function (userId, token) {
      return fetchJSON(cfg.API_URL + '/chats', {   // 🔥 FIXED (no /open)
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (token || '')
        },
        body: JSON.stringify({ otherUserId: userId })
      });
    }

  };

})();
