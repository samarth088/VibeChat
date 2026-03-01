// models/User.js
const mongoose = require('mongoose');
const crypto = require('crypto');

function generateUID() {
  return 'vibe_' + crypto.randomBytes(3).toString('hex');
}

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    unique: true,
    default: generateUID,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  // ✅ FIX 1: username field add ki — model mein thi hi nahi
  username: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  avatar: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: '',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'away'],
    default: 'offline',
  },
  // ✅ FIX 2: isOnline + socketId add ki — chat.socket.js use kar raha tha, model mein nahi thi
  isOnline: {
    type: Boolean,
    default: false,
  },
  socketId: {
    type: String,
    default: null,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

userSchema.pre('save', function (next) {
  if (!this.uid) {
    this.uid = generateUID();
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
