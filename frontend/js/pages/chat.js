// js/pages/chat.js
// Main app logic: session guard, profile render, socket connect, DM list
//
// FIXES:
//  1. No session => redirect to index.html (was only console.log before)
//  2. Removed prompt() / alert() for chat — shows toast instead
//  3. openChatFromSearch works correctly with fixed VibeAPI

(function () {

  // ── DOM helpers ────────────────────────────────────────────────
  function qid(id)  { return document.getElementById(id); }
  function qs(sel)  { return document.querySelector(sel); }
  function qsa(sel) { return document.querySelectorAll(sel); }

  // ── Render logged-in user's profile in profile sheet ──────────
  function renderProfile(sess) {
    qsa('.profile-name').forEach(function (el) {
      el.textContent = sess.username || 'Your Name';
    });
    qsa('.profile-uid').forEach(function (el) {
      el.textContent =
        (sess.username ? '@' + sess.username + ' · ' : '') +
        'ID: ' + (sess.idFormatted || window.VibeState.formatId(sess.userId));
    });
    var avatarBig = qs('.profile-avatar-big');
    if (avatarBig) {
      avatarBig.textContent = (sess.username || 'Y').charAt(0).toUpperCase();
    }
    var bioEl = qs('.profile-bio');
    if (bioEl) {
      bioEl.textContent =
        (sess.profile && sess.profile.bio) || '🚀 Living on vibes. Connect with me on VibeChat!';
    }
  }

  // ── Show a simple in-app toast (replaces alert/prompt) ────────
  function showToast(msg, duration) {
    duration = duration || 2500;
    var existing = document.getElementById('vibeToast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = 'vibeToast';
    toast.textContent = msg;
    toast.style.cssText = [
      'position:absolute', 'bottom:90px', 'left:50%',
      'transform:translateX(-50%)', 'background:rgba(0,80,200,0.92)',
      'color:#fff', 'padding:10px 20px', 'border-radius:30px',
      'font-size:13px', 'font-weight:600', 'z-index:999',
      'white-space:nowrap', 'pointer-events:none',
      'box-shadow:0 4px 20px rgba(0,100,255,0.4)'
    ].join(';');

    var phone = document.querySelector('.phone');
    if (phone) phone.appendChild(toast);

    setTimeout(function () { toast.remove(); }, duration);
  }

  // ── Add or move conversation to top of DM list ────────────────
  function addOrFocusConversation(userObj, roomId) {
    var dmList = qid('dmContent');
    if (!dmList) return;

    // If already in list, move to top
    var existing = dmList.querySelector('[data-userid="' + userObj.userId + '"]');
    if (existing) {
      dmList.insertBefore(existing, dmList.firstChild);
      return existing;
    }

    var initial  = (userObj.username || 'U').charAt(0).toUpperCase();
    var username = userObj.username || 'Unknown';

    var item = document.createElement('div');
    item.className = 'conv-item';
    item.setAttribute('data-userid', userObj.userId);
    item.setAttribute('data-room', roomId);
    item.innerHTML =
      '<div class="avatar-wrap">' +
        '<div class="avatar">' + initial + '</div>' +
      '</div>' +
      '<div class="conv-info">' +
        '<div class="conv-name">' + username + '</div>' +
        '<div class="conv-preview">Tap to open chat</div>' +
      '</div>' +
      '<div class="conv-meta">' +
        '<span class="conv-time">Now</span>' +
      '</div>';

    item.addEventListener('click', function () {
      openInlineChat(userObj, roomId);
    });

    dmList.insertBefore(item, dmList.firstChild);
    return item;
  }

  // ── Simple inline chat (no prompt/alert) ──────────────────────
  // Opens a mini input bar at the bottom — minimal, no layout change
  function openInlineChat(userObj, roomId) {
    // If a chat bar already open for this room, focus it
    var existing = document.getElementById('miniChatBar');
    if (existing) {
      existing.remove();
    }

    var phone = document.querySelector('.phone');
    if (!phone) return;

    var bar = document.createElement('div');
    bar.id = 'miniChatBar';
    bar.style.cssText = [
      'position:absolute', 'bottom:72px', 'left:0', 'right:0',
      'background:rgba(0,10,30,0.97)', 'border-top:1px solid rgba(0,100,255,0.3)',
      'padding:10px 16px', 'display:flex', 'align-items:center',
      'gap:10px', 'z-index:200'
    ].join(';');

    bar.innerHTML =
      '<div style="flex:1;background:rgba(0,50,120,0.4);border:1.5px solid rgba(0,120,255,0.35);' +
      'border-radius:20px;display:flex;align-items:center;padding:0 14px;gap:8px;">' +
        '<input id="miniChatInput" type="text" placeholder="Message ' + userObj.username + '…" ' +
        'style="flex:1;background:transparent;border:none;outline:none;color:#fff;font-size:14px;padding:10px 0;" />' +
      '</div>' +
      '<button id="miniChatSend" style="background:linear-gradient(135deg,#0080ff,#0050cc);border:none;' +
      'width:40px;height:40px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;">' +
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>' +
      '</button>' +
      '<button id="miniChatClose" style="background:rgba(255,255,255,0.07);border:none;color:rgba(255,255,255,0.5);' +
      'width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;">✕</button>';

    phone.appendChild(bar);

    var input    = document.getElementById('miniChatInput');
    var sendBtn  = document.getElementById('miniChatSend');
    var closeBtn = document.getElementById('miniChatClose');

    input.focus();

    function sendMessage() {
      var text = (input.value || '').trim();
      if (!text) return;
      var payload = { type: 'message', room: roomId, text: text };

      if (window.VibeSocket && window.VibeSocket.joinRoom) {
        window.VibeSocket.joinRoom(roomId);
      }
      window.sendWS && window.sendWS(payload);

      // Update preview in DM list
      var item = document.querySelector('[data-userid="' + userObj.userId + '"] .conv-preview');
      if (item) item.textContent = text;

      input.value = '';
      showToast('Message sent ✓');
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') sendMessage();
    });
    closeBtn.addEventListener('click', function () { bar.remove(); });
  }

  // ── Open chat from search result ──────────────────────────────
  window.openChatFromSearch = async function (userId) {
    try {
      var user = await window.VibeAPI.getUserById(userId);
      var sess = window.VibeState.session;
      var open = await window.VibeAPI.openChatWith(userId, sess && sess.token);
      var roomId = open.roomId || ('room_' + userId);

      window.VibeState.currentChat = {
        roomId:   roomId,
        userId:   userId,
        username: user.username || ('user_' + userId)
      };

      if (window.VibeSocket && window.VibeSocket.joinRoom) {
        window.VibeSocket.joinRoom(roomId);
      }

      addOrFocusConversation(user, roomId);
      window.switchTab('dm');
      showToast('Chat opened with ' + (user.username || 'user'));

    } catch (err) {
      console.error('[Chat] openChatFromSearch failed', err);
      showToast('Could not open chat. Try again.');
    }
  };

  // ── App startup ───────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    var sess = window.VibeState.loadSession();

    // FIX: redirect if no session (was only console.log before)
    if (!sess) {
      window.location.replace('./index.html');
      return;
    }

    renderProfile(sess);

    // Connect WebSocket
    try {
      if (window.VibeSocket && typeof window.VibeSocket.connect === 'function') {
        window.VibeSocket.connect(sess.token, function (msg) {
          if (!msg) return;
          if (msg.type === 'message' && msg.room) {
            console.log('[WS] incoming message', msg);
            // TODO: find conversation by room, update preview + badge
          }
        });
      }
    } catch (e) {
      console.error('[Chat] socket connect failed', e);
    }
  });

})();
