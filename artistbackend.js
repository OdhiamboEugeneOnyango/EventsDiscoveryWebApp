const express = require('express');
const router = express.Router();
const User = require('./models/User'); 
const Artist = require('./models/Artist');
const Merchandise = require('./models/Merchandise');
const ArtGallery = require('./models/ArtGallery');
const Event = require('./models/Event');
const Contact = require('./models/Contact'); 

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    next();
};

// Middleware to check if user owns the artist profile
const checkArtistOwnership = async (req, res, next) => {
    try {
        const artist = await Artist.findById(req.params.artistId);
        if (!artist) {
            return res.status(404).json({ success: false, message: 'Artist not found' });
        }
        
        if (artist.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied. You can only modify your own artist profile.' });
        }
        
        req.artist = artist; // Store artist for use in route handler
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to verify ownership' });
    }
};

// GET current authenticated user
router.get('/api/auth/current-user', (req, res) => {
    if (req.user) {
        res.json({
            success: true,
            user: {
                id: req.user.id,
                email: req.user.email,
                name: req.user.name,
                roles: req.user.roles
            }
        });
    } else {
        res.status(401).json({ success: false, message: 'Not authenticated' });
    }
});

// Get user roles by user ID
router.get('/api/users/:id/roles', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('roles');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json(user.roles || []);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch user roles' });
    }
});

// Check if current user owns the artist profile
router.get('/api/artists/:artistId/owner', requireAuth, async (req, res) => {
    try {
        const artist = await Artist.findById(req.params.artistId);
        if (!artist) {
            return res.status(404).json({ success: false, message: 'Artist not found' });
        }
        
        const isOwner = artist.userId.toString() === req.user.id.toString();
        res.json({ success: true, isOwner });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to check ownership' });
    }
});

// GET artist profile by artist ID (with all related data) - Public route
router.get('/api/artists/:artistId', async (req, res) => {
    try {
        const artist = await Artist.findById(req.params.artistId)
            .populate('merchandise')
            .populate('artGallery');
        
        if (!artist) {
            return res.status(404).json({ success: false, message: 'Artist not found' });
        }

        // Fetch events for this artist
        const events = await Event.find({ artist: artist._id }).sort({ date: 1 });

        // Format the response to match frontend expectations
        const artistData = {
            name: artist.name,
            bio: artist.bio,
            profilePic: artist.profilePic,
            social: artist.social || {},
            merchandise: artist.merchandise.map(item => ({
                id: item._id,
                name: item.name,
                description: item.description,
                price: item.price,
                image: item.image
            })),
            artGallery: artist.artGallery.map(item => ({
                id: item._id,
                title: item.title,
                description: item.description,
                image: item.image
            })),
            upcomingEvents: events.map(event => ({
                id: event._id,
                title: event.title,
                date: event.date,
                location: event.location,
                time: event.time,
                ticketLink: event.ticketLink
            }))
        };

        res.json(artistData);
    } catch (error) {
        console.error('Error fetching artist profile:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch artist profile' });
    }
});

// ADD new merchandise to artist - Protected route
router.post('/api/artists/:artistId/merchandise', requireAuth, checkArtistOwnership, async (req, res) => {
    try {
        const { name, description, price, image } = req.body;
        
        // Validate required fields
        if (!name || !price || !image) {
            return res.status(400).json({ success: false, message: 'Name, price, and image are required' });
        }

        const merch = new Merchandise({ 
            name, 
            description, 
            price: parseFloat(price), 
            image, 
            artist: req.params.artistId 
        });
        await merch.save();

        // Add to artist's merchandise array
        await Artist.findByIdAndUpdate(req.params.artistId, { $push: { merchandise: merch._id } });

        res.status(201).json({ success: true, merchandise: merch });
    } catch (error) {
        console.error('Error adding merchandise:', error);
        res.status(400).json({ success: false, message: 'Failed to add merchandise' });
    }
});

// ADD new event to artist - Protected route
router.post('/api/artists/:artistId/events', requireAuth, checkArtistOwnership, async (req, res) => {
    try {
        const { title, date, location, time, ticketLink } = req.body;
        
        // Validate required fields
        if (!title || !date || !location || !time) {
            return res.status(400).json({ success: false, message: 'Title, date, location, and time are required' });
        }

        const event = new Event({
            title,
            date: new Date(date),
            location,
            time,
            ticketLink: ticketLink || '',
            artist: req.params.artistId
        });
        await event.save();
        
        res.status(201).json({ success: true, event });
    } catch (error) {
        console.error('Error adding event:', error);
        res.status(400).json({ success: false, message: 'Failed to add event' });
    }
});

