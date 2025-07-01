// models/Organizer.js
const mongoose = require('mongoose');

const organizerSchema = new mongoose.Schema({
    organizationName: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        trim: true
    },
    website: {
        type: String,
        trim: true
    },
    contactEmail: { // Specific email for event inquiries, might differ from user's login email
        type: String,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
    },
    contactPhone: {
        type: String,
        trim: true,
        match: [/^(\+254|0)[17]\d{8}$/, 'Please enter a valid Kenyan phone number']
    },
    // Link to the User document that owns this organizer profile
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // A user can only have one organizer profile
    },
    // Other organizer-specific fields, e.g.,
    // businessRegistrationNumber: String,
    // paymentDetails: {
    //     bankName: String,
    //     accountNumber: String,
    //     // ...
    // },
    // eventsOrganized: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }] // Virtual or direct reference
}, {
    timestamps: true
});

// Optional: Add a virtual to easily get events organized by this organizer
organizerSchema.virtual('events', {
    ref: 'Event',
    localField: '_id',
    foreignField: 'organizer' // Assuming EventSchema has an 'organizer' field referencing this model
});

organizerSchema.set('toJSON', { virtuals: true });
organizerSchema.set('toObject', { virtuals: true });


module.exports = mongoose.model('Organizer', organizerSchema);