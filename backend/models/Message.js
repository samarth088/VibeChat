const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true
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

    // ================= STATUS SYSTEM =================
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
    },

    // ================= EDIT SYSTEM =================
    isEdited: {
      type: Boolean,
      default: false
    },

    editedAt: {
      type: Date,
      default: null
    },

    // ================= DELETE SYSTEM =================
    isDeletedForEveryone: {
      type: Boolean,
      default: false
    },

    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    // ================= REACTION SYSTEM =================
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        emoji: String
      }
    ]
  },
  {
    timestamps: true
  }
);

// ================= INDEXES =================
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ receiver: 1 });

module.exports = mongoose.model("Message", messageSchema);
