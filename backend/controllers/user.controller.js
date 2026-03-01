const User = require("../models/User");

// GET ALL USERS
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find(
      { _id: { $ne: req.user.id } },
      "username name bio avatar uid"
    );
    res.json(users);
  } catch (err) {
    next(err);
  }
};

// GET PROFILE
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// UPDATE PROFILE
exports.updateProfile = async (req, res, next) => {
  try {
    const { bio, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { bio, avatar },
      { new: true }
    ).select("-password");
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// SEARCH USER BY UID or USERNAME
// GET /users/search?uid=vibe_a3f9k2
// GET /users/search?uid=tanuu
// ─────────────────────────────────────────────
exports.searchUser = async (req, res, next) => {
  try {
    const { uid } = req.query;

    if (!uid || !uid.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const query = uid.trim().toLowerCase();

    // Search by uid OR username (case-insensitive)
    const user = await User.findOne({
      $or: [
        { uid: query },
        { username: query },
      ],
      _id: { $ne: req.user.id }, // exclude self
    }).select("id name username uid avatar status");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id:       user._id,
        uid:      user.uid,
        name:     user.name,
        username: user.username,
        avatar:   user.avatar,
        online:   user.status === "online",
      },
    });
  } catch (err) {
    next(err);
  }
};
