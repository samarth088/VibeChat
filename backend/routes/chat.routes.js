const express = require("express");
const router = express.Router();

const chatController = require("../controllers/chat.controller");
const { protect } = require("../middleware/auth.middleware");

// GET /api/chats
router.get("/", protect, chatController.getUserChats);

// POST /api/chats
router.post("/", protect, chatController.createOrGetChat);

// GET /api/chats/:chatId/messages
router.get("/:chatId/messages", protect, chatController.getChatMessages);

// POST /api/chats/:chatId/messages
router.post("/:chatId/messages", protect, chatController.sendMessage);

// PATCH /api/chats/:chatId/seen
router.patch("/:chatId/seen", protect, chatController.markChatSeen);

module.exports = router;
