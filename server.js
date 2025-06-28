const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const safezoneRoutes = require('./safezonebackend');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

//import models

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(safezoneRoutes);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eventhub';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// User Schema
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
            lastName: this.lastName
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

const User = mongoose.model('User', userSchema);

// Event Schema
const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    venue: { type: String, required: true },
    location: { type: String, required: true },
    capacity: { type: Number, required: true },
    price: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'draft', 'ended'], default: 'active' },
    attendees: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    rating: { type: Number, default: 0 }
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);
module.exports = { Event };

// Validation middleware
const validateSignupData = (req, res, next) => {
    const { firstName, lastName, email, phone, location, password, confirmPassword } = req.body;
    
    // Check required fields
    if (!firstName || !lastName || !email || !phone || !location || !password || !confirmPassword) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required'
        });
    }
    
    // Validate name lengths
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
        return res.status(400).json({
            success: false,
            message: 'First name and last name must be at least 2 characters long'
        });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Please enter a valid email address'
        });
    }
    
    // Validate phone format
    const phoneRegex = /^(\+254|0)[17]\d{8}$/;
    if (!phoneRegex.test(phone)) {
        return res.status(400).json({
            success: false,
            message: 'Please enter a valid Kenyan phone number'
        });
    }
    
    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 8 characters with uppercase, lowercase, number and special character'
        });
    }
    
    // Validate password confirmation
    if (password !== confirmPassword) {
        return res.status(400).json({
            success: false,
            message: 'Passwords do not match'
        });
    }
    
    next();
};

const validateLoginData = (req, res, next) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Please enter a valid email address'
        });
    }
    
    next();
};

// Routes

// Signup Route
app.post('/api/auth/signup', validateSignupData, async (req, res) => {
    try {
        const { firstName, lastName, email, phone, location, password, interests, newsletter } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email: email.toLowerCase() }, { phone }] 
        });
        
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: existingUser.email === email.toLowerCase() 
                    ? 'An account with this email already exists' 
                    : 'An account with this phone number already exists'
            });
        }
        
        // Create new user
        const newUser = new User({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            location: location.toLowerCase(),
            password,
            interests: interests || [],
            newsletter: newsletter || false
        });
        
        await newUser.save();
        
        // Generate token
        const token = newUser.generateAuthToken();
        
        // Remove password from response
        const userResponse = {
            id: newUser._id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            phone: newUser.phone,
            location: newUser.location,
            interests: newUser.interests,
            newsletter: newUser.newsletter,
            createdAt: newUser.createdAt
        };
        
        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            user: userResponse,
            token
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error: ' + validationErrors.join(', ')
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});

// Login Route
app.post('/api/auth/login', validateLoginData, async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account has been deactivated. Please contact support.'
            });
        }
        
        // Compare password
        const isPasswordValid = await user.comparePassword(password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        
        // Generate token
        const token = user.generateAuthToken();
        
        // Remove password from response
        const userResponse = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            location: user.location,
            interests: user.interests,
            newsletter: user.newsletter,
            lastLogin: user.lastLogin
        };
        
        res.json({
            success: true,
            message: 'Login successful',
            user: userResponse,
            token
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});

// Get all events
app.get('/api/events', async (req, res) => {
    try {
        const events = await Event.find({ status: 'active' }).sort({ date: 1 });

        // Map title ➝ name for the dropdown
        const mappedEvents = events.map(event => ({
            _id: event._id,
            name: event.title
        }));

        res.json({ success: true, events: mappedEvents });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch events' });
    }
});

