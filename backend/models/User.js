const mongoose = require("mongoose");
const crypto = require("crypto");

// Game-style UID: VIBE-4729
function generateUID() {
  const num = Math.floor(10000 + Math.random() * 90000); // 5-digit: 10000-99999
  return "VIBE-" + num;
}

const userSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      unique: true,
      index: true,
      default: generateUID
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      index: true,
      default: null
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      minlength: 6
    },

    avatar: {
      type: String,
      default: ""
    },

    bio: {
      type: String,
      default: ""
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: ["online", "offline", "away"],
      default: "offline"
    },

    isOnline: {
      type: Boolean,
      default: false
    },

    socketId: {
      type: String,
      default: null
    },

    lastSeen: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

userSchema.pre("validate", function (next) {
  if (!this.uid) {
    this.uid = generateUID();
  }

  if (this.username) {
    this.username = String(this.username).trim().toLowerCase();
  }

  if (this.avatar == null) this.avatar = "";
  if (this.bio == null) this.bio = "";

  next();
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
