const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('./models/User'); 
const Event = require('./models/Event');
const ForumPost = require('./models/ForumPost'); 

// JWT Authentication
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here';

// Auth middleware
const requireAuth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// Optional auth middleware (doesn't require login)
const optionalAuth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        } catch (err) {
            // Invalid token, but continue without user
            req.user = null;
        }
    }
    next();
};

// --- GET Events List ---
router.get('/api/events', async (req, res) => {
    try {
        const events = await Event.find({}).select('_id title name date location attendees');
        res.json({ success: true, events });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch events' });
    }
});

// --- GET Events for Dropdown ---
router.get('/api/events/dropdown', async (req, res) => {
    try {
        const events = await Event.find({ status: 'active' })  // Only active events
            .select('_id title')                               // Minimal fields
            .sort({ date: -1 });                               // Latest first

        const formattedEvents = events.map(event => ({
            _id: event._id,
            name: event.title
        }));

        res.json({ 
            success: true, 
            events: formattedEvents 
        });
    } catch (error) {
        console.error('Error fetching events for dropdown:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch events' });
    }
});

// --- GET Single Event ---
router.get('/api/events/:eventId', optionalAuth, async (req, res) => {
    try {
        const eventId = req.params.eventId;
        
        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ success: false, message: 'Invalid event ID' });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        res.json({ success: true, event });
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch event' });
    }
});

// --- GET Current User (with joined forums) ---
router.get('/api/auth/me', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user data' });
    }
});

// --- GET Forum Stats ---
router.get('/api/forums/:eventId/stats', async (req, res) => {
    try {
        const eventId = req.params.eventId;
        
        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ success: false, message: 'Invalid event ID' });
        }

        const totalPosts = await ForumPost.countDocuments({ eventId });
        const uniqueAuthors = await ForumPost.distinct('author', { eventId });
        const totalMembers = await User.countDocuments({ joinedForums: eventId });

        res.json({
            success: true,
            stats: {
                totalMembers,
                totalPosts,
                activeToday: Math.floor(Math.random() * 10), // Mock data
                onlineNow: Math.floor(Math.random() * 5)      // Mock data
            }
        });
    } catch (error) {
        console.error('Error fetching forum stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch forum stats' });
    }
});

// --- GET Posts ---
router.get('/api/forums/:eventId/posts', optionalAuth, async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const filter = req.query.type;
        
        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ success: false, message: 'Invalid event ID' });
        }

        let query = { eventId };
        if (filter && filter !== 'all') {
            query.type = filter;
        }

        const posts = await ForumPost.find(query)
            .populate('author', 'name')
            .sort({ createdAt: -1 })
            .lean();

        // Add isLiked field if user is authenticated
        if (req.user) {
            posts.forEach(post => {
                post.isLiked = post.likes && post.likes.includes(req.user.userId);
                post.likes = post.likes ? post.likes.length : 0;
            });
        } else {
            posts.forEach(post => {
                post.isLiked = false;
                post.likes = post.likes ? post.likes.length : 0;
            });
        }

        res.json({ success: true, posts });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch posts' });
    }
});

// --- CREATE Post ---
router.post('/api/forums/:eventId/posts', requireAuth, async (req, res) => {
    try {
        const { type, title, content } = req.body;
        const eventId = req.params.eventId;
        const author = req.user.userId;

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ success: false, message: 'Invalid event ID' });
        }

        // Validate required fields
        if (!type || !title || !content) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Check if user has joined the forum
        const user = await User.findById(author);
        if (!user || !user.joinedForums || !user.joinedForums.includes(eventId)) {
            return res.status(403).json({ success: false, message: 'You must join the forum to post' });
        }

        const post = new ForumPost({ 
            eventId, 
            type, 
            title, 
            content, 
            author,
            likes: [],
            replies: 0
        });
        
        await post.save();
        await post.populate('author', 'name');

        // Convert to plain object and add user-specific fields
        const postObj = post.toObject();
        postObj.isLiked = false;
        postObj.likes = 0;

        res.status(201).json({ success: true, post: postObj });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(400).json({ success: false, message: 'Failed to create post' });
    }
});

// --- Like/Unlike Post ---
router.post('/api/posts/:postId/like', requireAuth, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.userId;

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ success: false, message: 'Invalid post ID' });
        }

        const post = await ForumPost.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Initialize likes array if it doesn't exist
        if (!post.likes) {
            post.likes = [];
        }

        let isLiked = false;
        const userObjectId = new mongoose.Types.ObjectId(userId);

        if (post.likes.includes(userObjectId)) {
            // Remove like
            post.likes.pull(userObjectId);
            isLiked = false;
        } else {
            // Add like
            post.likes.push(userObjectId);
            isLiked = true;
        }

        await post.save();
        res.json({ 
            success: true, 
            likes: post.likes.length, 
            isLiked 
        });
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(400).json({ success: false, message: 'Failed to like/unlike post' });
    }
});

// --- Join/Leave Forum ---
router.post('/api/forums/:eventId/join', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const eventId = req.params.eventId;

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ success: false, message: 'Invalid event ID' });
        }

        // Check if event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Initialize joinedForums array if it doesn't exist
        if (!user.joinedForums) {
            user.joinedForums = [];
        }

        const index = user.joinedForums.indexOf(eventId);
        let joined = false;

        if (index === -1) {
            // Join forum
            user.joinedForums.push(eventId);
            joined = true;
        } else {
            // Leave forum
            user.joinedForums.splice(index, 1);
            joined = false;
        }

        await user.save();
        res.json({ 
            success: true, 
            joined,
            joinedForums: user.joinedForums 
        });
    } catch (error) {
        console.error('Error joining/leaving forum:', error);
        res.status(400).json({ success: false, message: 'Failed to join/leave forum' });
    }
});

module.exports = router;