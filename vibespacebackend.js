const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('./models/User'); 
const Event = require('./models/Event');
const ForumPost = require('./models/ForumPost'); 


// --- Forum Stats ---
router.get('/api/forums/:eventId/stats', async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const totalPosts = await ForumPost.countDocuments({ eventId });
        // For demo: count unique users who posted as totalMembers
        const members = await ForumPost.distinct('author', { eventId });
        res.json({
            stats: {
                totalMembers: members.length,
                totalPosts,
                activeToday: 0, // Implement if you track activity
                onlineNow: 0    // Implement if you track online users
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch forum stats' });
    }
});

// --- Get Posts ---
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

// --- Create Post ---
router.post('/api/forums/:eventId/posts', async (req, res) => {
    try {
        const { type, title, content } = req.body;
        const eventId = req.params.eventId;
        // You should get user from auth middleware; here we use req.user._id
        const author = req.user ? req.user._id : null;
        if (!author) return res.status(401).json({ success: false, message: 'Login required' });

        const post = new ForumPost({
            eventId,
            type,
            title,
            content,
            author
        });
        await post.save();
        await post.populate('author', 'name');
        res.status(201).json({ post });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Failed to create post' });
    }
});

// --- Like/Unlike Post ---
router.post('/api/posts/:postId/like', async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user ? req.user._id : null;
        if (!userId) return res.status(401).json({ success: false, message: 'Login required' });

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

// --- Join/Leave Forum ---
router.post('/api/forums/:eventId/join', async (req, res) => {
    try {
        const userId = req.user ? req.user._id : null;
        const eventId = req.params.eventId;
        if (!userId) return res.status(401).json({ success: false, message: 'Login required' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (!user.joinedForums) user.joinedForums = [];
        const idx = user.joinedForums.indexOf(eventId);
        if (idx === -1) {
            user.joinedForums.push(eventId);
        } else {
            user.joinedForums.splice(idx, 1);
        }
        await user.save();
        res.json({ success: true, joinedForums: user.joinedForums });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Failed to join/leave forum' });
    }
});

module.exports = router;