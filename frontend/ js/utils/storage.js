// js/utils/storage.js
(function () {
  window.App = window.App || {};
  App.utils = App.utils || {};

  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("Storage set failed", e);
    }
  }

  function get(key, fallback = null) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function remove(key) {
    localStorage.removeItem(key);
  }

  function clear() {
    localStorage.clear();
  }

  App.utils.storage = {
    set,
    get,
    remove,
    clear
  };
})();
