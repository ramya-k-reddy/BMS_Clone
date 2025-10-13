const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Show = require('../models/Show');
const Movie = require('../models/Movie');
const Theater = require('../models/Theater');
const { auth, theaterOwnerAuth, adminAuth } = require('../middleware/auth');

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

// @route   GET /api/shows
// @desc    Get shows with filters
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('movie').optional().isMongoId(),
  query('theater').optional().isMongoId(),
  query('city').optional().isString(),
  query('date').optional().isISO8601(),
  query('language').optional().isString()
], handleValidation, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      movie,
      theater,
      city,
      date,
      language
    } = req.query;

    // Build filter object
    const filter = { 
      isActive: true,
      status: 'scheduled'
    };
    
    if (movie) filter.movie = movie;
    if (theater) filter.theater = theater;
    if (language) filter.language = language;
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      filter.showDate = {
        $gte: startDate,
        $lt: endDate
      };
    } else {
      // Only show future shows by default
      filter.showDate = { $gte: new Date() };
    }

    // If city is provided, we need to filter by theaters in that city
    if (city) {
      const theatersInCity = await Theater.find({
        'address.city': { $regex: city, $options: 'i' },
        isActive: true,
        verificationStatus: 'verified'
      }).select('_id');
      
      filter.theater = { $in: theatersInCity.map(t => t._id) };
    }

    const skip = (page - 1) * limit;
    
    const [shows, totalShows] = await Promise.all([
      Show.find(filter)
        .populate('movie', 'title poster duration genre language certification')
        .populate('theater', 'name address.city address.street screens')
        .sort({ showDate: 1, showTime: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Show.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalShows / limit);

    res.json({
      success: true,
      data: {
        shows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalShows,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get shows error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching shows'
    });
  }
});

// @route   GET /api/shows/:id
// @desc    Get show by ID with seat availability
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('movie', 'title poster duration genre language certification director cast')
      .populate('theater', 'name address screens amenities');

    if (!show || !show.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Show not found'
      });
    }

    // Get the specific screen details
    const theater = show.theater;
    const screen = theater.screens.find(s => s.screenNumber === show.screen.screenNumber);
    
    if (!screen) {
      return res.status(404).json({
        success: false,
        message: 'Screen not found'
      });
    }

    // Calculate available seats by category
    const seatAvailability = {};
    screen.seatLayout.seatCategories.forEach(category => {
      seatAvailability[category.category] = {
        price: category.price,
        total: 0,
        available: 0,
        booked: 0
      };
    });

    // You would need to implement detailed seat mapping logic here
    // For now, we'll use a simplified approach
    show.pricing.forEach(pricing => {
      if (seatAvailability[pricing.category]) {
        seatAvailability[pricing.category].price = pricing.price;
      }
    });

    res.json({
      success: true,
      data: { 
        show,
        screen: {
          ...screen.toObject(),
          seatAvailability
        }
      }
    });

  } catch (error) {
    console.error('Get show error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Show not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error fetching show'
    });
  }
});

// @route   POST /api/shows
// @desc    Create new show (Theater Owner/Admin)
// @access  Private
router.post('/', auth, theaterOwnerAuth, [
  body('movie').isMongoId().withMessage('Valid movie ID is required'),
  body('theater').isMongoId().withMessage('Valid theater ID is required'),
  body('screen.screenNumber').isInt({ min: 1 }).withMessage('Valid screen number is required'),
  body('showDate').isISO8601().withMessage('Valid show date is required'),
  body('showTime').matches(/^([01]?\d|2[0-3]):[0-5]\d$/).withMessage('Valid show time (HH:MM) is required'),
  body('language').notEmpty().withMessage('Language is required'),
  body('format').isIn(['2D', '3D', 'IMAX', '4DX']).withMessage('Valid format is required'),
  body('pricing').isArray({ min: 1 }).withMessage('At least one pricing category is required')
], handleValidation, async (req, res) => {
  try {
    const {
      movie: movieId,
      theater: theaterId,
      screen,
      showDate,
      showTime,
      language,
      format,
      pricing
    } = req.body;

    // Verify movie exists
    const movie = await Movie.findById(movieId);
    if (!movie || !movie.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    // Verify theater exists and user owns it (unless admin)
    const theater = await Theater.findById(theaterId);
    if (!theater || !theater.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Theater not found'
      });
    }

    if (theater.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only create shows for your theaters.'
      });
    }

    // Verify screen exists in theater
    const theaterScreen = theater.screens.find(s => s.screenNumber === screen.screenNumber);
    if (!theaterScreen) {
      return res.status(400).json({
        success: false,
        message: 'Screen not found in theater'
      });
    }

    // Check for show time conflicts
    const showDateTime = new Date(`${showDate.split('T')[0]} ${showTime}`);
    const movieDuration = movie.duration + 30; // Add 30 minutes buffer
    const showEndTime = new Date(showDateTime.getTime() + movieDuration * 60000);

    const conflictingShows = await Show.find({
      theater: theaterId,
      'screen.screenNumber': screen.screenNumber,
      showDate: {
        $gte: new Date(showDate.split('T')[0]),
        $lt: new Date(new Date(showDate.split('T')[0]).getTime() + 24 * 60 * 60 * 1000)
      },
      isActive: true
    });

    for (const existingShow of conflictingShows) {
      const existingDateTime = new Date(`${existingShow.showDate.toISOString().split('T')[0]} ${existingShow.showTime}`);
      const existingMovie = await Movie.findById(existingShow.movie);
      const existingEndTime = new Date(existingDateTime.getTime() + (existingMovie.duration + 30) * 60000);

      if (
        (showDateTime >= existingDateTime && showDateTime < existingEndTime) ||
        (showEndTime > existingDateTime && showEndTime <= existingEndTime) ||
        (showDateTime <= existingDateTime && showEndTime >= existingEndTime)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Show time conflicts with existing show'
        });
      }
    }

    // Create show
    const show = new Show({
      movie: movieId,
      theater: theaterId,
      screen: {
        screenNumber: screen.screenNumber,
        name: theaterScreen.name
      },
      showDate: new Date(showDate),
      showTime,
      language,
      format,
      pricing,
      seats: {
        total: theaterScreen.capacity,
        available: theaterScreen.capacity,
        booked: [],
        blocked: theaterScreen.seatLayout.blockedSeats || []
      }
    });

    await show.save();

    // Update movie and theater references
    await Movie.findByIdAndUpdate(movieId, { $push: { shows: show._id } });
    await Theater.findByIdAndUpdate(theaterId, { $push: { shows: show._id } });

    const populatedShow = await Show.findById(show._id)
      .populate('movie', 'title poster duration')
      .populate('theater', 'name address');

    res.status(201).json({
      success: true,
      message: 'Show created successfully',
      data: { show: populatedShow }
    });

  } catch (error) {
    console.error('Create show error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating show'
    });
  }
});

