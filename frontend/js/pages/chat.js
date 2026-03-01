// js/pages/chat.js
(function () {

  function qid(id)  { return document.getElementById(id); }
  function qs(sel)  { return document.querySelector(sel); }
  function qsa(sel) { return document.querySelectorAll(sel); }
  function esc(t)   { return (t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function nowTime(){ var n=new Date(); return n.getHours().toString().padStart(2,'0')+':'+n.getMinutes().toString().padStart(2,'0'); }

  var msgStore = {};

  function updateEmptyState() {
    var dmList  = qid('dmContent');
    var emptyEl = qid('dmEmpty');
    if (!dmList || !emptyEl) return;
    var hasItems = dmList.querySelectorAll('.conv-item').length > 0;
    emptyEl.style.display = hasItems ? 'none' : 'block';
  }

  function _renderMsgs(roomId) {
    var area = qid('chatMsgsArea');
    if (!area) return;

    area.querySelectorAll('.msg-row').forEach(el => el.remove());

    (msgStore[roomId] || []).forEach(function(msg) {

      var row = document.createElement('div');
      row.className = 'msg-row';
      row.style.display = 'flex';
      row.style.justifyContent = msg.isMe ? 'flex-end' : 'flex-start';

      row.innerHTML =
        '<div style="max-width:75%;padding:8px 12px;border-radius:16px;background:' +
        (msg.isMe ? '#0065cc' : 'rgba(255,255,255,0.07)') +
        ';color:#fff;font-size:14px;">' +
          '<div>' + esc(msg.text) + '</div>' +
          '<div style="font-size:10px;color:rgba(255,255,255,0.4);text-align:right;">' +
            msg.time +
          '</div>' +
        '</div>';

      area.appendChild(row);
    });

    area.scrollTop = area.scrollHeight;
  }

  function _send(roomId, userObj) {

    var input = qid('chatInput');
    var text  = input.value.trim();
    if (!text) return;

    var sess = window.VibeState.session;
    if (!sess) return;

    if (!msgStore[roomId]) msgStore[roomId] = [];

    msgStore[roomId].push({
      text: text,
      isMe: true,
      time: nowTime()
    });

    if (window.VibeSocket && window.VibeSocket.socket) {
      window.VibeSocket.socket.emit("private-message", {
        from: sess.user.id,
        to: userObj.userId,
        text: text
      });
    }

    input.value = '';
    _renderMsgs(roomId);
  }

  window.openChatFromSearch = async function(userObj) {

    var sess = window.VibeState.session;
    if (!sess) return;

    var open = await window.VibeAPI.openChatWith(userObj.userId, sess.token);
    var roomId = open._id || open.roomId;

    window.VibeState.currentChat = {
      roomId: roomId,
      userId: userObj.userId,
      username: userObj.username
    };

    msgStore[roomId] = msgStore[roomId] || [];

    var phone = document.querySelector('.phone');
    var page = document.createElement('div');
    page.id = 'chatPage';
    page.style.position = 'absolute';
    page.style.inset = 0;
    page.style.background = '#000';
    page.style.display = 'flex';
    page.style.flexDirection = 'column';

    page.innerHTML =
      '<div style="padding:12px;color:#fff;font-weight:bold;">' +
        esc(userObj.username) +
      '</div>' +
      '<div id="chatMsgsArea" style="flex:1;overflow-y:auto;padding:10px;"></div>' +
      '<div style="display:flex;padding:10px;">' +
        '<input id="chatInput" style="flex:1;padding:8px;" placeholder="Message..." />' +
        '<button id="chatSendBtn">Send</button>' +
      '</div>';

    phone.appendChild(page);

    qid('chatSendBtn').addEventListener('click', function(){
      _send(roomId, userObj);
    });

    qid('chatInput').addEventListener('keydown', function(e){
      if (e.key === 'Enter') _send(roomId, userObj);
    });

    _renderMsgs(roomId);
  };

  document.addEventListener('DOMContentLoaded', function(){

    var sess = window.VibeState.loadSession();
    if (!sess) {
      window.location.replace('./index.html');
      return;
    }

    if (window.VibeSocket && typeof window.VibeSocket.connect === 'function') {

      window.VibeSocket.socket = window.VibeSocket.connect(sess.token, function(msg){

        if (!msg) return;

        if (msg.type === "private-message") {

          var data = msg.data;
          var roomId = data.chat;

          if (!msgStore[roomId]) msgStore[roomId] = [];

          msgStore[roomId].push({
            text: data.content,
            isMe: false,
            time: nowTime()
          });

          _renderMsgs(roomId);
        }
      });
    }
  });

})();
