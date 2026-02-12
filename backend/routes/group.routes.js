const express = require("express");
const router = express.Router();

const {
  createGroup,
  getUserGroups,
  getGroupMessages
} = require("../controllers/group.controller");

const authMiddleware = require("../middleware/auth.middleware");

// POST /api/groups
router.post("/", authMiddleware, createGroup);

// GET /api/groups
router.get("/", authMiddleware, getUserGroups);

// GET /api/groups/:groupId/messages
router.get("/:groupId/messages", authMiddleware, getGroupMessages);

module.exports = router;
