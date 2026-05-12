// js/ui/overlays.js
// Sheet open/close + search handling + user profile viewer
// FIX 1: Garbage text under username — ab u.uid use hota hai (not formatId on MongoDB ObjectId)
// FIX 2: openUserProfile() added — kisi bhi user ka profile dekhne ke liye
// FIX 3: openChatFromSearch mein name bhi pass hota hai

(function () {

  // ── Open helpers ─────────────────────────────────────────────
  window.openProfile = function () {
    document.getElementById("profileSheet").classList.add("active");
  };

  window.openSearch = function () {
    document.getElementById("searchSheet").classList.add("active");
    setTimeout(function () {
      var el = document.getElementById("searchInput");
      if (el) { el.focus(); if (el.select) el.select(); }
    }, 120);
  };

  window.openSettings = function () {
    document.getElementById("settingsSheet").classList.add("active");
  };

  // ── Close helper ──────────────────────────────────────────────
  window.closeSheet = function (ev, sheetId) {
    var el = document.getElementById(sheetId);
    if (!el) return;
    el.classList.remove("active");
    if (sheetId === "searchSheet") {
      var input = document.getElementById("searchInput");
      if (input) input.value = "";
      var results = document.getElementById("searchResults");
      if (results) {
        results.innerHTML = '<div class="search-empty">Enter ID or username to search</div>';
      }
    }
  };

  // ── Safe HTML escape ──────────────────────────────────────────
  function nh(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function setResults(html) {
    var el = document.getElementById("searchResults");
    if (el) el.innerHTML = html;
  }

  // ── Debounced search ──────────────────────────────────────────
  var _searchTimer = null;
  window.handleSearch = function (value) {
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(function () {
      performSearch(value);
    }, 320);
  };

  // ── Search logic ──────────────────────────────────────────────
  async function performSearch(q) {
    q = String(q || "").trim();
    if (!q) {
      setResults('<div class="search-empty">Enter ID or username to search</div>');
      return;
    }

    setResults('<div class="search-empty">Searching...</div>');

    try {
      var sess = window.VibeState && window.VibeState.loadSession
        ? window.VibeState.loadSession() : null;
      var token = sess && sess.token ? sess.token : "";

      var users = await window.VibeAPI.searchUsers(q, token);

      if (!users || users.length === 0) {
        setResults('<div class="search-empty">No results found</div>');
        return;
      }

      var resultsEl = document.getElementById("searchResults");
      if (!resultsEl) return;
      resultsEl.innerHTML = "";

      users.forEach(function (u) {
        var row = document.createElement("div");
        row.className = "search-row";

        var initial  = nh((u.username || u.name || "U").charAt(0).toUpperCase());
        var username = nh(u.username || u.name || "");

        // FIX: u.uid use karo (VIBE-XXXXX format) — MongoDB ObjectId nahi
        var displayId = u.uid ? nh(u.uid) : "";

        var onlineDot = u.isOnline
          ? '<span class="online-dot" style="display:inline-block;width:7px;height:7px;' +
            'border-radius:50%;background:#00e5ff;box-shadow:0 0 6px #00e5ff;vertical-align:middle;"></span>'
          : "";

        row.innerHTML =
          '<div class="search-row-left" style="cursor:pointer;">' +
            '<div class="search-avatar">' +
              (u.avatar
                ? '<img src="' + nh(u.avatar) + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">'
                : initial) +
            "</div>" +
            '<div class="search-info">' +
              '<div class="search-name">' + username + " " + onlineDot + "</div>" +
              '<div class="search-id">' + (displayId ? "ID: " + displayId : "") + "</div>" +
            "</div>" +
          "</div>" +
          '<button class="btn-outline small">Chat</button>';

        // Clicking name/avatar → view profile
        row.querySelector(".search-row-left").addEventListener("click", function () {
          window.openUserProfile(u);
        });

        // Clicking Chat → open chat directly
        row.querySelector("button").addEventListener("click", function () {
          if (window.openChatFromSearch) {
            window.openChatFromSearch({
              userId:   u.userId,
              username: u.username,
              name:     u.name || u.username,
              uid:      u.uid,
              avatar:   u.avatar || "",
              bio:      u.bio || "",
              isOnline: !!u.isOnline,
              lastSeen: u.lastSeen || null
            });
          }
          window.closeSheet(null, "searchSheet");
        });

        resultsEl.appendChild(row);
      });

    } catch (err) {
      console.error("[Search] error:", err);
      setResults('<div class="search-empty">Search failed. Try again.</div>');
    }
  }

  // ── User Profile Viewer (Bug 4 fix) ──────────────────────────
  window.openUserProfile = function (u) {
    // Remove any existing viewer
    var existing = document.getElementById("userProfileSheet");
    if (existing) existing.remove();

    var phone = document.querySelector(".phone");
    if (!phone || !u) return;

    var avatarHtml = u.avatar
      ? '<img src="' + nh(u.avatar) + '" alt="avatar" ' +
        'style="width:100%;height:100%;object-fit:cover;border-radius:50%;">'
      : nh((u.username || u.name || "U").charAt(0).toUpperCase());

    var onlineStatus = u.isOnline
      ? '<span style="color:#2ee67e;font-size:12px;">● Online</span>'
      : (u.lastSeen
          ? '<span style="color:rgba(255,255,255,0.45);font-size:12px;">Last seen recently</span>'
          : '<span style="color:rgba(255,255,255,0.35);font-size:12px;">Offline</span>');

    var sheet = document.createElement("div");
    sheet.id = "userProfileSheet";
    sheet.className = "sheet-overlay";
    sheet.innerHTML =
      '<div class="sheet" onclick="event.stopPropagation()" ' +
           'style="padding-bottom:28px;">' +
        '<div class="sheet-handle"></div>' +
        '<div class="profile-header">' +
          '<div class="profile-avatar-big">' + avatarHtml + "</div>" +
          '<div class="profile-name">' + nh(u.name || u.username || "") + "</div>" +
          '<div class="profile-uid">' +
            (u.username ? "@" + nh(u.username) : "") +
            (u.uid ? " · ID: " + nh(u.uid) : "") +
          "</div>" +
          '<div style="margin-top:6px;">' + onlineStatus + "</div>" +
        "</div>" +
        '<div class="profile-bio">' +
          nh(u.bio || "No bio yet.") +
        "</div>" +
        '<div style="display:flex;gap:10px;margin-top:4px;">' +
          '<button class="btn-primary" id="_upChatBtn">💬 Message</button>' +
        "</div>" +
      "</div>";

    // Close on backdrop click
    sheet.addEventListener("click", function (e) {
      if (e.target === sheet) sheet.remove();
    });

    phone.appendChild(sheet);
    // Trigger display
    requestAnimationFrame(function () {
      sheet.classList.add("active");
    });

    document.getElementById("_upChatBtn").addEventListener("click", function () {
      sheet.remove();
      if (window.openChatFromSearch) {
        window.openChatFromSearch({
          userId:   u.userId,
          username: u.username,
          name:     u.name || u.username,
          uid:      u.uid,
          avatar:   u.avatar || "",
          bio:      u.bio || "",
          isOnline: !!u.isOnline,
          lastSeen: u.lastSeen || null
        });
      }
      window.closeSheet(null, "searchSheet");
    });
  };

  // expose for debug
  window.VibePerformSearch = performSearch;
})();
