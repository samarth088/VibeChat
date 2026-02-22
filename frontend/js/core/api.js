// js/core/api.js
// API wrapper with DEV_MODE mocks — non-module

(function () {
  const cfg = window.ENV || { DEV_MODE: true };

  function fetchJSON(url, opts) {
    return fetch(url, opts).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  window.VibeAPI = {

    // login({ identifier, password }) => session object
    login: function ({ identifier, password }) {
      if (cfg.DEV_MODE) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            const userId = Math.floor(Math.random() * 90000) + 1;
            resolve({
              userId: userId,
              idFormatted: window.VibeState.formatId(userId),
              username: identifier,
              token: 'dev-token-' + userId,
              profile: { bio: '🚀 Living on vibes. Connect with me on VibeChat!' }
            });
          }, 600);
        });
      }
      return fetchJSON(cfg.API_URL + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
    },

    // signup({ fullname, username, contact, password }) => session object
    signup: function ({ fullname, username, contact, password }) {
      if (cfg.DEV_MODE) {
        return new Promise(function (resolve, reject) {
          setTimeout(function () {
            if (username.toLowerCase() === 'taken') {
              return reject(new Error('Username already taken. Try another.'));
            }
            const userId = Math.floor(Math.random() * 90000) + 1;
            resolve({
              userId:      userId,
              idFormatted: window.VibeState.formatId(userId),
              username:    username,
              token:       'dev-token-' + userId,
              profile:     { bio: '🚀 Living on vibes. Connect with me on VibeChat!' }
            });
          }, 800);
        });
      }
      return fetchJSON(cfg.API_URL + '/auth/signup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ fullname, username, contact, password })
      });
    },

    // searchUsers(query) => [{ userId, idFormatted, username, online }]
    searchUsers: function (query) {
      if (!query) return Promise.resolve([]);
      const q = String(query).trim();
      if (cfg.DEV_MODE) {
        if (q.startsWith('#')) {
          const num = parseInt(q.replace('#', ''), 10) || Math.floor(Math.random() * 90000) + 1;
          return Promise.resolve([{
            userId: num,
            idFormatted: window.VibeState.formatId(num),
            username: 'user_' + num,
            online: Math.random() > 0.5
          }]);
        }
        return Promise.resolve([1, 2, 3].map(function (i) {
          const id = Math.floor(Math.random() * 90000) + 1;
          return {
            userId: id,
            idFormatted: window.VibeState.formatId(id),  // FIX: was idFormated (typo)
            username: q + '_sample' + i,
            online: Math.random() > 0.5
          };
        }));
      }
      return fetchJSON(cfg.API_URL + '/users/search?q=' + encodeURIComponent(q));
    },

    // getUserById(userId) => user object
    getUserById: function (userId) {
      if (cfg.DEV_MODE) {
        return Promise.resolve({
          userId: userId,
          idFormatted: window.VibeState.formatId(userId),
          username: 'user_' + userId,
          bio: 'Dev user'
        });
      }
      return fetchJSON(cfg.API_URL + '/users/' + encodeURIComponent(userId));
    },

    // openChatWith(userId, token) => { roomId, participants }
    openChatWith: function (userId, token) {
      if (cfg.DEV_MODE) {
        return Promise.resolve({
          roomId: 'room_' + Math.floor(Math.random() * 1000000),
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
