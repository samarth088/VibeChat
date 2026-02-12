// ================= SERVER ENTRY =================
const http = require("http");
require("./config/env"); // Load env variables first

const app = require("./app");
const { connectDB } = require("./config/db");

// Create HTTP server
const server = http.createServer(app);

// ================= SOCKET INIT =================
const { initSocket } = require("./socket/socket");
initSocket(server);

// ================= DB CONNECTION =================
connectDB();

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 VibeChat backend running on port ${PORT}`);
});
