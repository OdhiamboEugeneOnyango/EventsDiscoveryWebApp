// models/Artist.js
const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true // stage name
    },
    bio: {
        type: String,
        trim: true
    },
    genre: {
        type: String,
        trim: true,
        required: true
    },
    profilePic: {
        type: String,
        trim: true
    },
    profileImage: { // optional alias if used in frontend
        type: String,
        trim: true
    },
    website: {
        type: String,
        trim: true
    },
    travelPreference: {
        type: String,
        enum: ['locally', 'nationally', 'internationally'],
        default: 'locally'
    },
    minFee: {
        type: Number,
        default: 0
    },
    performanceRequirements: {
        type: String,
        trim: true
    },
    acceptsBookings: {
        type: Boolean,
        default: true
    },
    requiresDeposit: {
        type: Boolean,
        default: false
    },
    depositPercent: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    social: {
        facebook: { type: String, trim: true },
        instagram: { type: String, trim: true },
        twitter: { type: String, trim: true },
        youtube: { type: String, trim: true }
    },
    merchandise: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Merchandise'
        }
    ],
    artGallery: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ArtGallery'
        }
    ],

    // Link to the User
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    }

}, {
    timestamps: true
});

artistSchema.set('toJSON', { virtuals: true });
artistSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Artist', artistSchema);