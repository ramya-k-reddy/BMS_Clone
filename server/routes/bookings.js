const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Show = require('../models/Show');
const Movie = require('../models/Movie');
const Theater = require('../models/Theater');
const User = require('../models/User');
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

// @route   POST /api/bookings/initiate
// @desc    Initiate booking (reserve seats temporarily)
// @access  Private
router.post('/initiate', auth, [
  body('showId').isMongoId().withMessage('Valid show ID is required'),
  body('seats').isArray({ min: 1 }).withMessage('At least one seat is required'),
  body('seats.*.seatId').notEmpty().withMessage('Seat ID is required'),
  body('seats.*.row').notEmpty().withMessage('Seat row is required'),
  body('seats.*.seatNumber').isInt({ min: 1 }).withMessage('Valid seat number is required'),
  body('seats.*.category').notEmpty().withMessage('Seat category is required'),
  body('contactDetails.email').isEmail().withMessage('Valid email is required'),
  body('contactDetails.phone').matches(/^\d{10}$/).withMessage('Valid 10-digit phone is required')
], handleValidation, async (req, res) => {
  try {
    const { showId, seats, contactDetails } = req.body;
    const userId = req.user._id;

    // Verify show exists and is bookable
    const show = await Show.findById(showId)
      .populate('movie', 'title duration')
      .populate('theater', 'name address');

    if (!show || !show.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Show not found'
      });
    }

    if (!show.isBookable()) {
      return res.status(400).json({
        success: false,
        message: 'Show is not available for booking'
      });
    }

    // Check if seats are available
    const bookedSeats = show.seats.booked.map(seat => seat.seatId);
    const blockedSeats = show.seats.blocked.map(seat => seat.seatId);
    const unavailableSeats = [...bookedSeats, ...blockedSeats];

    const requestedSeatIds = seats.map(seat => seat.seatId);
    const conflictingSeats = requestedSeatIds.filter(seatId => 
      unavailableSeats.includes(seatId)
    );

    if (conflictingSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some selected seats are no longer available',
        data: { conflictingSeats }
      });
    }

    // Calculate pricing
    const pricing = {};
    show.pricing.forEach(p => {
      pricing[p.category] = p.price;
    });

    let subtotal = 0;
    const seatsWithPricing = seats.map(seat => {
      const price = pricing[seat.category] || 0;
      subtotal += price;
      return { ...seat, price };
    });

    const taxes = Math.round(subtotal * 0.18); // 18% GST
    const convenienceFee = Math.round(seats.length * 20); // ₹20 per seat
    const total = subtotal + taxes + convenienceFee;

    // Create temporary booking
    const booking = new Booking({
      user: userId,
      show: showId,
      movie: show.movie._id,
      theater: show.theater._id,
      seats: seatsWithPricing,
      totalAmount: {
        subtotal,
        taxes,
        convenienceFee,
        discount: 0,
        total
      },
      payment: {
        paymentId: `temp_${Date.now()}_${userId}`,
        method: 'pending',
        status: 'pending'
      },
      contactDetails,
      bookingStatus: 'confirmed', // Will be updated after payment
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        bookingSource: 'web'
      }
    });

    // Reserve seats in show (temporarily)
    const seatReservations = seats.map(seat => ({
      seatId: seat.seatId,
      row: seat.row,
      seatNumber: seat.seatNumber,
      category: seat.category,
      bookedBy: userId,
      bookingId: booking._id,
      bookedAt: new Date()
    }));

    show.seats.booked.push(...seatReservations);
    show.seats.available -= seats.length;

    // Save both booking and updated show
    await Promise.all([
      booking.save(),
      show.save()
    ]);

    // Update user's bookings
    await User.findByIdAndUpdate(userId, { 
      $push: { bookings: booking._id } 
    });

    // Set timeout to release seats if payment not completed (10 minutes)
    setTimeout(async () => {
      try {
        const pendingBooking = await Booking.findById(booking._id);
        if (pendingBooking && pendingBooking.payment.status === 'pending') {
          // Cancel booking and release seats
          await cancelBookingAndReleaseSeats(booking._id);
        }
      } catch (error) {
        console.error('Error in booking timeout:', error);
      }
    }, 10 * 60 * 1000); // 10 minutes

    res.status(201).json({
      success: true,
      message: 'Booking initiated successfully. Please complete payment within 10 minutes.',
      data: { 
        booking: {
          id: booking._id,
          bookingId: booking.bookingId,
          totalAmount: booking.totalAmount,
          seats: booking.seats,
          show: {
            id: show._id,
            movie: show.movie,
            theater: show.theater,
            showDate: show.showDate,
            showTime: show.showTime
          }
        }
      }
    });

  } catch (error) {
    console.error('Initiate booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error initiating booking'
    });
  }
});

