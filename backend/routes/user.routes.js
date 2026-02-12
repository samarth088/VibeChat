const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  getProfile,
  updateProfile
} = require("../controllers/user.controller");

const authMiddleware = require("../middleware/auth.middleware");

// GET /api/users
router.get("/", authMiddleware, getAllUsers);

// GET /api/users/profile
router.get("/profile", authMiddleware, getProfile);

// PUT /api/users/profile
router.put("/profile", authMiddleware, updateProfile);

module.exports = router;
