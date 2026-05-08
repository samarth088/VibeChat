// utils/jwt.js
const jwt = require("jsonwebtoken");

// ✅ FIX: userId directly leta hai — pehle object { userId } pass hota tha
// auth.controller.js → generateToken(user._id) → sign({ id: user._id })
// auth.middleware.js → decoded.id → User.findById(decoded.id) ✅
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken
};

