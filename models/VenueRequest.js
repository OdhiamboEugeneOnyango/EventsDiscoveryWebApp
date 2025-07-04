const mongoose = require('mongoose');

const venueRequestSchema = new mongoose.Schema({
    venueName: {
        type: String,
        required: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Event'
    },
    organizerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Organizer'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('VenueRequest', venueRequestSchema);