// Create event
app.post('/api/events', async (req, res) => {
    try {
        const event = new Event(req.body);
        await event.save();
        res.status(201).json({ success: true, event });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Update event
app.put('/api/events/:id', async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
        res.json({ success: true, event });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Delete event
app.delete('/api/events/:id', async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
        res.json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Enhanced validation middleware for profile updates
const validateProfileData = (req, res, next) => {
    const { firstName, lastName, email, phone, location, interests, newsletter } = req.body;
    
    console.log('Validating profile data:', req.body);
    
    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !location) {
        return res.status(400).json({
            success: false,
            message: 'All required fields must be provided: firstName, lastName, email, phone, location'
        });
    }
    
    // Validate field lengths
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
        return res.status(400).json({
            success: false,
            message: 'First name and last name must be at least 2 characters long'
        });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a valid email address'
        });
    }
    
    // Validate phone format (Kenyan numbers)
    const phoneRegex = /^(\+254|0)[17]\d{8}$/;
    if (!phoneRegex.test(phone)) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a valid Kenyan phone number'
        });
    }
    
    // Validate location
    const validLocations = ['nairobi', 'mombasa', 'kisumu', 'nakuru', 'eldoret', 'thika', 'other'];
    if (!validLocations.includes(location.toLowerCase())) {
        return res.status(400).json({
            success: false,
            message: 'Please select a valid location'
        });
    }
    
    // Validate interests array
    if (interests && !Array.isArray(interests)) {
        return res.status(400).json({
            success: false,
            message: 'Interests must be an array'
        });
    }
    
    // Validate interests values
    const validInterests = ['music', 'sports', 'arts', 'food', 'tech', 'business', 'health', 'education'];
    if (interests && interests.length > 0) {
        const invalidInterests = interests.filter(interest => !validInterests.includes(interest));
        if (invalidInterests.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid interests: ${invalidInterests.join(', ')}`
            });
        }
    }
    
    next();
};

// Get User Profile Route (Protected)
app.get('/api/auth/profile', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            user
        });
        
    } catch (error) {
        console.error('Profile error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error occurred'
        });
    }
});

// Update User Profile Route (Protected) - NOW WITH EMAIL SUPPORT
app.put('/api/auth/profile', validateProfileData, async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const { firstName, lastName, email, phone, location, interests, newsletter, bio, dateOfBirth } = req.body;
        
        console.log('Profile update request:', {
            userId: decoded.userId,
            firstName,
            lastName,
            email,
            phone,
            location,
            interests,
            newsletter,
            bio,
            dateOfBirth
        });
        
        // Check if email is being changed and if it's already in use
        const existingUser = await User.findById(decoded.userId);
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // If email is being changed, check if it's already in use by another user
        if (email.toLowerCase() !== existingUser.email.toLowerCase()) {
            const emailExists = await User.findOne({ 
                email: email.toLowerCase(),
                _id: { $ne: decoded.userId } // Exclude current user
            });
            
            if (emailExists) {
                return res.status(409).json({
                    success: false,
                    message: 'Email address is already in use by another account'
                });
            }
        }
        
        // Prepare update data
        const updateData = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            location: location.toLowerCase(),
            interests: interests || [],
            newsletter: newsletter || false
        };
        
        // Add optional fields if provided
        if (bio !== undefined) {
            updateData.bio = bio.trim();
        }
        
        if (dateOfBirth !== undefined && dateOfBirth !== '') {
            updateData.dateOfBirth = dateOfBirth;
        }
        
        console.log('Update data prepared:', updateData);
        
        const updatedUser = await User.findByIdAndUpdate(
            decoded.userId,
            updateData,
            { 
                new: true, 
                runValidators: true,
                context: 'query' // Important for mongoose validators
            }
        ).select('-password');
        
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        console.log('Profile updated successfully:', updatedUser);
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser
        });
        
    } catch (error) {
        console.error('Profile update error:', error);
        
        if (error.name === 'ValidationError') {
            console.error('Validation errors:', error.errors);
            const validationErrors = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error: ' + validationErrors.join(', ')
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        
        if (error.code === 11000) {
            // MongoDB duplicate key error
            console.error('Duplicate key error:', error);
            return res.status(409).json({
                success: false,
                message: 'Email address is already in use'
            });
        }
        
        // Generic server error
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});

// Additional helper route to check email availability
app.post('/api/auth/check-email', async (req, res) => {
    try {
        const { email } = req.body;
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }
        
        // If user is logged in, exclude their current email from the check
        let excludeUserId = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                excludeUserId = decoded.userId;
            } catch (error) {
                // Token invalid, but we can still check email availability
                console.log('Invalid token for email check, proceeding without exclusion');
            }
        }
        
        const query = { email: email.toLowerCase() };
        if (excludeUserId) {
            query._id = { $ne: excludeUserId };
        }
        
        const existingUser = await User.findOne(query);
        
        res.json({
            success: true,
            available: !existingUser,
            message: existingUser ? 'Email is already in use' : 'Email is available'
        });
        
    } catch (error) {
        console.error('Email check error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred'
        });
    }
});

// Enhanced error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error occurred',
            errors: Object.values(error.errors).map(e => e.message)
        });
    }
    
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid authentication token'
        });
    }
    
    if (error.name === 'MongoError' && error.code === 11000) {
        return res.status(409).json({
            success: false,
            message: 'Duplicate data error'
        });
    }
    
    // Generic error response
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});
// Health Check Route
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Serve static files (your HTML, CSS, JS)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Import and use the memories backend
require('./memoriesbackend')(app);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Start the server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit: http://localhost:${PORT}`);
});

module.exports = { Event };