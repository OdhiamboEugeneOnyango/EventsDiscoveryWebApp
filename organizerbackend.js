const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Event = require('./models/Event');
const Organizer = require('./models/Organizer');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// --- Middleware ---
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Access token required' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        if (!user || !user.isActive) {
            return res.status(401).json({ success: false, message: 'Invalid or inactive user' });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
};

const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: `Access denied. Required role: ${roles.join(' or ')}` });
        }
        next();
    };
};

const checkEventOwnership = async (req, res, next) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        if (req.user.role === 'admin' || event.organizer.toString() === req.user._id.toString()) {
            req.event = event;
            next();
        } else {
            return res.status(403).json({ success: false, message: 'You can only modify your own events' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error checking event ownership' });
    }
};

// --- Auth Routes (for organizer dashboard) ---
router.post('/api/organizer/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({
            email,
            password: hashedPassword,
            name,
            role: 'organizer'
        });
        await user.save();
        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({
            success: true,
            message: 'Organizer registered successfully',
            token,
            user: { id: user._id, email: user.email, name: user.name, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error registering organizer' });
    }
});

router.post('/api/organizer/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, role: 'organizer' });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }
        if (!user.isActive) {
            return res.status(400).json({ success: false, message: 'Account is deactivated' });
        }
        user.lastLogin = new Date();
        await user.save();
        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: { id: user._id, email: user.email, name: user.name, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error logging in' });
    }
});

router.get('/api/organizer/verify', authenticateToken, requireRole('organizer', 'admin'), (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user._id,
            email: req.user.email,
            name: req.user.name,
            role: req.user.role
        }
    });
});

// --- Event Routes (Protected) ---
router.get('/api/organizer/events', authenticateToken, requireRole('organizer', 'admin'), async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'organizer') {
            query.organizer = req.user._id;
        }
        const events = await Event.find(query)
            .populate('organizer', 'name email')
            .sort({ createdAt: -1 });
        res.json({ success: true, events });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching events' });
    }
});

router.post('/api/organizer/events', authenticateToken, requireRole('organizer', 'admin'), async (req, res) => {
    try {
        const eventData = {
            ...req.body,
            organizer: req.user._id,
            updatedAt: new Date()
        };
        const event = new Event(eventData);
        await event.save();
        const populatedEvent = await Event.findById(event._id)
            .populate('organizer', 'name email');
        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            event: populatedEvent
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating event' });
    }
});

router.put('/api/organizer/events/:id', authenticateToken, requireRole('organizer', 'admin'), checkEventOwnership, async (req, res) => {
    try {
        const updateData = {
            ...req.body,
            updatedAt: new Date()
        };
        const event = await Event.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('organizer', 'name email');
        res.json({
            success: true,
            message: 'Event updated successfully',
            event
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating event' });
    }
});

router.delete('/api/organizer/events/:id', authenticateToken, requireRole('organizer', 'admin'), checkEventOwnership, async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting event' });
    }
});

router.get('/api/organizer/events/:id', authenticateToken, requireRole('organizer', 'admin'), checkEventOwnership, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'name email');
        res.json({ success: true, event });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching event' });
    }
});

// --- Analytics Route (Protected) ---
router.get('/api/organizer/analytics/dashboard', authenticateToken, requireRole('organizer', 'admin'), async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'organizer') {
            query.organizer = req.user._id;
        }
        const totalEvents = await Event.countDocuments(query);
        const activeEvents = await Event.countDocuments({ ...query, status: 'active' });
        const draftEvents = await Event.countDocuments({ ...query, status: 'draft' });
        const endedEvents = await Event.countDocuments({ ...query, status: 'ended' });
        const events = await Event.find(query);
        const totalAttendees = events.reduce((sum, event) => sum + event.attendees, 0);
        const totalRevenue = events.reduce((sum, event) => sum + event.revenue, 0);

        res.json({
            success: true,
            analytics: {
                totalEvents,
                activeEvents,
                draftEvents,
                endedEvents,
                totalAttendees,
                totalRevenue
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching analytics' });
    }
});

// --- Organizer Profile (optional, if you want to fetch organizer info) ---
router.get('/api/organizer/profile', authenticateToken, requireRole('organizer', 'admin'), async (req, res) => {
    try {
        const organizer = await Organizer.findOne({ user: req.user._id }).populate('user', 'name email');
        if (!organizer) {
            return res.status(404).json({ success: false, message: 'Organizer profile not found' });
        }
        res.json({ success: true, organizer });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching organizer profile' });
    }
});

module.exports = router;