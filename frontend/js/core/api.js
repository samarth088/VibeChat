// js/core/api.js
// Production-ready API wrapper
// Load order: env.js → state.js → api.js

(function () {

  var cfg = window.ENV || {};
  cfg.DEV_MODE = !!cfg.DEV_MODE;   // Strict boolean
  if (!cfg.API_URL) cfg.API_URL = '';

  function fetchJSON(url, opts) {
    return fetch(url, opts).then(async function (res) {
      var data = {};
      try { data = await res.json(); } catch (e) {}

      if (!res.ok) {
        throw new Error(data.message || ('HTTP ' + res.status));
      }

      return data;
    });
  }

  window.VibeAPI = {

    // ─────────────────────────────────────────
    // LOGIN
    // ─────────────────────────────────────────
    
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
          profile:     { bio: '🚀 Living on vibes.' }
        });
      }, 600);
    });
  }

  return fetchJSON(cfg.API_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: identifier,   // 🔥 FIX
      password: password
    })
  });
},
    // ─────────────────────────────────────────
    // SEND OTP
    // ─────────────────────────────────────────
    sendOTP: function (email) {

      if (!email) {
        return Promise.reject(new Error("Email is required"));
      }

      return fetchJSON(cfg.API_URL + '/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      });
    },

    // ─────────────────────────────────────────
    // VERIFY OTP + SIGNUP (2-Step Backend Flow)
    // ─────────────────────────────────────────
    verifyOTPAndSignup: function (data) {

      return fetchJSON(cfg.API_URL + '/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          otp:   data.otp
        })
      }).then(function () {

        return fetchJSON(cfg.API_URL + '/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name:     data.fullname,
            email:    data.email,
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
    headers: {
      'Authorization': 'Bearer ' + (window.VibeState.session?.token || '')
    }
  }).then(function (res) {

    if (!res.success || !res.user) return [];

    return [{
      userId:   res.user.id,
      uid:      res.user.uid,
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

      if (cfg.DEV_MODE) {
        return Promise.resolve({
          userId:      userId,
          idFormatted: window.VibeState.formatId(userId),
          username:    'user_' + userId,
          bio:         'Dev user'
        });
      }

      return fetchJSON(cfg.API_URL + '/users/' + encodeURIComponent(userId), {
        headers: {
          'Authorization': 'Bearer ' + (window.VibeState.session?.token || '')
        }
      });
    },

    // ─────────────────────────────────────────
    // OPEN CHAT
    // ─────────────────────────────────────────
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
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (token || '')
        },
        body: JSON.stringify({ otherUserId: userId })
      });
    }

  };

})();
