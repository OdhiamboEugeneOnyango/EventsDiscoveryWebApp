const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Basic schema if none exists
const VerificationRequest = mongoose.model('ArtistVerification', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  stageName: String,
  genre: String,
  portfolioLink: String,
  bio: String,
  status: { type: String, default: 'pending' }, // pending | approved | rejected
  submittedAt: { type: Date, default: Date.now }
}));

// Submit artist verification request
router.post('/', async (req, res) => {
  try {
    const { userId, stageName, genre, portfolioLink, bio } = req.body;

    if (!userId || !stageName || !genre) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const request = new VerificationRequest({ userId, stageName, genre, portfolioLink, bio });
    await request.save();

    res.status(201).json({ success: true, message: 'Verification request submitted' });
  } catch (error) {
    console.error('Artist verification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;