const mongoose = require('mongoose');

const forumPostSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    type: {
        type: String,
        enum: ['question', 'discussion', 'announcement'],
        default: 'discussion',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true // adds createdAt and updatedAt
});

module.exports = mongoose.model('ForumPost', forumPostSchema);