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

    // Remove old OTP
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

// ================= VERIFY OTP + SIGNUP =================
exports.verifyOtpAndSignup = async (req, res, next) => {
  try {
    const { email, otp, username, password } = req.body;

    // 1️⃣ Check OTP
    const record = await Otp.findOne({ email, otp });

    if (!record) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // 2️⃣ Delete OTP after verification
    await Otp.deleteOne({ email });

    // 3️⃣ Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // 4️⃣ Check if username exists
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

    res.status(201).json({
      user: {
        id: user._id,
        username: user.username
      },
      token
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
      user: {
        id: user._id,
        username: user.username
      },
      token
    });

  } catch (err) {
    next(err);
  }
};
