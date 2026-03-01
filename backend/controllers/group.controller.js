const Group = require("../models/Group");
const Message = require("../models/Message");

// CREATE GROUP
exports.createGroup = async (req, res, next) => {
  try {

    const currentUserId = req.user._id; // ✅ FIX
    const { name, members } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Group name required" });
    }

    const group = await Group.create({
      name,
      admin: currentUserId,
      members: [currentUserId, ...(members || [])]
    });

    res.status(201).json(group);

  } catch (err) {
    next(err);
  }
};


// GET USER GROUPS
exports.getUserGroups = async (req, res, next) => {
  try {

    const currentUserId = req.user._id; // ✅ FIX

    const groups = await Group.find({
      members: currentUserId
    });

    res.json(groups);

  } catch (err) {
    next(err);
  }
};


// GET GROUP MESSAGES
exports.getGroupMessages = async (req, res, next) => {
  try {

    const messages = await Message.find({
      group: req.params.groupId
    }).sort({ createdAt: 1 });

    res.json(messages);

  } catch (err) {
    next(err);
  }
};
