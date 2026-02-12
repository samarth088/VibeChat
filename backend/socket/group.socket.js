const Message = require("../models/Message");

const handleGroupSocket = (io, socket, onlineUsers) => {

  socket.on("group-message", async ({ groupId, from, text }) => {

    try {
      const message = await Message.create({
        group: groupId,
        sender: from,
        text
      });

      io.emit(`group-${groupId}`, message);

    } catch (err) {
      console.error("Group message error:", err);
    }

  });

};

module.exports = { handleGroupSocket };
