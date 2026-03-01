// js/core/state.js
(function () {

  const STORAGE_KEY = 'vibe_session_v1';

  window.VibeState = {
    session: null,
    currentChat: null,

    // ─────────────────────────────────────────
    // SAFE ID FORMATTER (FIXED)
    // ─────────────────────────────────────────
    formatId: function (uid) {

      if (!uid) return '#00000';

      // ✅ If already proper Vibe UID → return directly
      if (typeof uid === 'string' && uid.startsWith('vibe_')) {
        return uid;
      }

      // ✅ If Mongo ObjectId (long string) → return as is
      if (typeof uid === 'string' && uid.length > 10) {
        return uid;
      }

      // ✅ If numeric → format
      const num = Number(uid);
      if (!isNaN(num)) {
        return '#' + String(num).padStart(5, '0');
      }

      // Fallback
      return String(uid);
    },

    // ─────────────────────────────────────────
    // SESSION SAVE
    // ─────────────────────────────────────────
    saveSession: function (sessionObj) {
      const payload = { ...sessionObj, createdAt: Date.now() };
      window.VibeState.session = payload;

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {
        console.warn('saveSession failed', e);
      }
    },

    // ─────────────────────────────────────────
    // SESSION LOAD
    // ─────────────────────────────────────────
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

    // ─────────────────────────────────────────
    // CLEAR SESSION
    // ─────────────────────────────────────────
    clearSession: function () {
      window.VibeState.session = null;
      window.VibeState.currentChat = null;

      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
    }
  };

})();
