const Message = require("../models/Message");
const Chat = require("../models/Chat");
const User = require("../models/User");

const handleChatSocket = (io, socket, onlineUsers) => {
  socket.on("register", async (userId) => {
    try {
      if (!userId) return;

      onlineUsers.set(userId.toString(), socket.id);

      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        socketId: socket.id,
        lastSeen: null
      });

      io.emit("user-online", userId);
    } catch (err) {
      console.error("Register error:", err);
    }
  });

  socket.on("private-message", async ({ from, to, text }) => {
    try {
      const cleanText = String(text || "").trim();
      if (!from || !to || !cleanText) return;

      let chat = await Chat.findOne({
        members: { $all: [from, to] }
      });

      if (!chat) {
        chat = await Chat.create({
          members: [from, to],
          unreadCounts: new Map([
            [from.toString(), 0],
            [to.toString(), 0]
          ])
        });
      }

      const message = await Message.create({
        chat: chat._id,
        sender: from,
        receiver: to,
        content: cleanText,
        status: "sent"
      });

      chat.lastMessage = message._id;
      chat.updatedAt = new Date();

      const currentUnread = chat.unreadCounts.get(to.toString()) || 0;
      chat.unreadCounts.set(to.toString(), currentUnread + 1);

      await chat.save();

      const receiverSocket = onlineUsers.get(to.toString());

      if (receiverSocket) {
        message.status = "delivered";
        message.deliveredAt = new Date();
        await message.save();

        io.to(receiverSocket).emit("private-message", {
          _id: message._id,
          chat: String(chat._id),
          sender: from,
          receiver: to,
          content: cleanText,
          status: message.status,
          createdAt: message.createdAt
        });

        io.to(receiverSocket).emit("unread-update", {
          chatId: String(chat._id),
          unread: chat.unreadCounts.get(to.toString()) || 0
        });
      }

      socket.emit("message-sent", {
        _id: message._id,
        chat: String(chat._id),
        sender: from,
        receiver: to,
        content: cleanText,
        status: message.status,
        createdAt: message.createdAt
      });
    } catch (err) {
      console.error("Private message error:", err);
    }
  });

  socket.on("message-seen", async (msgId) => {
    try {
      const message = await Message.findById(msgId);
      if (!message) return;
      if (message.status === "seen") return;

      message.status = "seen";
      message.seenAt = new Date();
      await message.save();

      const chat = await Chat.findById(message.chat);
      if (chat) {
        chat.unreadCounts.set(message.receiver.toString(), 0);
        chat.updatedAt = new Date();
        await chat.save();

        socket.emit("unread-update", {
          chatId: String(chat._id),
          unread: 0
        });
      }

      const senderSocket = onlineUsers.get(message.sender.toString());
      if (senderSocket) {
        io.to(senderSocket).emit("message-seen", {
          msgId: String(message._id),
          chatId: String(message.chat)
        });
      }
    } catch (err) {
      console.error("Seen error:", err);
    }
  });

  socket.on("disconnect", async () => {
    try {
      for (const [userId, sockId] of onlineUsers.entries()) {
        if (sockId === socket.id) {
          onlineUsers.delete(userId);

          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            socketId: null,
            lastSeen: new Date()
          });

          io.emit("user-offline", {
            userId,
            lastSeen: new Date()
          });

          break;
        }
      }
    } catch (err) {
      console.error("Disconnect error:", err);
    }
  });
};

module.exports = { handleChatSocket };
