// UPDATED
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
  // ✅ ADDED: username field
  username: {
    type: String,
    unique: true,
    sparse: true,
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
  // ✅ ADDED: avatar (url or base64)
  avatar: {
    type: String,
    default: '',
  },
  // ✅ ADDED: bio
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
  // ✅ ADDED: isOnline + socketId + lastSeen
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
    default: null,
  },
}, { timestamps: true });

userSchema.pre('save', function (next) {
  if (!this.uid) {
    this.uid = generateUID();
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
