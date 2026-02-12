// =========================
// VibeChat Backend Server
// =========================

require("dotenv").config();

const http = require("http");
const app = require("./app");
const { connectDB } = require("./config/db");

// ================= SOCKET.IO =================
const { Server } = require("socket.io");
const { initSocket } = require("./socket/socket");

// Create HTTP server
const server = http.createServer(app);

// Setup socket server
const io = new Server(server, {
  cors: {
    origin: "*", // later restrict to frontend domain
    methods: ["GET", "POST"]
  }
});

// Initialize socket logic
initSocket(io);

// ================= DATABASE =================
connectDB();

// ================= START SERVER =================
const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
  console.log(`🚀 VibeChat backend running on port ${PORT}`);
});
