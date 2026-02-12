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
        members: [req.user.id, userId]
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
    const chats = await Chat.find({
      members: req.user.id
    })
      .populate("members", "username avatar")
      .populate("lastMessage");

    res.json(chats);
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
