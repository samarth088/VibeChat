// ================================
// VibeChat Express App Config
// ================================

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const chatRoutes = require("./routes/chat.routes");
const groupRoutes = require("./routes/group.routes");

const errorMiddleware = require("./middleware/error.middleware");

const app = express();

// ================= MIDDLEWARE =================

// Enable CORS (Later restrict to frontend domain)
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Parse JSON
app.use(express.json());

// Parse URL encoded (form support)
app.use(express.urlencoded({ extended: true }));

// ================= HEALTH CHECK =================

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "🚀 VibeChat Backend Running"
  });
});

// ================= API ROUTES =================

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/groups", groupRoutes);

// ================= 404 HANDLER =================

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});

// ================= ERROR HANDLER =================
// (Must be last)

app.use(errorMiddleware);

module.exports = app;
