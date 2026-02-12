const Message = require("../models/Message");
const Chat = require("../models/Chat");

// Create or get chat
const getOrCreateChat = async (user1, user2) => {
  let chat = await Chat.findOne({
    members: { $all: [user1, user2] }
  });

  if (!chat) {
    chat = await Chat.create({
      members: [user1, user2]
    });
  }

  return chat;
};

// Save message
const createMessage = async ({ chatId, sender, text }) => {
  const message = await Message.create({
    chat: chatId,
    sender,
    text
  });

  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: message._id
  });

  return message;
};

// Get chat messages
const getChatMessages = async (chatId) => {
  return await Message.find({ chat: chatId })
    .sort({ createdAt: 1 });
};

module.exports = {
  getOrCreateChat,
  createMessage,
  getChatMessages
};
