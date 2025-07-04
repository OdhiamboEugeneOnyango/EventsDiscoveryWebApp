const express = require('express');
const router = express.Router();
const Event = require('./models/Event');
const Ticket = require('./models/Ticket');
const Payment = require('./models/Payment');
//const UserInterest = require('./models/UserInterest');
//const UserGoing = require('./models/UserGoing');
//const UserSaved = require('./models/UserSaved');
//const EventReview = require('./models/EventReview');

// GET /api/events - Retrieve all events
router.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find({ status: 'active' })
      .sort({ date: -1 });

    const formattedEvents = events.map(event => ({
      id: event._id,
      title: event.title || 'Untitled Event',
      description: event.description || 'No description available',
      date: event.date ? event.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      time: event.time || '19:00',
      location: event.location || 'Unknown Location',
      venue: event.venue || 'Unknown Venue',
      price: event.price || 0,
      icon: event.icon || '🎭',
      category: event.category || 'Other',
      organizer: event.organizer || 'Unknown Organizer',
      organizerBio: event.organizerBio || 'No bio available',
      rating: event.rating || 0,
      reviews: event.reviews || 0,
      attendees: event.attendees || 0,
      capacity: event.capacity || 100,
      coordinates: event.coordinates || { lat: -1.2921, lng: 36.8219 }, // Default to Nairobi
      featured: event.featured || false,
      status: event.status || 'active',
      image: event.image || '',
      safetyRating: event.safetyRating || 5,
      ticketTypes: event.ticketTypes || []
    }));

    res.json({ 
      success: true, 
      events: formattedEvents 
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

// GET /api/events/:id - Get single event details
router.get('/api/events/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).lean();
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }
        
        res.json({
            success: true,
            event
        });
        
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch event',
            error: error.message
        });
    }
});

// POST /api/events/:id/interested - Toggle user interest in event
router.post('/api/events/:id/interested', async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        const existingInterest = await UserInterest.findOne({
            userId,
            eventId: req.params.id
        });
        
        if (existingInterest) {
            await UserInterest.deleteOne({ _id: existingInterest._id });
            res.json({
                success: true,
                message: 'Interest removed',
                interested: false
            });
        } else {
            await UserInterest.create({
                userId,
                eventId: req.params.id
            });
            res.json({
                success: true,
                message: 'Interest added',
                interested: true
            });
        }
        
    } catch (error) {
        console.error('Error toggling interest:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle interest',
            error: error.message
        });
    }
});

// POST /api/events/:id/going - Toggle user going status
router.post('/api/events/:id/going', async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        const existingGoing = await UserGoing.findOne({
            userId,
            eventId: req.params.id
        });
        
        if (existingGoing) {
            await UserGoing.deleteOne({ _id: existingGoing._id });
            res.json({
                success: true,
                message: 'Going status removed',
                going: false
            });
        } else {
            await UserGoing.create({
                userId,
                eventId: req.params.id
            });
            res.json({
                success: true,
                message: 'Going status added',
                going: true
            });
        }
        
    } catch (error) {
        console.error('Error toggling going status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle going status',
            error: error.message
        });
    }
});

// POST /api/events/:id/save - Toggle event save status
router.post('/api/events/:id/save', async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        const existingSave = await UserSaved.findOne({
            userId,
            eventId: req.params.id
        });
        
        if (existingSave) {
            await UserSaved.deleteOne({ _id: existingSave._id });
            res.json({
                success: true,
                message: 'Event removed from saved',
                saved: false
            });
        } else {
            await UserSaved.create({
                userId,
                eventId: req.params.id
            });
            res.json({
                success: true,
                message: 'Event saved',
                saved: true
            });
        }
        
    } catch (error) {
        console.error('Error toggling save status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle save status',
            error: error.message
        });
    }
});

// GET /api/events/user/:userId/interactions - Get user's event interactions
router.get('/api/events/user/:userId/interactions', async (req, res) => {
    try {
        const [interested, going, saved] = await Promise.all([
            UserInterest.find({ userId: req.params.userId }).distinct('eventId'),
            UserGoing.find({ userId: req.params.userId }).distinct('eventId'),
            UserSaved.find({ userId: req.params.userId }).distinct('eventId')
        ]);
        
        res.json({
            success: true,
            interactions: {
                interested,
                going,
                saved
            }
        });
        
    } catch (error) {
        console.error('Error fetching user interactions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user interactions',
            error: error.message
        });
    }
});

// GET /api/events/categories - Get available event categories
router.get('/api/events/categories', async (req, res) => {
    try {
        const categories = await Event.distinct('category');
        res.json({
            success: true,
            categories: categories.filter(cat => cat)
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories',
            error: error.message
        });
    }
});

