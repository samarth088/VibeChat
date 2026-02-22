const express = require("express");
const router = express.Router();

const {
  register,
  login,
  sendOtp,
  verifyOtp
} = require("../controllers/auth.controller");

// ================= OTP ROUTES =================

// POST /api/auth/send-otp
router.post("/send-otp", sendOtp);

// POST /api/auth/verify-otp
router.post("/verify-otp", verifyOtp);

// ================= AUTH ROUTES =================

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

module.exports = router;
