const express = require("express");
const router = express.Router();

const {
  sendOtp,
  verifyOtpAndSignup,
  login
} = require("../controllers/auth.controller");

// ================= OTP =================

// Send OTP
// POST /api/auth/send-otp
router.post("/send-otp", sendOtp);

// Verify OTP + Create Account
// POST /api/auth/verify-otp-signup
router.post("/verify-otp-signup", verifyOtpAndSignup);

// ================= LOGIN =================

// POST /api/auth/login
router.post("/login", login);

module.exports = router;
