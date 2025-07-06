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
    logo: {
        type: String,
        trim: true
    },
    contactEmail: {
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
    location: {
        type: String,
        lowercase: true,
        trim: true
    },

    // Link to the User document that owns this organizer profile
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },

    // Notifications settings
    notifications: {
        eventRegistration: { type: Boolean, default: true },
        ticketSales: { type: Boolean, default: true },
        marketingEmails: { type: Boolean, default: false }
    },

    // Payout preferences
    payoutSettings: {
        payoutMethod: {
            type: String,
            enum: ['bank', 'mpesa', 'paypal'],
            default: 'mpesa'
        },
        bankDetails: {
            bankName: String,
            accountName: String,
            accountNumber: String,
            branchCode: String
        },
        mpesaNumber: String,
        paypalEmail: String
    }

}, {
    timestamps: true
});

// Optional: Add a virtual to easily get events organized by this organizer
organizerSchema.virtual('events', {
    ref: 'Event',
    localField: '_id',
    foreignField: 'organizer'
});

organizerSchema.set('toJSON', { virtuals: true });
organizerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Organizer', organizerSchema);