const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  description: {
    type: String,
    required: true,
    maxlength: 300
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount must be positive']
  },
  type: {
    type: String,
    enum: ['logistics', 'marketing', 'venue', 'staff', 'misc'],
    default: 'misc'
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

ExpenseSchema.index({ organizerId: 1, date: -1 });

module.exports = mongoose.model('Expense', ExpenseSchema);