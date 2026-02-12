const User = require("../models/User");

const createUser = async ({ username, password }) => {
  return await User.create({ username, password });
};

const findUserByUsername = async (username) => {
  return await User.findOne({ username });
};

const findUserById = async (id) => {
  return await User.findById(id).select("-password");
};

const getAllUsers = async (currentUserId) => {
  return await User.find({ _id: { $ne: currentUserId } })
    .select("-password");
};

const updateUserProfile = async (userId, data) => {
  return await User.findByIdAndUpdate(
    userId,
    data,
    { new: true }
  ).select("-password");
};

module.exports = {
  createUser,
  findUserByUsername,
  findUserById,
  getAllUsers,
  updateUserProfile
};
