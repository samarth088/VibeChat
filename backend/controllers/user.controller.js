const User = require("../models/User");

// GET ALL USERS
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find(
      { _id: { $ne: req.user.id } },
      "username bio avatar"
    );

    res.json(users);
  } catch (err) {
    next(err);
  }
};

// GET PROFILE
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password");

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
