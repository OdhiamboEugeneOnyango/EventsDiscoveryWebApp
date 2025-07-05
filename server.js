const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const eventsRoutes = require('./eventsbackend');
const memoriesBackend = require('./memoriesbackend');
const safezoneRoutes = require('./safezonebackend');
const organizerRoutes = require('./organizerbackend');
const artistRoutes = require('./artistbackend');
const vibespaceRoutes = require('./vibespacebackend');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

//import models
const User = require('./models/User');
const Artist = require('./models/Artist');
const Organizer = require('./models/Organizer');    
const Memory = require('./models/Memory');
const Event = require('./models/Event');
const Merchandise = require('./models/Merchandise');
const ArtGallery = require('./models/ArtGallery');
const ForumPost = require('./models/ForumPost'); 
const Contact = require('./models/Contact'); 
const Ticket = require('./models/Ticket');
const Payment = require('./models/Payment');
const app = express();
memoriesBackend(app); // Initialize memories backend routes



// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(safezoneRoutes);
app.use(artistRoutes);
app.use(organizerRoutes);
app.use(vibespaceRoutes);
app.use(eventsRoutes); // Use event backend routes

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eventhub';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const adminInviteCodeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        match: [/^[A-Z0-9]{8}-[A-Z0-9]{4}-[A-Z0-9]{4}$/, 'Invalid invite code format']
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    usedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    usedAt: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const AdminInviteCode = mongoose.model('AdminInviteCode', adminInviteCodeSchema);

// Validation middleware
const validateSignupData = async (req, res, next) => {
    const { firstName, lastName, email, phone, location, password, confirmPassword, role, adminInviteCode } = req.body;
    
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
    
    const validRoles = ['user', 'organizer', 'artist', 'admin'];
    if (role && !validRoles.includes(role)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid role selected'
        });
    }
    
    // Validate admin invite code if role is admin
    if (role === 'admin' && !adminInviteCode) {
        return res.status(400).json({
            success: false,
            message: 'Admin invitation code is required for admin accounts'
        });
    }
    
    if (adminInviteCode) {
        const adminCodeRegex = /^[A-Z0-9]{8}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
        if (!adminCodeRegex.test(adminInviteCode)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid admin invitation code format'
            });
        }
              
        }
        
    next();
};

const validateLoginData = (req, res, next) => {
    const { email, password, role } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email, password, and role are required'
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Please enter a valid email address'
        });
    }

    const allowedRoles = ['user', 'organizer', 'artist', 'admin'];
    if (!allowedRoles.includes(role)) {
        return res.status(400).json({
            success: false,
            message: `Invalid role. Allowed roles are: ${allowedRoles.join(', ')}`
        });
    }

    next();
};


// Routes

