// User Schema
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
    },
    role: {
        type: String,
        required: true,
        enum: ['user', 'organizer', 'artist', 'admin'],
        default: 'user'
    },
    phone: {
        type: String,
        required: true,
        match: [/^(\+254|0)[17]\d{8}$/, 'Please enter a valid Kenyan phone number']
    },
    location: {
        type: String,
        required: true,
        enum: ['nairobi', 'mombasa', 'kisumu', 'nakuru', 'eldoret', 'thika', 'other']
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    interests: [{
        type: String,
        enum: ['music', 'sports', 'arts', 'food', 'tech', 'business', 'health', 'education']
    }],
    newsletter: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
     
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        { 
            userId: this._id, 
            email: this.email,
            firstName: this.firstName,
            lastName: this.lastName,
            role: this.role
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

module.exports = mongoose.model('User', userSchema);