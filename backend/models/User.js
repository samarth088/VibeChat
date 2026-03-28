const mongoose = require("mongoose");
const crypto = require("crypto");

function generateUID() {
  return "vibe_" + crypto.randomBytes(3).toString("hex");
}

const userSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      unique: true,
      index: true,
      default: generateUID
    },

    // ADDED
    name: {
      type: String,
      required: true,
      trim: true
    },

    // ADDED
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

    // ADDED
    avatar: {
      type: String,
      default: ""
    },

    // ADDED
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

    // ADDED
    isOnline: {
      type: Boolean,
      default: false
    },

    // ADDED
    socketId: {
      type: String,
      default: null
    },

    // ADDED
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

  if (this.avatar == null) {
    this.avatar = "";
  }

  if (this.bio == null) {
    this.bio = "";
  }

  next();
});

module.exports = mongoose.model("User", userSchema);
