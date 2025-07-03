const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
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
    coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    price: {
        type: Number,
        default: 0
    },
    ticketTypes: [
        {
            type: {
                type: String,
                required: true
            },
            price: {
                type: Number,
                required: true
            }
        }
    ],
    capacity: {
        type: Number,
        required: true
    },
    attendees: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviews: {
        type: Number,
        default: 0
    },
    safetyRating: {
        type: Number,
        min: 1,
        max: 5,
        default: 5
    },
    organizer: {
        type: String,
        required: true
    },
    organizerBio: {
        type: String,
        default: ''
    },
    icon: {
        type: String,
        default: '🎉'
    },
    image: {
        type: String,
        required: true
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
