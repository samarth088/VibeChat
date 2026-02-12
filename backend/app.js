// ================= EXPRESS APP CONFIG =================
const express = require("express");
const cors = require("cors");

const app = express();

// ================= GLOBAL MIDDLEWARE =================
app.use(cors({
  origin: "*", // production me restrict karna
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.json({ status: "VibeChat API Running 🚀" });
});

// ================= ROUTES =================
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/chats", require("./routes/chat.routes"));
app.use("/api/groups", require("./routes/group.routes"));

// ================= ERROR HANDLER =================
app.use(require("./middleware/error.middleware"));

module.exports = app;
