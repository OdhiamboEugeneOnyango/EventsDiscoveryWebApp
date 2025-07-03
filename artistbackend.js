const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

// Import models
const Artist = require('./models/Artist');
const User = require('./models/User');
const Event = require('./models/Event');
const Contact = require('./models/Contact');
const Merchandise = require('./models/Merchandise');
const ArtGallery = require('./models/ArtGallery');

// Middleware to authenticate user
const auth = (req, res, next) => {
    const token = req.header('x-auth-token') || req.cookies.token;
    
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// Middleware to check artist role
const checkArtistRole = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.roles.includes('artist')) {
            return res.status(403).json({ msg: 'Access denied. Artist role required.' });
        }
        next();
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Middleware to check artist ownership
const checkArtistOwnership = async (req, res, next) => {
    try {
        const artist = await Artist.findById(req.params.artistId);
        if (!artist) {
            return res.status(404).json({ msg: 'Artist not found' });
        }
        
        if (artist.userId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Access denied. You can only edit your own artist profile.' });
        }
        
        req.artist = artist;
        next();
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   GET /api/artists
// @desc    Get all artists
// @access  Public
router.get('/', async (req, res) => {
    try {
        const artists = await Artist.find({ isActive: true })
            .select('name profilePic bio')
            .sort({ createdAt: -1 });
        res.json(artists);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/artists/:id
// @desc    Get artist by ID with all details
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const artist = await Artist.findById(req.params.id)
            .populate('userId', 'name email')
            .populate('merchandise')
            .populate('upcomingEvents')
            .populate('artGallery');
        
        if (!artist || !artist.isActive) {
            return res.status(404).json({ msg: 'Artist not found' });
        }
        
        res.json(artist);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Artist not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/artists
// @desc    Create artist profile
// @access  Private (Artist role required)
router.post('/', [
    auth,
    checkArtistRole,
    [
        check('name', 'Name is required').not().isEmpty(),
        check('bio', 'Bio is required').not().isEmpty(),
        check('profilePic', 'Profile picture URL is required').isURL()
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, bio, profilePic, social } = req.body;
    
    try {
        // Check if user already has an artist profile
        let artist = await Artist.findOne({ userId: req.user.id });
        if (artist) {
            return res.status(400).json({ msg: 'Artist profile already exists' });
        }
        
        artist = new Artist({
            userId: req.user.id,
            name,
            bio,
            profilePic,
            social: social || {}
        });
        
        await artist.save();
        
        // Populate the response
        await artist.populate('userId', 'name email');
        
        res.json(artist);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/artists/:id
// @desc    Update artist profile
// @access  Private (Artist owner only)
router.put('/:id', [
    auth,
    checkArtistRole,
    checkArtistOwnership
], async (req, res) => {
    const { name, bio, profilePic, social } = req.body;
    
    try {
        const artistFields = {};
        if (name) artistFields.name = name;
        if (bio) artistFields.bio = bio;
        if (profilePic) artistFields.profilePic = profilePic;
        if (social) artistFields.social = social;
        
        const artist = await Artist.findByIdAndUpdate(
            req.params.id,
            { $set: artistFields },
            { new: true }
        ).populate('userId', 'name email');
        
        res.json(artist);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/artists/:id/owner
// @desc    Check if current user is the owner of the artist profile
// @access  Private
router.get('/:id/owner', auth, async (req, res) => {
    try {
        const artist = await Artist.findById(req.params.id);
        if (!artist) {
            return res.status(404).json({ msg: 'Artist not found' });
        }
        
        const isOwner = artist.userId.toString() === req.user.id;
        res.json({ isOwner });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/artists/:artistId/merchandise
// @desc    Add merchandise to artist profile
// @access  Private (Artist owner only)
router.post('/:artistId/merchandise', [
    auth,
    checkArtistRole,
    checkArtistOwnership,
    [
        check('name', 'Name is required').not().isEmpty(),
        check('price', 'Price must be a valid number').isFloat({ min: 0 }),
        check('image', 'Image URL is required').isURL()
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, description, price, image } = req.body;
    
    try {
        const merchandise = new Merchandise({
            artistId: req.params.artistId,
            name,
            description,
            price,
            image
        });
        
        await merchandise.save();
        
        // Add to artist's merchandise array
        await Artist.findByIdAndUpdate(
            req.params.artistId,
            { $push: { merchandise: merchandise._id } }
        );
        
        res.json(merchandise);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/artists/:artistId/merchandise/:merchId
// @desc    Delete merchandise item
// @access  Private (Artist owner only)
router.delete('/:artistId/merchandise/:merchId', [
    auth,
    checkArtistRole,
    checkArtistOwnership
], async (req, res) => {
    try {
        const merchandise = await Merchandise.findById(req.params.merchId);
        if (!merchandise) {
            return res.status(404).json({ msg: 'Merchandise not found' });
        }
        
        // Remove from artist's merchandise array
        await Artist.findByIdAndUpdate(
            req.params.artistId,
            { $pull: { merchandise: req.params.merchId } }
        );
        
        await Merchandise.findByIdAndDelete(req.params.merchId);
        
        res.json({ msg: 'Merchandise removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/artists/:artistId/events
// @desc    Add event to artist profile
// @access  Private (Artist owner only)
router.post('/:artistId/events', [
    auth,
    checkArtistRole,
    checkArtistOwnership,
    [
        check('title', 'Title is required').not().isEmpty(),
        check('date', 'Date is required').isISO8601(),
        check('location', 'Location is required').not().isEmpty(),
        check('time', 'Time is required').not().isEmpty()
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { title, date, location, time, ticketLink } = req.body;
    
    try {
        const event = new Event({
            artistId: req.params.artistId,
            title,
            date,
            location,
            time,
            ticketLink
        });
        
        await event.save();
        
        // Add to artist's upcoming events array
        await Artist.findByIdAndUpdate(
            req.params.artistId,
            { $push: { upcomingEvents: event._id } }
        );
        
        res.json(event);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/artists/:artistId/events/:eventId
// @desc    Delete event
// @access  Private (Artist owner only)
router.delete('/:artistId/events/:eventId', [
    auth,
    checkArtistRole,
    checkArtistOwnership
], async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }
        
        // Remove from artist's events array
        await Artist.findByIdAndUpdate(
            req.params.artistId,
            { $pull: { upcomingEvents: req.params.eventId } }
        );
        
        await Event.findByIdAndDelete(req.params.eventId);
        
        res.json({ msg: 'Event removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/artists/:artistId/gallery
// @desc    Add art piece to gallery
// @access  Private (Artist owner only)
router.post('/:artistId/gallery', [
    auth,
    checkArtistRole,
    checkArtistOwnership,
    [
        check('title', 'Title is required').not().isEmpty(),
        check('image', 'Image URL is required').isURL()
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { title, description, image } = req.body;
    
    try {
        const artPiece = new ArtGallery({
            artistId: req.params.artistId,
            title,
            description,
            image
        });
        
        await artPiece.save();
        
        // Add to artist's art gallery array
        await Artist.findByIdAndUpdate(
            req.params.artistId,
            { $push: { artGallery: artPiece._id } }
        );
        
        res.json(artPiece);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/artists/:artistId/gallery/:artId
// @desc    Delete art piece
// @access  Private (Artist owner only)
router.delete('/:artistId/gallery/:artId', [
    auth,
    checkArtistRole,
    checkArtistOwnership
], async (req, res) => {
    try {
        const artPiece = await ArtGallery.findById(req.params.artId);
        if (!artPiece) {
            return res.status(404).json({ msg: 'Art piece not found' });
        }
        
        // Remove from artist's gallery array
        await Artist.findByIdAndUpdate(
            req.params.artistId,
            { $pull: { artGallery: req.params.artId } }
        );
        
        await ArtGallery.findByIdAndDelete(req.params.artId);
        
        res.json({ msg: 'Art piece removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/artists/:artistId/contact
// @desc    Send message to artist
// @access  Private
router.post('/:artistId/contact', [
    auth,
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('message', 'Message is required').not().isEmpty()
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, email, message } = req.body;
    
    try {
        // Check if artist exists
        const artist = await Artist.findById(req.params.artistId);
        if (!artist) {
            return res.status(404).json({ msg: 'Artist not found' });
        }
        
        const contact = new Contact({
            artistId: req.params.artistId,
            fromUserId: req.user.id,
            name,
            email,
            message
        });
        
        await contact.save();
        
        // Here you could add email notification logic
        // sendEmailNotification(artist.email, contact);
        
        res.json({ msg: 'Message sent successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/artists/:artistId/contacts
// @desc    Get all contact messages for artist
// @access  Private (Artist owner only)
router.get('/:artistId/contacts', [
    auth,
    checkArtistRole,
    checkArtistOwnership
], async (req, res) => {
    try {
        const contacts = await Contact.find({ artistId: req.params.artistId })
            .populate('fromUserId', 'name email')
            .sort({ createdAt: -1 });
        
        res.json(contacts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/artists/:id
// @desc    Delete artist profile (deactivate)
// @access  Private (Artist owner only)
router.delete('/:id', [
    auth,
    checkArtistRole,
    checkArtistOwnership
], async (req, res) => {
    try {
        // Soft delete - just deactivate
        await Artist.findByIdAndUpdate(
            req.params.id,
            { isActive: false }
        );
        
        res.json({ msg: 'Artist profile deactivated' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/artists/search/:query
// @desc    Search artists by name or bio
// @access  Public
router.get('/search/:query', async (req, res) => {
    try {
        const searchQuery = req.params.query;
        const artists = await Artist.find({
            isActive: true,
            $or: [
                { name: { $regex: searchQuery, $options: 'i' } },
                { bio: { $regex: searchQuery, $options: 'i' } }
            ]
        }).select('name profilePic bio');
        
        res.json(artists);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;