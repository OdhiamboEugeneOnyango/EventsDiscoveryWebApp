// models/Artist.js
const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    bio: {
        type: String,
        required: false,
        trim: true
    },
    profilePic: {
        type: String,
        trim: true
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
    //  LINK TO THE USER SCHEMA
    user: {
        type: mongoose.Schema.Types.ObjectId, // Specifies it's a MongoDB ObjectId
        ref: 'User', // Tells Mongoose which model to use for population
        required: true,
        unique: true // Ensures one User can only have one Artist profile
    }
}, {
    timestamps: true
});

// ... virtuals and toJSON/toObject settings ...

module.exports = mongoose.model('Artist', artistSchema);