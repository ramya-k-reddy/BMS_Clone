const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51S68IADc9q6ZN2kAuURrNWfJ1LfC5zBrBMXDuIE4yjcjnaC0k9lJQpfzoHTk7wXeMuasWWx8EqnQ1xNeItUoXHLy00YAx4Uwar');
const { auth } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Show = require('../models/Show');
const { sendBookingConfirmation } = require('../services/emailService');

// Create payment intent
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Get booking details
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    console.log('Booking status check:', {
      bookingId: booking._id,
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.payment?.status,
      createdAt: booking.createdAt
    });

    // Check if booking belongs to the user
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to booking',
        debug: {
          bookingUser: booking.user.toString(),
          currentUser: req.user._id.toString()
        }
      });
    }

    // Check if booking is still pending
    if (booking.bookingStatus !== 'pending') {
      console.error('Booking not in pending status:', {
        bookingId: booking._id,
        currentStatus: booking.bookingStatus,
        expectedStatus: 'pending'
      });
      return res.status(400).json({
        success: false,
        message: 'Booking is not in pending status',
        debug: {
          currentStatus: booking.bookingStatus,
          expectedStatus: 'pending'
        }
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalAmount.total * 100), // Convert to cents
      currency: 'inr',
      metadata: {
        bookingId: booking._id.toString(),
        userId: req.user._id.toString()
      },
      description: `Booking for ${booking.seats.length} seats`
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        amount: booking.totalAmount.total
      }
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    
    // Return more specific error messages
    if (error.type === 'StripeAuthenticationError') {
      return res.status(500).json({
        success: false,
        message: 'Payment service configuration error. Please contact support.',
        error: 'Stripe API key is invalid or expired'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
});

// Confirm payment and update booking
router.post('/confirm-payment', auth, async (req, res) => {
  try {
    const { bookingId, paymentIntentId } = req.body;

    // Get booking
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const paymentSucceeded = paymentIntent.status === 'succeeded';
    
    if (paymentSucceeded) {
      // Update booking status
      booking.bookingStatus = 'confirmed';
      booking.payment = {
        paymentId: paymentIntentId,
        method: 'stripe',
        status: 'completed',
        transactionId: paymentIntentId,
        paidAt: new Date()
      };
      await booking.save();

      // Move seats from reserved to booked in show
      const show = await Show.findById(booking.show)
        .populate('theater', 'name address')
        .populate('screen');
      
      if (show) {
        // Remove from reserved
        show.seats.reserved = show.seats.reserved.filter(
          seat => seat.bookingId.toString() !== booking._id.toString()
        );
        
        // Add to booked
        booking.seats.forEach(seat => {
          show.seats.booked.push({
            seatId: seat.seatId,
            row: seat.row,
            seatNumber: seat.seatNumber,
            category: seat.category,
            bookedBy: booking.user,
            bookingId: booking._id,
            bookedAt: new Date()
          });
        });
        
        // Update available seats count
        show.seats.available -= booking.seats.length;
        
        await show.save();
        console.log(`✅ Moved ${booking.seats.length} seats from reserved to booked for booking ${booking.bookingId}`);
        
        // Send confirmation email with ticket details
        const bookingWithDetails = await Booking.findById(booking._id)
          .populate('movie', 'title')
          .populate('theater', 'name')
          .populate({
            path: 'show',
            populate: { path: 'screen', select: 'screenNumber' }
          });
        
        if (bookingWithDetails) {
          // Send confirmation email - don't fail booking if email fails
          try {
            await sendBookingConfirmation(
              bookingWithDetails,
              bookingWithDetails.show,
              bookingWithDetails.movie,
              bookingWithDetails.theater
            );
          } catch (emailError) {
            console.error('⚠️ Failed to send confirmation email, but booking succeeded:', emailError.message);
          }
        }
      }

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        data: booking
      });
    } else {
      // Payment failed - release reserved seats
      const show = await Show.findById(booking.show);
      if (show) {
        show.seats.reserved = show.seats.reserved.filter(
          seat => seat.bookingId.toString() !== booking._id.toString()
        );
        await show.save();
        console.log(`❌ Payment failed - released reserved seats for booking ${booking.bookingId}`);
      }
      
      res.status(400).json({
        success: false,
        message: 'Payment not completed',
        paymentStatus: paymentIntent.status
      });
    }
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: error.message
    });
  }
});

module.exports = router;
