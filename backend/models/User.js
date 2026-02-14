const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20
    },

    email: {
      type: String,
      unique: true,
      sparse: true
    },

    password: {
      type: String,
      required: true
    },

    bio: {
      type: String,
      default: ""
    },

    avatar: {
      type: String,
      default: ""
    },

    // ✅ ONLINE SYSTEM
    isOnline: {
      type: Boolean,
      default: false
    },

    lastSeen: {
      type: Date,
      default: null
    },

    socketId: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
