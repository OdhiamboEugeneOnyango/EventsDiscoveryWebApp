// models/Memory.js
const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    eventName: { type: String, required: true },
    eventDate: { type: String, required: true },
    location: { type: String, required: true },
    caption: { type: String },
    mediaUrl: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    comments: { type: Number, default: 0 }
}, {
    timestamps: true
});

module.exports = mongoose.model('Memory', memorySchema);
