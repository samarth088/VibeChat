const Message = require("../models/Message");
const Chat = require("../models/Chat");

// SEND MESSAGE
exports.sendMessage = async (req, res, next) => {
  try {
    const sender = req.user._id;
    const chatId = req.body.chatId || req.params.chatId;
    const text = (req.body.text || req.body.content || "").trim();

    if (!chatId || !text) {
      return res.status(400).json({
        success: false,
        message: "chatId and text/content required"
      });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found"
      });
    }

    const receiver = chat.members.find(
      (m) => m.toString() !== sender.toString()
    );

    if (!receiver) {
      return res.status(400).json({
        success: false,
        message: "Receiver not found"
      });
    }

    const message = await Message.create({
      chat: chatId,
      sender,
      receiver,
      content: text,
      status: "sent"
    });

    chat.lastMessage = message._id;
    chat.updatedAt = new Date();

    const currentUnread = chat.unreadCounts.get(receiver.toString()) || 0;
    chat.unreadCounts.set(receiver.toString(), currentUnread + 1);

    await chat.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "_id username name avatar")
      .populate("receiver", "_id username name avatar");

    return res.json({
      success: true,
      message: populatedMessage,
      chatId: chat._id
    });
  } catch (err) {
    next(err);
  }
};
