// js/core/api.js
// API wrapper — production ready

(function () {

  var cfg = window.ENV || { DEV_MODE: true, API_URL: '' };

  function fetchJSON(url, opts) {
    return fetch(url, opts).then(async function (res) {

      var data = {};
      try {
        data = await res.json();
      } catch (e) {}

      if (!res.ok) {
        throw new Error(data.message || data.error || ('HTTP ' + res.status));
      }

      return data;
    });
  }

  window.VibeAPI = {

    // ── LOGIN ───────────────────────────────────────────────
    login: function (data) {

      var email    = data.identifier;
      var password = data.password;

      if (cfg.DEV_MODE) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            var userId = Math.floor(Math.random() * 90000) + 1;
            resolve({
              userId:   userId,
              username: email,
              token:    'dev-token-' + userId,
              profile:  { bio: '🚀 Living on vibes.' }
            });
          }, 600);
        });
      }

      return fetchJSON(cfg.API_URL + '/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:    email,
          password: password
        })
      });
    },


    // ── SEND OTP ────────────────────────────────────────────
    sendOTP: function (email) {

      if (cfg.DEV_MODE) {
        return Promise.resolve({ success: true });
      }

      return fetchJSON(cfg.API_URL + '/auth/send-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      });
    },


    // ── VERIFY OTP + SIGNUP ─────────────────────────────────
    verifyOTPAndSignup: function (data) {

      if (cfg.DEV_MODE) {
        return Promise.resolve({
          userId:   1,
          username: data.username,
          token:    'dev-token',
          profile:  {}
        });
      }

      return fetchJSON(cfg.API_URL + '/auth/verify-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          otp:   data.otp
        })
      })
      .then(function () {
        return fetchJSON(cfg.API_URL + '/auth/signup', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name:     data.username,
            email:    data.email,
            password: data.password
          })
        });
      });
    },


    // ── SEARCH USERS (UID BASED + AUTH) ─────────────────────
    searchUsers: function (query) {

      if (!query) return Promise.resolve([]);

      if (cfg.DEV_MODE) {
        return Promise.resolve([]);
      }

      var sess = window.VibeState.session;
      if (!sess || !sess.token) {
        return Promise.reject(new Error('Not authenticated'));
      }

      return fetchJSON(
        cfg.API_URL + '/users/search?uid=' + encodeURIComponent(query.trim()),
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer ' + sess.token
          }
        }
      )
      .then(function (res) {
        if (!res.success || !res.user) return [];
        return [res.user]; // normalize for UI
      })
      .catch(function () {
        return [];
      });
    },


    // ── GET USER BY ID (AUTH) ───────────────────────────────
    getUserById: function (userId) {

      if (cfg.DEV_MODE) {
        return Promise.resolve({
          userId:   userId,
          username: 'dev_user'
        });
      }

      var sess = window.VibeState.session;

      return fetchJSON(
        cfg.API_URL + '/users/search?uid=' + encodeURIComponent(userId),
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer ' + (sess ? sess.token : '')
          }
        }
      ).then(function (res) {
        return res.user;
      });
    },


    // ── OPEN CHAT ────────────────────────────────────────────
    openChatWith: function (userId, token) {

      if (cfg.DEV_MODE) {
        return Promise.resolve({
          roomId: 'room_' + userId
        });
      }

      return fetchJSON(cfg.API_URL + '/chats/open', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ otherUserId: userId })
      });
    }

  };

})();
