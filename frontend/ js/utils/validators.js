// js/utils/validators.js
(function () {
  window.App = window.App || {};
  App.utils = App.utils || {};

  function isEmail(email = "") {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isStrongPassword(password = "") {
    return password.length >= 6;
  }

  function isNotEmpty(value = "") {
    return value.trim().length > 0;
  }

  function maxLength(value = "", max = 100) {
    return value.length <= max;
  }

  App.utils.validators = {
    isEmail,
    isStrongPassword,
    isNotEmpty,
    maxLength
  };
})();
