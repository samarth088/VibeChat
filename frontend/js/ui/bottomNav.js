// js/ui/bottomNav.js
// Tab switching — uses classList instead of inline style to match CSS
// FIX: was using display:'block' which broke flex-based group/calls layout

(function () {
  var TABS = ['dm', 'group', 'calls'];

  function hideAll() {
    TABS.forEach(function (name) {
      // Hide content panels
      var content = document.getElementById(
        name === 'dm' ? 'dmContent' :
        name === 'group' ? 'groupContent' : 'callsContent'
      );
      if (content) content.classList.remove('active');

      // Remove active from tab buttons
      var tab = document.getElementById('tab-' + name);
      if (tab) tab.classList.remove('active');
    });
  }

  window.switchTab = function (which) {
    hideAll();

    var contentId =
      which === 'dm'     ? 'dmContent'    :
      which === 'group'  ? 'groupContent' :
      which === 'calls'  ? 'callsContent' : null;

    if (contentId) {
      var el = document.getElementById(contentId);
      if (el) el.classList.add('active');
    }

    var tabEl = document.getElementById('tab-' + which);
    if (tabEl) tabEl.classList.add('active');
  };

  // Show DM tab by default on load
  document.addEventListener('DOMContentLoaded', function () {
    window.switchTab('dm');
  });
})();
