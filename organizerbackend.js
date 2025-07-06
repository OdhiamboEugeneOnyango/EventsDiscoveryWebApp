const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Refund = require('./models/Refund');
const Expense = require('./models/Expense');
const Payout = require('./models/Payout');

// Import models
const Organizer = require('./models/Organizer');
const Event = require('./models/Event');
const Application = require('./models/Application');
const VenueRequest = require('./models/VenueRequest');
const User = require('./models/User'); // Add this import

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads/events';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and GIF files are allowed'));
    }
  }
});

// ORGANIZER PROFILE ROUTES

// Get organizer profile - FIXED TO MATCH FRONTEND EXPECTATIONS
router.get('/profile', async (req, res) => {
  try {
    // Get user data first
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user has organizer profile
    const organizer = await Organizer.findOne({ userId: req.user.userId });
    
    // Return user data with organizer info if exists
    res.json({ 
      success: true, 
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        organizerProfile: organizer
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update organizer profile
router.put('/profile', upload.single('logo'), async (req, res) => {
  try {
    const updates = {
      organizationName: req.body.organizationName,
      description: req.body.description,
      website: req.body.website,
      contactEmail: req.body.contactEmail,
      contactPhone: req.body.contactPhone
    };

    if (req.file) {
      updates.logo = `/uploads/events/${req.file.filename}`;
    }

    const organizer = await Organizer.findOneAndUpdate(
      { userId: req.user.userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!organizer) {
      return res.status(404).json({ success: false, message: 'Organizer profile not found' });
    }

    res.json({ success: true, message: 'Profile updated', organizer });
  } catch (error) {
    console.error('Error updating organizer profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// EVENT MANAGEMENT ROUTES

// --- GET Events List ---
router.get('/api/events', async (req, res) => {
    try {
        const events = await Event.find({}).select('_id title name date location attendees time	location category status	price');
        res.json({ success: true, events });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch events' });
    }
});

// Get organizer's events - FIXED ROUTE
/*router.get('/api/events', async (req, res) => {
  try {
    const organizer = await Organizer.findOne({ userId: req.user.userId });
    if (!organizer) {
      return res.status(404).json({ success: false, message: 'Organizer profile not found' });
    }

    const events = await Event.find({ organizerId: organizer._id })
      .sort({ date: 1 });

    res.json({ success: true, events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});*/

// Create new event - FIXED ROUTE WITH IMAGE UPLOAD
router.post('/api/events', upload.single('image'), async (req, res) => {
  try {
    /*const organizer = await Organizer.findOne({ userId: req.user.userId });
    if (!organizer) {
      return res.status(404).json({ success: false, message: 'Organizer profile not found' });
    }*/

    const eventData = {
      name: req.body.name, // Changed from title to name to match frontend
      description: req.body.description,
      category: req.body.category,
      date: req.body.date,
      time: req.body.time,
      location: req.body.location,
      capacity: req.body.capacity ? parseInt(req.body.capacity) : null,
      price: req.body.price ? parseFloat(req.body.price) : 0,
      organizerId: organizer._id,
      status: req.body.status || 'active',
      tags: req.body.tags || []
    };

    if (req.file) {
      eventData.image = `/uploads/events/${req.file.filename}`;
    }

    const event = new Event(eventData);
    await event.save();

    res.status(201).json({ 
      success: true, 
      message: 'Event created successfully', 
      event 
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update event - FIXED ROUTE
router.put('/api/events/:eventId', upload.single('image'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizer = await Organizer.findOne({ userId: req.user.userId });
    
    if (!organizer) {
      return res.status(404).json({ success: false, message: 'Organizer profile not found' });
    }

    const event = await Event.findOne({ 
      _id: eventId, 
      organizerId: organizer._id 
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const updates = {
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      date: req.body.date,
      time: req.body.time,
      location: req.body.location,
      capacity: req.body.capacity ? parseInt(req.body.capacity) : null,
      price: req.body.price ? parseFloat(req.body.price) : 0,
      status: req.body.status,
      tags: req.body.tags || []
    };

    if (req.file) {
      updates.image = `/uploads/events/${req.file.filename}`;
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId, 
      updates, 
      { new: true }
    );

    res.json({ 
      success: true, 
      message: 'Event updated successfully', 
      event: updatedEvent 
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete event - NEW ROUTE
router.delete('/api/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizer = await Organizer.findOne({ userId: req.user.userId });
    
    if (!organizer) {
      return res.status(404).json({ success: false, message: 'Organizer profile not found' });
    }

    const event = await Event.findOne({ 
      _id: eventId, 
      organizerId: organizer._id 
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    await Event.findByIdAndDelete(eventId);

    res.json({ 
      success: true, 
      message: 'Event deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get event statistics - FIXED ROUTE
router.get('/stats', async (req, res) => {
  try {
    const organizer = await Organizer.findOne({ userId: req.user.userId });
    if (!organizer) {
      return res.status(404).json({ success: false, message: 'Organizer profile not found' });
    }

    const [totalEvents, activeEvents, totalAttendees, totalRevenue] = await Promise.all([
      Event.countDocuments({ organizerId: organizer._id }),
      Event.countDocuments({ organizerId: organizer._id, status: 'active' }),
      Event.aggregate([
        { $match: { organizerId: organizer._id } },
        { $group: { _id: null, total: { $sum: '$attendees' } } }
      ]),
      Event.aggregate([
        { $match: { organizerId: organizer._id } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$attendees', '$price'] } } } }
      ])
    ]);

    res.json({
      success: true,
      totalEvents,
      activeEvents,
      totalAttendees: totalAttendees[0]?.total || 0,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUBLIC ROUTES (without authentication)

// Public route: Get list of active events (simplified)
router.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find({ status: 'active' })
      .select('_id name') // Changed from title to name
      .sort({ date: -1 });

    res.json({ 
      success: true, 
      events 
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch events' 
    });
  }
});

// Private route: Get event details by ID
router.get('/api/events/:eventId', async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('organizerId', 'organizationName logo');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({ success: true, event });
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// APPLICATION MANAGEMENT

// Get applications for organizer's events
router.get('/applications', async (req, res) => {
  try {
    const organizer = await Organizer.findOne({ userId: req.user.userId });
    if (!organizer) {
      return res.status(404).json({ success: false, message: 'Organizer profile not found' });
    }

    const events = await Event.find({ organizerId: organizer._id }).select('_id');
    const eventIds = events.map(event => event._id);

    const applications = await Application.find({ eventId: { $in: eventIds } })
      .populate('userId', 'firstName lastName email')
      .populate('eventId', 'name') // Changed from title to name
      .sort({ createdAt: -1 });

    res.json({ success: true, applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get refund history for current organizer
router.get('/api/finance/refunds', async (req, res) => {
  try {
    const organizer = await Organizer.findOne({ userId: req.user.userId });
    if (!organizer) return res.status(404).json({ success: false, message: 'Organizer not found' });

    const events = await Event.find({ organizerId: organizer._id }).select('_id');
    const eventIds = events.map(e => e._id);

    const refunds = await Refund.find({ eventId: { $in: eventIds } })
      .populate('userId', 'email')
      .sort({ requestedAt: -1 });

    const data = refunds.map(r => ({
      date: r.requestedAt,
      userEmail: r.userId?.email || 'N/A',
      amount: r.amount,
      status: r.status
    }));

    res.json({ success: true, refunds: data });
  } catch (err) {
    console.error('Error fetching refunds:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch refunds' });
  }
});

// Get expense log for current organizer
router.get('/api/finance/expenses', async (req, res) => {
  try {
    const organizer = await Organizer.findOne({ userId: req.user.userId });
    if (!organizer) return res.status(404).json({ success: false, message: 'Organizer not found' });

    const expenses = await Expense.find({ organizerId: organizer._id }).sort({ date: -1 });

    res.json({ success: true, expenses });
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch expenses' });
  }
});

// Get payout history for current organizer
router.get('/api/finance/payouts', async (req, res) => {
  try {
    const organizer = await Organizer.findOne({ userId: req.user.userId });
    if (!organizer) return res.status(404).json({ success: false, message: 'Organizer not found' });

    const payouts = await Payout.find({ organizerId: organizer._id }).sort({ createdAt: -1 });

    const data = payouts.map(p => ({
      date: p.requestedAt,
      amount: p.amount,
      method: p.method,
      status: p.status
    }));

    res.json({ success: true, payouts: data });
  } catch (err) {
    console.error('Error fetching payouts:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch payouts' });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large' });
    }
  }
  
  if (error.message === 'Only JPEG, PNG, and GIF files are allowed') {
    return res.status(400).json({ success: false, message: error.message });
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

module.exports = router;