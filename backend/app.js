// ================================
// VibeChat Express App Config
// ================================

const express = require("express");
const cors = require("cors");

const authRoutes    = require("./routes/auth.routes");
const userRoutes    = require("./routes/user.routes");
const chatRoutes    = require("./routes/chat.routes");
const groupRoutes   = require("./routes/group.routes");

const errorMiddleware = require("./middleware/error.middleware");

const app = express();

// ================= CORS =================
// FIX: OPTIONS preflight must be handled BEFORE all routes
// Browser sends OPTIONS before PATCH/PUT/DELETE — without this,
// CORS policy blocks the actual request.

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin"
  ],
  credentials: false   // must be false when origin is "*"
};

// Handle preflight for ALL routes
app.options("*", cors(corsOptions));

// Apply CORS to all requests
app.use(cors(corsOptions));

// ================= BODY PARSERS =================
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "🚀 VibeChat Backend Running"
  });
});

// ================= API ROUTES =================
app.use("/api/auth",     authRoutes);
app.use("/api/users",    userRoutes);
app.use("/api/chats",    chatRoutes);
app.use("/api/groups",   groupRoutes);
app.use("/api/messages", require("./routes/message.routes"));

// ================= 404 =================
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ================= ERROR HANDLER =================
app.use(errorMiddleware);

module.exports = app;
