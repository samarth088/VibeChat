// js/core/api.js
// Production-ready API wrapper
// Load order: env.js → state.js → api.js

(function () {
  var cfg = window.ENV || {};
  cfg.DEV_MODE = !!cfg.DEV_MODE;
  if (!cfg.API_URL) cfg.API_URL = "";

  function getSession() {
    return window.VibeState && window.VibeState.loadSession
      ? window.VibeState.loadSession()
      : null;
  }

  function getToken(token) {
    if (token) return token;
    var sess = getSession();
    return sess && sess.token ? sess.token : "";
  }

  function fetchJSON(url, opts) {
    return fetch(url, opts).then(async function (res) {
      var data = {};
      try { data = await res.json(); } catch (e) {}

      if (!res.ok) {
        throw new Error(data.message || data.error || ("HTTP " + res.status));
      }

      return data;
    });
  }

  window.VibeAPI = {
    sendMessage: function (chatId, text, token) {
      return fetchJSON(cfg.API_URL + "/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + getToken(token)
        },
        body: JSON.stringify({
          chatId: chatId,
          text: text
        })
      });
    },

    login: function (data) {
      var identifier = data.identifier;
      var password = data.password;

      if (cfg.DEV_MODE) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            var userId = Math.floor(Math.random() * 90000) + 1;
            resolve({
              token: "dev-token-" + userId,
              user: {
                id: userId,
                uid: "vibe_demo_" + userId,
                name: identifier,
                username: identifier,
                email: identifier + "@demo.local",
                avatar: "",
                bio: "🚀 Living on vibes."
              }
            });
          }, 500);
        });
      }

      return fetchJSON(cfg.API_URL + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifier,
          password: password
        })
      });
    },

    sendOTP: function (email) {
      if (!email) {
        return Promise.reject(new Error("Email is required"));
      }

      return fetchJSON(cfg.API_URL + "/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email })
      });
    },

    verifyOTPAndSignup: function (data) {
      return fetchJSON(cfg.API_URL + "/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          otp: data.otp
        })
      }).then(function () {
        return fetchJSON(cfg.API_URL + "/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.fullname,
            email: data.email,
            password: data.password
          })
        });
      });
    },

    searchUsers: function (query) {
      if (!query) return Promise.resolve([]);

      var q = String(query).trim();

      return fetchJSON(cfg.API_URL + "/users/search?uid=" + encodeURIComponent(q), {
        headers: {
          "Authorization": "Bearer " + getToken()
        }
      }).then(function (res) {
        if (!res.success || !res.user) return [];

        return [{
          userId: res.user.id,
          uid: res.user.uid,
          name: res.user.name || "",
          username: res.user.username || res.user.name,
          avatar: res.user.avatar || "",
          bio: res.user.bio || "",
          isOnline: !!res.user.isOnline,
          lastSeen: res.user.lastSeen || null
        }];
      });
    },

    getUserById: function (userId) {
      return fetchJSON(cfg.API_URL + "/users/search?uid=" + encodeURIComponent(userId), {
        headers: {
          "Authorization": "Bearer " + getToken()
        }
      }).then(function (res) {
        if (!res.success || !res.user) {
          throw new Error("User not found");
        }

        return {
          userId: res.user.id,
          uid: res.user.uid,
          username: res.user.username,
          name: res.user.name,
          bio: res.user.bio || "",
          avatar: res.user.avatar || "",
          isOnline: !!res.user.isOnline,
          lastSeen: res.user.lastSeen || null
        };
      });
    },

    // ADDED
    getMyProfile: function (token) {
      return fetchJSON(cfg.API_URL + "/users/me", {
        headers: {
          "Authorization": "Bearer " + getToken(token)
        }
      }).then(function (res) {
        if (!res.success || !res.user) {
          throw new Error("Failed to load profile");
        }
        return res.user;
      });
    },

    // ADDED
    updateProfile: function (data, token) {
      return fetchJSON(cfg.API_URL + "/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + getToken(token)
        },
        body: JSON.stringify(data || {})
      }).then(function (res) {
        if (!res.success || !res.user) {
          throw new Error("Profile update failed");
        }
        return res.user;
      });
    },

    // ADDED
    updateAvatar: function (avatar, token) {
      return this.updateProfile({ avatar: avatar }, token);
    },

    openChatWith: function (userId, token) {
      return fetchJSON(cfg.API_URL + "/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + getToken(token)
        },
        body: JSON.stringify({
          otherUserId: userId
        })
      }).then(function (res) {
        if (!res.roomId) {
          throw new Error("Chat creation failed");
        }

        return {
          roomId: res.roomId
        };
      });
    }
  };
})();
