// routes/chat.routes.js

const express = require("express");
const router  = express.Router();

const {
  getUserChats,
  createOrGetChat,
  getChatMessages,
  sendMessage,
  markChatSeen
} = require("../controllers/chat.controller");

const { protect } = require("../middleware/auth.middleware");

router.get(  "/",                protect, getUserChats);      // GET  /api/chats
router.post( "/",                protect, createOrGetChat);   // POST /api/chats  { userId }
router.get(  "/:chatId/messages",protect, getChatMessages);   // GET  /api/chats/:id/messages
router.post( "/:chatId/messages",protect, sendMessage);       // POST /api/chats/:id/messages
router.patch("/:chatId/seen",    protect, markChatSeen);      // PATCH /api/chats/:id/seen

module.exports = router;
