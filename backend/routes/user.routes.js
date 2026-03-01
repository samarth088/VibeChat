const express = require("express");
const router = express.Router();
const { getAllUsers, getProfile, updateProfile, searchUser } = require("../controllers/user.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);

router.get("/search", searchUser);  // ← pehle
router.get("/me", getProfile);
router.put("/me", updateProfile);
router.get("/all", getAllUsers);

module.exports = router;
