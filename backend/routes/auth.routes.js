const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, signup, login } = require('../controllers/auth.controller');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/signup', signup);
router.post('/login', login);

module.exports = router;
