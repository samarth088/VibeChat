// controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const OtpModel = require('../models/Otp');
const { sendOtpEmail } = require('../utils/email');
const { generateOtp, getOtpExpiry, isOtpExpired } = require('../utils/otp');
const { generateToken } = require('../utils/jwt');

// ─────────────────────────────────────────────
// POST /api/auth/send-otp
// Body: { email }
// ─────────────────────────────────────────────
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const emailLower = email.toLowerCase().trim();

    // Check if email already registered & verified
    const existingUser = await User.findOne({ email: emailLower, isVerified: true });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered. Please login.' });
    }

    // Delete any previous OTPs for this email
    await OtpModel.deleteMany({ email: emailLower });

    // Generate new OTP
    const otp = generateOtp();
    const expiresAt = getOtpExpiry(10); // 10 minutes

    // Save OTP to DB
    await OtpModel.create({ email: emailLower, otp, expiresAt });

    // Send email
    await sendOtpEmail(emailLower, otp);

    return res.status(200).json({
      success: true,
      message: `OTP sent to ${emailLower}. Check your inbox.`,
    });

  } catch (error) {
    console.error('sendOtp error:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/verify-otp
// Body: { email, otp }
// ─────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const emailLower = email.toLowerCase().trim();

    const otpRecord = await OtpModel.findOne({ email: emailLower }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' });
    }

    if (isOtpExpired(otpRecord.expiresAt)) {
      await OtpModel.deleteMany({ email: emailLower });
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
    }

    if (otpRecord.otp !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully. Proceed to complete signup.',
    });

  } catch (error) {
    console.error('verifyOtp error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/signup
// Body: { name, email, password }
// Call this AFTER OTP is verified
// ─────────────────────────────────────────────
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const emailLower = email.toLowerCase().trim();

    // Check OTP was verified
    const otpRecord = await OtpModel.findOne({ email: emailLower, verified: true });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Email not verified. Please complete OTP verification first.',
      });
    }

    // Check user doesn't already exist
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser && existingUser.isVerified) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user — UID is auto-generated in model
    const user = await User.create({
      name: name.trim(),
      email: emailLower,
      password: hashedPassword,
      isVerified: true,
    });

    // Clean up OTP records
    await OtpModel.deleteMany({ email: emailLower });

    // Generate JWT
    const token = generateToken({ userId: user._id });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: user._id,
        uid: user.uid,        // ← searchable UID like "vibe_a3f9k2"
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    });

  } catch (error) {
    console.error('signup error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password }
// ─────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const emailLower = email.toLowerCase().trim();

    const user = await User.findOne({ email: emailLower });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: 'Email not verified. Please signup again.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken({ userId: user._id });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    });

  } catch (error) {
    console.error('login error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
