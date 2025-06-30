const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const express = require('express');
const Event = require('./models/Event'); // Import Event model
const Memory = require('./models/Memory');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/memories';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4', 'video/mov', 'video/avi'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    }
});

// Memory Routes
module.exports = function(app) {
    
    // Get all memories
    app.get('/api/memories', async (req, res) => {
        try {
            const memories = await Memory.find()
                .populate('eventId', 'title date venue location')
                .sort({ createdAt: -1 });
            
            // Format memories for frontend
            const formattedMemories = memories.map(memory => ({
                _id: memory._id,
                eventName: memory.eventName,
                eventDate: memory.eventDate,
                location: memory.location,
                type: memory.type,
                mediaUrl: `/uploads/memories/${path.basename(memory.mediaUrl)}`,
                caption: memory.caption,
                likes: memory.likes,
                comments: memory.comments,
                createdAt: memory.createdAt,
                _hasLiked: false // You can implement user-specific logic here
            }));

            res.json({ 
                success: true, 
                memories: formattedMemories 
            });
        } catch (error) {
            console.error('Error fetching memories:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch memories' 
            });
        }
    });

    // Get events for dropdown 
    app.get('/api/events', async (req, res) => {
        try {  
            
            const events = await Event.find({ status: 'active' })
                .select('_id title')
                .sort({ date: -1 });

            const formattedEvents = events.map(event => ({
                _id: event._id,
                name: event.title
            }));

            res.json({ 
                success: true, 
                events: formattedEvents 
            });
        } catch (error) {
            console.error('Error fetching events:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch events' 
            });
        }
    });

    // Upload memory
    app.post('/api/memories/upload', upload.single('file'), async (req, res) => {
        try {
            const { eventId, caption, type } = req.body;
            
            if (!req.file) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'No file uploaded' 
                });
            }

            if (!eventId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Event ID is required' 
                });
            }

            // Get event details
            
            const event = await Event.findById(eventId);
            
            if (!event) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Event not found' 
                });
            }

            // Create new memory
            const memory = new Memory({
                eventId: eventId,
                eventName: event.title,
                eventDate: event.date,
                location: event.location,
                type: type || (req.file.mimetype.startsWith('video/') ? 'video' : 'image'),
                mediaUrl: req.file.path,
                caption: caption || 'New memory uploaded!',
                userId: req.user?._id // Add if you have user authentication
            });

            await memory.save();

            // Format response for frontend
            const formattedMemory = {
                _id: memory._id,
                eventName: memory.eventName,
                eventDate: memory.eventDate,
                location: memory.location,
                type: memory.type,
                mediaUrl: `/uploads/memories/${path.basename(memory.mediaUrl)}`,
                caption: memory.caption,
                likes: memory.likes,
                comments: memory.comments,
                createdAt: memory.createdAt,
                _hasLiked: false
            };

            res.json({ 
                success: true, 
                message: 'Memory uploaded successfully',
                memory: formattedMemory
            });

        } catch (error) {
            console.error('Error uploading memory:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to upload memory' 
            });
        }
    });

    // Like/Unlike memory
    app.post('/api/memories/:id/like', async (req, res) => {
        try {
            const memoryId = req.params.id;
            const action = req.headers['x-action']; // 'like' or 'unlike'
            // const userId = req.user?._id; // Add if you have user authentication

            const memory = await Memory.findById(memoryId);
            
            if (!memory) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Memory not found' 
                });
            }

            if (action === 'like') {
                memory.likes += 1;
                // memory.likedBy.push(userId); // Add if you have user authentication
            } else if (action === 'unlike') {
                memory.likes = Math.max(0, memory.likes - 1);
                // memory.likedBy = memory.likedBy.filter(id => !id.equals(userId)); // Add if you have user authentication
            }

            await memory.save();

            res.json({ 
                success: true, 
                likes: memory.likes 
            });

        } catch (error) {
            console.error('Error toggling like:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to toggle like' 
            });
        }
    });

    // Delete memory
    app.delete('/api/memories/:id', async (req, res) => {
        try {
            const memoryId = req.params.id;
            
            const memory = await Memory.findById(memoryId);
            
            if (!memory) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Memory not found' 
                });
            }

            // Delete file from filesystem
            if (fs.existsSync(memory.mediaUrl)) {
                fs.unlinkSync(memory.mediaUrl);
            }

            // Delete from database
            await Memory.findByIdAndDelete(memoryId);

            res.json({ 
                success: true, 
                message: 'Memory deleted successfully' 
            });

        } catch (error) {
            console.error('Error deleting memory:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to delete memory' 
            });
        }
    });

    // Get single memory
    app.get('/api/memories/:id', async (req, res) => {
        try {
            const memory = await Memory.findById(req.params.id)
                .populate('eventId', 'title date venue location');
            
            if (!memory) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Memory not found' 
                });
            }

            const formattedMemory = {
                _id: memory._id,
                eventName: memory.eventName,
                eventDate: memory.eventDate,
                location: memory.location,
                type: memory.type,
                mediaUrl: `/uploads/memories/${path.basename(memory.mediaUrl)}`,
                caption: memory.caption,
                likes: memory.likes,
                comments: memory.comments,
                createdAt: memory.createdAt,
                _hasLiked: false
            };

            res.json({ 
                success: true, 
                memory: formattedMemory 
            });

        } catch (error) {
            console.error('Error fetching memory:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch memory' 
            });
        }
    });

    // Serve uploaded files
    app.use('/uploads', express.static('uploads'));
    
    // Handle 404 for API routes
    app.use('/api/memories', (req, res) => {
        res.status(404).json({ 
            success: false, 
            message: 'API route not found' 
        });
    });

    // Handle 404 for static files
    app.use('/uploads', (req, res) => {
        res.status(404).json({ 
            success: false, 
            message: 'Static file not found' 
        });
    });

    // Handle 500 errors
    app.use((err, req, res, next) => {
        console.error('Server error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
        console.error('Uncaught Exception:', err);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

   };

// Export the Memory model for use in other parts of your application
module.exports.Memory = Memory;