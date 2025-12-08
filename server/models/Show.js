const mongoose = require('mongoose');

const showSchema = new mongoose.Schema({
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
  screen: {
    screenNumber: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },
  showDate: {
    type: Date,
    required: [true, 'Show date is required']
  },
  showTime: {
    type: String,
    required: [true, 'Show time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format']
  },
  language: {
    type: String,
    required: [true, 'Show language is required']
  },
  format: {
    type: String,
    enum: ['2D', '3D', 'IMAX', '4DX'],
    required: true
  },
  pricing: [{
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
  seats: {
    total: {
      type: Number,
      required: true,
      min: [1, 'Total seats must be at least 1']
    },
    available: {
      type: Number,
      required: true
    },
    booked: [{
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
        required: true
      },
      bookedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
      },
      bookedAt: {
        type: Date,
        default: Date.now
      }
    }],
    reserved: [{
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
        required: true
      },
      reservedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
      },
      reservedAt: {
        type: Date,
        default: Date.now
      },
      expiresAt: {
        type: Date,
        required: true
      }
    }],
    blocked: [{
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
      reason: {
        type: String,
        default: 'Maintenance'
      }
    }]
  },
  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }],
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  specialOffers: [{
    type: {
      type: String,
      enum: ['discount', 'cashback', 'combo']
    },
    title: String,
    description: String,
    discountPercentage: Number,
    validTill: Date
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
showSchema.index({ movie: 1, theater: 1, showDate: 1 });
showSchema.index({ showDate: 1, showTime: 1 });
showSchema.index({ theater: 1, showDate: 1 });
showSchema.index({ movie: 1, showDate: 1 });

// Virtual for show datetime
showSchema.virtual('showDateTime').get(function() {
  const date = this.showDate.toISOString().split('T')[0];
  return `${date} ${this.showTime}`;
});

// Method to check if show is bookable
showSchema.methods.isBookable = function() {
  const now = new Date();
  
  // Parse the show date and time
  let showDateTime;
  try {
    // showDate is stored as Date object, showTime is "HH:MM" format
    const showDateObj = new Date(this.showDate);
    const [hours, minutes] = this.showTime.split(':').map(Number);
    
    // Create datetime by combining date and time
    showDateTime = new Date(showDateObj);
    showDateTime.setHours(hours, minutes, 0, 0);
    
    console.log('Bookability check:', {
      now: now.toISOString(),
      showDateTime: showDateTime.toISOString(),
      isPast: showDateTime < now,
      status: this.status,
      isActive: this.isActive,
      availableSeats: this.seats.available
    });
  } catch (error) {
    console.error('Error parsing show date/time:', error);
    // If date parsing fails, allow booking (don't block due to date issues)
    return this.status === 'scheduled' && this.isActive && this.seats.available > 0;
  }
  
  return (
    this.status === 'scheduled' &&
    this.isActive &&
    showDateTime > now &&
    this.seats.available > 0
  );
};

// Method to get available seats by category
showSchema.methods.getAvailableSeatsByCategory = function() {
  const seatsByCategory = {};
  
  // Initialize categories
  this.pricing.forEach(p => {
    seatsByCategory[p.category] = {
      total: 0,
      available: 0,
      price: p.price
    };
  });

  // You would need to implement logic based on theater seat layout
  // This is a simplified version
  return seatsByCategory;
};

module.exports = mongoose.model('Show', showSchema);