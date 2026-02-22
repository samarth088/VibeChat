// js/core/state.js
// Global state helper — non-module, loaded before everything else

(function () {
  const STORAGE_KEY = 'vibe_session_v1';

  window.VibeState = {
    session: null,
    currentChat: null,

    // Format numeric ID to #00042
    formatId: function (n) {
      const num = Number(n) || 0;
      return '#' + String(num).padStart(5, '0');
    },

    // Save session to memory + localStorage
    saveSession: function (sessionObj) {
      const payload = {
        ...sessionObj,
        createdAt: Date.now()
      };
      window.VibeState.session = payload;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {
        console.warn('saveSession: localStorage write failed', e);
      }
    },

    // Load session from localStorage into memory
    loadSession: function () {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        window.VibeState.session = parsed;
        return parsed;
      } catch (e) {
        console.warn('loadSession failed', e);
        return null;
      }
    },

    // Clear session from memory + localStorage
    clearSession: function () {
      window.VibeState.session = null;
      window.VibeState.currentChat = null;
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
    }
  };
})();
