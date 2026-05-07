// controllers/auth.controller.js

const bcrypt = require("bcryptjs");
const User   = require("../models/User");
const OtpModel = require("../models/Otp");
const { sendEmail }   = require("../utils/email");
const { generateOtp, getOtpExpiry, isOtpExpired } = require("../utils/otp");
const { generateToken } = require("../utils/jwt");


// ─────────────────────────────────────────────
// SEND OTP
// ─────────────────────────────────────────────
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const emailLower = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: emailLower, isVerified: true });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email already registered. Please login." });
    }

    await OtpModel.deleteMany({ email: emailLower });

    const otp = generateOtp();
    const expiresAt = getOtpExpiry(10);

    await OtpModel.create({ email: emailLower, otp, expiresAt, verified: false });

    const subject = "Your VibeChat OTP Code";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto; padding: 20px; border-radius: 12px; background: #0d1117; color: #ffffff;">
        <h2 style="color: #7c6aff;">VibeChat</h2>
        <p>Your OTP verification code:</p>
        <h1 style="letter-spacing: 8px; font-size: 36px; color: #ffffff;">${otp}</h1>
        <p style="color: #888;">This OTP expires in 10 minutes. Do not share it with anyone.</p>
      </div>
    `;

    await sendEmail(emailLower, subject, html);

    return res.status(200).json({ success: true, message: `OTP sent to ${emailLower}` });

  } catch (error) {
    console.error("sendOtp error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};


// ─────────────────────────────────────────────
// VERIFY OTP
// ─────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp, fullname, username, password } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const emailLower = email.toLowerCase().trim();
    const otpRecord = await OtpModel.findOne({ email: emailLower }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "No OTP found. Please request a new one." });
    }

    if (isOtpExpired(otpRecord.expiresAt)) {
      await OtpModel.deleteMany({ email: emailLower });
      return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
    }

    if (otpRecord.otp !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: "Invalid OTP. Please try again." });
    }

    // If signup data is also passed, create the account directly
    // FIX: frontend's verifyOTPAndSignup sends fullname+username+password together
    if (fullname && password) {
      otpRecord.verified = true;
      await otpRecord.save();

      return await _createAccount({ emailLower, fullname, username, password, res });
    }

    // OTP-only verify (just marking verified)
    otpRecord.verified = true;
    await otpRecord.save();

    return res.status(200).json({ success: true, message: "OTP verified. Proceed to complete signup." });

  } catch (error) {
    console.error("verifyOtp error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


// ─────────────────────────────────────────────
// SIGNUP (separate endpoint, also works)
// ─────────────────────────────────────────────
exports.signup = async (req, res) => {
  try {
    const { name, fullname, email, password, username: reqUsername } = req.body;

    const displayName = (fullname || name || "").trim();
    if (!displayName || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }

    const emailLower = email.toLowerCase().trim();

    // Check OTP was verified
    const otpRecord = await OtpModel.findOne({ email: emailLower, verified: true });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Email not verified. Please verify OTP first." });
    }

    if (await User.findOne({ email: emailLower })) {
      return res.status(409).json({ success: false, message: "Email already registered." });
    }

    return await _createAccount({
      emailLower,
      fullname: displayName,
      username: reqUsername || null,
      password,
      res
    });

  } catch (error) {
    console.error("signup error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};


// ─────────────────────────────────────────────
// INTERNAL: Create user account
// ─────────────────────────────────────────────
async function _createAccount({ emailLower, fullname, username, password, res }) {
  try {
    if (await User.findOne({ email: emailLower, isVerified: true })) {
      return res.status(409).json({ success: false, message: "Email already registered." });
    }

    // Build username from provided or from name
    let baseUsername = username
      ? String(username).trim().toLowerCase().replace(/[^a-z0-9_.]/g, "")
      : fullname.trim().toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9_.]/g, "");

    if (!baseUsername || baseUsername.length < 3) {
      baseUsername = "user";
    }

    // Make username unique
    let finalUsername = baseUsername;
    const taken = await User.findOne({ username: finalUsername });
    if (taken) {
      finalUsername = baseUsername + Math.floor(1000 + Math.random() * 9000);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name:       fullname,
      username:   finalUsername,
      email:      emailLower,
      password:   hashedPassword,
      isVerified: true
    });

    await OtpModel.deleteMany({ email: emailLower });

    const token = generateToken(user._id);

    return res.status(201).json({
      success:     true,
      message:     "Account created successfully!",
      token,
      userId:      user._id,
      idFormatted: user.uid,
      username:    user.username,
      user: {
        id:         user._id,
        uid:        user.uid,
        name:       user.name,
        username:   user.username,
        email:      user.email,
        avatar:     user.avatar,
        isVerified: user.isVerified
      }
    });

  } catch (err) {
    console.error("_createAccount error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
}


// ─────────────────────────────────────────────
// LOGIN — email OR username dono se kaam karta hai
// ─────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    // FIX: frontend login.js sends { identifier, password }
    // lekin backend expect karta tha { email, password }
    const { email, identifier, password } = req.body;

    const loginId = (identifier || email || "").toLowerCase().trim();

    if (!loginId || !password) {
      return res.status(400).json({ success: false, message: "Email/username and password are required" });
    }

    // Search by email OR username
    const user = await User.findOne({
      $or: [
        { email: loginId },
        { username: loginId }
      ]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: "Email not verified. Please verify your email first." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      userId:  user._id,
      user: {
        id:         user._id,
        uid:        user.uid,
        name:       user.name,
        username:   user.username,
        email:      user.email,
        avatar:     user.avatar,
        bio:        user.bio,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error("login error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};
