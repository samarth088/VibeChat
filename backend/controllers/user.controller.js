const User = require("../models/User");

// GET ALL USERS (except current user)
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("-password");
    res.json({ success: true, users });
  } catch (err) { next(err); }
};

// GET MY PROFILE
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

// UPDATE MY PROFILE
exports.updateProfile = async (req, res, next) => {
  try {
    const updates = (({ name, username, bio, avatar }) => ({ name, username, bio, avatar }))(req.body);
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password");
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

// SEARCH USER
exports.searchUser = async (req, res, next) => {
  try {
    const { q } = req.query;
    const users = await User.find({
      $or: [{ username: new RegExp(q, "i") }, { uid: q }],
      _id: { $ne: req.user._id }
    }).select("-password");
    res.json({ success: true, users });
  } catch (err) { next(err); }
};
