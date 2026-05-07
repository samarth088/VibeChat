// socket/chat.socket.js

// Real-time DM messaging — send, deliver, read receipts

const Message = require("../models/Message");
const Chat    = require("../models/Chat");

const handleChatSocket = (io, socket, onlineUsers) => {

  // ── Send Message ──────────────────────────────────────────────
  socket.on("message", async ({ roomId, to, text }) => {
    try {
      if (!roomId || !to || !String(text || "").trim()) return;

      const senderId = socket.data && socket.data.userId;
      if (!senderId) return;

      const content = String(text).trim();

      // Save to DB
      const message = await Message.create({
        chat:    roomId,
        sender:  senderId,
        receiver: to,
        content,
        status:  "sent"
      });

      // Update chat metadata
      await Chat.findByIdAndUpdate(roomId, {
        lastMessage:   message._id,
        lastMessageAt: message.createdAt,
        updatedAt:     new Date()
      });

      const populatedMsg = await Message.findById(message._id)
        .populate("sender",   "_id username name avatar")
        .populate("receiver", "_id username name avatar");

      const payload = {
        _id:       populatedMsg._id,
        roomId,
        sender:    populatedMsg.sender,
        receiver:  populatedMsg.receiver,
        content:   populatedMsg.content,
        status:    populatedMsg.status,
        createdAt: populatedMsg.createdAt
      };

      // Send to sender room (optimistic confirm)
      socket.emit("message", payload);

      // Send to receiver if online
      const receiverSocketId = onlineUsers.get(String(to));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("message", payload);

        // Mark as delivered since receiver is online
        await Message.findByIdAndUpdate(message._id, { status: "delivered" });
        const deliveredPayload = { ...payload, status: "delivered" };
        socket.emit("message:status", { msgId: message._id, status: "delivered" });
        io.to(receiverSocketId).emit("message:status", { msgId: message._id, status: "delivered" });
      }

    } catch (err) {
      console.error("socket message error:", err);
    }
  });

  // ── Mark as Read (blue ticks) ─────────────────────────────────
  socket.on("message:seen", async ({ roomId, by }) => {
    try {
      if (!roomId || !by) return;

      // Update all unread messages in this chat to "read"
      const updated = await Message.updateMany(
        {
          chat:     roomId,
          receiver: by,
          status:   { $in: ["sent", "delivered"] }
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
