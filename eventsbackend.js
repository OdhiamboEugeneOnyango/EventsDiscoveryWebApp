const express = require('express');
const router = express.Router();
const Event = require('./models/Event');

// Get all events with proper error handling
router.get('/api/events', async (req, res) => {
    try {
        const events = await Event.find({ status: 'active' }).sort({ date: 1 });
        
        // Transform events to match frontend expectations
        const transformedEvents = events.map(event => ({
            _id: event._id.toString(), // Convert ObjectId to string
            id: event._id.toString(),   // Convert ObjectId to string
            title: event.title,
            description: event.description,
            category: event.category,
            date: event.date,
            time: event.time,
            venue: event.venue,
            location: event.location,
            organizer: event.organizer,
            price: event.price,
            tickets: event.tickets,
            icon: event.icon,
            safetyRating: event.safetyRating,
            attendees: event.attendees,
            status: event.status
        }));
        
        res.json({ 
            success: true, 
            events: transformedEvents,
            count: transformedEvents.length 
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch events',
            error: error.message 
        });
    }
});

// Search events
router.get('/api/events/search', async (req, res) => {
    try {
        const { q, category, location, date, price } = req.query;
        let query = { status: 'active' };
        
        // Build search query
        if (q) {
            query.$or = [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { venue: { $regex: q, $options: 'i' } }
            ];
        }
        
        if (category) query.category = category;
        if (location) query.location = location;
        if (date) query.date = date;
        
        const events = await Event.find(query).sort({ date: 1 });
        
        res.json({ 
            success: true, 
            events,
            count: events.length 
        });
    } catch (error) {
        console.error('Error searching events:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to search events',
            error: error.message 
        });
    }
});

// Get single event by ID
router.get('/api/events/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ 
                success: false, 
                message: 'Event not found' 
            });
        }
        
        // Transform single event
        const transformedEvent = {
            _id: event._id.toString(), // Convert ObjectId to string
    id: event._id.toString(),   // Convert ObjectId to string
            title: event.title,
            description: event.description,
            category: event.category,
            date: event.date,
            time: event.time,
            venue: event.venue,
            location: event.location,
            organizer: event.organizer,
            price: event.price,
            tickets: event.tickets,
            icon: event.icon,
            safetyRating: event.safetyRating,
            attendees: event.attendees,
            status: event.status
        };
        
        res.json({ success: true, event: transformedEvent });
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch event',
            error: error.message 
        });
    }
});

// Create event with validation
router.post('/api/events', async (req, res) => {
    try {
        // Validate required fields
        const requiredFields = ['title', 'description', 'category', 'date', 'time', 'venue', 'location', 'organizer'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }
        
        const event = new Event(req.body);
        await event.save();
        
        res.status(201).json({ 
            success: true, 
            event,
            message: 'Event created successfully' 
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(400).json({ 
            success: false, 
            message: 'Failed to create event',
            error: error.message 
        });
    }
});

// Update event
router.put('/api/events/:id', async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
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
            message: 'Event updated successfully' 
        });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(400).json({ 
            success: false, 
            message: 'Failed to update event',
            error: error.message 
        });
    }
});

// Delete event (soft delete by changing status)
router.delete('/api/events/:id', async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(
            req.params.id,
            { status: 'cancelled' },
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
            message: 'Event cancelled successfully',
            event 
        });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete event',
            error: error.message 
        });
    }
});

module.exports = router;