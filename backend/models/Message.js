const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
    ],

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null
    },

    // ADDED
    lastMessageAt: {
      type: Date,
      default: null,
      index: true
    },

    unreadCounts: {
      type: Map,
      of: Number,
      default: {}
    }
  },
  { timestamps: true }
);

chatSchema.index({ members: 1 });
chatSchema.index({ lastMessageAt: -1, updatedAt: -1 });

// UPDATED
module.exports = mongoose.models.Chat || mongoose.model("Chat", chatSchema);
