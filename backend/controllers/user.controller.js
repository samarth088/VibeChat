
const User = require("../models/User");

function isValidAvatar(value) {
  if (!value) return true;

  return (
    /^https?:\/\//i.test(value) ||
    /^data:image\/[a-zA-Z+]+;base64,/.test(value) ||
    value.startsWith("/")
  );
}

function sanitizeString(value) {
  return String(value || "").trim();
}

// GET ALL USERS
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find(
      { _id: { $ne: req.user._id } },
      "username name bio avatar uid status isOnline lastSeen"
    ).sort({ name: 1, username: 1 });

    res.json({
      success: true,
      users
    });
  } catch (err) {
    next(err);
  }
};

// GET MY PROFILE
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (err) {
    next(err);
  }
};

// UPDATE PROFILE
exports.updateProfile = async (req, res, next) => {
  try {
    const updates = {};
    const body = req.body || {};

    // UPDATED
    if (Object.prototype.hasOwnProperty.call(body, "name")) {
      const name = sanitizeString(body.name);

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Name is required"
        });
      }

      if (name.length > 60) {
        return res.status(400).json({
          success: false,
          message: "Name is too long"
        });
      }

      updates.name = name;
    }

    // UPDATED
    if (Object.prototype.hasOwnProperty.call(body, "username")) {
      const username = sanitizeString(body.username).toLowerCase();

      if (!username) {
        return res.status(400).json({
          success: false,
          message: "Username is required"
        });
      }

      if (!/^[a-z0-9_.]{3,30}$/.test(username)) {
        return res.status(400).json({
          success: false,
          message: "Username must be 3-30 chars and only letters, numbers, _ or ."
        });
      }

      const existing = await User.findOne({
        username,
        _id: { $ne: req.user._id }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Username already taken"
        });
      }

      updates.username = username;
    }

    // UPDATED
    if (Object.prototype.hasOwnProperty.call(body, "bio")) {
      const bio = String(body.bio || "").trim();

      if (bio.length > 180) {
        return res.status(400).json({
          success: false,
          message: "Bio is too long"
        });
      }

      updates.bio = bio;
    }

    // UPDATED
    if (Object.prototype.hasOwnProperty.call(body, "avatar")) {
      const avatar = String(body.avatar || "").trim();

      if (!isValidAvatar(avatar)) {
        return res.status(400).json({
          success: false,
          message: "Avatar must be a valid image URL or base64 image"
        });
      }

      updates.avatar = avatar;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      success: true,
      user
    });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate value found. Username or email already exists."
      });
    }

    next(err);
  }
};

// SEARCH USER
exports.searchUser = async (req, res, next) => {
  try {
    const uid = sanitizeString(req.query.uid);

    if (!uid) {
      return res.status(400).json({
        success: false,
        message: "Search query required"
      });
    }

    const query = uid.toLowerCase();

    const user = await User.findOne({
      $or: [
        { uid: query },
        { username: query }
      ],
      _id: { $ne: req.user._id }
    }).select("_id uid name username avatar bio isOnline lastSeen status");

    if (!user) {
      return res.json({
        success: false
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        uid: user.uid,
        name: user.name,
        username: user.username,
        avatar: user.avatar || "",
        bio: user.bio || "",
        isOnline: !!user.isOnline,
        lastSeen: user.lastSeen || null
      }
    });
  } catch (err) {
    next(err);
  }
};
