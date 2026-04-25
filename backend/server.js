require("./config/env");

const http = require("http");
const app = require("./app");
const { connectDB } = require("./config/db");
const { Server } = require("socket.io");

// 🔥 SAFE IMPORT
const socketModule = require("./socket/socket");

const PORT = process.env.PORT || 10000;

async function startServer() {
  try {
    console.log("🚀 Starting backend...");

    await connectDB();

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
      }
    });

    // store io globally
    app.set("io", io);

    // 🔍 DEBUG
    console.log("Socket module loaded:", socketModule);

    const initSocket = socketModule.initSocket;

    if (typeof initSocket !== "function") {
      console.error("❌ initSocket is NOT a function:", initSocket);
      process.exit(1);
    }

    // ✅ INIT SOCKET
    initSocket(io);

    server.listen(PORT, "0.0.0.0", () => {
      console.log("✅ Server running on port " + PORT);
    });

    server.on("error", (err) => {
      console.error("❌ Server listen error:", err);
      process.exit(1);
    });

  } catch (err) {
    console.error("❌ Fatal startup error:", err);
    process.exit(1);
  }
}

startServer();
