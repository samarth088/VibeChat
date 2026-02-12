const express = require("express");
const router = express.Router();

const {
  getUserChats,
  getChatMessages,
  createOrGetChat
} = require("../controllers/chat.controller");

const authMiddleware = require("../middleware/auth.middleware");

// GET /api/chats
router.get("/", authMiddleware, getUserChats);

// GET /api/chats/:chatId/messages
router.get("/:chatId/messages", authMiddleware, getChatMessages);

// POST /api/chats
router.post("/", authMiddleware, createOrGetChat);

module.exports = router;
