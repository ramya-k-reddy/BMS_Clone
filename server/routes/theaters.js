const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Theater = require('../models/Theater');
const { auth, partnerAuth, adminAuth, optionalAuth } = require('../middleware/auth');

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

// @route   GET /api/theaters
// @desc    Get all theaters with filters
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('city').optional().isString(),
  query('search').optional().isString()
], handleValidation, optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      city,
      search,
      lat,
      lng,
      radius = 10 // km
    } = req.query;

    // Build filter object - admins see all theaters, others see only verified and active
    const filter = {};
    
    if (req.user?.role !== 'admin') {
      filter.isActive = true;
      filter.verificationStatus = 'verified';
    }
    
    if (city) {
      filter['address.city'] = { $regex: city, $options: 'i' };
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { 'address.street': { $regex: search, $options: 'i' } }
      ];
    }

    // Location-based search
    if (lat && lng) {
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      };
    }

    const skip = (page - 1) * limit;
    
    const [theaters, totalTheaters] = await Promise.all([
      Theater.find(filter)
        .populate('owner', 'name email phone')
        // Include screens with seatLayout for admin show creation
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Theater.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalTheaters / limit);

    res.json({
      success: true,
      data: {
        theaters,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalTheaters,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get theaters error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching theaters'
    });
  }
});

// @route   GET /api/theaters/:id
// @desc    Get theater by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const theater = await Theater.findById(req.params.id)
      .populate('owner', 'name email phone')
      .populate('shows');

    if (!theater || !theater.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Theater not found'
      });
    }

    res.json({
      success: true,
      data: { theater }
    });

  } catch (error) {
    console.error('Get theater error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Theater not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error fetching theater'
    });
  }
});

// @route   POST /api/theaters
// @desc    Create new theater (Theater Owner/Admin)
// @access  Private
router.post('/', auth, partnerAuth, [
  body('name').trim().notEmpty().withMessage('Theater name is required'),
  body('address.street').trim().notEmpty().withMessage('Street address is required'),
  body('address.city').trim().notEmpty().withMessage('City is required'),
  body('address.state').trim().notEmpty().withMessage('State is required'),
  body('address.pincode').matches(/^\d{6}$/).withMessage('Valid 6-digit pincode is required'),
  body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('Valid coordinates [lng, lat] are required'),
  body('contact.phone').matches(/^\d{10}$/).withMessage('Valid 10-digit phone is required'),
  body('contact.email').isEmail().withMessage('Valid email is required'),
  body('screens').isArray({ min: 1 }).withMessage('At least one screen is required')
], handleValidation, async (req, res) => {
  try {
    const theaterData = {
      ...req.body,
      owner: req.user._id
    };

    // Validate screen data
    for (const screen of theaterData.screens) {
      if (!screen.seatLayout || !screen.seatLayout.seatCategories || screen.seatLayout.seatCategories.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Each screen must have at least one seat category'
        });
      }
    }

    const theater = new Theater(theaterData);
    await theater.save();

    res.status(201).json({
      success: true,
      message: 'Theater created successfully. Awaiting verification.',
      data: { theater }
    });

  } catch (error) {
    console.error('Create theater error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Theater with similar details already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error creating theater'
    });
  }
});

// @route   PUT /api/theaters/:id
// @desc    Update theater (Owner/Admin)
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const theater = await Theater.findById(req.params.id);

    if (!theater) {
      return res.status(404).json({
        success: false,
        message: 'Theater not found'
      });
    }

    // Check ownership or admin
    if (theater.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own theaters.'
      });
    }

    const updatedTheater = await Theater.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('owner', 'name email');

    res.json({
      success: true,
      message: 'Theater updated successfully',
      data: { theater: updatedTheater }
    });

  } catch (error) {
    console.error('Update theater error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating theater'
    });
  }
});

// @route   DELETE /api/theaters/:id
// @desc    Delete theater (Owner/Admin)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const theater = await Theater.findById(req.params.id);

    if (!theater) {
      return res.status(404).json({
        success: false,
        message: 'Theater not found'
      });
    }

    // Check ownership or admin
    if (theater.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own theaters.'
      });
    }

    await Theater.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({
      success: true,
      message: 'Theater deleted successfully'
    });

  } catch (error) {
    console.error('Delete theater error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting theater'
    });
  }
});

// @route   GET /api/theaters/:id/screens/:screenNumber
// @desc    Get specific screen layout
// @access  Public
router.get('/:id/screens/:screenNumber', async (req, res) => {
  try {
    const { id, screenNumber } = req.params;
    
    const theater = await Theater.findById(id);
    if (!theater) {
      return res.status(404).json({
        success: false,
        message: 'Theater not found'
      });
    }

    const screen = theater.screens.find(s => s.screenNumber == screenNumber);
    if (!screen) {
      return res.status(404).json({
        success: false,
        message: 'Screen not found'
      });
    }

    res.json({
      success: true,
      data: { screen }
    });

  } catch (error) {
    console.error('Get screen error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching screen'
    });
  }
});

// @route   GET /api/theaters/cities/list
// @desc    Get all cities with theaters
// @access  Public
router.get('/cities/list', async (req, res) => {
  try {
    const cities = await Theater.distinct('address.city', { 
      isActive: true,
      verificationStatus: 'verified'
    });

    res.json({
      success: true,
      data: { cities: cities.sort() }
    });

  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching cities'
    });
  }
});

// @route   PUT /api/theaters/:id/verify
// @desc    Verify theater (Admin only)
// @access  Private/Admin
router.put('/:id/verify', auth, adminAuth, async (req, res) => {
  try {
    const { verificationStatus } = req.body;

    if (!['verified', 'rejected'].includes(verificationStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification status'
      });
    }

    const theater = await Theater.findByIdAndUpdate(
      req.params.id,
      { verificationStatus },
      { new: true }
    ).populate('owner', 'name email');

    if (!theater) {
      return res.status(404).json({
        success: false,
        message: 'Theater not found'
      });
    }

    res.json({
      success: true,
      message: `Theater ${verificationStatus} successfully`,
      data: { theater }
    });

  } catch (error) {
    console.error('Verify theater error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error verifying theater'
    });
  }
});

// @route   GET /api/theaters/owner/my-theaters
// @desc    Get theaters owned by current user
// @access  Private/Theater Owner
router.get('/owner/my-theaters', auth, partnerAuth, async (req, res) => {
  try {
    const theaters = await Theater.find({ owner: req.user._id })
      .populate('shows')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { theaters }
    });

  } catch (error) {
    console.error('Get my theaters error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching your theaters'
    });
  }
});

module.exports = router;