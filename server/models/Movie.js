const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Movie title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Movie description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  genre: [{
    type: String,
    required: true,
    enum: [
      'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 
      'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Animation',
      'Biography', 'Crime', 'Documentary', 'Family', 'History',
      'Music', 'Mystery', 'War', 'Western'
    ]
  }],
  language: [{
    type: String,
    required: true
  }],
  duration: {
    type: Number,
    required: [true, 'Movie duration is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  releaseDate: {
    type: Date,
    required: [true, 'Release date is required']
  },
  director: {
    type: String,
    required: [true, 'Director name is required']
  },
  cast: [{
    name: {
      type: String,
      required: true
    },
    role: String,
    image: String
  }],
  poster: {
    type: String,
    required: [true, 'Movie poster is required']
  },
  bannerImage: {
    type: String,
    default: ''
  },
  trailerUrl: {
    type: String,
    default: ''
  },
  rating: {
    imdb: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    userRating: {
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
  certification: {
    type: String,
    enum: ['U', 'U/A', 'A', 'S'],
    required: true
  },
  format: [{
    type: String,
    enum: ['2D', '3D', 'IMAX', '4DX'],
    default: ['2D']
  }],
  status: {
    type: String,
    enum: ['coming-soon', 'now-showing', 'ended'],
    default: 'coming-soon'
  },
  shows: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Show'
  }],
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better search performance
movieSchema.index({ title: 'text', description: 'text' });
movieSchema.index({ genre: 1, language: 1 });
movieSchema.index({ releaseDate: -1 });
movieSchema.index({ status: 1 });

module.exports = mongoose.model('Movie', movieSchema);