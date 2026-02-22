// js/core/api.js
// API wrapper with DEV_MODE mocks — non-module
// Load order: env.js → state.js → api.js

(function () {
  var cfg = window.ENV || { DEV_MODE: true, API_URL: '' };

  function fetchJSON(url, opts) {
    return fetch(url, opts).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  window.VibeAPI = {

    // ── login ─────────────────────────────────────────────────
    login: function (data) {
      var identifier = data.identifier;
      var password   = data.password;
      if (cfg.DEV_MODE) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            var userId = Math.floor(Math.random() * 90000) + 1;
            resolve({
              userId:      userId,
              idFormatted: window.VibeState.formatId(userId),
              username:    identifier,
              token:       'dev-token-' + userId,
              profile:     { bio: '🚀 Living on vibes. Connect with me on VibeChat!' }
            });
          }, 600);
        });
      }
      return fetchJSON(cfg.API_URL + '/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ identifier: identifier, password: password })
      });
    },

    // ── sendOTP ───────────────────────────────────────────────
    sendOTP: function (phone) {
      if (cfg.DEV_MODE) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            console.log('[DEV] OTP sent to', phone, '— use 123456 to verify');
            resolve({ success: true });
          }, 800);
        });
      }
      return fetchJSON(cfg.API_URL + '/auth/send-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone: phone })
      });
    },

    // ── verifyOTPAndSignup ────────────────────────────────────
    verifyOTPAndSignup: function (data) {
      if (cfg.DEV_MODE) {
        return new Promise(function (resolve, reject) {
          setTimeout(function () {
            if (data.otp !== '123456') {
              return reject(new Error('Invalid OTP. (DEV: use 123456)'));
            }
            if ((data.username || '').toLowerCase() === 'taken') {
              return reject(new Error('Username already taken.'));
            }
            var userId = Math.floor(Math.random() * 90000) + 1;
            resolve({
              userId:      userId,
              idFormatted: window.VibeState.formatId(userId),
              username:    data.username,
              token:       'dev-token-' + userId,
              profile:     { bio: '🚀 Living on vibes. Connect with me on VibeChat!' }
            });
          }, 700);
        });
      }
      return fetchJSON(cfg.API_URL + '/auth/verify-otp-signup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data)
      });
    },

    // ── searchUsers ───────────────────────────────────────────
    searchUsers: function (query) {
      if (!query) return Promise.resolve([]);
      var q = String(query).trim();
      if (cfg.DEV_MODE) {
        if (q.startsWith('#')) {
          var num = parseInt(q.replace('#', ''), 10) || Math.floor(Math.random() * 90000) + 1;
          return Promise.resolve([{
            userId:      num,
            idFormatted: window.VibeState.formatId(num),
            username:    'user_' + num,
            online:      Math.random() > 0.5
          }]);
        }
        return Promise.resolve([1, 2, 3].map(function (i) {
          var id = Math.floor(Math.random() * 90000) + 1;
          return {
            userId:      id,
            idFormatted: window.VibeState.formatId(id),
            username:    q + '_sample' + i,
            online:      Math.random() > 0.5
          };
        }));
      }
      return fetchJSON(cfg.API_URL + '/users/search?q=' + encodeURIComponent(q));
    },

    // ── getUserById ───────────────────────────────────────────
    getUserById: function (userId) {
      if (cfg.DEV_MODE) {
        return Promise.resolve({
          userId:      userId,
          idFormatted: window.VibeState.formatId(userId),
          username:    'user_' + userId,
          bio:         'Dev user'
        });
      }
      return fetchJSON(cfg.API_URL + '/users/' + encodeURIComponent(userId));
    },

    // ── openChatWith ──────────────────────────────────────────
    openChatWith: function (userId, token) {
      if (cfg.DEV_MODE) {
        return Promise.resolve({
          roomId:       'room_' + Math.floor(Math.random() * 1000000),
          participants: [userId]
        });
      }
      return fetchJSON(cfg.API_URL + '/chats/open', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': 'Bearer ' + (token || '')
        },
        body: JSON.stringify({ otherUserId: userId })
      });
    }

  };

})();
