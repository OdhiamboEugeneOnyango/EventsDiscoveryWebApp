const express = require('express');
const router = express.Router();
const Artist = require('./models/Artist');
const Merchandise = require('./models/Merchandise');
const ArtGallery = require('./models/ArtGallery');
const Event = require('./models/Event');

// GET artist profile by artist ID (with all related data)
router.get('/api/artists/:artistId', async (req, res) => {
    try {
        const artist = await Artist.findById(req.params.artistId)
            .populate('merchandise')
            .populate('artGallery');
        if (!artist) return res.status(404).json({ success: false, message: 'Artist not found' });

        // Optionally, fetch events for this artist (if you link events to artist)
        const events = await Event.find({ artist: artist._id });

        res.json({
            success: true,
            artist: {
                _id: artist._id,
                name: artist.name,
                bio: artist.bio,
                profilePic: artist.profilePic,
                social: artist.social,
                merchandise: artist.merchandise,
                artGallery: artist.artGallery,
                upcomingEvents: events
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch artist profile' });
    }
});

// ADD new merchandise to artist
router.post('/api/artists/:artistId/merchandise', async (req, res) => {
    try {
        const { name, description, price, image } = req.body;
        const merch = new Merchandise({ name, description, price, image, artist: req.params.artistId });
        await merch.save();

        // Add to artist's merchandise array
        await Artist.findByIdAndUpdate(req.params.artistId, { $push: { merchandise: merch._id } });

        res.status(201).json({ success: true, merchandise: merch });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Failed to add merchandise' });
    }
});

// ADD new event to artist
router.post('/api/artists/:artistId/events', async (req, res) => {
    try {
        const { title, date, location, time, ticketLink } = req.body;
        const event = new Event({
            title,
            date,
            location,
            time,
            ticketLink,
            artist: req.params.artistId // Make sure your Event model has an 'artist' field
        });
        await event.save();
        res.status(201).json({ success: true, event });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Failed to add event' });
    }
});

// ADD new art gallery item to artist
router.post('/api/artists/:artistId/gallery', async (req, res) => {
    try {
        const { title, description, image } = req.body;
        const art = new ArtGallery({ title, description, image, artist: req.params.artistId });
        await art.save();

        // Add to artist's artGallery array
        await Artist.findByIdAndUpdate(req.params.artistId, { $push: { artGallery: art._id } });

        res.status(201).json({ success: true, art });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Failed to add gallery item' });
    }
});

module.exports = router;