const Chat = require("../models/Chat");
const Message = require("../models/Message");


// utils
function sameId(a, b) {
  return String(a) === String(b);
}

function mapGet(mapObj, key) {
  if (!mapObj) return 0;
  if (typeof mapObj.get === "function") {
    return Number(mapObj.get(String(key)) || 0);
  }
  return Number(mapObj[String(key)] || 0);
}

function mapSet(chatDoc, key, value) {
  if (!chatDoc.unreadCounts) {
    chatDoc.unreadCounts = {};
  }
  if (typeof chatDoc.unreadCounts.set === "function") {
    chatDoc.unreadCounts.set(String(key), Number(value || 0));
  } else {
    chatDoc.unreadCounts[String(key)] = Number(value || 0);
  }
}

// ✅ CREATE OR GET CHAT
exports.createOrGetChat = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.body.userId;

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID required"
      });
    }

    if (sameId(currentUserId, otherUserId)) {
      return res.status(400).json({
        success: false,
        message: "Cannot chat with yourself"
      });
    }

    let chat = await Chat.findOne({
      members: { $all: [currentUserId, otherUserId] }
    });

    if (!chat) {
      chat = await Chat.create({
        members: [currentUserId, otherUserId],
        unreadCounts: {
          [String(currentUserId)]: 0,
          [String(otherUserId)]: 0
        }
      });
    }

    res.json({
      success: true,
      roomId: chat._id
    });

  } catch (err) {
    next(err);
  }
};

// ✅ GET USER CHATS
exports.getUserChats = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    const chats = await Chat.find({
      members: currentUserId
    })
      .populate("members", "username name avatar uid bio isOnline lastSeen")
      .populate("lastMessage", "content status createdAt sender receiver")
      .sort({ updatedAt: -1 });

    const formatted = chats.map(chat => {
      const otherUser = chat.members.find(m => !sameId(m._id, currentUserId));

      return {
        _id: chat._id,
        user: otherUser,
        lastMessage: chat.lastMessage,
        unreadCount: mapGet(chat.unreadCounts, currentUserId),
        updatedAt: chat.updatedAt
      };
    });

    res.json({
      success: true,
      chats: formatted
    });

  } catch (err) {
    next(err);
  }
};

// ✅ GET CHAT MESSAGES
exports.getChatMessages = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const chatId = req.params.chatId;

    const chat = await Chat.findById(chatId);

    if (!chat || !chat.members.some(id => sameId(id, currentUserId))) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const messages = await Message.find({ chat: chatId })
      .populate("sender", "username name avatar")
      .populate("receiver", "username name avatar")
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      messages
    });

  } catch (err) {
    next(err);
  }
};

// ✅ SEND MESSAGE
exports.sendMessage = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const chatId = req.params.chatId;
    const content = String(req.body.content || "").trim();

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Message required"
      });
    }

    const chat = await Chat.findById(chatId);

    if (!chat || !chat.members.some(id => sameId(id, currentUserId))) {
      return res.status(403).json({
        success: false,
        message: "Not allowed"
      });
    }

    const receiverId = chat.members.find(id => !sameId(id, currentUserId));

    const message = await Message.create({
      chat: chatId,
      sender: currentUserId,
      receiver: receiverId,
      content,
      status: "sent"
    });

    chat.lastMessage = message._id;
    chat.lastMessageAt = message.createdAt;

    mapSet(chat, receiverId, mapGet(chat.unreadCounts, receiverId) + 1);

    await chat.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "username name avatar")
      .populate("receiver", "username name avatar");

    res.status(201).json({
      success: true,
      message: populatedMessage
    });

  } catch (err) {
    next(err);
  }
};

// ✅ MARK CHAT AS SEEN
exports.markChatSeen = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const chatId = req.params.chatId;

    const chat = await Chat.findById(chatId);

    if (!chat || !chat.members.some(id => sameId(id, currentUserId))) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    await Message.updateMany(
      {
        chat: chatId,
        receiver: currentUserId,
        status: { $in: ["sent", "delivered"] }
      },
      {
        $set: {
          status: "seen",
          seenAt: new Date()
        }
      }
    );

    mapSet(chat, currentUserId, 0);
    await chat.save();

    res.json({
      success: true
    });

  } catch (err) {
    next(err);
  }
};
