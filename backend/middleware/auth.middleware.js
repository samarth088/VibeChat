// middleware/auth.middleware.js
// FIX: "Bearer eyJ..." se "Bearer " properly strip hota hai
//      Pehle poori string verify hoti thi → jwt.verify fail → 401

const jwt  = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized. No token provided."
      });
    }

    // Strip "Bearer " prefix if present
    let token = authHeader;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized. Token is empty."
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found. Token may be stale."
      });
    }

    req.user = user;
    next();

  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token. Please login again."
    });
  }
};

// Named export — routes use { protect }
module.exports = { protect };
