const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getProfile,
  updateProfile,
  searchUser,
} = require("../controllers/user.controller");

const { protect } = require("../middleware/auth.middleware");

// All routes protected
router.use(protect);

// GET /users/search?uid=tanuu   ← SEARCH by uid or username
router.get("/search", searchUser);

// GET /users/me
router.get("/me", getProfile);

// PUT /users/me
router.put("/me", updateProfile);

// GET /users/all
router.get("/all", getAllUsers);

module.exports = router;
