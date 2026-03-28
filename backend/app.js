require("./config/env");

const http = require("http");
const app = require("./app");
const { connectDB } = require("./config/db");
const { Server } = require("socket.io");
const { initSocket } = require("./socket/socket");

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

    // ADDED
    app.set("io", io);

    initSocket(io);

    server.listen(PORT, "0.0.0.0", function () {
      console.log("✅ Server running on port " + PORT);
    });

    server.on("error", function (err) {
      console.error("❌ Server listen error:", err);
      process.exit(1);
    });
  } catch (err) {
    console.error("❌ Fatal startup error:", err);
    process.exit(1);
  }
}

startServer();
