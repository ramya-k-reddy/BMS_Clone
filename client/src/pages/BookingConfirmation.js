import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import '../styles/BookingConfirmation.css';

const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await api.get(`/bookings/${bookingId}`);
        console.log('Booking confirmation data:', response.data);
        
        // Handle nested data structure
        const bookingData = response.data.data?.booking || response.data.data || response.data;
        setBooking(bookingData);
      } catch (error) {
        console.error('Error fetching booking:', error);
        toast.error('Failed to load booking details');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, navigate]);

  if (loading) {
    return (
      <div className="loading-container">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h2 className="error-title">Booking not found</h2>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-container">
      <div className="confirmation-wrapper">
        {/* Success Header */}
        <div className="confirmation-header">
          <div className="success-icon-wrapper">
            <svg className="success-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="confirmation-title">Booking Confirmed!</h1>
          <p className="confirmation-subtitle">Your tickets have been booked successfully</p>
        </div>

        {/* Booking Details Card */}
        <div className="confirmation-card">
          <div className="card-header">
            <h2>Booking Details</h2>
            <p className="booking-id">Booking ID: {booking._id}</p>
          </div>

          <div className="card-content">
            {/* Seats Info */}
            <div className="info-section">
              <h3 className="section-title">Seats</h3>
              <div className="seats-container">
                {booking.seats?.map((seat, index) => (
                  <span key={index} className="seat-badge">
                    {seat.seatId || `${seat.row}${seat.seatNumber}`} ({seat.category})
                  </span>
                )) || <p className="no-seats">No seats information</p>}
              </div>
            </div>

            {/* Payment Info */}
            <div className="info-section">
              <h3 className="section-title">Payment Information</h3>
              <div className="payment-row">
                <span className="payment-label">Total Amount:</span>
                <span className="payment-value amount">
                  ₹{booking.totalAmount?.total || booking.totalPrice || 0}
                </span>
              </div>
              <div className="payment-row">
                <span className="payment-label">Payment Status:</span>
                <span className="payment-value status">
                  {booking.payment?.status || booking.paymentStatus || 'completed'}
                </span>
              </div>
              {(booking.payment?.transactionId || booking.paymentDetails?.transactionId) && (
                <div className="payment-row">
                  <span className="payment-label">Transaction ID:</span>
                  <span className="transaction-id">
                    {booking.payment?.transactionId || booking.paymentDetails?.transactionId}
                  </span>
                </div>
              )}
            </div>

            {/* Contact Info */}
            {booking.contactDetails && (
              <div className="info-section">
                <h3 className="section-title">Contact Details</h3>
                <div className="contact-info">
                  <p><strong>Email:</strong> {booking.contactDetails.email}</p>
                  <p><strong>Phone:</strong> {booking.contactDetails.phone}</p>
                </div>
              </div>
            )}

            {/* Booking Status */}
            <div className="info-section">
              <div className="payment-row">
                <span className="payment-label">Booking Status:</span>
                <span className={`status-badge ${
                  (booking.bookingStatus || booking.status) === 'confirmed' ? 'confirmed' : 'pending'
                }`}>
                  {((booking.bookingStatus || booking.status) || 'pending').charAt(0).toUpperCase() + 
                   ((booking.bookingStatus || booking.status) || 'pending').slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            Go to Home
          </button>
          <button onClick={() => navigate('/bookings')} className="btn btn-primary">
            View My Bookings
          </button>
        </div>

        {/* Test Payment Info */}
        <div className="info-notice">
          <p>
            <strong>Note:</strong> This is a test booking using Stripe test mode. No real payment was processed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;