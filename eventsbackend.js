const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
const moment = require('moment');
require('dotenv').config();

// Import models
const Event = require('./models/Event');
const Ticket = require('./models/Ticket');
const Payment = require('./models/Payment');

// M-Pesa Configuration
const MPESA_CONFIG = {
    consumer_key: process.env.MPESA_CONSUMER_KEY,
    consumer_secret: process.env.MPESA_CONSUMER_SECRET,
    business_short_code: process.env.MPESA_SHORTCODE,
    passkey: process.env.MPESA_PASSKEY,
    callback_url: process.env.MPESA_CALLBACK_URL || 'https://yourdomain.com/api/payments/mpesa/callback',
    base_url: process.env.MPESA_ENV === 'production' 
        ? 'https://api.safaricom.co.ke' 
        : 'https://sandbox.safaricom.co.ke'
};

// M-Pesa access token cache
let mpesaAccessToken = null;
let tokenExpiryTime = null;

// Helper function to get M-Pesa access token
async function getMpesaAccessToken() {
    try {
        if (mpesaAccessToken && tokenExpiryTime && moment().isBefore(tokenExpiryTime)) {
            return mpesaAccessToken;
        }

        const auth = Buffer.from(`${MPESA_CONFIG.consumer_key}:${MPESA_CONFIG.consumer_secret}`).toString('base64');
        
        const response = await axios.get(`${MPESA_CONFIG.base_url}/oauth/v1/generate?grant_type=client_credentials`, {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });

        mpesaAccessToken = response.data.access_token;
        tokenExpiryTime = moment().add(response.data.expires_in, 'seconds');
        
        return mpesaAccessToken;
    } catch (error) {
        console.error('Error getting M-Pesa access token:', error);
        throw error;
    }
}

// Helper function to generate M-Pesa password
function generateMpesaPassword(timestamp) {
    const data = MPESA_CONFIG.business_short_code + MPESA_CONFIG.passkey + timestamp;
    return Buffer.from(data).toString('base64');
}

