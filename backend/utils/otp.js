// utils/otp.js
const crypto = require('crypto');

/**
 * Generate a 6-digit OTP
 */
function generateOtp() {
  // Cryptographically secure random 6-digit number
  return String(crypto.randomInt(100000, 999999));
}

/**
 * Get OTP expiry time (10 minutes from now)
 */
function getOtpExpiry(minutes = 10) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Check if OTP is expired
 */
function isOtpExpired(expiresAt) {
  return new Date() > new Date(expiresAt);
}

module.exports = { generateOtp, getOtpExpiry, isOtpExpired };
