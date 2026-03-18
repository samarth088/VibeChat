function normalizeChat(raw) {
  var sess = getSession();
  var me = String((sess && sess.userId) || "");

  var participants = raw.participants || raw.members || [];
  var otherUser = raw.otherUser || raw.user || raw.participant || null;

  if (!otherUser && Array.isArray(participants)) {
    otherUser = participants.find(function (p) {
      var pid = String(p._id || p.id || p.userId || "");
      return pid !== me;
    }) || null;
  }

  var chatId = raw._id || raw.id || raw.chatId || raw.roomId;
  var userId = otherUser ? (otherUser._id || otherUser.id || otherUser.userId) : null;
  var username = otherUser ? (otherUser.username || otherUser.name || "User") : "User";

  var unreadMap = raw.unreadCounts || {};
  var myUnread = 0;

  try {
    myUnread = Number(unreadMap[me] || 0);
  } catch (e) {
    myUnread = Number(raw.unreadCount || 0);
  }

  return {
    roomId: String(chatId || ""),
    userId: String(userId || ""),
    username: username,
    isOnline: !!(otherUser && otherUser.isOnline),
    lastSeenAt: otherUser ? (otherUser.lastSeen || otherUser.lastSeenAt || null) : null,
    unreadCount: myUnread,
    preview:
      (raw.lastMessage && (raw.lastMessage.content || raw.lastMessage.text)) ||
      raw.preview ||
      "Tap to chat",
    time:
      (raw.lastMessage && (raw.lastMessage.createdAt || raw.lastMessage.updatedAt)) ||
      raw.updatedAt ||
      raw.createdAt ||
      null
  };
}
