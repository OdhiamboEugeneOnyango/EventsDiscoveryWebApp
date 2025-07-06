const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema({
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Payout amount must be positive']
  },
  method: {
    type: String,
    enum: ['bank', 'mpesa', 'paypal'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  details: {
    type: Object, // Optional: structured details like account name, bank, etc.
    default: {}
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  }
}, { timestamps: true });

PayoutSchema.index({ organizerId: 1, createdAt: -1 });

module.exports = mongoose.model('Payout', PayoutSchema);