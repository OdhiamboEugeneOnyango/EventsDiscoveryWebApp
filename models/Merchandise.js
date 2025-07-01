// models/Merchandise.js
const mongoose = require('mongoose');

const merchandiseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    image: {
        type: String, // URL to the merchandise image
        trim: true,
        default: 'https://via.placeholder.com/400x300/CCCCCC/FFFFFF?text=Merch'
    },
    artist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist', // Reference to the Artist model
        required: true
    },
    stock: { // Optional: for inventory management
        type: Number,
        min: 0,
        default: 0
    },
    category: { // Optional: e.g., 'T-Shirt', 'Print', 'Sculpture'
        type: String,
        trim: true
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

module.exports = mongoose.model('Merchandise', merchandiseSchema);