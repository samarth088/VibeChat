// js/core/state.js
(function () {
  const STORAGE_KEY = 'vibe_session_v1';

  window.VibeState = {
    session: null,
    currentChat: null,

    // ✅ FIX: Backend "vibe_a3f9k2" string UID bhejta hai
    // Number("vibe_a3f9k2") = NaN = 0 = #00000 → yahi bug tha
    formatId: function (uid) {
      if (!uid) return '#00000';
      if (typeof uid === 'string' && uid.startsWith('vibe_')) return uid;
      const num = Number(uid) || 0;
      return '#' + String(num).padStart(5, '0');
    },

    saveSession: function (sessionObj) {
      const payload = { ...sessionObj, createdAt: Date.now() };
      window.VibeState.session = payload;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); }
      catch (e) { console.warn('saveSession failed', e); }
    },

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

    clearSession: function () {
      window.VibeState.session = null;
      window.VibeState.currentChat = null;
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    }
  };
})();
