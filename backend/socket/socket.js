// UPDATED
const { handleChatSocket } = require("./chat.socket");
const { handleGroupSocket } = require("./group.socket");
const User = require("../models/User");

let onlineUsers = new Map(); // userId -> socketId

const initSocket = (io) => {

  io.on("connection", (socket) => {

    console.log("⚡ User connected:", socket.id);

    // ===== REGISTER USER =====
    socket.on("register", async (userId) => {
      try {
        if (!userId) return;
        onlineUsers.set(String(userId), socket.id);
        console.log("🟢 Registered:", userId);

        // Update user record: isOnline true + socketId
        try {
          await User.findByIdAndUpdate(
            userId,
            { isOnline: true, socketId: socket.id },
            { new: true }
          );
        } catch (e) {
          console.warn("Failed to update user online state on register:", e.message || e);
        }

        // Broadcast presence to all clients
        io.emit("presence", {
          type: "presence",
          userId: String(userId),
          isOnline: true,
          lastSeen: null
        });

      } catch (e) {
        console.error("register handler error:", e);
      }
    });

    // ===== CHAT EVENTS =====
    handleChatSocket(io, socket, onlineUsers);

    // ===== GROUP EVENTS =====
    handleGroupSocket(io, socket, onlineUsers);

    socket.on("disconnect", async () => {
      try {
        // find userId for this socket
        let foundUser = null;
        for (let [key, value] of onlineUsers.entries()) {
          if (value === socket.id) {
            foundUser = key;
            onlineUsers.delete(key);
            break;
          }
        }

        console.log("🔴 Disconnected:", socket.id, "user:", foundUser);

        if (foundUser) {
          // update DB: user offline and lastSeen
          const lastSeenAt = new Date();
          try {
            await User.findByIdAndUpdate(
              foundUser,
              { isOnline: false, lastSeen: lastSeenAt, socketId: null },
              { new: true }
            );
          } catch (e) {
            console.warn("Failed to update user on disconnect:", e.message || e);
          }

          // Broadcast presence to all clients
          io.emit("presence", {
            type: "presence",
            userId: String(foundUser),
            isOnline: false,
            lastSeen: lastSeenAt.toISOString()
          });
        }

      } catch (e) {
        console.error("disconnect handler error:", e);
      }
    });

  });

};

module.exports = { initSocket };
