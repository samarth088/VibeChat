const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const chatRoutes = require("./routes/chat.routes");
const groupRoutes = require("./routes/group.routes");
const messageRoutes = require("./routes/message.routes");

const errorMiddleware = require("./middleware/error.middleware");

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true
}));

// UPDATED
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

app.get("/", function (req, res) {
  res.status(200).json({
    status: "success",
    message: "🚀 VibeChat Backend Running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/messages", messageRoutes);

app.use(function (req, res) {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

app.use(errorMiddleware);

module.exports = app;
