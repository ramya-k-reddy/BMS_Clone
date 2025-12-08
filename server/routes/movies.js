const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Movie = require('../models/Movie');
const { auth, adminAuth, optionalAuth } = require('../middleware/auth');

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

// @route   GET /api/movies
// @desc    Get all movies with filters
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('genre').optional().isString(),
  query('language').optional().isString(),
  query('status').optional().isIn(['coming-soon', 'now-showing', 'ended']),
  query('city').optional().isString(),
  query('search').optional().isString()
], handleValidation, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      genre,
      language,
      status,
      city,
      search,
      sortBy = 'releaseDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    
    // Only filter by status if explicitly provided
    if (status) filter.status = status;
    if (genre) filter.genre = { $in: [genre] };
    if (language) filter.language = { $in: [language] };
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { director: { $regex: search, $options: 'i' } },
        { 'cast.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const [movies, totalMovies] = await Promise.all([
      Movie.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-reviews')
        .lean(),
      Movie.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalMovies / limit);

    res.json({
      success: true,
      data: {
        movies,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalMovies,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get movies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching movies'
    });
  }
});

// @route   GET /api/movies/:id
// @desc    Get movie by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id)
      .populate('shows')
      .populate('reviews.user', 'name avatar');

    if (!movie || !movie.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    res.json({
      success: true,
      data: { movie }
    });

  } catch (error) {
    console.error('Get movie error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error fetching movie'
    });
  }
});

// @route   POST /api/movies
// @desc    Create new movie (Admin only)
// @access  Private/Admin
router.post('/', auth, adminAuth, [
  body('title').trim().notEmpty().withMessage('Movie title is required'),
  body('description').trim().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('genre').isArray({ min: 1 }).withMessage('At least one genre is required'),
  body('language').isArray({ min: 1 }).withMessage('At least one language is required'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('releaseDate').isISO8601().withMessage('Valid release date is required'),
  body('director').trim().notEmpty().withMessage('Director name is required'),
  body('cast').isArray().withMessage('Cast must be an array'),
  body('poster').isURL().withMessage('Valid poster URL is required'),
  body('certification').isIn(['U', 'U/A', 'A', 'S']).withMessage('Valid certification is required')
], handleValidation, async (req, res) => {
  try {
    const movieData = req.body;
    
    // Check if movie with same title already exists
    const existingMovie = await Movie.findOne({ 
      title: { $regex: new RegExp(`^${movieData.title}$`, 'i') }
    });

    if (existingMovie) {
      return res.status(400).json({
        success: false,
        message: 'Movie with this title already exists'
      });
    }

    const movie = new Movie(movieData);
    await movie.save();

    res.status(201).json({
      success: true,
      message: 'Movie created successfully',
      data: { movie }
    });

  } catch (error) {
    console.error('Create movie error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating movie'
    });
  }
});

// @route   PUT /api/movies/:id
// @desc    Update movie (Admin only)
// @access  Private/Admin
router.put('/:id', auth, adminAuth, [
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('duration').optional().isInt({ min: 1 }),
  body('director').optional().trim().notEmpty()
], handleValidation, async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    res.json({
      success: true,
      message: 'Movie updated successfully',
      data: { movie }
    });

  } catch (error) {
    console.error('Update movie error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error updating movie'
    });
  }
});

// @route   DELETE /api/movies/:id
// @desc    Delete movie (Admin only)
// @access  Private/Admin
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    res.json({
      success: true,
      message: 'Movie deleted successfully'
    });

  } catch (error) {
    console.error('Delete movie error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error deleting movie'
    });
  }
});

// @route   POST /api/movies/:id/reviews
// @desc    Add movie review
// @access  Private
router.post('/:id/reviews', auth, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters')
], handleValidation, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const movieId = req.params.id;
    const userId = req.user._id;

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    // Check if user has already reviewed this movie
    const existingReview = movie.reviews.find(
      review => review.user.toString() === userId.toString()
    );

    if (existingReview) {
      // Update existing review
      existingReview.rating = rating;
      existingReview.comment = comment;
      existingReview.createdAt = new Date();
    } else {
      // Add new review
      movie.reviews.push({
        user: userId,
        rating,
        comment
      });
    }

    // Recalculate average rating
    const totalRatings = movie.reviews.length;
    const sumRatings = movie.reviews.reduce((sum, review) => sum + review.rating, 0);
    movie.rating.userRating = totalRatings > 0 ? (sumRatings / totalRatings) : 0;
    movie.rating.totalRatings = totalRatings;

    await movie.save();

    res.status(201).json({
      success: true,
      message: existingReview ? 'Review updated successfully' : 'Review added successfully'
    });

  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding review'
    });
  }
});

// @route   GET /api/movies/genres/list
// @desc    Get all available genres
// @access  Public
router.get('/genres/list', async (req, res) => {
  try {
    const genres = [
      'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 
      'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Animation',
      'Biography', 'Crime', 'Documentary', 'Family', 'History',
      'Music', 'Mystery', 'War', 'Western'
    ];

    res.json({
      success: true,
      data: { genres }
    });

  } catch (error) {
    console.error('Get genres error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching genres'
    });
  }
});

// @route   GET /api/movies/languages/list
// @desc    Get all available languages
// @access  Public
router.get('/languages/list', async (req, res) => {
  try {
    const languages = await Movie.distinct('language', { isActive: true });

    res.json({
      success: true,
      data: { languages }
    });

  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching languages'
    });
  }
});

module.exports = router;