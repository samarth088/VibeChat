// socket/chat.socket.js
// Real-time DM messaging — send, deliver, read receipts

const Message = require("../models/Message");
const Chat = require("../models/Chat");

const handleChatSocket = (io, socket, onlineUsers) => {

  // ■■ Send Message ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  socket.on("message", async ({ roomId, to, text }) => {
    try {
      if (!roomId || !to || !String(text || "").trim()) return;
      const senderId = socket.data && socket.data.userId;
      if (!senderId) return;
      const content = String(text).trim();

      // ■ FIX: Save + populate in ONE query (pehle 2 DB calls the, ab 1 hai)
      const message = new Message({
        chat: roomId,
        sender: senderId,
        receiver: to,
        content,
        status: "sent"
      });
      await message.save();

      // Populate in place — extra findById query hataya
      await message.populate("sender", "_id username name avatar");
      await message.populate("receiver", "_id username name avatar");

      // Update chat metadata (parallel — await nahi)
      Chat.findByIdAndUpdate(roomId, {
        lastMessage: message._id,
        lastMessageAt: message.createdAt,
        updatedAt: new Date()
      }).catch(err => console.error("Chat update error:", err));

      const payload = {
        _id: message._id,
        roomId,
        sender: message.sender,
        receiver: message.receiver,
        content: message.content,
        status: message.status,
        createdAt: message.createdAt
      };

      // Send to sender (optimistic confirm)
      socket.emit("message", payload);

      // Send to receiver if online
      const receiverSocketId = onlineUsers.get(String(to));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("message", payload);

        // Mark as delivered since receiver is online
        Message.findByIdAndUpdate(message._id, { status: "delivered" })
          .catch(err => console.error("Deliver update error:", err));

        socket.emit("message:status", { msgId: message._id, status: "delivered" });
        io.to(receiverSocketId).emit("message:status", { msgId: message._id, status: "delivered" });
      }

    } catch (err) {
      console.error("socket message error:", err);
    }
  });

  // ■■ Mark as Read (blue ticks) ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
  socket.on("message:seen", async ({ roomId, by }) => {
    try {
      if (!roomId || !by) return;

      // Update all unread messages in this chat to "read"
      const updated = await Message.updateMany(
        {
          chat: roomId,
          receiver: by,
          status: { $in: ["sent", "delivered"] }
        },
        {
          $set: { status: "read", seenAt: new Date() }
        }
      );

      if (updated.modifiedCount > 0) {
        // Tell sender that messages were read
        io.to(roomId).emit("message:seen", { roomId, by });
      }
    } catch (err) {
      console.error("socket message:seen error:", err);
    }
  });

};

module.exports = { handleChatSocket };
