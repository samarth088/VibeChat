// js/pages/chat.js — WhatsApp/TG style full chat page

(function () {
  function qid(id)  { return document.getElementById(id); }
  function qs(sel)  { return document.querySelector(sel); }
  function qsa(sel) { return document.querySelectorAll(sel); }
  function esc(t)   { return (t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function nowTime(){ var n=new Date(); return n.getHours().toString().padStart(2,'0')+':'+n.getMinutes().toString().padStart(2,'0'); }

  // In-memory message store { roomId: [{text,isMe,time}] }
  var msgStore = {};

  // ── Render profile ─────────────────────────────────────────
  function renderProfile(sess) {
    qsa('.profile-name').forEach(function(el){ el.textContent = sess.username||'Your Name'; });
    qsa('.profile-uid').forEach(function(el){
      el.textContent = (sess.username?'@'+sess.username+' · ':'')+'ID: '+(sess.idFormatted||window.VibeState.formatId(sess.userId));
    });
    var av = qs('.profile-avatar-big');
    if (av) av.textContent = (sess.username||'Y').charAt(0).toUpperCase();
    var bio = qs('.profile-bio');
    if (bio) bio.textContent = (sess.profile&&sess.profile.bio)||'🚀 Living on vibes.';
  }

  // ── Build full-screen chat page ────────────────────────────
  function openChatPage(userObj, roomId) {
    var phone = qs('.phone');
    if (!phone) return;

    // Remove old chat page
    var old = qid('chatPage');
    if (old) old.remove();

    if (!msgStore[roomId]) msgStore[roomId] = [];

    var initial  = esc((userObj.username||'U').charAt(0).toUpperCase());
    var username = esc(userObj.username||'User');

    var page = document.createElement('div');
    page.id = 'chatPage';
    page.style.cssText = 'position:absolute;inset:0;z-index:300;display:flex;flex-direction:column;background:linear-gradient(160deg,#000d24 0%,#000510 100%);';

    page.innerHTML =
      // ── Top header ──────────────────────────────────────────
      '<div id="chatPageHeader" style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(0,8,28,0.95);border-bottom:1px solid rgba(0,100,255,0.2);flex-shrink:0;">'+
        '<button id="chatBackBtn" style="background:none;border:none;color:#4db8ff;font-size:26px;line-height:1;cursor:pointer;padding:0 6px 0 0;">‹</button>'+
        '<div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#1a3a6a,#0d1f3c);border:2px solid rgba(0,100,220,0.4);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#4db8ff;flex-shrink:0;">'+initial+'</div>'+
        '<div style="flex:1;min-width:0;">'+
          '<div style="color:#fff;font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+username+'</div>'+
          '<div style="color:#00e5ff;font-size:11px;margin-top:1px;" id="chatUserStatus">online</div>'+
        '</div>'+
        '<div style="display:flex;gap:6px;">'+
          '<button style="background:none;border:none;color:rgba(255,255,255,0.6);cursor:pointer;padding:6px;" title="Voice call">'+
            '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>'+
          '</button>'+
          '<button style="background:none;border:none;color:rgba(255,255,255,0.6);cursor:pointer;padding:6px;" title="Video call">'+
            '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"/></svg>'+
          '</button>'+
        '</div>'+
      '</div>'+

      // ── Messages area ────────────────────────────────────────
      '<div id="chatMsgsArea" style="flex:1;overflow-y:auto;padding:12px 10px;display:flex;flex-direction:column;gap:6px;scroll-behavior:smooth;">'+
        '<div style="text-align:center;margin:10px 0 16px;">'+
          '<span style="background:rgba(0,40,100,0.5);color:rgba(255,255,255,0.38);font-size:11px;padding:5px 14px;border-radius:20px;border:1px solid rgba(0,80,180,0.2);">'+
            '🔒 Messages are end-to-end encrypted'+
          '</span>'+
        '</div>'+
      '</div>'+

      // ── Input bar ────────────────────────────────────────────
      '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(0,6,20,0.98);border-top:1px solid rgba(0,80,200,0.2);flex-shrink:0;">'+
        '<button style="background:none;border:none;color:rgba(255,255,255,0.5);font-size:22px;cursor:pointer;padding:4px;flex-shrink:0;">📎</button>'+
        '<div style="flex:1;display:flex;align-items:center;background:rgba(0,40,100,0.4);border:1.5px solid rgba(0,100,255,0.3);border-radius:24px;padding:0 14px;gap:6px;">'+
          '<input id="chatInput" type="text" placeholder="Message..." style="flex:1;background:transparent;border:none;outline:none;color:#fff;font-size:14px;padding:11px 0;" />'+
          '<button style="background:none;border:none;font-size:18px;cursor:pointer;padding:2px;" id="chatEmojiBtn">😊</button>'+
        '</div>'+
        '<button id="chatSendBtn" style="width:44px;height:44px;border-radius:50%;border:none;flex-shrink:0;background:linear-gradient(135deg,#0080ff,#0050cc);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(0,100,255,0.4);transition:transform 0.15s;">'+
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>'+
        '</button>'+
      '</div>';

    phone.appendChild(page);

    // Render existing messages
    _renderMsgs(roomId);

    // Back → remove page
    qid('chatBackBtn').addEventListener('click', function() {
      page.style.animation = 'slideOut 0.2s ease forwards';
      setTimeout(function(){ page.remove(); }, 180);
    });

    // Send button
    qid('chatSendBtn').addEventListener('click', function(){ _send(roomId, userObj); });
    qid('chatInput').addEventListener('keydown', function(e){ if(e.key==='Enter') _send(roomId, userObj); });

    // Slide-in animation
    page.style.animation = 'slideIn 0.22s ease forwards';

    // Join socket room
    if (window.VibeSocket && window.VibeSocket.joinRoom) window.VibeSocket.joinRoom(roomId);
  }

  // ── Render messages ────────────────────────────────────────
  function _renderMsgs(roomId) {
    var area = qid('chatMsgsArea');
    if (!area) return;
    area.querySelectorAll('.msg-row').forEach(function(el){ el.remove(); });

    (msgStore[roomId]||[]).forEach(function(msg) {
      var row = document.createElement('div');
      row.className = 'msg-row';
      row.style.cssText = 'display:flex;'+(msg.isMe?'justify-content:flex-end;':'justify-content:flex-start;');

      row.innerHTML =
        '<div style="'+
          'max-width:75%;min-width:60px;'+
          'padding:8px 12px 6px;'+
          'border-radius:'+(msg.isMe?'16px 16px 3px 16px':'16px 16px 16px 3px')+';'+
          'background:'+(msg.isMe?'linear-gradient(135deg,#0065cc,#0045aa)':'rgba(255,255,255,0.07)')+';'+
          'border:1px solid '+(msg.isMe?'rgba(0,120,255,0.25)':'rgba(255,255,255,0.07)')+';'+
          'color:#fff;font-size:14px;line-height:1.45;word-break:break-word;'+
          'box-shadow:'+(msg.isMe?'0 2px 8px rgba(0,80,200,0.3)':'0 1px 4px rgba(0,0,0,0.3)')+';'+
        '">'+
          '<div>'+esc(msg.text)+'</div>'+
          '<div style="font-size:10px;color:rgba(255,255,255,0.38);margin-top:3px;text-align:right;display:flex;align-items:center;justify-content:flex-end;gap:3px;">'+
            msg.time+
            (msg.isMe?'<span style="color:rgba(100,180,255,0.7);">✓✓</span>':'')+
          '</div>'+
        '</div>';

      area.appendChild(row);
    });

    area.scrollTop = area.scrollHeight;
  }

  // ── Send message ───────────────────────────────────────────
  function _send(roomId, userObj) {
    var input = qid('chatInput');
    var text  = (input?input.value:'').trim();
    if (!text) return;

    if (!msgStore[roomId]) msgStore[roomId] = [];
    msgStore[roomId].push({ text:text, isMe:true, time:nowTime() });

    window.sendWS && window.sendWS({ type:'message', room:roomId, text:text });

    // Update DM list preview + move to top
    var preview = qs('[data-userid="'+userObj.userId+'"] .conv-preview');
    if (preview) preview.textContent = text;
    var timeEl = qs('[data-userid="'+userObj.userId+'"] .conv-time');
    if (timeEl) timeEl.textContent = nowTime();
    var dmList = qid('dmContent');
    var item   = qs('[data-userid="'+userObj.userId+'"]');
    if (dmList && item) dmList.insertBefore(item, dmList.firstChild);

    if (input) input.value = '';

    // Send button bounce
    var btn = qid('chatSendBtn');
    if (btn) { btn.style.transform='scale(0.88)'; setTimeout(function(){ btn.style.transform=''; },120); }

    _renderMsgs(roomId);
  }

  // ── Add or focus conversation ──────────────────────────────
  function addOrFocusConversation(userObj, roomId) {
    var dmList = qid('dmContent');
    if (!dmList) return;

    var existing = dmList.querySelector('[data-userid="'+userObj.userId+'"]');
    if (existing) {
      dmList.insertBefore(existing, dmList.firstChild);
      openChatPage(userObj, roomId);
      return;
    }

    var item = document.createElement('div');
    item.className = 'conv-item';
    item.setAttribute('data-userid', userObj.userId);
    item.setAttribute('data-room', roomId);
    item.innerHTML =
      '<div class="avatar-wrap"><div class="avatar">'+esc((userObj.username||'U').charAt(0).toUpperCase())+'</div></div>'+
      '<div class="conv-info">'+
        '<div class="conv-name">'+esc(userObj.username||'User')+'</div>'+
        '<div class="conv-preview">Tap to chat</div>'+
      '</div>'+
      '<div class="conv-meta"><span class="conv-time">Now</span></div>';

    item.addEventListener('click', function(){ openChatPage(userObj, roomId); });
    dmList.insertBefore(item, dmList.firstChild);
    openChatPage(userObj, roomId);
  }

  // ── Wire static conv items ─────────────────────────────────
  function wireStaticItems() {
    qsa('.conv-item').forEach(function(item) {
      item.addEventListener('click', function() {
        var userId   = this.getAttribute('data-userid') || ('u_'+Date.now());
        var roomId   = this.getAttribute('data-room')   || ('room_'+userId);
        var username = (this.querySelector('.conv-name')||{}).textContent || 'User';
        openChatPage({ userId:userId, username:username }, roomId);
      });
    });
  }

  // ── From search ────────────────────────────────────────────
  window.openChatFromSearch = async function(userId) {
    try {
      var user   = await window.VibeAPI.getUserById(userId);
      var sess   = window.VibeState.session;
      var open   = await window.VibeAPI.openChatWith(userId, sess&&sess.token);
      var roomId = open.roomId||('room_'+userId);
      window.VibeState.currentChat = { roomId:roomId, userId:userId, username:user.username };
      addOrFocusConversation(user, roomId);
      window.switchTab('dm');
    } catch(e){ console.error('[Chat]', e); }
  };

  // ── Startup ────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function() {
    var sess = window.VibeState.loadSession();
    if (!sess) { window.location.replace('./index.html'); return; }

    renderProfile(sess);
    wireStaticItems();

    try {
      if (window.VibeSocket && typeof window.VibeSocket.connect === 'function') {
        window.VibeSocket.connect(sess.token, function(msg) {
          if (msg && msg.type==='message' && msg.room) {
            if (!msgStore[msg.room]) msgStore[msg.room] = [];
            msgStore[msg.room].push({ text:msg.text, isMe:false, time:nowTime() });
            _renderMsgs(msg.room);
          }
        });
      }
    } catch(e){ console.error('[Socket]', e); }
  });

})();
