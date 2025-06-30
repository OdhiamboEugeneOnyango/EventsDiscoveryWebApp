// models/Memory.js
const mongoose = require('mongoose');

// models/Memory.js
const memorySchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    eventName: { type: String, required: true },
    eventDate: { type: String, required: true },
    location: { type: String, required: true },
    caption: { type: String, default: '' }, // Added default
    mediaUrl: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: { type: Number, default: 0 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } 
}, {
    timestamps: true
});

module.exports = mongoose.model('Memory', memorySchema);
