const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Event = require('./models/Event');

const app = express();

// --- Venue Safety Rating Schema ---
const venueSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    name: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comments: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const Venue = mongoose.model('Venue', venueSchema);

// --- Incident Report Schema ---
const incidentSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    type: { 
        type: String, 
        enum: ['safety', 'harassment', 'theft', 'medical', 'facility', 'other'],
        required: true 
    },
    location: { type: String, required: true },
    date: { type: String, required: true }, // ISO date string
    description: { type: String, required: true },
    reporterContact: { type: String },
    createdAt: { type: Date, default: Date.now }
});
const Incident = mongoose.model('Incident', incidentSchema);

// --- Lost & Found Schema ---
const lostFoundSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    status: { type: String, enum: ['lost', 'found'], required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    date: { type: String, required: true }, // ISO date string
    contact: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const LostFound = mongoose.model('LostFound', lostFoundSchema);

// --- Venue Endpoints ---
router.get('/api/venues', async (req, res) => {
    try {
        const venues = await Venue.find().sort({ createdAt: -1 });
        res.json({ success: true, venues });
    } catch (error) {
        console.error('Error fetching venues:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch venues' });
    }
});

router.post('/api/venues', async (req, res) => {
    try {
        const { eventId, name, rating, comments } = req.body;
        // Validate eventId exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(400).json({ success: false, message: 'Invalid event ID' });
        }
        const venue = new Venue({ eventId, name, rating, comments });
        await venue.save();
        res.status(201).json({ success: true, venue });
    } catch (error) {
        console.error('Error creating venue:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

// --- Incident Endpoints ---
router.get('/api/incidents', async (req, res) => {
    try {
        const incidents = await Incident.find().sort({ createdAt: -1 });
        res.json({ success: true, incidents });
    } catch (error) {
        console.error('Error fetching incidents:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch incidents' });
    }
});

router.post('/api/incidents', async (req, res) => {
    try {
        const { eventId, type, location, date, description, reporterContact } = req.body;
        // Validate eventId exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(400).json({ success: false, message: 'Invalid event ID' });
        }
        const incident = new Incident({ 
            eventId, 
            type, 
            location, 
            date, 
            description, 
            reporterContact 
        });
        await incident.save();
        res.status(201).json({ success: true, incident });
    } catch (error) {
        console.error('Error creating incident:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

// --- Lost & Found Endpoints ---
router.get('/api/lostfound', async (req, res) => {
    try {
        const items = await LostFound.find().sort({ createdAt: -1 });
        res.json({ success: true, items });
    } catch (error) {
        console.error('Error fetching lost & found items:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch lost & found items' });
    }
});

router.post('/api/lostfound', async (req, res) => {
    try {
        const { eventId, status, description, location, date, contact } = req.body;
        // Validate eventId exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(400).json({ success: false, message: 'Invalid event ID' });
        }
        const item = new LostFound({ 
            eventId, 
            status, 
            description, 
            location, 
            date, 
            contact 
        });
        await item.save();
        res.status(201).json({ success: true, item });
    } catch (error) {
        console.error('Error creating lost & found item:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

// --- Additional utility endpoints ---

// Get venues by event
router.get('/api/venues/event/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const venues = await Venue.find({ eventId }).sort({ createdAt: -1 });
        res.json({ success: true, venues });
    } catch (error) {
        console.error('Error fetching venues by event:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch venues for event' });
    }
});

// Get incidents by event
router.get('/api/incidents/event/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const incidents = await Incident.find({ eventId }).sort({ createdAt: -1 });
        res.json({ success: true, incidents });
    } catch (error) {
        console.error('Error fetching incidents by event:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch incidents for event' });
    }
});

// Get lost & found items by event
router.get('/api/lostfound/event/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const items = await LostFound.find({ eventId }).sort({ createdAt: -1 });
        res.json({ success: true, items });
    } catch (error) {
        console.error('Error fetching lost & found by event:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch lost & found items for event' });
    }
});

// Get event statistics
router.get('/api/events/:eventId/stats', async (req, res) => {
    try {
        const { eventId } = req.params;
        const [venueCount, incidentCount, lostFoundCount] = await Promise.all([
            Venue.countDocuments({ eventId }),
            Incident.countDocuments({ eventId }),
            LostFound.countDocuments({ eventId })
        ]);
        // Calculate average venue rating
        const venueRatings = await Venue.find({ eventId }, 'rating');
        const avgRating = venueRatings.length > 0 
            ? venueRatings.reduce((sum, v) => sum + v.rating, 0) / venueRatings.length 
            : 0;
        res.json({
            success: true,
            stats: {
                venues: venueCount,
                incidents: incidentCount,
                lostFound: lostFoundCount,
                averageRating: Math.round(avgRating * 10) / 10
            }
        });
    } catch (error) {
        console.error('Error fetching event stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch event statistics' });
    }
});
// --- Export the router ---
module.exports = router;