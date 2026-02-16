const Chat = require("../models/Chat");
const Message = require("../models/Message");

// CREATE OR GET CHAT
exports.createOrGetChat = async (req, res, next) => {
  try {
    const { userId } = req.body;

    let chat = await Chat.findOne({
      members: { $all: [req.user.id, userId] }
    });

    if (!chat) {
      chat = await Chat.create({
        members: [req.user.id, userId],
        unreadCounts: {
          [req.user.id]: 0,
          [userId]: 0
        }
      });
    }

    res.json(chat);
  } catch (err) {
    next(err);
  }
};

// 🔥 UPDATED – GET USER CHATS WITH UNREAD
exports.getUserChats = async (req, res, next) => {
  try {

    const userId = req.user.id;

    const chats = await Chat.find({
      members: userId
    })
      .populate("members", "username avatar isOnline lastSeen")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    const formatted = chats.map(chat => {

      const otherUser = chat.members.find(
        m => m._id.toString() !== userId
      );

      return {
        _id: chat._id,
        user: otherUser,
        lastMessage: chat.lastMessage,
        unread: chat.unreadCounts?.get(userId) || 0
      };
    });

    res.json(formatted);

  } catch (err) {
    next(err);
  }
};

// GET CHAT MESSAGES
exports.getChatMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({
      chat: req.params.chatId
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    next(err);
  }
};