// @route   GET /api/bookings
// @desc    Get user's bookings
// @access  Private
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['confirmed', 'cancelled', 'refunded', 'expired'])
], handleValidation, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status
    } = req.query;

    const filter = { user: req.user._id };
    if (status) filter.bookingStatus = status;

    const skip = (page - 1) * limit;

    const [bookings, totalBookings] = await Promise.all([
      Booking.find(filter)
        .populate('movie', 'title poster duration genre language certification')
        .populate('theater', 'name address')
        .populate('show', 'showDate showTime language format')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Booking.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalBookings / limit);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalBookings,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching bookings'
    });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('movie', 'title poster duration genre language certification director')
      .populate('theater', 'name address contact amenities')
      .populate('show', 'showDate showTime language format screen')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking or is admin
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { booking }
    });

  } catch (error) {
    console.error('Get booking error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error fetching booking'
    });
  }
});

// @route   POST /api/bookings/:id/cancel
// @desc    Cancel booking
// @access  Private
router.post('/:id/cancel', auth, [
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
], handleValidation, async (req, res) => {
  try {
    const { reason } = req.body;
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId)
      .populate('show');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if booking can be cancelled
    if (!booking.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be cancelled. Check cancellation policy.'
      });
    }

    // Calculate refund amount
    const refundAmount = booking.calculateRefundAmount();

    // Update booking
    booking.bookingStatus = 'cancelled';
    booking.cancellation = {
      cancelledAt: new Date(),
      reason: reason || 'User cancellation',
      refundAmount,
      cancelledBy: req.user._id
    };

    await booking.save();

    // Release seats in show
    await releaseSeatsFromShow(booking.show._id, booking.seats);

    // Process refund (integrate with payment gateway)
    // This would be handled in the payments route

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { 
        refundAmount,
        refundStatus: 'processing'
      }
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling booking'
    });
  }
});

// @route   GET /api/bookings/:id/ticket
// @desc    Get booking ticket/QR code
// @access  Private
router.get('/:id/ticket', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('movie', 'title poster')
      .populate('theater', 'name address')
      .populate('show', 'showDate showTime screen');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if booking is confirmed
    if (booking.bookingStatus !== 'confirmed' || booking.payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Ticket not available. Booking not confirmed.'
      });
    }

    // Generate QR code data if not exists
    if (!booking.qrCode) {
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
    }

    res.json({
      success: true,
      data: { 
        ticket: {
          bookingId: booking.bookingId,
          qrCode: booking.qrCode,
          movie: booking.movie,
          theater: booking.theater,
          show: booking.show,
          seats: booking.seats,
          totalAmount: booking.totalAmount
        }
      }
    });

  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching ticket'
    });
  }
});

// Helper function to cancel booking and release seats
async function cancelBookingAndReleaseSeats(bookingId) {
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) return;

    // Update booking status
    booking.bookingStatus = 'expired';
    booking.payment.status = 'failed';
    await booking.save();

    // Release seats from show
    await releaseSeatsFromShow(booking.show, booking.seats);

    console.log(`Booking ${booking.bookingId} expired and seats released`);
  } catch (error) {
    console.error('Error cancelling expired booking:', error);
  }
}

// Helper function to release seats from show
async function releaseSeatsFromShow(showId, seats) {
  try {
    const show = await Show.findById(showId);
    if (!show) return;

    const seatIds = seats.map(seat => seat.seatId);
    
    // Remove booked seats
    show.seats.booked = show.seats.booked.filter(
      bookedSeat => !seatIds.includes(bookedSeat.seatId)
    );
    
    // Update available count
    show.seats.available += seats.length;
    
    await show.save();
  } catch (error) {
    console.error('Error releasing seats:', error);
  }
}

module.exports = router;