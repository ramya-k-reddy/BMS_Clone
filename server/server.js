const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');
const theaterRoutes = require('./routes/theaters');
const showRoutes = require('./routes/shows');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');

const app = express();
const httpServer = createServer(app);

// Socket.IO setup for real-time seat updates
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully!');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error.message);
  process.exit(1);
});

// Socket.IO for real-time features
const activeUsers = new Map();
const seatLocks = new Map();

io.on('connection', (socket) => {
  console.log(`👤 User connected: ${socket.id}`);

  // Join show room for live seat updates
  socket.on('join-show', (showId) => {
    socket.join(`show-${showId}`);
    console.log(`👤 User ${socket.id} joined show ${showId}`);
  });

  // Handle seat selection
  socket.on('select-seat', (data) => {
    const { showId, seatId, userId } = data;
    const lockKey = `${showId}-${seatId}`;
    
    // Lock seat for 10 minutes
    seatLocks.set(lockKey, {
      userId,
      socketId: socket.id,
      timestamp: Date.now()
    });

    // Broadcast seat lock to all users in the show
    socket.to(`show-${showId}`).emit('seat-locked', {
      seatId,
      userId,
      isLocked: true
    });

    // Auto-release seat after 10 minutes
    setTimeout(() => {
      if (seatLocks.has(lockKey)) {
        seatLocks.delete(lockKey);
        io.to(`show-${showId}`).emit('seat-unlocked', { seatId });
      }
    }, 10 * 60 * 1000); // 10 minutes
  });

  // Handle seat deselection
  socket.on('deselect-seat', (data) => {
    const { showId, seatId } = data;
    const lockKey = `${showId}-${seatId}`;
    
    seatLocks.delete(lockKey);
    socket.to(`show-${showId}`).emit('seat-unlocked', { seatId });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`👤 User disconnected: ${socket.id}`);
    
    // Release all seats locked by this user
    for (const [lockKey, lockData] of seatLocks.entries()) {
      if (lockData.socketId === socket.id) {
        const [showId, seatId] = lockKey.split('-');
        seatLocks.delete(lockKey);
        socket.to(`show-${showId}`).emit('seat-unlocked', { seatId });
      }
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/theaters', theaterRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'BookMyShow Server is running!',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    mongoose.connection.close();
    console.log('✅ Server closed successfully');
  });
});

module.exports = { app, io };