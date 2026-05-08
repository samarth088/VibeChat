// services/user.service.js
const User = require("../models/User");

// ✅ FIX: createUser ab saare fields leta hai — pehle sirf username+password tha
const createUser = async ({ name, username, email, password }) => {
  return await User.create({ name, username, email, password });
};

const findUserByUsername = async (username) => {
  return await User.findOne({ username: username.toLowerCase().trim() });
};

const findUserByEmail = async (email) => {
  return await User.findOne({ email: email.toLowerCase().trim() });
};

const findUserById = async (id) => {
  return await User.findById(id).select("-password");
};

const getAllUsers = async (currentUserId) => {
  return await User.find({ _id: { $ne: currentUserId } }).select("-password");
};

const updateUserProfile = async (userId, data) => {
  return await User.findByIdAndUpdate(userId, data, { new: true }).select("-password");
};

const findUserByUid = async (uid) => {
  return await User.findOne({ uid }).select("-password");
};

module.exports = {
  createUser,
  findUserByUsername,
  findUserByEmail,
  findUserById,
  getAllUsers,
  updateUserProfile,
  findUserByUid,
};

