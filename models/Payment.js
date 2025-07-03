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
        unique: true, // KEEP this here.
        sparse: true
    },
    
    // Internal reference number
    referenceNumber: {
        type: String,
        unique: true, // KEEP this here.
        required: true
    },
    
    // M-Pesa specific fields
    mpesaReceiptNumber: {
        type: String,
        unique: true, // ADD unique: true here if you want it unique and indexed
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
        unique: true, // ADD unique: true here if you want it unique and indexed
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
paymentSchema.index({ user: 1, event: 1 }); // Compound index - KEEP
paymentSchema.index({ status: 1 });         // Single field index - KEEP
paymentSchema.index({ paymentMethod: 1 });  // Single field index - KEEP
paymentSchema.index({ initiatedAt: -1 });   // Single field index - KEEP

// REMOVE the following lines as they are redundant with 'unique: true'
// paymentSchema.index({ referenceNumber: 1 });
// paymentSchema.index({ transactionId: 1 });
// paymentSchema.index({ mpesaReceiptNumber: 1 });
// paymentSchema.index({ checkoutRequestId: 1 });


// Pre-save middleware to generate reference number and calculate amounts
paymentSchema.pre('save', function(next) {
    if (this.isNew) {
        // Generate unique reference number
        const timestamp = Date.now().toString();
        const random = crypto.randomBytes(4).toString('hex').toUpperCase();
        this.referenceNumber = `PAY-${timestamp}-${random}`;
        
        // Calculate net amount (amount - processing fee)
        this.netAmount = this.amount - (this.processingFee || 0); // Ensure processingFee is handled if null/undefined
        
        // Calculate unit price if not provided
        if ((this.unitPrice === undefined || this.unitPrice === null) && this.quantity > 0) {
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

// Virtuals, Instance methods, Static methods (all look good)
// ... (rest of your schema code) ...

module.exports = mongoose.model('Payment', paymentSchema);