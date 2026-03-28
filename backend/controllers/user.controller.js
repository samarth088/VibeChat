const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    content: {
      type: String,
      required: true,
      trim: true
    },

    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent"
    },

    deliveredAt: {
      type: Date,
      default: null
    },

    seenAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

messageSchema.index({ chat: 1, createdAt: 1 });

// UPDATED
module.exports = mongoose.models.Message || mongoose.model("Message", messageSchema);