// ADD new art gallery item to artist - Protected route
router.post('/api/artists/:artistId/gallery', requireAuth, checkArtistOwnership, async (req, res) => {
    try {
        const { title, description, image } = req.body;
        
        // Validate required fields
        if (!title || !image) {
            return res.status(400).json({ success: false, message: 'Title and image are required' });
        }

        const art = new ArtGallery({ 
            title, 
            description, 
            image, 
            artist: req.params.artistId 
        });
        await art.save();

        // Add to artist's artGallery array
        await Artist.findByIdAndUpdate(req.params.artistId, { $push: { artGallery: art._id } });

        res.status(201).json({ success: true, art });
    } catch (error) {
        console.error('Error adding gallery item:', error);
        res.status(400).json({ success: false, message: 'Failed to add gallery item' });
    }
});

// DELETE merchandise item - Protected route
router.delete('/api/artists/merchandise/:itemId', requireAuth, async (req, res) => {
    try {
        const merchandise = await Merchandise.findById(req.params.itemId);
        if (!merchandise) {
            return res.status(404).json({ success: false, message: 'Merchandise not found' });
        }

        // Check if user owns the artist profile that owns this merchandise
        const artist = await Artist.findById(merchandise.artist);
        if (!artist || artist.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Remove from artist's merchandise array
        await Artist.findByIdAndUpdate(merchandise.artist, { $pull: { merchandise: req.params.itemId } });
        
        // Delete the merchandise item
        await Merchandise.findByIdAndDelete(req.params.itemId);

        res.json({ success: true, message: 'Merchandise deleted successfully' });
    } catch (error) {
        console.error('Error deleting merchandise:', error);
        res.status(500).json({ success: false, message: 'Failed to delete merchandise' });
    }
});

// DELETE event - Protected route
router.delete('/api/artists/events/:eventId', requireAuth, async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // Check if user owns the artist profile that owns this event
        const artist = await Artist.findById(event.artist);
        if (!artist || artist.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Delete the event
        await Event.findByIdAndDelete(req.params.eventId);

        res.json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ success: false, message: 'Failed to delete event' });
    }
});

// DELETE gallery item - Protected route
router.delete('/api/artists/gallery/:artId', requireAuth, async (req, res) => {
    try {
        const artPiece = await ArtGallery.findById(req.params.artId);
        if (!artPiece) {
            return res.status(404).json({ success: false, message: 'Art piece not found' });
        }

        // Check if user owns the artist profile that owns this art piece
        const artist = await Artist.findById(artPiece.artist);
        if (!artist || artist.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Remove from artist's artGallery array
        await Artist.findByIdAndUpdate(artPiece.artist, { $pull: { artGallery: req.params.artId } });
        
        // Delete the art piece
        await ArtGallery.findByIdAndDelete(req.params.artId);

        res.json({ success: true, message: 'Art piece deleted successfully' });
    } catch (error) {
        console.error('Error deleting art piece:', error);
        res.status(500).json({ success: false, message: 'Failed to delete art piece' });
    }
});

// CONTACT artist - Protected route (user must be authenticated to send messages)
router.post('/api/artists/:artistId/contact', requireAuth, async (req, res) => {
    try {
        const { name, email, message } = req.body;
        
        // Validate required fields
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
        }

        // Check if artist exists
        const artist = await Artist.findById(req.params.artistId);
        if (!artist) {
            return res.status(404).json({ success: false, message: 'Artist not found' });
        }

        // Create contact message (you'll need to create a Contact model)
        const contact = new Contact({
            artistId: req.params.artistId,
            senderUserId: req.user.id,
            name,
            email,
            message,
            createdAt: new Date()
        });
        
        await contact.save();

        // Here you could also send an email notification to the artist
        // await sendEmailNotification(artist.email, contact);

        res.status(201).json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending contact message:', error);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
});

// GET contact messages for artist (for artist to view their messages) - Protected route
router.get('/api/artists/:artistId/contacts', requireAuth, checkArtistOwnership, async (req, res) => {
    try {
        const contacts = await Contact.find({ artistId: req.params.artistId })
            .populate('senderUserId', 'name email')
            .sort({ createdAt: -1 });

        res.json({ success: true, contacts });
    } catch (error) {
        console.error('Error fetching contact messages:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch contact messages' });
    }
});

module.exports = router;