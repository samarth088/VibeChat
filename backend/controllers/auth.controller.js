// controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const OtpModel = require('../models/Otp');
const { sendEmail } = require('../utils/email');   // ✅ matches export in email.js
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

    // Check if already registered & verified
    const existingUser = await User.findOne({ email: emailLower, isVerified: true });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered. Please login.' });
    }

    // Delete previous OTPs
    await OtpModel.deleteMany({ email: emailLower });

    // Generate OTP
    const otp = generateOtp();
    const expiresAt = getOtpExpiry(10);

    // Save to DB
    await OtpModel.create({ email: emailLower, otp, expiresAt });

    // Send email — passes otp directly, email.js handles HTML
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

    otpRecord.verified = true;
    await otpRecord.save();

    return res.status(200).json({
      success: true,
      message: 'OTP verified. Proceed to complete signup.',
    });

  } catch (error) {
    console.error('verifyOtp error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/signup
// Body: { name, email, password }
// ─────────────────────────────────────────────
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const emailLower = email.toLowerCase().trim();

    // Must have verified OTP first
    const otpRecord = await OtpModel.findOne({ email: emailLower, verified: true });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Email not verified. Please complete OTP verification first.',
      });
    }

    // Check not already registered
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser && existingUser.isVerified) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: emailLower,
      password: hashedPassword,
      isVerified: true,
    });

    await OtpModel.deleteMany({ email: emailLower });

    const token = generateToken({ userId: user._id });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
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
