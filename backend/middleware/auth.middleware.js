// middleware/auth.middleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ success: false, error: "Unauthorized. No token." });
    }

    // ✅ FIX: "Bearer eyJ..." se "Bearer " strip karo
    // Pehle poori string verify hoti thi → jwt.verify fail → 401
    let token = authHeader;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ success: false, error: "User not found" });
    }

    req.user = user;
    next();

  } catch (err) {
    return res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
};

// ✅ Named export "protect" — user.routes.js mein { protect } se import hota hai
module.exports = { protect };

