// js/core/socket.js
// Safe fallback socket layer for current stack

(function () {
  function noop() {}

  window.VibeSocket = {
    connect: function (_token, _onMessage) {
      console.warn("VibeSocket disabled: frontend is using safe fallback mode.");
      return null;
    },
    send: noop,
    joinRoom: noop,
    disconnect: noop
  };
})();
