// app.js

const express = require("express");
const cors    = require("cors");

const authRoutes   = require("./routes/auth.routes");
const userRoutes   = require("./routes/user.routes");
const chatRoutes   = require("./routes/chat.routes");
const groupRoutes  = require("./routes/group.routes");

const errorMiddleware = require("./middleware/error.middleware");

const app = express();

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = [
  "https://vibechat.in",
  "https://www.vibechat.in",
  // Dev origins — local testing ke liye
  "http://localhost:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:5173",
  "http://127.0.0.1:3000"
];

const corsOptions = {
  origin: function (origin, callback) {
    // No origin = mobile apps, Postman, curl — allow
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS not allowed: " + origin), false);
  },
  methods:      ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  credentials:  true
};

app.options("*", cors(corsOptions));
app.use(cors(corsOptions));

// ── BODY PARSERS ──────────────────────────────────────────────
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// ── HEALTH CHECK ──────────────────────────────────────────────
// Health check — frontend pings this to wake Render.com server
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: Date.now() });
});

app.get("/", (req, res) => {
  res.status(200).json({ status: "success", message: "VibeChat Backend Running 🚀" });
});

// ── ROUTES ────────────────────────────────────────────────────
app.use("/api/auth",   authRoutes);
app.use("/api/users",  userRoutes);
app.use("/api/chats",  chatRoutes);
app.use("/api/groups", groupRoutes);
// NOTE: /api/messages route removed — duplicate of /api/chats/:chatId/messages

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── ERROR HANDLER ─────────────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