// GET /api/events/locations - Get available event locations
router.get('/api/events/locations', async (req, res) => {
    try {
        const locations = await Event.distinct('location');
        res.json({
            success: true,
            locations: locations.filter(loc => loc)
        });
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch locations',
            error: error.message
        });
    }
});

// GET /api/events/featured - Get featured events
router.get('/api/events/featured', async (req, res) => {
    try {
        const featuredEvents = await Event.find({ featured: true })
            .sort({ rating: -1 })
            .limit(6)
            .lean();
        
        res.json({
            success: true,
            events: featuredEvents
        });
    } catch (error) {
        console.error('Error fetching featured events:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch featured events',
            error: error.message
        });
    }
});

// GET /api/events/upcoming - Get upcoming events
router.get('/api/events/upcoming', async (req, res) => {
    try {
        const currentDate = new Date();
        const upcomingEvents = await Event.find({ date: { $gte: currentDate } })
            .sort({ date: 1 })
            .limit(10)
            .lean();
        
        res.json({
            success: true,
            events: upcomingEvents
        });
    } catch (error) {
        console.error('Error fetching upcoming events:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch upcoming events',
            error: error.message
        });
    }
});

// GET /api/events/popular - Get popular events based on attendees
router.get('/api/events/popular', async (req, res) => {
    try {
        const popularEvents = await Event.find({})
            .sort({ attendees: -1 })
            .limit(10)
            .lean();
        
        res.json({
            success: true,
            events: popularEvents
        });
    } catch (error) {
        console.error('Error fetching popular events:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch popular events',
            error: error.message
        });
    }
});

// POST /api/events/:id/reviews - Add review to event
router.post('/api/events/:id/reviews', async (req, res) => {
    try {
        const { userId, rating, comment, userName } = req.body;
        
        if (!userId || !rating) {
            return res.status(400).json({
                success: false,
                message: 'User ID and rating are required'
            });
        }
        
        const review = await EventReview.create({
            userId,
            eventId: req.params.id,
            rating: parseInt(rating),
            comment: comment || '',
            userName: userName || 'Anonymous'
        });
        
        // Update event rating
        await updateEventRating(req.params.id);
        
        res.json({
            success: true,
            message: 'Review added successfully',
            review
        });
        
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add review',
            error: error.message
        });
    }
});

// GET /api/events/:id/reviews - Get event reviews
router.get('/api/events/:id/reviews', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        
        const [reviews, totalReviews] = await Promise.all([
            EventReview.find({ eventId: req.params.id })
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(parseInt(limit))
                .lean(),
            EventReview.countDocuments({ eventId: req.params.id })
        ]);
        
        res.json({
            success: true,
            reviews,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalReviews / limit),
                totalReviews,
                hasNext: page * limit < totalReviews,
                hasPrev: page > 1
            }
        });
        
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews',
            error: error.message
        });
    }
});

// Helper function to update event rating
async function updateEventRating(eventId) {
    try {
        const reviews = await EventReview.find({ eventId });
        
        if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = totalRating / reviews.length;
            
            await Event.findByIdAndUpdate(eventId, {
                rating: Math.round(averageRating * 10) / 10,
                reviews: reviews.length
            });
        }
    } catch (error) {
        console.error('Error updating event rating:', error);
    }
}

// POST /api/events/:id/purchase - Handle ticket purchase
router.post('/api/events/:id/purchase', async (req, res) => {
    try {
        const { userId, quantity, paymentMethod, totalAmount } = req.body;
        
        if (!userId || !quantity || !paymentMethod || !totalAmount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required purchase information'
            });
        }
        
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }
        
        // Check availability
        if (event.attendees + quantity > event.capacity) {
            return res.status(400).json({
                success: false,
                message: 'Not enough tickets available'
            });
        }
        
        // Create tickets
        const tickets = Array.from({ length: quantity }, () => ({
            eventId: req.params.id,
            userId
        }));
        
        // Create purchase record
        const purchase = await Ticket.create({
            userId,
            eventId: req.params.id,
            quantity,
            totalAmount,
            paymentMethod,
            status: 'confirmed',
            tickets
        });
        
        // Update event attendees count
        await Event.findByIdAndUpdate(req.params.id, {
            $inc: { attendees: quantity }
        });
        
        res.json({
            success: true,
            message: 'Tickets purchased successfully',
            purchase
        });
        
    } catch (error) {
        console.error('Error processing purchase:', error);
        res.status(500).json({
            success: false,
            message: 'Purchase failed. Please try again.',
            error: error.message
        });
    }
});

// Error handling middleware
router.use((error, req, res, next) => {
    console.error('Events API Error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

module.exports = router;