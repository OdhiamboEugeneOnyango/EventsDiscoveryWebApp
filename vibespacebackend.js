const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('./models/User'); 
const Event = require('./models/Event');
const ForumPost = require('./models/ForumPost'); 

// Add this near the top of the file
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here'; // Replace with your actual secret
const requireAuth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};



// --- Forum Stats ---
// --- 🔍 GET Forum Stats ---
router.get('/api/forums/:eventId/stats', async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const totalPosts = await ForumPost.countDocuments({ eventId });
        const members = await ForumPost.distinct('author', { eventId });

        res.json({
            stats: {
                totalMembers: members.length,
                totalPosts,
                activeToday: 0,
                onlineNow: 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch forum stats' });
    }
});

// --- 🗨️ GET Posts ---
router.get('/api/forums/:eventId/posts', async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const filter = req.query.type;
        let query = { eventId };
        if (filter && filter !== 'all') query.type = filter;

        const posts = await ForumPost.find(query)
            .populate('author', 'name')
            .sort({ createdAt: -1 });

        res.json({ posts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch posts' });
    }
});

// --- ✍️ CREATE Post (🔐 requireAuth added) ---
router.post('/api/forums/:eventId/posts', requireAuth, async (req, res) => {
    try {
        const { type, title, content } = req.body;
        const eventId = req.params.eventId;
        const author = req.user.userId;

        if (!author) return res.status(401).json({ success: false, message: 'Login required' });

        const post = new ForumPost({ eventId, type, title, content, author });
        await post.save();
        await post.populate('author', 'name');

        res.status(201).json({ post });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Failed to create post' });
    }
});


// --- ❤️ Like/Unlike Post (🔐 requireAuth added) ---
router.post('/api/posts/:postId/like', requireAuth, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.userId;

        const post = await ForumPost.findById(postId);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        let isLiked = false;
        if (!post.likes) post.likes = [];

        if (post.likes.includes(userId)) {
            post.likes.pull(userId);
        } else {
            post.likes.push(userId);
            isLiked = true;
        }

        await post.save();
        res.json({ likes: post.likes.length, isLiked });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Failed to like/unlike post' });
    }
});


// --- 👥 Join/Leave Forum (🔐 requireAuth added) ---
router.post('/api/forums/:eventId/join', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const eventId = req.params.eventId;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (!user.joinedForums) user.joinedForums = [];
        const index = user.joinedForums.indexOf(eventId);

        if (index === -1) {
            user.joinedForums.push(eventId);
        } else {
            user.joinedForums.splice(index, 1);
        }

        await user.save();
        res.json({ success: true, joinedForums: user.joinedForums });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Failed to join/leave forum' });
    }
});



module.exports = router;