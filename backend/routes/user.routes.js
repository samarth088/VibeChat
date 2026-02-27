// routes/user.routes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');

// Search user by UID (e.g. GET /api/users/search?uid=vibe_a3f9k2)
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { uid } = req.query;

    if (!uid || uid.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Enter a valid UID to search' });
    }

    const user = await User.findOne({ uid: uid.trim() }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'No user found with this UID' });
    }

    // Don't return yourself
    if (user._id.toString() === req.userId.toString()) {
      return res.status(400).json({ success: false, message: "That's your own UID!" });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        uid: user.uid,
        name: user.name,
        avatar: user.avatar,
        status: user.status,
        lastSeen: user.lastSeen,
      },
    });

  } catch (error) {
    console.error('User search error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/users/me — get own profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
