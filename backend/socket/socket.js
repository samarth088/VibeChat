
const { handleChatSocket } = require("./chat.socket");
const { handleGroupSocket } = require("./group.socket");
const User = require("../models/User");

let onlineUsers = new Map();

function getSocketIdByUserId(userId) {
  return onlineUsers.get(String(userId)) || null;
}

function emitPresence(io, userId, isOnline, lastSeen) {
  io.emit("presence", {
    type: "presence",
    userId: String(userId),
    isOnline: !!isOnline,
    lastSeen: lastSeen ? new Date(lastSeen).toISOString() : null
  });
}

const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("⚡ User connected:", socket.id);

    // UPDATED
    socket.on("register", async (userId) => {
      try {
        if (!userId) return;

        const cleanUserId = String(userId);
        socket.data.userId = cleanUserId;
        onlineUsers.set(cleanUserId, socket.id);

        await User.findByIdAndUpdate(cleanUserId, {
          isOnline: true,
          status: "online",
          socketId: socket.id,
          lastSeen: null
        });

        emitPresence(io, cleanUserId, true, null);
        console.log("🟢 Registered:", cleanUserId);
      } catch (err) {
        console.error("Register socket error:", err);
      }
    });

    // ADDED
    socket.on("join", (roomId) => {
      if (!roomId) return;
      socket.join(String(roomId));
    });

    handleChatSocket(io, socket, onlineUsers);
    handleGroupSocket(io, socket, onlineUsers);

    socket.on("disconnect", async () => {
      try {
        let disconnectedUserId = socket.data && socket.data.userId
          ? String(socket.data.userId)
          : null;

        if (!disconnectedUserId) {
          for (let [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
              disconnectedUserId = String(userId);
              break;
            }
          }
        }

        if (disconnectedUserId) {
          onlineUsers.delete(disconnectedUserId);

          const lastSeen = new Date();

          await User.findByIdAndUpdate(disconnectedUserId, {
            isOnline: false,
            status: "offline",
            socketId: null,
            lastSeen: lastSeen
          });

          emitPresence(io, disconnectedUserId, false, lastSeen);
        }

        console.log("🔴 Disconnected:", socket.id);
      } catch (err) {
        console.error("Disconnect socket error:", err);
      }
    });
  });
};

module.exports = {
  initSocket,
  getSocketIdByUserId
};
