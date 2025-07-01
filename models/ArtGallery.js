// models/ArtGallery.js
const mongoose = require('mongoose');

const artGallerySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    image: {
        type: String, // URL to the art piece image
        trim: true,
        required: true
    },
    artist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist', // Reference to the Artist model
        required: true
    },
    yearCreated: { // Optional
        type: Number
    },
    medium: { // Optional: e.g., 'Oil on Canvas', 'Digital', 'Sculpture'
        type: String,
        trim: true
    },
    dimensions: { // Optional: e.g., '24x36 inches'
        type: String,
        trim: true
    },
    isForSale: { // Optional: if art pieces can be bought
        type: Boolean,
        default: false
    },
    price: { // Optional: if isForSale is true
        type: Number,
        min: 0,
        required: function() { return this.isForSale; } // Only required if isForSale is true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});


module.exports = mongoose.model('ArtGallery', artGallerySchema);