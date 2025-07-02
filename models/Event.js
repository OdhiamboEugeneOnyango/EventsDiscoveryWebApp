// This file defines the Event model schema for a MongoDB database using Mongoose.
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['music', 'sports', 'arts', 'food', 'tech', 'business']
    },
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true
    },
    time: {
        type: String, // Format: HH:MM AM/PM
        required: true
    },
    venue: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true,
        enum: ['nairobi', 'mombasa', 'kisumu', 'nakuru']
    },
    organizer: {
        type: String,
        required: true
    },
    price: {
        type: String, // Can be "Free" or "KSH X"
        default: 'Free'
    },
    tickets: {
        general: {
            price: {
                type: Number,
                default: 0
            },
            available: {
                type: Number,
                default: 100
            }
        }
    },
    icon: {
        type: String,
        default: '🎉'
    },
    safetyRating: {
        type: Number,
        min: 1,
        max: 5,
        default: 5
    },
    attendees: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'cancelled', 'completed'],
        default: 'active'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);