// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const {
  sendOtp,
  verifyOtp,
  signup,
  login,
} = require('../controllers/auth.controller');

// Step 1: Send OTP to email
router.post('/send-otp', sendOtp);

// Step 2: Verify OTP
router.post('/verify-otp', verifyOtp);

// Step 3: Complete signup (after OTP verified)
router.post('/signup', signup);

// Login
router.post('/login', login);

module.exports = router;
