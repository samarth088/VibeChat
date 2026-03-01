// js/ui/overlays.js
(function () {

  window.openProfile = function () {
    document.getElementById('profileSheet').classList.add('active');
  };

  window.openSearch = function () {
    document.getElementById('searchSheet').classList.add('active');
    setTimeout(function () {
      var el = document.getElementById('searchInput');
      if (el) el.focus();
    }, 120);
  };

  window.openSettings = function () {
    document.getElementById('settingsSheet').classList.add('active');
  };

  window.closeSheet = function (ev, sheetId) {
    var el = document.getElementById(sheetId);
    if (!el) return;
    el.classList.remove('active');

    if (sheetId === 'searchSheet') {
      var input = document.getElementById('searchInput');
      if (input) input.value = '';
      var results = document.getElementById('searchResults');
      if (results) results.innerHTML =
        '<div class="search-empty">Enter ID or username to search</div>';
    }
  };

  var searchTimer = null;

  window.handleSearch = function (value) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      performSearch(value);
    }, 320);
  };

  function nh(text) {
    return (text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function setResults(html) {
    var el = document.getElementById('searchResults');
    if (el) el.innerHTML = html;
  }

  async function performSearch(q) {
    q = (q || '').trim();

    if (!q) {
      setResults('<div class="search-empty">Enter ID or username to search</div>');
      return;
    }

    setResults('<div class="search-empty">Searching...</div>');

    try {
      var users = await window.VibeAPI.searchUsers(q);

      if (!users || users.length === 0) {
        setResults('<div class="search-empty">No results found</div>');
        return;
      }

      var resultsEl = document.getElementById('searchResults');
      if (!resultsEl) return;
      resultsEl.innerHTML = '';

      users.forEach(function (u) {

        var row = document.createElement('div');
        row.className = 'search-row';

        // 🔥 FIXED — always show real UID
        var displayId = nh(u.uid);

        var initial   = nh((u.username || u.name || 'U').charAt(0).toUpperCase());
        var username  = nh(u.username || u.name || '');

        var onlineDot = u.online
          ? '<span class="online-dot" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#00e5ff;"></span>'
          : '';

        row.innerHTML =
          '<div class="search-row-left">' +
            '<div class="search-avatar">' + initial + '</div>' +
            '<div class="search-info">' +
              '<div class="search-name">' + username + ' ' + onlineDot + '</div>' +
              '<div class="search-id">' + displayId + '</div>' +
            '</div>' +
          '</div>' +
          '<button class="btn-outline small">Chat</button>';

        var btn = row.querySelector('button');

        // 🔥 FIXED — pass full object
        btn.addEventListener('click', function () {

          var userObj = {
            userId: u.userId,
            username: u.username || u.name || 'User'
          };

          if (window.openChatFromSearch) {
            window.openChatFromSearch(userObj);
          }

          window.closeSheet(null, 'searchSheet');
        });

        resultsEl.appendChild(row);
      });

    } catch (err) {
      console.error('[Search] error', err);
      setResults('<div class="search-empty">Search failed. Try again.</div>');
    }
  }

})();
