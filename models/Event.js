// models/Event.js
const mongoose = require('mongoose');

// Event Schema
const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    venue: { type: String, required: true },
    location: { type: String, required: true },
    capacity: { type: Number, required: true },
    price: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'draft', 'ended'], default: 'active' },
    attendees: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    rating: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);