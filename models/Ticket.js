const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true
    },
    ticketNumber: {
        type: String,
        unique: true,
        required: true
    },
    ticketType: {
        type: String,
        enum: ['General Admission', 'VIP', 'Premium', 'Student', 'Early Bird', 'Group'],
        default: 'General Admission'
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['active', 'used', 'cancelled', 'refunded', 'expired'],
        default: 'active'
    },
    qrCode: {
        type: String,
        unique: true
    },
    isValidated: {
        type: Boolean,
        default: false
    },
    validatedAt: {
        type: Date
    },
    validatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    seatNumber: {
        type: String
    },
    section: {
        type: String
    },
    originalOwner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    transferHistory: [{
        fromUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        toUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        transferDate: {
            type: Date,
            default: Date.now
        },
        reason: String
    }],
    refundRequested: {
        type: Boolean,
        default: false
    },
    refundRequestDate: {
        type: Date
    },
    refundReason: {
        type: String
    },
    refundStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'processed'],
        default: 'pending'
    },
    refundAmount: {
        type: Number,
        min: 0
    },
    purchaseSource: {
        type: String,
        enum: ['web', 'mobile', 'admin', 'partner'],
        default: 'web'
    },
    specialRequirements: {
        type: String
    },
    notes: {
        type: String
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance (no duplicates)
ticketSchema.index({ user: 1, event: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ purchaseDate: -1 });

// Pre-save middleware to generate ticket number and QR code
ticketSchema.pre('save', async function (next) {
    if (this.isNew) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        this.ticketNumber = `TKT-${timestamp}-${random}`.toUpperCase();

        const qrData = {
            ticketId: this._id,
            eventId: this.event,
            userId: this.user,
            ticketNumber: this.ticketNumber,
            quantity: this.quantity
        };
        this.qrCode = Buffer.from(JSON.stringify(qrData)).toString('base64');

        if (this.event) {
            try {
                const Event = mongoose.model('Event');
                const event = await Event.findById(this.event);
                if (event) {
                    this.expiryDate = new Date(event.date + 'T' + (event.endTime || '23:59'));
                    this.expiryDate.setHours(this.expiryDate.getHours() + 24);
                }
            } catch (error) {
                console.error('Error setting expiry date:', error);
            }
        }
    }
    next();
});

// Virtuals
ticketSchema.virtual('validationUrl').get(function () {
    return `/api/tickets/${this._id}/validate`;
});

ticketSchema.virtual('daysUntilExpiry').get(function () {
    if (!this.expiryDate) return null;
    const now = new Date();
    const diffTime = this.expiryDate - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

ticketSchema.virtual('pricePerTicket').get(function () {
    return this.quantity > 0 ? this.totalAmount / this.quantity : 0;
});

// Instance methods
ticketSchema.methods.validateTicket = function (validatorId) {
    if (this.status !== 'active') throw new Error('Ticket is not active');
    if (this.isValidated) throw new Error('Ticket already validated');
    if (this.expiryDate && new Date() > this.expiryDate) throw new Error('Ticket has expired');

    this.isValidated = true;
    this.validatedAt = new Date();
    this.validatedBy = validatorId;
    this.status = 'used';
    return this.save();
};

ticketSchema.methods.transferTo = function (newUserId, reason = '') {
    if (this.status !== 'active') throw new Error('Cannot transfer inactive ticket');
    if (this.isValidated) throw new Error('Cannot transfer validated ticket');

    this.transferHistory.push({
        fromUser: this.user,
        toUser: newUserId,
        reason
    });

    if (!this.originalOwner) {
        this.originalOwner = this.user;
    }

    this.user = newUserId;
    return this.save();
};

ticketSchema.methods.requestRefund = function (reason) {
    if (this.status !== 'active') throw new Error('Cannot refund inactive ticket');
    if (this.isValidated) throw new Error('Cannot refund validated ticket');
    if (this.refundRequested) throw new Error('Refund already requested');

    this.refundRequested = true;
    this.refundRequestDate = new Date();
    this.refundReason = reason;
    this.refundStatus = 'pending';
    return this.save();
};

// Static methods
ticketSchema.statics.getByUser = function (userId, options = {}) {
    const query = this.find({ user: userId });

    if (options.status) {
        query.where({ status: options.status });
    }

    if (options.upcoming) {
        query.populate({
            path: 'event',
            match: { date: { $gte: new Date() } }
        });
    } else {
        query.populate('event');
    }

    return query.populate('payment').sort({ purchaseDate: -1 });
};

ticketSchema.statics.getByEvent = function (eventId, options = {}) {
    const query = this.find({ event: eventId });

    if (options.status) {
        query.where({ status: options.status });
    }

    return query.populate('user', 'name email phone')
                .populate('payment')
                .sort({ purchaseDate: -1 });
};

ticketSchema.statics.getStats = function (eventId) {
    return this.aggregate([
        { $match: { event: mongoose.Types.ObjectId(eventId) } },
        {
            $group: {
                _id: null,
                totalTickets: { $sum: '$quantity' },
                totalRevenue: { $sum: '$totalAmount' },
                activeTickets: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'active'] }, '$quantity', 0]
                    }
                },
                usedTickets: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'used'] }, '$quantity', 0]
                    }
                },
                cancelledTickets: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'cancelled'] }, '$quantity', 0]
                    }
                }
            }
        }
    ]);
};

module.exports = mongoose.model('Ticket', ticketSchema);
