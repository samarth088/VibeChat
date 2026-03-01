const Chat = require("../models/Chat");
const Message = require("../models/Message");

// CREATE OR GET CHAT
exports.createOrGetChat = async (req, res, next) => {
  try {

    const currentUserId = req.user._id;  // ✅ FIX
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({ message: "Other user ID required" });
    }

    let chat = await Chat.findOne({
      members: { $all: [currentUserId, otherUserId] }
    });

    if (!chat) {
      chat = await Chat.create({
        members: [currentUserId, otherUserId],
        unreadCounts: {
          [currentUserId]: 0,
          [otherUserId]: 0
        }
      });
    }

    res.json(chat);

  } catch (err) {
    next(err);
  }
};


// GET USER CHATS
exports.getUserChats = async (req, res, next) => {
  try {

    const currentUserId = req.user._id; // ✅ FIX

    const chats = await Chat.find({
      members: currentUserId
    })
      .populate("members", "username avatar isOnline lastSeen uid")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    const formatted = chats.map(chat => {

      const otherUser = chat.members.find(
        m => m._id.toString() !== currentUserId.toString()
      );

      return {
        _id: chat._id,
        user: otherUser,
        lastMessage: chat.lastMessage,
        unread: chat.unreadCounts?.[currentUserId] || 0
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
