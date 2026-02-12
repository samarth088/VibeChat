const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat"
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group"
    },

    content: {
      type: String,
      required: true
    },

    type: {
      type: String,
      enum: ["text", "image", "video", "file"],
      default: "text"
    },

    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent"
    },

    seenAt: Date,
    deliveredAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
