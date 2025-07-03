const mongoose = require('mongoose');
const crypto = require('crypto');

const paymentSchema = new mongoose.Schema({
    // Reference to the user making the payment
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // Reference to the event
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    
    // Payment details
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    
    currency: {
        type: String,
        default: 'KSH',
        enum: ['KSH', 'USD', 'EUR', 'GBP']
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
    
    // Payment method
    paymentMethod: {
        type: String,
        required: true,
        enum: ['mpesa', 'card', 'bank_transfer', 'paypal', 'cash']
    },
    
    // Payment status
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
        default: 'pending'
    },
    
    // Transaction ID from payment provider
    transactionId: {
        type: String,
        unique: true,
        sparse: true
    },
    
    // Internal reference number
    referenceNumber: {
        type: String,
        unique: true,
        required: true
    },
    
    // M-Pesa specific fields
    mpesaReceiptNumber: {
        type: String,
        sparse: true
    },
    
    phoneNumber: {
        type: String,
        required: function() {
            return this.paymentMethod === 'mpesa';
        }
    },
    
    checkoutRequestId: {
        type: String,
        sparse: true
    },
    
    // Card payment specific fields
    cardLast4: {
        type: String,
        required: function() {
            return this.paymentMethod === 'card';
        }
    },
    
    cardBrand: {
        type: String,
        enum: ['visa', 'mastercard', 'amex', 'discover'],
        required: function() {
            return this.paymentMethod === 'card';
        }
    },
    
    // Bank transfer specific fields
    bankReference: {
        type: String,
        required: function() {
            return this.paymentMethod === 'bank_transfer';
        }
    },
    
    // PayPal specific fields
    paypalTransactionId: {
        type: String,
        required: function() {
            return this.paymentMethod === 'paypal';
        }
    },
    
    // Payment processing
    processingFee: {
        type: Number,
        default: 0,
        min: 0
    },
    
    netAmount: {
        type: Number,
        required: true,
        min: 0
    },
    
    // Timestamps
    initiatedAt: {
        type: Date,
        default: Date.now
    },
    
    completedAt: {
        type: Date
    },
    
    failedAt: {
        type: Date
    },
    
    // Failure details
    failureReason: {
        type: String
    },
    
    failureCode: {
        type: String
    },
    
    // Refund details
    refundAmount: {
        type: Number,
        min: 0
    },
    
    refundReason: {
        type: String
    },
    
    refundedAt: {
        type: Date
    },
    
    refundTransactionId: {
        type: String
    },
    
    // Additional metadata
    ipAddress: {
        type: String
    },
    
    userAgent: {
        type: String
    },
    
    paymentSource: {
        type: String,
        enum: ['web', 'mobile', 'admin', 'api'],
        default: 'web'
    },
    
    // Webhook and callback data
    webhookData: {
        type: mongoose.Schema.Types.Mixed
    },
    
    callbackData: {
        type: mongoose.Schema.Types.Mixed
    },
    
    // Retry attempts
    retryCount: {
        type: Number,
        default: 0,
        min: 0,
        max: 3
    },
    
    lastRetryAt: {
        type: Date
    },
    
    // Notes and comments
    notes: {
        type: String
    },
    
    adminNotes: {
        type: String
    },
    
    // Discount/coupon information
    discountCode: {
        type: String
    },
    
    discountAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Tax information
    taxAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    taxRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
paymentSchema.index({ user: 1, event: 1 });
paymentSchema.index({ referenceNumber: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ mpesaReceiptNumber: 1 });
paymentSchema.index({ checkoutRequestId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentMethod: 1 });
paymentSchema.index({ initiatedAt: -1 });

// Pre-save middleware to generate reference number and calculate amounts
paymentSchema.pre('save', function(next) {
    if (this.isNew) {
        // Generate unique reference number
        const timestamp = Date.now().toString();
        const random = crypto.randomBytes(4).toString('hex').toUpperCase();
        this.referenceNumber = `PAY-${timestamp}-${random}`;
        
        // Calculate net amount (amount - processing fee)
        this.netAmount = this.amount - this.processingFee;
        
        // Calculate unit price if not provided
        if (!this.unitPrice && this.quantity > 0) {
            this.unitPrice = this.amount / this.quantity;
        }
    }
    
    // Update completion timestamp
    if (this.isModified('status')) {
        if (this.status === 'completed' && !this.completedAt) {
            this.completedAt = new Date();
        } else if (this.status === 'failed' && !this.failedAt) {
            this.failedAt = new Date();
        }
    }
    
    next();
});

// Virtual for payment age in minutes
paymentSchema.virtual('ageInMinutes').get(function() {
    return Math.floor((new Date() - this.initiatedAt) / (1000 * 60));
});

// Virtual for payment duration (for completed payments)
paymentSchema.virtual('processingDuration').get(function() {
    if (this.completedAt) {
        return Math.floor((this.completedAt - this.initiatedAt) / 1000); // in seconds
    }
    return null;
});

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
    return `${this.currency} ${this.amount.toLocaleString()}`;
});