// @route   PUT /api/shows/:id
// @desc    Update show (Theater Owner/Admin)
// @access  Private
router.put('/:id', auth, theaterOwnerAuth, async (req, res) => {
  try {
    const show = await Show.findById(req.params.id).populate('theater');

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found'
      });
    }

    // Check ownership or admin
    if (show.theater.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update shows for your theaters.'
      });
    }

    // Don't allow updates if show has bookings
    if (show.bookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update show with existing bookings'
      });
    }

    const updatedShow = await Show.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('movie', 'title poster duration')
     .populate('theater', 'name address');

    res.json({
      success: true,
      message: 'Show updated successfully',
      data: { show: updatedShow }
    });

  } catch (error) {
    console.error('Update show error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating show'
    });
  }
});

// @route   DELETE /api/shows/:id
// @desc    Cancel show (Theater Owner/Admin)
// @access  Private
router.delete('/:id', auth, theaterOwnerAuth, async (req, res) => {
  try {
    const show = await Show.findById(req.params.id).populate('theater');

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found'
      });
    }

    // Check ownership or admin
    if (show.theater.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only cancel shows for your theaters.'
      });
    }

    // Update show status instead of deleting
    await Show.findByIdAndUpdate(req.params.id, { 
      status: 'cancelled',
      isActive: false 
    });

    res.json({
      success: true,
      message: 'Show cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel show error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling show'
    });
  }
});

// @route   GET /api/shows/movie/:movieId
// @desc    Get shows for a specific movie
// @access  Public
router.get('/movie/:movieId', [
  query('city').optional().isString(),
  query('date').optional().isISO8601(),
  query('language').optional().isString()
], handleValidation, async (req, res) => {
  try {
    const { movieId } = req.params;
    const { city, date, language } = req.query;

    const filter = {
      movie: movieId,
      isActive: true,
      status: 'scheduled',
      showDate: { $gte: new Date() }
    };

    if (language) filter.language = language;
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      filter.showDate = {
        $gte: startDate,
        $lt: endDate
      };
    }

    // If city is provided, filter by theaters in that city
    if (city) {
      const theatersInCity = await Theater.find({
        'address.city': { $regex: city, $options: 'i' },
        isActive: true,
        verificationStatus: 'verified'
      }).select('_id');
      
      filter.theater = { $in: theatersInCity.map(t => t._id) };
    }

    const shows = await Show.find(filter)
      .populate('theater', 'name address screens amenities')
      .sort({ showDate: 1, showTime: 1 })
      .lean();

    // Group shows by theater and date
    const groupedShows = {};
    shows.forEach(show => {
      const theaterId = show.theater._id.toString();
      const showDate = show.showDate.toISOString().split('T')[0];
      
      if (!groupedShows[theaterId]) {
        groupedShows[theaterId] = {
          theater: show.theater,
          dates: {}
        };
      }
      
      if (!groupedShows[theaterId].dates[showDate]) {
        groupedShows[theaterId].dates[showDate] = [];
      }
      
      groupedShows[theaterId].dates[showDate].push(show);
    });

    res.json({
      success: true,
      data: { 
        shows: Object.values(groupedShows),
        totalShows: shows.length
      }
    });

  } catch (error) {
    console.error('Get movie shows error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching movie shows'
    });
  }
});

module.exports = router;