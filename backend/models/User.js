// models/User.js
const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Generate a unique UID like: vibe_a3f9k2
 * Short, readable, searchable
 */
function generateUID() {
  return 'vibe_' + crypto.randomBytes(3).toString('hex'); // e.g. vibe_a3f9k2
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
  isVerified: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'away'],
    default: 'offline',
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Ensure UID is always set before save
userSchema.pre('save', function (next) {
  if (!this.uid) {
    this.uid = generateUID();
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
