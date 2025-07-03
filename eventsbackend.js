const express = require('express');
const router = express.Router();

// Middleware to parse JSON
router.use(express.json());

const Event = require('./models/Event');
const Ticket = require('./models/Ticket');
const Payment = require('./models/Payment');


// GET /api/events - Retrieve all events (matches frontend expectation)
router.get('/api/events', async (req, res) => {
    try {
        const events = await db.collection('events')
            .find({})
            .sort({ date: 1 })
            .toArray();
        res.json({
            success: true,
            events: events || []
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.json({
            success: false,
            events: []
        });
    }
});

// GET /api/events/:id - Get single event details
router.get('/api/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const event = await db.collection('events').findOne({ 
            $or: [
                { id: parseInt(id) },
                { _id: id }
            ]
        });
        
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
        const { id } = req.params;
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        // Check if user is already interested
        const existingInterest = await db.collection('user_interests').findOne({
            userId,
            eventId: parseInt(id)
        });
        
        if (existingInterest) {
            // Remove interest
            await db.collection('user_interests').deleteOne({
                userId,
                eventId: parseInt(id)
            });
            
            res.json({
                success: true,
                message: 'Interest removed',
                interested: false
            });
        } else {
            // Add interest
            await db.collection('user_interests').insertOne({
                userId,
                eventId: parseInt(id),
                createdAt: new Date()
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
        const { id } = req.params;
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        // Check if user is already going
        const existingGoing = await db.collection('user_going').findOne({
            userId,
            eventId: parseInt(id)
        });
        
        if (existingGoing) {
            // Remove going status
            await db.collection('user_going').deleteOne({
                userId,
                eventId: parseInt(id)
            });
            
            res.json({
                success: true,
                message: 'Going status removed',
                going: false
            });
        } else {
            // Add going status
            await db.collection('user_going').insertOne({
                userId,
                eventId: parseInt(id),
                createdAt: new Date()
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
        const { id } = req.params;
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        // Check if event is already saved
        const existingSave = await db.collection('user_saved').findOne({
            userId,
            eventId: parseInt(id)
        });
        
        if (existingSave) {
            // Remove save
            await db.collection('user_saved').deleteOne({
                userId,
                eventId: parseInt(id)
            });
            
            res.json({
                success: true,
                message: 'Event removed from saved',
                saved: false
            });
        } else {
            // Add save
            await db.collection('user_saved').insertOne({
                userId,
                eventId: parseInt(id),
                createdAt: new Date()
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
        const { userId } = req.params;
        
        // Get all user interactions
        const [interested, going, saved] = await Promise.all([
            db.collection('user_interests').find({ userId }).toArray(),
            db.collection('user_going').find({ userId }).toArray(),
            db.collection('user_saved').find({ userId }).toArray()
        ]);
        
        res.json({
            success: true,
            interactions: {
                interested: interested.map(i => i.eventId),
                going: going.map(g => g.eventId),
                saved: saved.map(s => s.eventId)
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
        const categories = await db.collection('events').distinct('category');
        
        res.json({
            success: true,
            categories: categories.filter(cat => cat) // Remove null/undefined values
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
        const locations = await db.collection('events').distinct('location');
        
        res.json({
            success: true,
            locations: locations.filter(loc => loc) // Remove null/undefined values
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
        const featuredEvents = await db.collection('events')
            .find({ featured: true })
            .sort({ rating: -1 })
            .limit(6)
            .toArray();
        
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
        const currentDate = new Date().toISOString().split('T')[0];
        
        const upcomingEvents = await db.collection('events')
            .find({ date: { $gte: currentDate } })
            .sort({ date: 1 })
            .limit(10)
            .toArray();
        
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
        const popularEvents = await db.collection('events')
            .find({})
            .sort({ attendees: -1 })
            .limit(10)
            .toArray();
        
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
        const { id } = req.params;
        const { userId, rating, comment, userName } = req.body;
        
        if (!userId || !rating) {
            return res.status(400).json({
                success: false,
                message: 'User ID and rating are required'
            });
        }
        
        const review = {
            userId,
            eventId: parseInt(id),
            rating: parseInt(rating),
            comment: comment || '',
            userName: userName || 'Anonymous',
            createdAt: new Date()
        };
        
        await db.collection('event_reviews').insertOne(review);
        
        // Update event rating
        await this.updateEventRating(parseInt(id));
        
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
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        const offset = (page - 1) * limit;
        
        const reviews = await db.collection('event_reviews')
            .find({ eventId: parseInt(id) })
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(parseInt(limit))
            .toArray();
        
        const totalReviews = await db.collection('event_reviews')
            .countDocuments({ eventId: parseInt(id) });
        
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
        const reviews = await db.collection('event_reviews')
            .find({ eventId })
            .toArray();
        
        if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = totalRating / reviews.length;
            
            await db.collection('events').updateOne(
                { id: eventId },
                { 
                    $set: { 
                        rating: Math.round(averageRating * 10) / 10,
                        reviews: reviews.length
                    }
                }
            );
        }
    } catch (error) {
        console.error('Error updating event rating:', error);
    }
}

// GET /api/payments/:id/status - Check payment status
router.get('/api/payments/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        
        const payment = await db.collection('payment_requests').findOne({ 
            _id: id 
        });
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }
        
        res.json({
            success: true,
            status: payment.status,
            paymentDetails: payment
        });
        
    } catch (error) {
        console.error('Error checking payment status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check payment status'
        });
    }
});

// POST /api/events/:id/purchase - Handle ticket purchase
router.post('/api/events/:id/purchase', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, quantity, paymentMethod, totalAmount } = req.body;
        
        if (!userId || !quantity || !paymentMethod || !totalAmount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required purchase information'
            });
        }
        
        // Verify event exists
        const event = await db.collection('events').findOne({ 
            id: parseInt(id) 
        });
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }
        
        // Check availability
        const currentAttendees = event.attendees || 0;
        const eventCapacity = event.capacity || 0;
        
        if (currentAttendees + quantity > eventCapacity) {
            return res.status(400).json({
                success: false,
                message: 'Not enough tickets available'
            });
        }
        
        // Create ticket purchase record
        const purchase = {
            userId,
            eventId: parseInt(id),
            quantity: parseInt(quantity),
            totalAmount: parseFloat(totalAmount),
            paymentMethod,
            status: 'confirmed',
            purchaseDate: new Date(),
            tickets: Array.from({ length: quantity }, (_, i) => ({
                ticketId: `${id}-${Date.now()}-${i + 1}`,
                eventId: parseInt(id),
                userId,
                purchaseDate: new Date()
            }))
        };
        
        await db.collection('ticket_purchases').insertOne(purchase);
        
        // Update event attendees count
        await db.collection('events').updateOne(
            { id: parseInt(id) },
            { $inc: { attendees: parseInt(quantity) } }
        );
        
        res.json({
            success: true,
            message: 'Tickets purchased successfully',
            purchase
        });
        
    } catch (error) {
        console.error('Error processing purchase:', error);
        res.status(500).json({
            success: false,
            message: 'Purchase failed. Please try again.'
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