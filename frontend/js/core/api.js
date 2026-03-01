// js/core/api.js
(function () {

  var cfg = window.ENV || {};
  cfg.DEV_MODE = !!cfg.DEV_MODE;
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
      var email    = data.identifier;
      var password = data.password;

      if (cfg.DEV_MODE) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            var fakeUid = 'vibe_' + Math.random().toString(36).slice(2, 8);
            resolve({
              token: 'dev-token-123',
              user: {
                id:       'dev_id_001',
                uid:      fakeUid,
                username: email.split('@')[0],
                email:    email,
                avatar:   ''
              }
            });
          }, 600);
        });
      }

      // Backend returns: { success, token, user: { id, uid, username, email, avatar } }
      return fetchJSON(cfg.API_URL + '/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email, password: password })
      });
    },

    // ─────────────────────────────────────────
    // SEND OTP
    // ─────────────────────────────────────────
    sendOTP: function (email) {
      if (!email) return Promise.reject(new Error("Email is required"));

      return fetchJSON(cfg.API_URL + '/auth/send-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email })
      });
    },

    // ─────────────────────────────────────────
    // VERIFY OTP + SIGNUP
    // ─────────────────────────────────────────
    verifyOTPAndSignup: function (data) {
      return fetchJSON(cfg.API_URL + '/auth/verify-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: data.email, otp: data.otp })
      }).then(function () {
        return fetchJSON(cfg.API_URL + '/auth/signup', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            name:     data.fullname,
            email:    data.email,
            password: data.password
          })
        });
      });
    },

    // ─────────────────────────────────────────
    // SEARCH USERS — by uid (vibe_xxx) or username
    // ─────────────────────────────────────────
    searchUsers: function (query) {
      if (!query) return Promise.resolve([]);

      var q = String(query).trim();

      if (cfg.DEV_MODE) {
        return Promise.resolve([{
          userId:   'dev_id_002',
          uid:      'vibe_sample',
          username: q + '_sample',
          online:   true
        }]);
      }

      return fetchJSON(
        cfg.API_URL + '/users/search?uid=' + encodeURIComponent(q),
        {
          headers: {
            'Authorization': 'Bearer ' + (window.VibeState.session?.token || '')
          }
        }
      ).then(function (res) {
        if (!res.success || !res.user) return [];

        return [{
          userId:   res.user.id,
          uid:      res.user.uid,       // ← vibe_a3f9k2
          username: res.user.username || res.user.name,
          online:   res.user.online || false
        }];
      }).catch(function () {
        return [];  // not found = empty array
      });
    },

    // ─────────────────────────────────────────
    // GET USER BY ID
    // ─────────────────────────────────────────
    getUserById: function (userId) {
      if (cfg.DEV_MODE) {
        return Promise.resolve({
          userId:   userId,
          uid:      'vibe_devusr',
          username: 'user_' + userId,
          bio:      'Dev user'
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
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': 'Bearer ' + (token || '')
        },
        body: JSON.stringify({ otherUserId: userId })
      });
    }

  };

})();// js/core/api.js
(function () {

  var cfg = window.ENV || {};
  cfg.DEV_MODE = !!cfg.DEV_MODE;
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
      var email    = data.identifier;
      var password = data.password;

      if (cfg.DEV_MODE) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            var fakeUid = 'vibe_' + Math.random().toString(36).slice(2, 8);
            resolve({
              token: 'dev-token-123',
              user: {
                id:       'dev_id_001',
                uid:      fakeUid,
                username: email.split('@')[0],
                email:    email,
                avatar:   ''
              }
            });
          }, 600);
        });
      }

      // Backend returns: { success, token, user: { id, uid, username, email, avatar } }
      return fetchJSON(cfg.API_URL + '/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email, password: password })
      });
    },

    // ─────────────────────────────────────────
    // SEND OTP
    // ─────────────────────────────────────────
    sendOTP: function (email) {
      if (!email) return Promise.reject(new Error("Email is required"));

      return fetchJSON(cfg.API_URL + '/auth/send-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email })
      });
    },

    // ─────────────────────────────────────────
    // VERIFY OTP + SIGNUP
    // ─────────────────────────────────────────
    verifyOTPAndSignup: function (data) {
      return fetchJSON(cfg.API_URL + '/auth/verify-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: data.email, otp: data.otp })
      }).then(function () {
        return fetchJSON(cfg.API_URL + '/auth/signup', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            name:     data.fullname,
            email:    data.email,
            password: data.password
          })
        });
      });
    },

    // ─────────────────────────────────────────
    // SEARCH USERS — by uid (vibe_xxx) or username
    // ─────────────────────────────────────────
    searchUsers: function (query) {
      if (!query) return Promise.resolve([]);

      var q = String(query).trim();

      if (cfg.DEV_MODE) {
        return Promise.resolve([{
          userId:   'dev_id_002',
          uid:      'vibe_sample',
          username: q + '_sample',
          online:   true
        }]);
      }

      return fetchJSON(
        cfg.API_URL + '/users/search?uid=' + encodeURIComponent(q),
        {
          headers: {
            'Authorization': 'Bearer ' + (window.VibeState.session?.token || '')
          }
        }
      ).then(function (res) {
        if (!res.success || !res.user) return [];

        return [{
          userId:   res.user.id,
          uid:      res.user.uid,       // ← vibe_a3f9k2
          username: res.user.username || res.user.name,
          online:   res.user.online || false
        }];
      }).catch(function () {
        return [];  // not found = empty array
      });
    },

    // ─────────────────────────────────────────
    // GET USER BY ID
    // ─────────────────────────────────────────
    getUserById: function (userId) {
      if (cfg.DEV_MODE) {
        return Promise.resolve({
          userId:   userId,
          uid:      'vibe_devusr',
          username: 'user_' + userId,
          bio:      'Dev user'
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
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': 'Bearer ' + (token || '')
        },
        body: JSON.stringify({ otherUserId: userId })
      });
    }

  };

})();// js/core/api.js
(function () {

  var cfg = window.ENV || {};
  cfg.DEV_MODE = !!cfg.DEV_MODE;
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
      var email    = data.identifier;
      var password = data.password;

      if (cfg.DEV_MODE) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            var fakeUid = 'vibe_' + Math.random().toString(36).slice(2, 8);
            resolve({
              token: 'dev-token-123',
              user: {
                id:       'dev_id_001',
                uid:      fakeUid,
                username: email.split('@')[0],
                email:    email,
                avatar:   ''
              }
            });
          }, 600);
        });
      }

      // Backend returns: { success, token, user: { id, uid, username, email, avatar } }
      return fetchJSON(cfg.API_URL + '/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email, password: password })
      });
    },

    // ─────────────────────────────────────────
    // SEND OTP
    // ─────────────────────────────────────────
    sendOTP: function (email) {
      if (!email) return Promise.reject(new Error("Email is required"));

      return fetchJSON(cfg.API_URL + '/auth/send-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email })
      });
    },

    // ─────────────────────────────────────────
    // VERIFY OTP + SIGNUP
    // ─────────────────────────────────────────
    verifyOTPAndSignup: function (data) {
      return fetchJSON(cfg.API_URL + '/auth/verify-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: data.email, otp: data.otp })
      }).then(function () {
        return fetchJSON(cfg.API_URL + '/auth/signup', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            name:     data.fullname,
            email:    data.email,
            password: data.password
          })
        });
      });
    },

    // ─────────────────────────────────────────
    // SEARCH USERS — by uid (vibe_xxx) or username
    // ─────────────────────────────────────────
    searchUsers: function (query) {
      if (!query) return Promise.resolve([]);

      var q = String(query).trim();

      if (cfg.DEV_MODE) {
        return Promise.resolve([{
          userId:   'dev_id_002',
          uid:      'vibe_sample',
          username: q + '_sample',
          online:   true
        }]);
      }

      return fetchJSON(
        cfg.API_URL + '/users/search?uid=' + encodeURIComponent(q),
        {
          headers: {
            'Authorization': 'Bearer ' + (window.VibeState.session?.token || '')
          }
        }
      ).then(function (res) {
        if (!res.success || !res.user) return [];

        return [{
          userId:   res.user.id,
          uid:      res.user.uid,       // ← vibe_a3f9k2
          username: res.user.username || res.user.name,
          online:   res.user.online || false
        }];
      }).catch(function () {
        return [];  // not found = empty array
      });
    },

    // ─────────────────────────────────────────
    // GET USER BY ID
    // ─────────────────────────────────────────
    getUserById: function (userId) {
      if (cfg.DEV_MODE) {
        return Promise.resolve({
          userId:   userId,
          uid:      'vibe_devusr',
          username: 'user_' + userId,
          bio:      'Dev user'
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
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': 'Bearer ' + (token || '')
        },
        body: JSON.stringify({ otherUserId: userId })
      });
    }

  };

})();// js/core/api.js
(function () {

  var cfg = window.ENV || {};
  cfg.DEV_MODE = !!cfg.DEV_MODE;
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
      var email    = data.identifier;
      var password = data.password;

      if (cfg.DEV_MODE) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            var fakeUid = 'vibe_' + Math.random().toString(36).slice(2, 8);
            resolve({
              token: 'dev-token-123',
              user: {
                id:       'dev_id_001',
                uid:      fakeUid,
                username: email.split('@')[0],
                email:    email,
                avatar:   ''
              }
            });
          }, 600);
        });
      }

      // Backend returns: { success, token, user: { id, uid, username, email, avatar } }
      return fetchJSON(cfg.API_URL + '/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email, password: password })
      });
    },

    // ─────────────────────────────────────────
    // SEND OTP
    // ─────────────────────────────────────────
    sendOTP: function (email) {
      if (!email) return Promise.reject(new Error("Email is required"));

      return fetchJSON(cfg.API_URL + '/auth/send-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email })
      });
    },

    // ─────────────────────────────────────────
    // VERIFY OTP + SIGNUP
    // ─────────────────────────────────────────
    verifyOTPAndSignup: function (data) {
      return fetchJSON(cfg.API_URL + '/auth/verify-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: data.email, otp: data.otp })
      }).then(function () {
        return fetchJSON(cfg.API_URL + '/auth/signup', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            name:     data.fullname,
            email:    data.email,
            password: data.password
          })
        });
      });
    },

    // ─────────────────────────────────────────
    // SEARCH USERS — by uid (vibe_xxx) or username
    // ─────────────────────────────────────────
    searchUsers: function (query) {
      if (!query) return Promise.resolve([]);

      var q = String(query).trim();

      if (cfg.DEV_MODE) {
        return Promise.resolve([{
          userId:   'dev_id_002',
          uid:      'vibe_sample',
          username: q + '_sample',
          online:   true
        }]);
      }

      return fetchJSON(
        cfg.API_URL + '/users/search?uid=' + encodeURIComponent(q),
        {
          headers: {
            'Authorization': 'Bearer ' + (window.VibeState.session?.token || '')
          }
        }
      ).then(function (res) {
        if (!res.success || !res.user) return [];

        return [{
          userId:   res.user.id,
          uid:      res.user.uid,       // ← vibe_a3f9k2
          username: res.user.username || res.user.name,
          online:   res.user.online || false
        }];
      }).catch(function () {
        return [];  // not found = empty array
      });
    },

    // ─────────────────────────────────────────
    // GET USER BY ID
    // ─────────────────────────────────────────
    getUserById: function (userId) {
      if (cfg.DEV_MODE) {
        return Promise.resolve({
          userId:   userId,
          uid:      'vibe_devusr',
          username: 'user_' + userId,
          bio:      'Dev user'
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
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': 'Bearer ' + (token || '')
        },
        body: JSON.stringify({ otherUserId: userId })
      });
    }

  };

})();// js/core/api.js
(function () {

  var cfg = window.ENV || {};
  cfg.DEV_MODE = !!cfg.DEV_MODE;
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
      var email    = data.identifier;
      var password = data.password;

      if (cfg.DEV_MODE) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            var fakeUid = 'vibe_' + Math.random().toString(36).slice(2, 8);
            resolve({
              token: 'dev-token-123',
              user: {
                id:       'dev_id_001',
                uid:      fakeUid,
                username: email.split('@')[0],
                email:    email,
                avatar:   ''
              }
            });
          }, 600);
        });
      }

      // Backend returns: { success, token, user: { id, uid, username, email, avatar } }
      return fetchJSON(cfg.API_URL + '/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email, password: password })
      });
    },

    // ─────────────────────────────────────────
    // SEND OTP
    // ─────────────────────────────────────────
    sendOTP: function (email) {
      if (!email) return Promise.reject(new Error("Email is required"));

      return fetchJSON(cfg.API_URL + '/auth/send-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email })
      });
    },

    // ─────────────────────────────────────────
    // VERIFY OTP + SIGNUP
    // ─────────────────────────────────────────
    verifyOTPAndSignup: function (data) {
      return fetchJSON(cfg.API_URL + '/auth/verify-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: data.email, otp: data.otp })
      }).then(function () {
        return fetchJSON(cfg.API_URL + '/auth/signup', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            name:     data.fullname,
            email:    data.email,
            password: data.password
          })
        });
      });
    },

    // ─────────────────────────────────────────
    // SEARCH USERS — by uid (vibe_xxx) or username
    // ─────────────────────────────────────────
    searchUsers: function (query) {
      if (!query) return Promise.resolve([]);

      var q = String(query).trim();

      if (cfg.DEV_MODE) {
        return Promise.resolve([{
          userId:   'dev_id_002',
          uid:      'vibe_sample',
          username: q + '_sample',
          online:   true
        }]);
      }

      return fetchJSON(
        cfg.API_URL + '/users/search?uid=' + encodeURIComponent(q),
        {
          headers: {
            'Authorization': 'Bearer ' + (window.VibeState.session?.token || '')
          }
        }
      ).then(function (res) {
        if (!res.success || !res.user) return [];

        return [{
          userId:   res.user.id,
          uid:      res.user.uid,       // ← vibe_a3f9k2
          username: res.user.username || res.user.name,
          online:   res.user.online || false
        }];
      }).catch(function () {
        return [];  // not found = empty array
      });
    },

    // ─────────────────────────────────────────
    // GET USER BY ID
    // ─────────────────────────────────────────
    getUserById: function (userId) {
      if (cfg.DEV_MODE) {
        return Promise.resolve({
          userId:   userId,
          uid:      'vibe_devusr',
          username: 'user_' + userId,
          bio:      'Dev user'
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
