// UPDATED
const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  getProfile,
  updateProfile,
  searchUser
} = require("../controllers/user.controller");

const { protect } = require("../middleware/auth.middleware");

// Protect all routes
router.use(protect);

// Search user by username or UID
router.get("/search", searchUser);

// Get my profile
router.get("/me", getProfile);

// Update my profile (name, username, bio, avatar)
router.put("/me", updateProfile);

// Get all users (except me)
router.get("/all", getAllUsers);

module.exports = router;