// Signup Route
app.post('/api/auth/signup', validateSignupData, async (req, res) => {
    try {
        const { firstName, lastName, email, phone, location, role, password, interests, newsletter, adminInviteCode } = req.body;
        
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
        
         // Validate admin invite code if role is admin
        if (role === 'admin') {
            if (!adminInviteCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Admin invitation code is required'
                });
            }
        
            const inviteCode = await AdminInviteCode.findOne({ 
                code: adminInviteCode,
                isUsed: false 
            });

            if (!inviteCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired admin invitation code'
                });
            }
            // Mark invite code as used
            inviteCode.isUsed = true;
            inviteCode.usedAt = new Date();
            await inviteCode.save();
        }
        
        // Create new user
        const newUser = new User({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            location: location.toLowerCase(),
            password,
            role: role || 'user',
            interests: interests || [],
            newsletter: newsletter || false
        });
        
        await newUser.save();


         // Create role-specific profiles based on user role
        let roleProfile = null;
        
        try {
            switch (role) {
                case 'organizer':
                    // Check if organizer profile already exists
                    const existingOrganizer = await Organizer.findOne({ user: newUser._id });
                    if (!existingOrganizer) {
                        const newOrganizer = new Organizer({
                            organizationName: `${newUser.firstName} ${newUser.lastName} Events`, // unique name
                            user: newUser._id,
                            description: '',
                            website: '',
                            contactEmail: newUser.email, // uses the email from signup
                            contactPhone: newUser.phone // matches Kenyan phone format validation
                        });

                        roleProfile = await newOrganizer.save();
                        console.log('Organizer profile created:', roleProfile._id);
                    }
                    break;
                    
                case 'artist':
                        const baseName = `${newUser.firstName} ${newUser.lastName}`;
                        let artistName = baseName;

                        // Check if artist name already exists
                        const existingName = await Artist.findOne({ name: artistName });
                        if (existingName) {
                            artistName += ' ' + newUser._id.toString().slice(-4);  // Make it unique
                        }

                        // Check if artist profile already exists for this user
                        const existingArtist = await Artist.findOne({ user: newUser._id });
                        if (!existingArtist) {
                            const newArtist = new Artist({
                                name: artistName, // ✅ now uses the resolved unique name
                                bio: '',
                                profilePic: '',
                                social: {
                                    facebook: '',
                                    instagram: '',
                                    twitter: '',
                                    youtube: ''
                                },
                                merchandise: [],
                                artGallery: [],
                                user: newUser._id
                            });

                            roleProfile = await newArtist.save();
                            console.log('Artist profile created:', roleProfile._id);
                        }
                        break;

                    
                case 'admin':
                    // Check if admin profile already exists
                    const existingAdmin = await Admin.findOne({ user: newUser._id });
                    if (!existingAdmin) {
                        const newAdmin = new Admin({
                            user: newUser._id,
                            // Add other default fields based on your Admin schema
                            permissions: [
                                'manage_users',
                                'manage_events',
                                'manage_content',
                                'generate_reports',
                                'system_settings'
                            ],
                            department: 'General',
                            accessLevel: 'full',
                            lastActivity: new Date(),
                            isActive: true
                        });
                        roleProfile = await newAdmin.save();
                        console.log('Admin profile created:', roleProfile._id);
                    }
                    
                    // Update invite code with user reference
                    await AdminInviteCode.findOneAndUpdate(
                        { code: adminInviteCode },
                        { usedBy: newUser._id }
                    );
                    break;
                    
                case 'user':
                default:
                    // For regular users, no additional profile needed
                    // The User document itself contains all necessary information
                    console.log('Regular user created, no additional profile needed');
                    break;
            }
        } catch (profileError) {
            console.error(`Error creating ${role} profile:`, profileError);
            // If profile creation fails, we might want to delete the user
            // Or continue without the profile and handle it later
            console.warn(`${role} profile creation failed, but user account was created successfully`);
        }

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
            role: newUser.role,
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

const requireAuth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = {
            userId: decoded.userId, // ✅ ensures consistency
            role: decoded.role      // ✅ if needed for role-based checks
        };
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};


const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }
        
        next();
    };
};

// ==========================
// 🔐 GET Authenticated User
// ==========================
const getUserProfile = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Profile error:', error);
        return res.status(401).json({
            success: false,
            message: error.name === 'JsonWebTokenError' ? 'Invalid token' : 'Server error occurred'
        });
    }
};

// 🔁 Reuse this for both routes
app.get('/api/auth/profile', getUserProfile);
app.get('/api/auth/me', getUserProfile); // For vibespace.js and others


// Create admin invite code (admin only)
app.post('/api/admin/invite-codes', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        // Generate unique invite code
        const generateCode = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            const part1 = Array.from({length: 8}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
            const part2 = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
            const part3 = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
            return `${part1}-${part2}-${part3}`;
        };
        
        let code;
        let isUnique = false;
        
        // Ensure unique code
        while (!isUnique) {
            code = generateCode();
            const existing = await AdminInviteCode.findOne({ code });
            if (!existing) isUnique = true;
        }
        
        const inviteCode = new AdminInviteCode({
            code,
            createdBy: req.user.userId
        });
        
        await inviteCode.save();
        
        res.status(201).json({
            success: true,
            message: 'Admin invite code created successfully',
            inviteCode: {
                code: inviteCode.code,
                createdAt: inviteCode.createdAt
            }
        });
        
    } catch (error) {
        console.error('Create invite code error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create invite code'
        });
    }
});

// Get all invite codes (admin only)
app.get('/api/admin/invite-codes', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const inviteCodes = await AdminInviteCode.find()
            .populate('usedBy', 'firstName lastName email')
            .populate('createdBy', 'firstName lastName email')
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            inviteCodes
        });
        
    } catch (error) {
        console.error('Get invite codes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch invite codes'
        });
    }
});

