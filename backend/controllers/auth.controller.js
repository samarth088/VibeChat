const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Otp = require("../models/Otp");
const { generateToken } = require("../utils/jwt");
const { generateOTP } = require("../utils/otp");
const { sendEmail } = require("../utils/email");

// ================= SEND OTP =================
exports.sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    // Remove old OTP if exists
    await Otp.deleteOne({ email });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.create({
      email,
      otp,
      expiresAt
    });

    await sendEmail(
      email,
      "Your VibeChat OTP",
      `
      <h2>Your OTP is: ${otp}</h2>
      <p>This OTP will expire in 5 minutes.</p>
      `
    );

    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    next(err);
  }
};

// ================= VERIFY OTP =================
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const record = await Otp.findOne({ email, otp });

    if (!record) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Delete OTP after verification
    await Otp.deleteOne({ email });

    res.json({ message: "OTP verified successfully" });

  } catch (err) {
    next(err);
  }
};

// ================= REGISTER =================
exports.register = async (req, res, next) => {
  try {
    const { username, password, email } = req.body;

    // 🔥 OTP check mandatory
    const otpRecord = await Otp.findOne({ email });

    if (otpRecord) {
      return res.status(400).json({ error: "Please verify OTP before registering" });
    }

    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashed
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username
      }
    });

  } catch (err) {
    next(err);
  }
};

// ================= LOGIN =================
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username
      }
    });

  } catch (err) {
    next(err);
  }
};
