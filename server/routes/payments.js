const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_API_KEY);
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Show = require('../models/Show');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Handle validation errors
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

// @route   POST /api/payments/create-payment-intent
// @desc    Create Stripe payment intent for booking
// @access  Private
router.post('/create-payment-intent', auth, [
  body('bookingId').isMongoId().withMessage('Valid booking ID is required'),
  body('paymentMethod').isIn(['card', 'upi', 'netbanking', 'wallet']).withMessage('Valid payment method is required')
], handleValidation, async (req, res) => {
  try {
    const { bookingId, paymentMethod } = req.body;

    // Verify booking exists and belongs to user
    const booking = await Booking.findById(bookingId)
      .populate('movie', 'title')
      .populate('theater', 'name')
      .populate('show', 'showDate showTime');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (booking.payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Payment already processed for this booking'
      });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalAmount.total * 100), // Convert to paise
      currency: 'inr',
      metadata: {
        bookingId: booking._id.toString(),
        userId: req.user._id.toString(),
        movieTitle: booking.movie.title,
        theaterName: booking.theater.name,
        showDate: booking.show.showDate.toISOString().split('T')[0],
        showTime: booking.show.showTime,
        seatCount: booking.seats.length.toString()
      },
      description: `Movie ticket booking - ${booking.movie.title} at ${booking.theater.name}`,
      receipt_email: booking.contactDetails.email,
      shipping: {
        name: req.user.name,
        phone: booking.contactDetails.phone,
        address: {
          line1: booking.theater.name,
          city: 'Movie Theater',
          country: 'IN'
        }
      }
    });

    // Update booking with payment intent details
    booking.payment.paymentId = paymentIntent.id;
    booking.payment.method = paymentMethod;
    await booking.save();

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: booking.totalAmount.total
      }
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating payment intent'
    });
  }
});

// @route   POST /api/payments/confirm-payment
// @desc    Confirm payment and complete booking
// @access  Private
router.post('/confirm-payment', auth, [
  body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
  body('bookingId').isMongoId().withMessage('Valid booking ID is required')
], handleValidation, async (req, res) => {
  try {
    const { paymentIntentId, bookingId } = req.body;

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed successfully'
      });
    }

    // Verify booking
    const booking = await Booking.findById(bookingId)
      .populate('movie', 'title poster')
      .populate('theater', 'name address')
      .populate('show', 'showDate showTime');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Verify payment amount matches
    const expectedAmount = Math.round(booking.totalAmount.total * 100);
    if (paymentIntent.amount !== expectedAmount) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount mismatch'
      });
    }

    // Update booking payment status
    booking.payment.status = 'completed';
    booking.payment.transactionId = paymentIntent.id;
    booking.payment.paidAt = new Date();
    booking.bookingStatus = 'confirmed';

    // Generate QR code data
    const qrData = {
      bookingId: booking.bookingId,
      movieTitle: booking.movie.title,
      theater: booking.theater.name,
      showDate: booking.show.showDate,
      showTime: booking.show.showTime,
      seats: booking.seats.map(s => `${s.row}${s.seatNumber}`).join(', ')
    };
    booking.qrCode = Buffer.from(JSON.stringify(qrData)).toString('base64');

    await booking.save();

    // Send confirmation email/SMS (implement as needed)
    // await sendBookingConfirmation(booking);

    res.json({
      success: true,
      message: 'Payment confirmed and booking completed successfully',
      data: {
        bookingId: booking.bookingId,
        transactionId: paymentIntent.id,
        amount: booking.totalAmount.total,
        status: 'confirmed'
      }
    });

  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error confirming payment'
    });
  }
});

// @route   POST /api/payments/webhook
// @desc    Handle Stripe webhooks
// @access  Public
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      
      // Update booking status if not already updated
      try {
        const booking = await Booking.findOne({ 
          'payment.paymentId': paymentIntent.id 
        });
        
        if (booking && booking.payment.status === 'pending') {
          booking.payment.status = 'completed';
          booking.payment.paidAt = new Date();
          booking.bookingStatus = 'confirmed';
          await booking.save();
        }
      } catch (error) {
        console.error('Error updating booking from webhook:', error);
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      
      // Handle failed payment
      try {
        const booking = await Booking.findOne({ 
          'payment.paymentId': failedPayment.id 
        });
        
        if (booking) {
          booking.payment.status = 'failed';
          booking.bookingStatus = 'expired';
          await booking.save();
          
          // Release seats
          await releaseSeatsFromShow(booking.show, booking.seats);
        }
      } catch (error) {
        console.error('Error handling failed payment:', error);
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// @route   POST /api/payments/refund
// @desc    Process refund for cancelled booking
// @access  Private
router.post('/refund', auth, [
  body('bookingId').isMongoId().withMessage('Valid booking ID is required'),
  body('reason').optional().trim().isLength({ max: 500 })
], handleValidation, async (req, res) => {
  try {
    const { bookingId, reason } = req.body;

    // Verify booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (booking.bookingStatus !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking must be cancelled before refund'
      });
    }

    if (booking.payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'No payment to refund'
      });
    }

    // Calculate refund amount
    const refundAmount = booking.cancellation.refundAmount || booking.calculateRefundAmount();
    
    if (refundAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No refund amount available'
      });
    }

    // Create Stripe refund
    const refund = await stripe.refunds.create({
      payment_intent: booking.payment.paymentId,
      amount: Math.round(refundAmount * 100), // Convert to paise
      reason: 'requested_by_customer',
      metadata: {
        bookingId: booking._id.toString(),
        originalAmount: booking.totalAmount.total.toString(),
        refundReason: reason || 'User cancellation'
      }
    });

    // Update booking with refund details
    booking.payment.refundId = refund.id;
    booking.payment.refundAmount = refundAmount;
    booking.payment.refundedAt = new Date();
    booking.payment.status = 'refunded';

    await booking.save();

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundId: refund.id,
        refundAmount,
        status: refund.status,
        estimatedArrival: 'Refund will be processed in 5-10 business days'
      }
    });

  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing refund'
    });
  }
});

// @route   GET /api/payments/payment-methods
// @desc    Get available payment methods
// @access  Public
router.get('/payment-methods', (req, res) => {
  res.json({
    success: true,
    data: {
      methods: [
        {
          id: 'card',
          name: 'Credit/Debit Card',
          icon: 'credit-card',
          enabled: true,
          description: 'Visa, Mastercard, RuPay, American Express'
        },
        {
          id: 'upi',
          name: 'UPI',
          icon: 'mobile',
          enabled: true,
          description: 'Pay using any UPI app'
        },
        {
          id: 'netbanking',
          name: 'Net Banking',
          icon: 'bank',
          enabled: true,
          description: 'All major banks supported'
        },
        {
          id: 'wallet',
          name: 'Digital Wallet',
          icon: 'wallet',
          enabled: true,
          description: 'Paytm, PhonePe, GooglePay'
        }
      ]
    }
  });
});

// Helper function to release seats (same as in bookings route)
async function releaseSeatsFromShow(showId, seats) {
  try {
    const show = await Show.findById(showId);
    if (!show) return;

    const seatIds = seats.map(seat => seat.seatId);
    
    show.seats.booked = show.seats.booked.filter(
      bookedSeat => !seatIds.includes(bookedSeat.seatId)
    );
    
    show.seats.available += seats.length;
    await show.save();
  } catch (error) {
    console.error('Error releasing seats:', error);
  }
}

module.exports = router;