// Login Route
app.post('/api/auth/login', validateLoginData, async (req, res) => {
    try {
        const { email, password } = req.body;
        
        //Find user by email and role
       const user = await User.findOne({ email: email.toLowerCase()});

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
            role: user.role,
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

// ==== USER ROUTES (for index.html) ====
app.get('/api/user/dashboard', requireAuth, requireRole(['user']), async (req, res) => {
    try {
        // Get user-specific dashboard data
        const user = await User.findById(req.user.userId).select('-password');
        const upcomingEvents = await Event.find({ 
            status: 'active',
            date: { $gte: new Date() }
        }).limit(5).sort({ date: 1 });

        res.json({
            success: true,
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                interests: user.interests
            },
            upcomingEvents,
            message: `Welcome back, ${user.firstName}!`
        });
    } catch (error) {
        console.error('User dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load dashboard'
        });
    }
});

app.get('/api/user/events', requireAuth, requireRole(['user']), async (req, res) => {
    try {
        // Get user's registered events (you'll need to implement registration system)
        const events = await Event.find({ status: 'active' }).sort({ date: 1 });
        
        res.json({
            success: true,
            events,
            message: 'Events loaded successfully'
        });
    } catch (error) {
        console.error('User events error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load events'
        });
    }
});

app.post('/api/user/events/:eventId/register', requireAuth, requireRole(['user']), async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user.userId;

        // Check if event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Here you would implement registration logic
        // For now, just return success
        res.json({
            success: true,
            message: 'Successfully registered for event'
        });
    } catch (error) {
        console.error('Event registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register for event'
        });
    }
});

// ==== ADMIN ROUTES (for admin.html) ====
app.get('/api/admin/dashboard', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        // Get admin dashboard statistics
        const totalUsers = await User.countDocuments();
        const totalEvents = await Event.countDocuments();
        const totalOrganizers = await User.countDocuments({ role: 'organizer' });
        const totalArtists = await User.countDocuments({ role: 'artist' });
        const recentUsers = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalEvents,
                totalOrganizers,
                totalArtists
            },
            recentUsers,
            message: 'Admin dashboard loaded successfully'
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load admin dashboard'
        });
    }
});

app.put('/api/admin/users/:userId/status', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;

        const user = await User.findByIdAndUpdate(
            userId,
            { isActive },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
        });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user status'
        });
    }
});

app.get('/api/admin/events', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const events = await Event.find()
            .populate('createdBy', 'firstName lastName email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            events,
            message: 'All events loaded successfully'
        });
    } catch (error) {
        console.error('Admin events error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load events'
        });
    }
});

app.put('/api/admin/events/:eventId/approve', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const { eventId } = req.params;
        const { status } = req.body; // 'approved', 'rejected', 'active'

        const event = await Event.findByIdAndUpdate(
            eventId,
            { status },
            { new: true }
        );

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        res.json({
            success: true,
            event,
            message: `Event ${status} successfully`
        });
    } catch (error) {
        console.error('Approve event error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update event status'
        });
    }
});

// ==== MULTI-ROLE ROUTES ====
app.get('/api/events/:eventId', requireAuth, requireRole(['user', 'organizer', 'artist', 'admin']), async (req, res) => {
    try {
        const { eventId } = req.params;
        
        const event = await Event.findById(eventId)
            .populate('createdBy', 'firstName lastName');

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        res.json({
            success: true,
            event,
            message: 'Event details loaded successfully'
        });
    } catch (error) {
        console.error('Get event details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load event details'
        });
    }
});

// Enhanced validation middleware for profile updates
const validateProfileData = (req, res, next) => {
    const { firstName, lastName, email, phone, location, role, interests, newsletter } = req.body;
    
    console.log('Validating profile data:', req.body);
    
    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !location || !role) {
        return res.status(400).json({
            success: false,
            message: 'All required fields must be provided: firstName, lastName, email, phone, location, role'
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
    
    // Validate role
    const validRoles = ['user', 'organizer', 'artist', 'admin'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({
            success: false,
            message: 'Please select a valid account type'
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
        const { firstName, lastName, email, phone, location, role, interests, newsletter, bio, dateOfBirth } = req.body;
        
        console.log('Profile update request:', {
            userId: decoded.userId,
            firstName,
            lastName,
            email,
            phone,
            location,
            role: decoded.role,        
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
            role: decoded.role, // Keep the user's current role
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

// Admin only route example
app.get('/api/admin/users', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});

// Organizer and Admin route example
app.get('/api/organizer/dashboard', requireAuth, requireRole(['organizer', 'admin']), async (req, res) => {
    // Organizer dashboard logic
    res.json({ success: true, message: 'Organizer dashboard data' });
});

// Artist and Admin route example
app.get('/api/artist/profile', requireAuth, requireRole(['artist', 'admin']), async (req, res) => {
    // Artist profile logic
    res.json({ success: true, message: 'Artist profile data' });
});

// Middleware to handle 404 errors
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
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

// Static file routes for role-based pages
app.get('/admin', requireAuth, requireRole(['admin']), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
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

app.get('/events', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'events.html')); // adjust path as needed
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
