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
      if (cfg.DEV_MODE) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            var fakeUid = 'vibe_' + Math.random().toString(36).slice(2, 8);
            resolve({
              token: 'dev-token-123',
              user: {
                id: fakeUid,
                uid: fakeUid,
                name: 'Dev User',
                username: data.identifier.split('@')[0],
                email: data.identifier,
                avatar: ''
              }
            });
          }, 600);
        });
      }

      return fetchJSON(cfg.API_URL + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.identifier,
          password: data.password
        })
      }).then(function (res) {
        return {
          token: res.token,
          user: {
            id: res.user.uid,      // 🔥 USE UID
            uid: res.user.uid,
            name: res.user.username,
            username: res.user.username,
            email: res.user.email,
            avatar: res.user.avatar || ''
          }
        };
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
        body: JSON.stringify({ email })
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
      }).then(function (res) {
        return {
          token: res.token,
          user: {
            id: res.user.uid,   // 🔥 USE UID
            uid: res.user.uid,
            name: res.user.username,
            username: res.user.username,
            email: res.user.email,
            avatar: res.user.avatar || ''
          }
        };
      });
    },

    // ─────────────────────────────────────────
    // SEARCH USERS
    // ─────────────────────────────────────────
    searchUsers: function (query) {
      if (!query) return Promise.resolve([]);
      var q = String(query).trim();

      if (cfg.DEV_MODE) {
        var fakeUid = 'vibe_' + Math.random().toString(36).slice(2, 8);
        return Promise.resolve([{
          userId: fakeUid,
          uid: fakeUid,
          idFormatted: fakeUid,
          name: q + ' User',
          username: q + '_sample',
          avatar: '',
          online: true
        }]);
      }

      return fetchJSON(
        cfg.API_URL + '/users/search?uid=' + encodeURIComponent(q),
        { headers: authHeader() }
      ).then(function (res) {

        if (!res.success || !res.user) return [];

        return [{
          userId:   res.user.uid,      // 🔥 USE UID
          uid:      res.user.uid,
          idFormatted: res.user.uid,  // 🔥 DIRECT UID
          name:     res.user.username,
          username: res.user.username,
          avatar:   res.user.avatar || '',
          online:   res.user.online || false
        }];
      });
    },

    // ─────────────────────────────────────────
    // GET USER BY UID
    // ─────────────────────────────────────────
    getUserById: function (uid) {
      if (cfg.DEV_MODE) {
        return Promise.resolve({
          uid: uid,
          name: 'Dev User',
          username: 'user_' + uid
        });
      }

      return fetchJSON(
        cfg.API_URL + '/users/' + encodeURIComponent(uid),
        { headers: authHeader() }
      );
    },

    // ─────────────────────────────────────────
    // OPEN CHAT
    // ─────────────────────────────────────────
    openChatWith: function (uid, token) {
      if (cfg.DEV_MODE) {
        return Promise.resolve({
          roomId: 'room_' + Math.floor(Math.random() * 1000000)
        });
      }

      return fetchJSON(cfg.API_URL + '/chats/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (token || '')
        },
        body: JSON.stringify({
          otherUserId: uid   // 🔥 SEND UID
        })
      });
    }

  };

})();
