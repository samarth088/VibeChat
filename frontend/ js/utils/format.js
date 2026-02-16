// js/utils/format.js
(function () {
  window.App = window.App || {};
  App.utils = App.utils || {};

  // Escape HTML to prevent XSS
  function escapeHTML(str = "") {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Shorten long text (chat preview)
  function truncate(text = "", max = 40) {
    if (text.length <= max) return text;
    return text.slice(0, max) + "…";
  }

  // Convert URLs to clickable links
  function linkify(text = "") {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, url => `<a href="${url}" target="_blank">${url}</a>`);
  }

  // Get initials from name (Avatar fallback)
  function initials(name = "") {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  App.utils.format = {
    escapeHTML,
    truncate,
    linkify,
    initials
  };
})();
