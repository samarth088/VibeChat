// js/core/state.js
// Global state helper — non-module, loaded before everything else

(function () {
  const STORAGE_KEY = "vibe_session_v1";

  window.VibeState = {
    session: null,
    currentChat: null,

    formatId: function (n) {
      var value = String(n || "");
      if (!value) return "";
      if (value.indexOf("vibe_") === 0) return value;

      const num = Number(n);
      if (!isNaN(num) && String(num) === String(n)) {
        return "#" + String(num).padStart(5, "0");
      }

      return value;
    },

    saveSession: function (sessionObj) {
      // Keep original createdAt if already set (don't reset 7-day timer on re-save)
      const existing = window.VibeState.session || {};
      const payload = {
        ...sessionObj,
        createdAt: existing.createdAt || Date.now()
      };

      window.VibeState.session = payload;

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {
        console.warn("saveSession: localStorage write failed", e);
      }
    },

    // Ping server so Render.com free server wakes up before user tries to login
    wakeServer: function () {
      try {
        var cfg = window.ENV || {};
        var url = String(cfg.API_URL || "").replace(/\/+$/, "");
        if (!url) return;
        fetch(url + "/health", { method: "GET" }).catch(function () {});
      } catch(e) {}
    },

    loadSession: function () {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw);

        // Session 7 din tak valid — uske baad login maango
        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
        if (parsed.createdAt && (Date.now() - parsed.createdAt) > SEVEN_DAYS) {
          localStorage.removeItem(STORAGE_KEY);
          return null;
        }

        // Token missing ho to bhi invalid
        if (!parsed.token) {
          localStorage.removeItem(STORAGE_KEY);
          return null;
        }

        window.VibeState.session = parsed;
        return parsed;
      } catch (e) {
        console.warn("loadSession failed", e);
        return null;
      }
    },

    clearSession: function () {
      window.VibeState.session = null;
      window.VibeState.currentChat = null;

      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
    }
  };
})();
