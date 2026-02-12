const Message = require("../models/Message");
const Chat = require("../models/Chat");

const handleChatSocket = (io, socket, onlineUsers) => {

  // ================= PRIVATE MESSAGE =================
  socket.on("private-message", async ({ from, to, text }) => {

    try {
      // Find or create chat
      let chat = await Chat.findOne({
        members: { $all: [from, to] }
      });

      if (!chat) {
        chat = await Chat.create({
          members: [from, to]
        });
      }

      // Save message
      const message = await Message.create({
        chat: chat._id,
        sender: from,
        text
      });

      // Update last message
      chat.lastMessage = message._id;
      await chat.save();

      const receiverSocket = onlineUsers.get(to);

      // Send to receiver if online
      if (receiverSocket) {
        io.to(receiverSocket).emit("private-message", message);
      }

      // Send back to sender (ack)
      socket.emit("message-sent", message);

    } catch (err) {
      console.error("Private message error:", err);
    }

  });

  // ================= MESSAGE SEEN =================
  socket.on("message-seen", async (msgId) => {
    try {

      const message = await Message.findByIdAndUpdate(
        msgId,
        { status: "seen" },
        { new: true }
      );

      if (!message) return;

      const receiverSocket = onlineUsers.get(message.sender.toString());

      if (receiverSocket) {
        io.to(receiverSocket).emit("message-seen", {
          msgId: message._id
        });
      }

    } catch (err) {
      console.error("Seen error:", err);
    }
  });

};

module.exports = { handleChatSocket };
