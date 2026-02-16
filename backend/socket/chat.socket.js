const Message = require("../models/Message");
const Chat = require("../models/Chat");
const User = require("../models/User");

const handleChatSocket = (io, socket, onlineUsers) => {

  // ================= REGISTER =================
  socket.on("register", async (userId) => {
    onlineUsers.set(userId, socket.id);

    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      socketId: socket.id,
      lastSeen: null
    });

    io.emit("user-online", userId);
  });

  // ================= DISCONNECT =================
  socket.on("disconnect", async () => {
    for (let [userId, sockId] of onlineUsers.entries()) {
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
  });

  // ================= PRIVATE MESSAGE =================
  socket.on("private-message", async ({ from, to, text }) => {

    try {

      let chat = await Chat.findOne({
        members: { $all: [from, to] }
      });

      if (!chat) {
        chat = await Chat.create({
          members: [from, to],
          unreadCounts: {
            [from]: 0,
            [to]: 0
          }
        });
      }

      const message = await Message.create({
        chat: chat._id,
        sender: from,
        receiver: to,
        content: text,
        status: "sent"
      });

      // Update last message
      chat.lastMessage = message._id;

      // Increase unread for receiver
      const currentUnread = chat.unreadCounts.get(to) || 0;
      chat.unreadCounts.set(to, currentUnread + 1);

      await chat.save();

      const receiverSocket = onlineUsers.get(to);

      if (receiverSocket) {

        message.status = "delivered";
        message.deliveredAt = new Date();
        await message.save();

        // Send message to receiver
        io.to(receiverSocket).emit("private-message", message);

        // 🔥 Emit unread update
        io.to(receiverSocket).emit("unread-update", {
          chatId: chat._id,
          unread: chat.unreadCounts.get(to)
        });
      }

      // Ack back to sender
      socket.emit("message-sent", message);

    } catch (err) {
      console.error("Private message error:", err);
    }
  });

  // ================= MESSAGE SEEN =================
  socket.on("message-seen", async (msgId) => {

    try {

      const message = await Message.findById(msgId);
      if (!message) return;

      message.status = "seen";
      message.seenAt = new Date();
      await message.save();

      const chat = await Chat.findById(message.chat);

      if (chat) {
        // Reset unread for receiver
        chat.unreadCounts.set(message.receiver.toString(), 0);
        await chat.save();

        // 🔥 Emit unread reset
        socket.emit("unread-update", {
          chatId: chat._id,
          unread: 0
        });
      }

      const senderSocket = onlineUsers.get(message.sender.toString());

      if (senderSocket) {
        io.to(senderSocket).emit("message-seen", {
          msgId: message._id
        });
      }

    } catch (err) {
      console.error("Seen error:", err);
    }
  });

  // ================= TYPING =================
  socket.on("typing", ({ to }) => {
    const receiverSocket = onlineUsers.get(to);
    if (receiverSocket) {
      io.to(receiverSocket).emit("typing", true);
    }
  });

  socket.on("stop-typing", ({ to }) => {
    const receiverSocket = onlineUsers.get(to);
    if (receiverSocket) {
      io.to(receiverSocket).emit("typing", false);
    }
  });

};

module.exports = { handleChatSocket };