// Virtual for payment summary
paymentSchema.virtual('summary').get(function() {
    return {
        referenceNumber: this.referenceNumber,
        amount: this.amount,
        currency: this.currency,
        status: this.status,
        paymentMethod: this.paymentMethod,
        initiatedAt: this.initiatedAt,
        completedAt: this.completedAt
    };
});

// Instance method to mark payment as completed
paymentSchema.methods.markAsCompleted = function(transactionData = {}) {
    if (this.status !== 'pending' && this.status !== 'processing') {
        throw new Error('Payment cannot be marked as completed');
    }
    
    this.status = 'completed';
    this.completedAt = new Date();
    
    // Set transaction-specific data
    if (transactionData.transactionId) {
        this.transactionId = transactionData.transactionId;
    }
    
    if (transactionData.mpesaReceiptNumber) {
        this.mpesaReceiptNumber = transactionData.mpesaReceiptNumber;
    }
    
    if (transactionData.callbackData) {
        this.callbackData = transactionData.callbackData;
    }
    
    return this.save();
};

// Instance method to mark payment as failed
paymentSchema.methods.markAsFailed = function(reason, code = null) {
    this.status = 'failed';
    this.failedAt = new Date();
    this.failureReason = reason;
    
    if (code) {
        this.failureCode = code;
    }
    
    return this.save();
};

// Instance method to process refund
paymentSchema.methods.processRefund = function(refundAmount, reason) {
    if (this.status !== 'completed') {
        throw new Error('Cannot refund incomplete payment');
    }
    
    if (refundAmount > this.amount) {
        throw new Error('Refund amount cannot exceed payment amount');
    }
    
    this.status = 'refunded';
    this.refundAmount = refundAmount;
    this.refundReason = reason;
    this.refundedAt = new Date();
    
    return this.save();
};

// Instance method to retry payment
paymentSchema.methods.retry = function() {
    if (this.retryCount >= 3) {
        throw new Error('Maximum retry attempts reached');
    }
    
    if (this.status !== 'failed') {
        throw new Error('Can only retry failed payments');
    }
    
    this.retryCount += 1;
    this.lastRetryAt = new Date();
    this.status = 'pending';
    this.failedAt = null;
    this.failureReason = null;
    this.failureCode = null;
    
    return this.save();
};

// Static method to get payments by user
paymentSchema.statics.getByUser = function(userId, options = {}) {
    const query = this.find({ user: userId });
    
    if (options.status) {
        query.where({ status: options.status });
    }
    
    if (options.paymentMethod) {
        query.where({ paymentMethod: options.paymentMethod });
    }
    
    if (options.dateFrom) {
        query.where({ initiatedAt: { $gte: options.dateFrom } });
    }
    
    if (options.dateTo) {
        query.where({ initiatedAt: { $lte: options.dateTo } });
    }
    
    return query.populate('event', 'title date venue')
                .sort({ initiatedAt: -1 });
};

// Static method to get payments by event
paymentSchema.statics.getByEvent = function(eventId, options = {}) {
    const query = this.find({ event: eventId });
    
    if (options.status) {
        query.where({ status: options.status });
    }
    
    return query.populate('user', 'name email phone')
                .sort({ initiatedAt: -1 });
};

// Static method to get payment statistics
paymentSchema.statics.getStats = function(eventId = null) {
    const matchStage = eventId ? { event: mongoose.Types.ObjectId(eventId) } : {};
    
    return this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalPayments: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
                completedPayments: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
                    }
                },
                completedAmount: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0]
                    }
                },
                failedPayments: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
                    }
                },
                pendingPayments: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
                    }
                },
                refundedPayments: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0]
                    }
                },
                refundedAmount: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'refunded'] }, '$refundAmount', 0]
                    }
                }
            }
        }
    ]);
};

// Static method to get payment method statistics
paymentSchema.statics.getPaymentMethodStats = function(eventId = null) {
    const matchStage = eventId ? { event: mongoose.Types.ObjectId(eventId) } : {};
    
    return this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$paymentMethod',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
                completedCount: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
                    }
                },
                completedAmount: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0]
                    }
                }
            }
        },
        { $sort: { totalAmount: -1 } }
    ]);
};

// Static method to find expired pending payments
paymentSchema.statics.findExpiredPending = function(minutesOld = 30) {
    const cutoffTime = new Date(Date.now() - minutesOld * 60 * 1000);
    return this.find({
        status: 'pending',
        initiatedAt: { $lt: cutoffTime }
    });
};

module.exports = mongoose.model('Payment', paymentSchema);