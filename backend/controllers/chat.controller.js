const Chat = require("../models/Chat");
const Message = require("../models/Message");

// CREATE OR GET CHAT
exports.createOrGetChat = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    // frontend ab userId bhej raha hai
    const otherUserId = req.body.userId || req.body.otherUserId;

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        message: "Other user ID required"
      });
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

    return res.json({
      success: true,
      roomId: chat._id
    });
  } catch (err) {
    next(err);
  }
};

// GET USER CHATS
exports.getUserChats = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    const chats = await Chat.find({
      members: currentUserId
    })
      .populate("members", "username avatar uid isOnline lastSeenAt")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    const formatted = chats.map((chat) => {
      const otherUser = chat.members.find(
        (m) => m._id.toString() !== currentUserId.toString()
      );

      return {
        _id: chat._id,
        user: otherUser,
        lastMessage: chat.lastMessage,
        unreadCount: chat.unreadCounts?.[currentUserId] || 0,
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

// GET CHAT MESSAGES
exports.getChatMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({
      chat: req.params.chatId
    })
      .populate("sender", "username")
      .populate("receiver", "username")
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      messages
    });
  } catch (err) {
    next(err);
  }
};

// SEND MESSAGE
exports.sendMessage = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { chatId } = req.params;
    const content = (req.body.content || "").trim();

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Message content required"
      });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found"
      });
    }

    const receiverId = chat.members.find(
      (id) => id.toString() !== currentUserId.toString()
    );

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Receiver not found"
      });
    }

    const message = await Message.create({
      chat: chatId,
      sender: currentUserId,
      receiver: receiverId,
      content,
      status: "sent"
    });

    chat.lastMessage = message._id;

    chat.unreadCounts = {
      ...(chat.unreadCounts || {}),
      [receiverId.toString()]: (chat.unreadCounts?.[receiverId.toString()] || 0) + 1,
      [currentUserId.toString()]: chat.unreadCounts?.[currentUserId.toString()] || 0
    };

    await chat.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "username")
      .populate("receiver", "username");

    return res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (err) {
    next(err);
  }
};

// MARK CHAT SEEN
exports.markChatSeen = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { chatId } = req.params;

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

    const chat = await Chat.findById(chatId);
    if (chat) {
      chat.unreadCounts = {
        ...(chat.unreadCounts || {}),
        [currentUserId.toString()]: 0
      };
      await chat.save();
    }

    return res.json({
      success: true
    });
  } catch (err) {
    next(err);
  }
};
