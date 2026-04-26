
const express = require("express");
const router = express.Router();

const {
  getUserChats,
  createOrGetChat,
  getChatMessages,
  sendMessage,
  markChatSeen
} = require("../controllers/chat.controller");

const { protect } = require("../middleware/auth.middleware");

router.get("/", protect, getUserChats);
router.post("/", protect, createOrGetChat);
router.get("/:chatId/messages", protect, getChatMessages);
router.post("/:chatId/messages", protect, sendMessage);
router.patch("/:chatId/seen", protect, markChatSeen);

module.exports = router;
