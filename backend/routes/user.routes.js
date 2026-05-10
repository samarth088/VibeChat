const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getProfile,
  updateProfile,
  searchUser,
  changePassword
} = require("../controllers/user.controller");
const { protect } = require("../middleware/auth.middleware");

// Protect all routes
router.use(protect);

// Search by UID or username
router.get("/search", searchUser);

// Get my profile
router.get("/me", getProfile);

// Update my profile
router.put("/me", updateProfile);

// Get all users except current user
router.get("/all", getAllUsers);

// ■ Change password
router.patch("/change-password", changePassword);

module.exports = router;
