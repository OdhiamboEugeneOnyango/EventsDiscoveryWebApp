const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import Models
const Artist = require('./models/Artist');
const User = require('./models/User');
const Event = require('./models/Event');
const Contact = require('./models/Contact');
const Merchandise = require('./models/Merchandise');
const ArtGallery = require('./models/ArtGallery');

// JWT Secret (Move to .env in production)
const JWT_SECRET = 'your-secret-key-here';

// Middleware: Authenticate token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
}

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads/artists';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
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

// GET /api/artists - Get list of all artists
router.get('/api/artists', async (req, res) => {
  try {
    const artists = await Artist.find().select('_id name profilePic');
    res.json({ success: true, artists });
  } catch (error) {
    console.error('Error fetching artists:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/artists/:id - Get single artist profile
router.get('/api/artists/:id', async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id)
      .populate('merchandise')
      .populate('upcomingEvents')
      .populate('artGallery');

    if (!artist) {
      return res.status(404).json({ success: false, message: 'Artist not found' });
    }

    res.json({ success: true, ...artist.toObject(), id: artist._id });
  } catch (error) {
    console.error('Error fetching artist data:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/artists - Create new artist profile
router.post('/api/artists', authenticateToken, upload.single('profilePic'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user already has an artist profile
    const existingArtist = await Artist.findOne({ user: user._id });
    if (existingArtist) {
      return res.status(400).json({ success: false, message: 'Artist profile already exists' });
    }

    const newArtist = new Artist({
      name: req.body.name,
      bio: req.body.bio || '',
      profilePic: req.file ? `/uploads/artists/${req.file.filename}` : '',
      social: JSON.parse(req.body.social || '{}'),
      user: user._id
    });

    await newArtist.save();

    res.status(201).json({ success: true, message: 'Artist profile created', artist: newArtist });
  } catch (error) {
    console.error('Error creating artist:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/artists/:id - Update artist profile
router.put('/artists/:id', authenticateToken, upload.single('profilePic'), async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) {
      return res.status(404).json({ success: false, message: 'Artist not found' });
    }

    // Ensure current user is owner
    if (artist.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const updates = {
      name: req.body.name,
      bio: req.body.bio,
      social: JSON.parse(req.body.social || '{}')
    };

    if (req.file) {
      updates.profilePic = `/uploads/artists/${req.file.filename}`;
    }

    const updatedArtist = await Artist.findByIdAndUpdate(req.params.id, updates, { new: true });

    res.json({ success: true, message: 'Artist updated', artist: updatedArtist });
  } catch (error) {
    console.error('Error updating artist:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/artists/:id/merchandise - Add merchandise
router.post('/artists/:id/merchandise', authenticateToken, async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) {
      return res.status(404).json({ success: false, message: 'Artist not found' });
    }

    if (artist.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const newMerch = new Merchandise({
      name: req.body.name,
      description: req.body.description,
      price: parseFloat(req.body.price),
      image: req.body.image,
      artist: artist._id
    });

    await newMerch.save();
    artist.merchandise.push(newMerch._id);
    await artist.save();

    res.status(201).json({ success: true, message: 'Merchandise added', item: newMerch });
  } catch (error) {
    console.error('Error adding merchandise:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/artists/:id/merchandise/:itemId - Delete merchandise
router.delete('/artists/:id/merchandise/:itemId', authenticateToken, async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) {
      return res.status(404).json({ success: false, message: 'Artist not found' });
    }

    if (artist.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    await Merchandise.findByIdAndDelete(req.params.itemId);
    artist.merchandise.pull(req.params.itemId);
    await artist.save();

    res.json({ success: true, message: 'Merchandise deleted' });
  } catch (error) {
    console.error('Error deleting merchandise:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/artists/:id/events - Add event
router.post('/artists/:id/events', authenticateToken, async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) {
      return res.status(404).json({ success: false, message: 'Artist not found' });
    }

    if (artist.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const newEvent = new Event({
      title: req.body.title,
      date: req.body.date,
      location: req.body.location,
      time: req.body.time,
      ticketLink: req.body.ticketLink,
      artist: artist._id
    });

    await newEvent.save();
    artist.upcomingEvents.push(newEvent._id);
    await artist.save();

    res.status(201).json({ success: true, message: 'Event added', event: newEvent });
  } catch (error) {
    console.error('Error adding event:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/artists/:id/events/:eventId - Delete event
router.delete('/artists/:id/events/:eventId', authenticateToken, async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) {
      return res.status(404).json({ success: false, message: 'Artist not found' });
    }

    if (artist.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    await Event.findByIdAndDelete(req.params.eventId);
    artist.upcomingEvents.pull(req.params.eventId);
    await artist.save();

    res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/artists/:id/gallery - Add art piece
router.post('/artists/:id/gallery', authenticateToken, async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) {
      return res.status(404).json({ success: false, message: 'Artist not found' });
    }

    if (artist.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const newArt = new ArtGallery({
      title: req.body.title,
      description: req.body.description,
      image: req.body.image,
      artist: artist._id
    });

    await newArt.save();
    artist.artGallery.push(newArt._id);
    await artist.save();

    res.status(201).json({ success: true, message: 'Art piece added', art: newArt });
  } catch (error) {
    console.error('Error adding art piece:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/artists/:id/gallery/:artId - Delete art piece
router.delete('/artists/:id/gallery/:artId', authenticateToken, async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) {
      return res.status(404).json({ success: false, message: 'Artist not found' });
    }

    if (artist.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    await ArtGallery.findByIdAndDelete(req.params.artId);
    artist.artGallery.pull(req.params.artId);
    await artist.save();

    res.json({ success: true, message: 'Art piece deleted' });
  } catch (error) {
    console.error('Error deleting art piece:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/artists/:id/contact - Send message to artist
router.post('/artists/:id/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    const newContact = new Contact({
      artist: req.params.id,
      name,
      email,
      message
    });

    await newContact.save();

    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/artists/:id/owner - Check if user owns this artist profile
router.get('/artists/:id/owner', authenticateToken, async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) {
      return res.json({ isOwner: false });
    }
    res.json({ isOwner: artist.user.toString() === req.user.id });
  } catch (error) {
    res.json({ isOwner: false });
  }
});

// GET /api/users/:id/roles - Get user roles
router.get('/users/:id/roles', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.json([]);
    res.json(user.roles || []);
  } catch (error) {
    res.json([]);
  }
});

module.exports = router;