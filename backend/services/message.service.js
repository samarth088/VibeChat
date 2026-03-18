const Message = require("../models/Message");
const Chat = require("../models/Chat");

// Create or get chat
const getOrCreateChat = async (user1, user2) => {
  let chat = await Chat.findOne({
    members: { $all: [user1, user2] }
  });

  if (!chat) {
    chat = await Chat.create({
      members: [user1, user2],
      unreadCounts: new Map([
        [user1.toString(), 0],
        [user2.toString(), 0]
      ])
    });
  }

  return chat;
};

// Save message
const createMessage = async ({ chatId, sender, receiver, text }) => {
  if (!chatId || !sender || !receiver || !text || !String(text).trim()) {
    throw new Error("chatId, sender, receiver and text are required");
  }

  const cleanText = String(text).trim();

  const message = await Message.create({
    chat: chatId,
    sender,
    receiver,
    content: cleanText,
    status: "sent"
  });

  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: message._id,
    updatedAt: new Date()
  });

  return message;
};

// Get chat messages
const getChatMessages = async (chatId) => {
  return await Message.find({ chat: chatId })
    .populate("sender", "_id username name avatar")
    .populate("receiver", "_id username name avatar")
    .sort({ createdAt: 1 });
};

module.exports = {
  getOrCreateChat,
  createMessage,
  getChatMessages
};
