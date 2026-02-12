const { handleChatSocket } = require("./chat.socket");
const { handleGroupSocket } = require("./group.socket");

let onlineUsers = new Map(); // userId -> socketId

const initSocket = (io) => {

  io.on("connection", (socket) => {

    console.log("⚡ User connected:", socket.id);

    // ===== REGISTER USER =====
    socket.on("register", (userId) => {
      onlineUsers.set(userId, socket.id);
      console.log("🟢 Registered:", userId);
    });

    // ===== CHAT EVENTS =====
    handleChatSocket(io, socket, onlineUsers);

    // ===== GROUP EVENTS =====
    handleGroupSocket(io, socket, onlineUsers);

    socket.on("disconnect", () => {
      for (let [key, value] of onlineUsers.entries()) {
        if (value === socket.id) {
          onlineUsers.delete(key);
          break;
        }
      }
      console.log("🔴 Disconnected:", socket.id);
    });

  });

};

module.exports = { initSocket };