// Routes
module.exports = function(app) {
// Get all active events
app.get('/api/events', async (req, res) => {
    try {
        const events = await Event.find({ status: 'active' }).sort({ date: 1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single event
app.get('/api/events/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }        
        res.json(event);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get tickets for user
app.get('/api/tickets/user/:userId', async (req, res) => {
    try {
        const tickets = await Ticket.find({ user: req.params.userId })
            .populate('event', 'title date time venue')
            .sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get tickets for event
app.get('/api/tickets/event/:eventId', async (req, res) => {
    try {
        const tickets = await Ticket.find({ event: req.params.eventId })
            .populate('user', 'name email')
            .sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create ticket
app.post('/api/tickets', async (req, res) => {
    try {
        const ticket = new Ticket(req.body);
        await ticket.save();
        res.status(201).json(ticket);
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// M-Pesa STK Push
app.post('/api/payments/mpesa', async (req, res) => {
    try {
        const { phoneNumber, amount, eventId, quantity } = req.body;
        
        // Validate input
        if (!phoneNumber || !amount || !eventId || !quantity) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Format phone number (remove leading zero and add 254)
        const formattedPhone = phoneNumber.startsWith('0') 
            ? '254' + phoneNumber.slice(1) 
            : phoneNumber;

        // Get access token
        const accessToken = await getMpesaAccessToken();
        
        // Generate timestamp and password
        const timestamp = moment().format('YYYYMMDDHHmmss');
        const password = generateMpesaPassword(timestamp);
        
        // Create payment record
        const payment = new Payment({
            event: eventId,
            amount,
            phoneNumber: formattedPhone,
            paymentMethod: 'mpesa',
            status: 'pending',
            quantity
        });
        await payment.save();

        // STK Push request
        const stkPushData = {
            BusinessShortCode: MPESA_CONFIG.business_short_code,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: formattedPhone,
            PartyB: MPESA_CONFIG.business_short_code,
            PhoneNumber: formattedPhone,
            CallBackURL: MPESA_CONFIG.callback_url,
            AccountReference: `TICKET-${payment._id}`,
            TransactionDesc: `Event ticket purchase`
        };

        const response = await axios.post(
            `${MPESA_CONFIG.base_url}/mpesa/stkpush/v1/processrequest`,
            stkPushData,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Update payment with checkout request ID
        payment.checkoutRequestId = response.data.CheckoutRequestID;
        await payment.save();

        res.json({
            message: 'STK Push sent successfully',
            checkoutRequestId: response.data.CheckoutRequestID,
            paymentId: payment._id
        });

    } catch (error) {
        console.error('M-Pesa payment error:', error);
        res.status(500).json({ 
            message: 'Payment initiation failed',
            error: error.response?.data || error.message 
        });
    }
});

// M-Pesa callback
app.post('/api/payments/mpesa/callback', async (req, res) => {
    try {
        const { Body } = req.body;
        const { stkCallback } = Body;
        
        const checkoutRequestId = stkCallback.CheckoutRequestID;
        const resultCode = stkCallback.ResultCode;
        
        // Find payment record
        const payment = await Payment.findOne({ checkoutRequestId });
        
        if (!payment) {
            console.error('Payment not found for checkout request ID:', checkoutRequestId);
            return res.status(404).json({ message: 'Payment not found' });
        }

        if (resultCode === 0) {
            // Payment successful
            const callbackMetadata = stkCallback.CallbackMetadata;
            const items = callbackMetadata.Item;
            
            let mpesaReceiptNumber = '';
            let transactionDate = '';
            
            items.forEach(item => {
                if (item.Name === 'MpesaReceiptNumber') {
                    mpesaReceiptNumber = item.Value;
                }
                if (item.Name === 'TransactionDate') {
                    transactionDate = item.Value;
                }
            });

            // Update payment status
            payment.status = 'completed';
            payment.mpesaReceiptNumber = mpesaReceiptNumber;
            payment.transactionDate = transactionDate;
            await payment.save();

            // Create ticket
            const ticket = new Ticket({
                user: payment.user,
                event: payment.event,
                payment: payment._id,
                quantity: payment.quantity,
                totalAmount: payment.amount,
                status: 'active'
            });
            await ticket.save();

            // Update event attendees count
            await Event.findByIdAndUpdate(
                payment.event,
                { $inc: { attendees: payment.quantity } }
            );

            console.log('Payment completed successfully:', mpesaReceiptNumber);
        } else {
            // Payment failed
            payment.status = 'failed';
            payment.failureReason = stkCallback.ResultDesc;
            await payment.save();
            
            console.log('Payment failed:', stkCallback.ResultDesc);
        }

        res.json({ message: 'Callback processed successfully' });
    } catch (error) {
        console.error('M-Pesa callback error:', error);
        res.status(500).json({ message: 'Callback processing failed' });
    }
});

// Check payment status
app.get('/api/payments/:paymentId/status', async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.paymentId);
        
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        
        res.json({
            status: payment.status,
            mpesaReceiptNumber: payment.mpesaReceiptNumber,
            transactionDate: payment.transactionDate
        });
    } catch (error) {
        console.error('Error checking payment status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all payments
app.get('/api/payments', async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate('event', 'title date')
            .populate('user', 'name email')
            .sort({ createdAt: -1 });
        res.json(payments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Search events
app.get('/api/search/events', async (req, res) => {
    try {
        const { q, category, location, date, minPrice, maxPrice } = req.query;
        
        let query = { status: 'active' };
        
        if (q) {
            query.$or = [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { venue: { $regex: q, $options: 'i' } }
            ];
        }
        
        if (category) {
            query.category = category;
        }
        
        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }
        
        if (date) {
            query.date = date;
        }
        
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseInt(minPrice);
            if (maxPrice) query.price.$lte = parseInt(maxPrice);
        }
        
        const events = await Event.find(query)
            .populate('organizer', 'name')
            .sort({ date: 1 });
        
        res.json(events);
    } catch (error) {
        console.error('Error searching events:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get event statistics
app.get('/api/stats/events', async (req, res) => {
    try {
        const totalEvents = await Event.countDocuments({ status: 'active' });
        const totalTicketsSold = await Ticket.countDocuments({ status: 'active' });
        const totalRevenue = await Payment.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        const eventsByCategory = await Event.aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);
        
        res.json({
            totalEvents,
            totalTicketsSold,
            totalRevenue: totalRevenue[0]?.total || 0,
            eventsByCategory
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

};