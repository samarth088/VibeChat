const bcrypt = require("bcryptjs");
const User = require("../models/User");
const OtpModel = require("../models/Otp");
const { sendEmail } = require("../utils/email");
const { generateOtp, getOtpExpiry, isOtpExpired } = require("../utils/otp");
const { generateToken } = require("../utils/jwt");


// ─────────────────────────────────────────────
// SEND OTP
// ─────────────────────────────────────────────
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const emailLower = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: emailLower,
      isVerified: true,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered. Please login.",
      });
    }

    await OtpModel.deleteMany({ email: emailLower });

    const otp = generateOtp();
    const expiresAt = getOtpExpiry(10);

    await OtpModel.create({
      email: emailLower,
      otp,
      expiresAt,
      verified: false,
    });

    const subject = "Your VibeChat OTP Code";

    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2>VibeChat OTP Verification</h2>
        <p>Your OTP code is:</p>
        <h1 style="letter-spacing: 5px;">${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
      </div>
    `;

    await sendEmail(emailLower, subject, html);

    return res.status(200).json({
      success: true,
      message: `OTP sent to ${emailLower}. Check your inbox.`,
    });

  } catch (error) {
    console.error("sendOtp error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};


// ─────────────────────────────────────────────
// VERIFY OTP
// ─────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const emailLower = email.toLowerCase().trim();

    const otpRecord = await OtpModel
      .findOne({ email: emailLower })
      .sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "No OTP found. Please request a new one.",
      });
    }

    if (isOtpExpired(otpRecord.expiresAt)) {
      await OtpModel.deleteMany({ email: emailLower });
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new one.",
      });
    }

    if (otpRecord.otp !== String(otp).trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    otpRecord.verified = true;
    await otpRecord.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified. Proceed to complete signup.",
    });

  } catch (error) {
    console.error("verifyOtp error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ─────────────────────────────────────────────
// SIGNUP (AUTO CLEAN NULL USERNAME FIX)
// ─────────────────────────────────────────────
exports.signup = async (req, res) => {
  try {

    // 🔥 AUTO CLEANUP (only broken records)
    await User.deleteMany({ username: null });
    await User.deleteMany({ username: { $exists: false } });

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const emailLower = email.toLowerCase().trim();
    const username = name.trim().toLowerCase().replace(/\s+/g, "");

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Invalid username.",
      });
    }

    const otpRecord = await OtpModel.findOne({
      email: emailLower,
      verified: true,
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Email not verified. Please verify OTP first.",
      });
    }

    if (await User.findOne({ email: emailLower })) {
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    if (await User.findOne({ username })) {
      return res.status(409).json({
        success: false,
        message: "Username already taken.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      username: username,
      email: emailLower,
      password: hashedPassword,
      isVerified: true,
    });

    await OtpModel.deleteMany({ email: emailLower });

    const token = generateToken({ userId: user._id });

    return res.status(201).json({
      success: true,
      message: "Account created successfully!",
      token,
      user: {
        id: user._id,
        uid: user.uid,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    });

  } catch (error) {
    console.error("signup error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const emailLower = email.toLowerCase().trim();

    const user = await User.findOne({ email: emailLower });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Email not verified.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken({ userId: user._id });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        uid: user.uid,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    });

  } catch (error) {
    console.error("login error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
