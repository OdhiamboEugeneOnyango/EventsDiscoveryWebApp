const mongoose = require('mongoose');

const RefundSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Refund amount must be positive']
  },
  reason: {
    type: String,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processed'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  }
}, { timestamps: true });

RefundSchema.index({ userId: 1, eventId: 1 });

module.exports = mongoose.model('Refund', RefundSchema);