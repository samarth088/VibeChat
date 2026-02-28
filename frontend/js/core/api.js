// js/core/api.js
// API wrapper with DEV_MODE mocks — non-module
// Load order: env.js → state.js → api.js

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
              profile:  { bio: '🚀 Living on vibes. Connect with me on VibeChat!' }
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
        return new Promise(function (resolve) {
          setTimeout(function () {
            console.log('[DEV] OTP sent to', email, '— use 123456');
            resolve({ success: true });
          }, 800);
        });
      }

      return fetchJSON(cfg.API_URL + '/auth/send-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      });
    },


    // ── VERIFY OTP + SIGNUP (FIXED 2-STEP FLOW) ────────────
    verifyOTPAndSignup: function (data) {

      if (cfg.DEV_MODE) {
        return new Promise(function (resolve, reject) {

          setTimeout(function () {

            if (data.otp !== '123456') {
              return reject(new Error('Invalid OTP. (DEV: use 123456)'));
            }

            var userId = Math.floor(Math.random() * 90000) + 1;

            resolve({
              userId:   userId,
              username: data.username,
              token:    'dev-token-' + userId,
              profile:  { bio: '🚀 Living on vibes.' }
            });

          }, 700);
        });
      }

      // STEP 1: Verify OTP
      return fetchJSON(cfg.API_URL + '/auth/verify-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          otp:   data.otp
        })
      })

      // STEP 2: Then create account
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


    // ── SEARCH USERS ─────────────────────────────────────────
    searchUsers: function (query) {

      if (!query) return Promise.resolve([]);

      var q = String(query).trim();

      if (cfg.DEV_MODE) {
        var id = Math.floor(Math.random() * 90000) + 1;
        return Promise.resolve([{
          userId:   id,
          username: q + '_sample',
          online:   true
        }]);
      }

      return fetchJSON(cfg.API_URL + '/users/search?q=' + encodeURIComponent(q));
    },


    // ── GET USER BY ID ───────────────────────────────────────
    getUserById: function (userId) {

      if (cfg.DEV_MODE) {
        return Promise.resolve({
          userId:   userId,
          username: 'user_' + userId,
          bio:      'Dev user'
        });
      }

      return fetchJSON(cfg.API_URL + '/users/' + encodeURIComponent(userId));
    },


    // ── OPEN CHAT ────────────────────────────────────────────
    openChatWith: function (userId, token) {

      if (cfg.DEV_MODE) {
        return Promise.resolve({
          roomId:       'room_' + Math.floor(Math.random() * 1000000),
          participants: [userId]
        });
      }

      return fetchJSON(cfg.API_URL + '/chats/open', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': 'Bearer ' + (token || '')
        },
        body: JSON.stringify({ otherUserId: userId })
      });
    }

  };

})();
