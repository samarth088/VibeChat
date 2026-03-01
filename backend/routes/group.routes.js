const express = require("express");
const router = express.Router();

const {
  createGroup,
  getUserGroups,
  getGroupMessages
} = require("../controllers/group.controller");

const { protect } = require("../middleware/auth.middleware"); // ✅ FIX

// POST /api/groups
router.post("/", protect, createGroup);

// GET /api/groups
router.get("/", protect, getUserGroups);

// GET /api/groups/:groupId/messages
router.get("/:groupId/messages", protect, getGroupMessages);

module.exports = router;
