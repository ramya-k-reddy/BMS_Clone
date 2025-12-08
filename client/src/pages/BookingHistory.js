import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import '../styles/BookingHistory.css';

const BookingHistory = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, confirmed, cancelled

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/bookings', { params });
      
      if (response.data.success) {
        setBookings(response.data.data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="booking-history-container">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="booking-history-header">
          <h1 className="booking-history-title">My Bookings</h1>
          <p className="booking-history-subtitle">View and manage your movie bookings</p>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            onClick={() => setFilter('all')}
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          >
            All Bookings
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`filter-tab ${filter === 'confirmed' ? 'active' : ''}`}
          >
            Confirmed
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`filter-tab ${filter === 'cancelled' ? 'active' : ''}`}
          >
            Cancelled
          </button>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <h2 className="empty-title">No bookings found</h2>
            <p className="empty-message">
              {filter === 'all' 
                ? "You haven't made any bookings yet. Start by browsing movies!"
                : `No ${filter} bookings found.`}
            </p>
            <button
              onClick={() => navigate('/movies')}
              className="empty-action-btn"
            >
              Browse Movies
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking._id} className="booking-card">
                <div className="booking-card-content">
                  <div className="booking-card-body">
                    {/* Movie Poster */}
                    <div className="booking-poster">
                      {booking.movie?.poster ? (
                        <img
                          src={booking.movie.poster}
                          alt={booking.movie.title}
                        />
                      ) : (
                        <div className="booking-poster-placeholder">
                          <span>No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Booking Details */}
                    <div className="booking-details">
                      <div className="booking-header">
                        <div>
                          <h3 className="booking-title">
                            {booking.movie?.title || 'Movie Title'}
                          </h3>
                          <p className="booking-id">
                            Booking ID: <span className="booking-id-code">{booking.bookingId}</span>
                          </p>
                        </div>
                        <span className={`booking-status-badge ${booking.bookingStatus}`}>
                          {booking.bookingStatus?.charAt(0).toUpperCase() + booking.bookingStatus?.slice(1)}
                        </span>
                      </div>

                      <div className="booking-info-grid">
                        <div>
                          <p className="booking-info-item">
                            <span className="booking-info-label">Theater:</span> {booking.theater?.name || 'N/A'}
                          </p>
                          <p className="booking-info-item">
                            <span className="booking-info-label">Date:</span> {formatDate(booking.show?.showDate || booking.createdAt)}
                          </p>
                          <p className="booking-info-item">
                            <span className="booking-info-label">Time:</span> {formatTime(booking.show?.showTime)}
                          </p>
                        </div>
                        <div>
                          <p className="booking-info-item">
                            <span className="booking-info-label">Seats:</span> {booking.seats?.map(s => s.seatId).join(', ')}
                          </p>
                          <p className="booking-info-item">
                            <span className="booking-info-label">Seats:</span> {booking.seats?.map(s => s.seatId).join(', ')}
                          </p>
                          <p className="booking-info-item">
                            <span className="booking-info-label">Total Seats:</span> {booking.seats?.length || 0}
                          </p>
                          <p className="booking-info-item">
                            <span className="booking-info-label">Booked On:</span> {formatDate(booking.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="booking-footer">
                        <div className="booking-price">
                          <p className="booking-total">
                            ₹{booking.totalAmount?.total || 0}
                          </p>
                          <p className="booking-breakdown">
                            Subtotal: ₹{booking.totalAmount?.subtotal || 0} + Tax: ₹{booking.totalAmount?.taxes || 0}
                          </p>
                        </div>
                        
                        {booking.bookingStatus === 'confirmed' && (
                          <button
                            onClick={() => navigate(`/booking-confirmation/${booking._id}`)}
                            className="booking-action-btn"
                          >
                            View Ticket
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingHistory;