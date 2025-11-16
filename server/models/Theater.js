const mongoose = require('mongoose');

const theaterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Theater name is required'],
    trim: true
  },
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true,
      match: [/^[0-9]{6}$/, 'Please enter a valid 6-digit pincode']
    },
    landmark: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contact: {
    phone: {
      type: String,
      required: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    email: {
      type: String,
      required: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    }
  },
  screens: [{
    screenNumber: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    capacity: {
      type: Number,
      required: true,
      min: [1, 'Capacity must be at least 1']
    },
    screenType: {
      type: String,
      enum: ['Regular', 'IMAX', '4DX', 'Dolby Atmos'],
      default: 'Regular'
    },
    seatLayout: {
      rows: {
        type: Number,
        required: true,
        min: [1, 'Must have at least 1 row']
      },
      seatsPerRow: {
        type: Number,
        required: true,
        min: [1, 'Must have at least 1 seat per row']
      },
      seatCategories: [{
        category: {
          type: String,
          required: true,
          enum: ['Premium', 'Gold', 'Silver', 'Executive']
        },
        price: {
          type: Number,
          required: true,
          min: [0, 'Price cannot be negative']
        },
        rows: {
          from: {
            type: String,
            required: true
          },
          to: {
            type: String,
            required: true
          }
        }
      }],
      blockedSeats: [{
        row: String,
        seatNumber: Number
      }]
    },
    amenities: [{
      type: String,
      enum: ['AC', 'Recliner', 'Food Service', 'Parking', 'Wheelchair Accessible', '3D Capability', 'IMAX', 'Dolby Atmos', 'Premium Seating']
    }]
  }],
  amenities: [{
    type: String,
    enum: [
      'Parking', 'Food Court', 'ATM', 'Wheelchair Accessible', 
      'Air Conditioning', 'Security', '3D Capability', 'IMAX',
      'Dolby Atmos', 'Cafe', 'Gift Shop'
    ]
  }],
  images: [{
    type: String
  }],
  shows: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Show'
  }],
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
theaterSchema.index({ location: '2dsphere' });
theaterSchema.index({ 'address.city': 1 });
theaterSchema.index({ name: 'text' });

module.exports = mongoose.model('Theater', theaterSchema);