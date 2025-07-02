const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    artistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist',
        required: true
    },
    senderUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient queries
contactSchema.index({ artistId: 1, createdAt: -1 });
contactSchema.index({ senderUserId: 1 });

module.exports = mongoose.model('Contact', contactSchema);