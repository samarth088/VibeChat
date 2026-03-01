const express = require("express");
const router = express.Router();

const chatController = require("../controllers/chat.controller");
const { protect } = require("../middleware/auth.middleware");

// GET /api/chats
router.get("/", protect, chatController.getUserChats);

// GET /api/chats/:chatId/messages
router.get("/:chatId/messages", protect, chatController.getChatMessages);

// POST /api/chats
router.post("/", protect, chatController.createOrGetChat);

module.exports = router;
