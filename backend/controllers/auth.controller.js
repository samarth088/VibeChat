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
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

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
    console.error("SEND OTP ERROR:", err);
    next(err);
  }
};

// ================= VERIFY OTP + SIGNUP =================
exports.verifyOtpAndSignup = async (req, res, next) => {
  try {
    const { email, otp, username, password } = req.body;

    if (!email || !otp || !username || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // 1️⃣ Find OTP
    const record = await Otp.findOne({ email, otp });

    if (!record) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // 2️⃣ Expiry check
    if (record.expiresAt < new Date()) {
      await Otp.deleteOne({ email });
      return res.status(400).json({ error: "OTP expired" });
    }

    // 3️⃣ Delete OTP after verification
    await Otp.deleteOne({ email });

    // 4️⃣ Check duplicates
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ error: "Username already taken" });
    }

    // 5️⃣ Create user
    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashed
    });

    const token = generateToken(user._id);

    // ✅ FRONTEND COMPATIBLE RESPONSE
    res.status(201).json({
      userId: user._id,
      username: user.username,
      token,
      profile: {
        bio: "🚀 Living on vibes. Connect with me on VibeChat!"
      }
    });

  } catch (err) {
    console.error("VERIFY OTP SIGNUP ERROR:", err);
    next(err);
  }
};

// ================= LOGIN =================
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    // ✅ SAME STRUCTURE AS SIGNUP
    res.json({
      userId: user._id,
      username: user.username,
      token,
      profile: {
        bio: "🚀 Living on vibes. Connect with me on VibeChat!"
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    next(err);
  }
};
