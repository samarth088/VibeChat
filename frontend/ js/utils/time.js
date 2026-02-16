// js/utils/time.js
(function () {
  window.App = window.App || {};
  App.utils = App.utils || {};

  function formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  }

  // "5 min ago", "2 hours ago"
  function timeAgo(dateStr) {
    const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);

    const intervals = {
      year: 31536000,
      month: 2592000,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (let key in intervals) {
      const value = Math.floor(seconds / intervals[key]);
      if (value >= 1) return `${value} ${key}${value > 1 ? "s" : ""} ago`;
    }

    return "just now";
  }

  App.utils.time = {
    formatTime,
    formatDate,
    timeAgo
  };
})();
