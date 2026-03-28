// =========================
// VibeChat Backend Server
// =========================

require("dotenv").config();

const http = require("http");
const app = require("./app");
const { connectDB } = require("./config/db");

const { Server } = require("socket.io");
const { initSocket } = require("./socket/socket");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
  }
});

// ADDED
app.set("io", io);

initSocket(io);
connectDB();

const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
  console.log(`🚀 VibeChat backend running on port ${PORT}`);
});
