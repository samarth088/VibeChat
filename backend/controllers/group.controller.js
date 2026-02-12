const Group = require("../models/Group");
const Message = require("../models/Message");

// CREATE GROUP
exports.createGroup = async (req, res, next) => {
  try {
    const { name, members } = req.body;

    const group = await Group.create({
      name,
      admin: req.user.id,
      members: [req.user.id, ...members]
    });

    res.status(201).json(group);
  } catch (err) {
    next(err);
  }
};

// GET USER GROUPS
exports.getUserGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({
      members: req.user.id
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
