const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  show: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Show',
    required: [true, 'Show is required']
  },
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: [true, 'Movie is required']
  },
  theater: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Theater',
    required: [true, 'Theater is required']
  },
  seats: [{
    seatId: {
      type: String,
      required: true
    },
    row: {
      type: String,
      required: true
    },
    seatNumber: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      required: true,
      enum: ['Premium', 'Gold', 'Silver', 'Executive']
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    }
  }],
  totalAmount: {
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative']
    },
    taxes: {
      type: Number,
      required: true,
      min: [0, 'Taxes cannot be negative']
    },
    convenienceFee: {
      type: Number,
      default: 0,
      min: [0, 'Convenience fee cannot be negative']
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative']
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative']
    }
  },
  payment: {
    paymentId: {
      type: String,
      required: true
    },
    method: {
      type: String,
      enum: ['card', 'wallet', 'upi', 'netbanking'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date,
    refundId: String,
    refundAmount: Number,
    refundedAt: Date
  },
  contactDetails: {
    email: {
      type: String,
      required: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      required: true,
      match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number']
    }
  },
  bookingStatus: {
    type: String,
    enum: ['confirmed', 'cancelled', 'refunded', 'expired'],
    default: 'confirmed'
  },
  cancellation: {
    cancelledAt: Date,
    reason: String,
    refundAmount: Number,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  qrCode: {
    type: String
  },
  tickets: [{
    ticketId: {
      type: String,
      unique: true
    },
    seatId: String,
    qrCode: String,
    isUsed: {
      type: Boolean,
      default: false
    },
    usedAt: Date
  }],
  notifications: {
    confirmationSent: {
      type: Boolean,
      default: false
    },
    reminderSent: {
      type: Boolean,
      default: false
    },
    cancellationSent: {
      type: Boolean,
      default: false
    }
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    bookingSource: {
      type: String,
      enum: ['web', 'mobile', 'api'],
      default: 'web'
    }
  }
}, {
  timestamps: true
});

// Generate booking ID before saving
bookingSchema.pre('save', function(next) {
  if (!this.bookingId) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.bookingId = `BMS${timestamp.slice(-6)}${random}`;
  }
  next();
});

// Generate ticket IDs before saving
bookingSchema.pre('save', function(next) {
  if (this.isNew && this.tickets.length === 0) {
    this.seats.forEach((seat, index) => {
      const ticketId = `${this.bookingId}-${String(index + 1).padStart(2, '0')}`;
      this.tickets.push({
        ticketId,
        seatId: seat.seatId
      });
    });
  }
  next();
});

// Indexes for better query performance
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ show: 1 });
bookingSchema.index({ 'payment.status': 1 });
bookingSchema.index({ bookingStatus: 1 });

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const showTime = this.show.showDate;
  const timeDifference = showTime - now;
  const hoursBeforeShow = timeDifference / (1000 * 60 * 60);
  
  return (
    this.bookingStatus === 'confirmed' &&
    this.payment.status === 'completed' &&
    hoursBeforeShow >= 2 // Can cancel up to 2 hours before show
  );
};

// Method to calculate refund amount
bookingSchema.methods.calculateRefundAmount = function() {
  if (!this.canBeCancelled()) return 0;
  
  const now = new Date();
  const showTime = this.show.showDate;
  const hoursBeforeShow = (showTime - now) / (1000 * 60 * 60);
  
  let refundPercentage;
  if (hoursBeforeShow >= 24) {
    refundPercentage = 0.8; // 80% refund
  } else if (hoursBeforeShow >= 4) {
    refundPercentage = 0.5; // 50% refund
  } else {
    refundPercentage = 0.2; // 20% refund
  }
  
  return Math.round(this.totalAmount.total * refundPercentage);
};

module.exports = mongoose.model('Booking', bookingSchema);