// socket/group.socket.js
const Message = require("../models/Message");

const handleGroupSocket = (io, socket, onlineUsers) => {

  socket.on("group-message", async ({ groupId, from, text }) => {

    try {
      const message = await Message.create({
        group:  groupId,
        sender: from,
        // ✅ FIX: "text" → "content" — Message model mein field "content" hai, "text" nahi
        // chat.socket.js bhi "content" use karta hai — consistent rakha
        content: text,
      });

      io.emit(`group-${groupId}`, message);

    } catch (err) {
      console.error("Group message error:", err);
    }

  });

};

module.exports = { handleGroupSocket };

