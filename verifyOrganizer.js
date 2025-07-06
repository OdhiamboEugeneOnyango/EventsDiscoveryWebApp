const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Basic schema if none exists
const VerificationRequest = mongoose.model('OrganizerVerification', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  organizationName: String,
  orgWebsite: String,
  experienceYears: Number,
  motivation: String,
  status: { type: String, default: 'pending' },
  submittedAt: { type: Date, default: Date.now }
}));

// Submit organizer verification request
router.post('/', async (req, res) => {
  try {
    const { userId, organizationName, orgWebsite, experienceYears, motivation } = req.body;

    if (!userId || !organizationName || !experienceYears) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const request = new VerificationRequest({ userId, organizationName, orgWebsite, experienceYears, motivation });
    await request.save();

    res.status(201).json({ success: true, message: 'Verification request submitted' });
  } catch (error) {
    console.error('Organizer verification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;