const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      default: null  // null for group messages
    },

    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null  // null for DM messages
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null  // null for group messages
    },

    content: {
      type: String,
      required: true,
      trim: true
    },

    // "sent" = deliver ho gaya server pe
    // "delivered" = receiver ke device pe pahuncha
    // "read" = receiver ne dekh liya (blue ticks)
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent"
    },

    seenAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

messageSchema.index({ chat: 1, createdAt: 1 });
messageSchema.index({ group: 1, createdAt: 1 });

module.exports = mongoose.models.Message || mongoose.model("Message", messageSchema);
