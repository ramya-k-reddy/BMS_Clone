import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import '../styles/SeatSelection.css';

const SeatSelection = () => {
  const { movieId, showId } = useParams();
  const navigate = useNavigate();
  
  const [show, setShow] = useState(null);
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatMap, setSeatMap] = useState([]);

  const fetchShowDetails = async () => {
    try {
      setLoading(true);
      const [showResponse, movieResponse] = await Promise.all([
        api.get(`/shows/${showId}`),
        api.get(`/movies/${movieId}`)
      ]);

      console.log('Show data:', showResponse.data);
      console.log('Movie data:', movieResponse.data);

      const showData = showResponse.data.data.show || showResponse.data.data;
      const movieData = movieResponse.data.data;
      
      console.log('Parsed Show Data:', showData);
      console.log('Show Date from API:', showData.showDate);
      console.log('Show Date type:', typeof showData.showDate);
      console.log('Theater:', showData.theater);
      console.log('Screen:', showData.screen);
      
      setShow(showData);
      setMovie(movieData);
      
      // Generate seat map from theater screen layout
      if (showData.theater && showData.screen) {
        // Check if screens is populated
        let screenData;
        if (showData.theater.screens && showData.theater.screens.length > 0) {
          screenData = showData.theater.screens.find(
            s => s.screenNumber === showData.screen.screenNumber
          );
        } else if (showResponse.data.data.screen) {
          // Screen data might be separate in the response
          screenData = showResponse.data.data.screen;
        }
        
        console.log('Screen Data:', screenData);
        
        if (screenData && screenData.seatLayout) {
          const generatedSeatMap = generateSeatMap(
            screenData.seatLayout,
            showData.seats.booked,
            showData.seats.blocked
          );
          setSeatMap(generatedSeatMap);
        } else {
          console.error('No seat layout found');
          toast.error('Seat layout not available');
        }
      }
    } catch (error) {
      console.error('Error fetching show details:', error);
      toast.error('Failed to load show details');
      navigate('/movies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShowDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showId, movieId]);

  const generateSeatMap = (seatLayout, bookedSeats, blockedSeats) => {
    const { rows, seatsPerRow, seatCategories } = seatLayout;
    const seatMap = [];
    
    // Get row letters (A, B, C, etc.)
    const rowLetters = Array.from({ length: rows }, (_, i) => 
      String.fromCharCode(65 + i)
    );

    rowLetters.forEach(rowLetter => {
      const rowSeats = [];
      
      for (let seatNum = 1; seatNum <= seatsPerRow; seatNum++) {
        const seatId = `${rowLetter}${seatNum}`;
        
        // Determine seat category based on row
        const category = seatCategories.find(cat => {
          const fromCode = cat.rows.from.charCodeAt(0);
          const toCode = cat.rows.to.charCodeAt(0);
          const currentCode = rowLetter.charCodeAt(0);
          return currentCode >= fromCode && currentCode <= toCode;
        });

        // Check if seat is booked or blocked
        const isBooked = bookedSeats.some(seat => seat.seatId === seatId);
        const blocked = blockedSeats.find(seat => seat.seatId === seatId);
        
        rowSeats.push({
          seatId,
          row: rowLetter,
          seatNumber: seatNum,
          category: category?.category || 'Standard',
          price: category?.price || 0,
          status: blocked ? 'blocked' : (isBooked ? 'booked' : 'available')
        });
      }
      
      seatMap.push({
        row: rowLetter,
        seats: rowSeats
      });
    });

    return seatMap;
  };

  const handleSeatClick = (seat) => {
    if (seat.status === 'booked' || seat.status === 'blocked') {
      return;
    }

    const isSelected = selectedSeats.some(s => s.seatId === seat.seatId);
    
    if (isSelected) {
      setSelectedSeats(selectedSeats.filter(s => s.seatId !== seat.seatId));
    } else {
      if (selectedSeats.length >= 10) {
        toast.error('You can select maximum 10 seats at a time');
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const calculateTotal = () => {
    return selectedSeats.reduce((total, seat) => total + seat.price, 0);
  };

  const calculatePriceBreakdown = () => {
    const subtotal = calculateTotal();
    const taxes = Math.round(subtotal * 0.18); // 18% GST
    const convenienceFee = Math.round(selectedSeats.length * 20); // ₹20 per seat
    const total = subtotal + taxes + convenienceFee;
    
    return { subtotal, taxes, convenienceFee, total };
  };

  const handleProceedToPayment = async () => {
    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat');
      return;
    }

    try {
      // Create booking
      const bookingData = {
        showId: showId,
        seats: selectedSeats.map(seat => ({
          seatId: seat.seatId,
          row: seat.row,
          seatNumber: seat.seatNumber,
          category: seat.category
        })),
        contactDetails: {
          email: 'user@example.com', // TODO: Get from user profile
          phone: '9999999999' // TODO: Get from user profile
        }
      };

      const response = await api.post('/bookings/initiate', bookingData);
      
      if (response.data.success) {
        toast.success('Seats reserved! Proceed to payment');
        navigate(`/payment/${response.data.data._id}`);
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.message || 'Failed to create booking');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!show || !movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Show not found</h2>
          <button
            onClick={() => navigate('/movies')}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Back to Movies
          </button>
        </div>
      </div>
    );
  }

  const groupedSeats = selectedSeats.reduce((acc, seat) => {
    if (!acc[seat.category]) {
      acc[seat.category] = [];
    }
    acc[seat.category].push(seat);
    return acc;
  }, {});

  return (
    <div className="seat-selection-container">
      {/* Header */}
      <div className="seat-selection-header">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(`/movie/${movieId}`)}
            className="back-button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="header-info">
            <h1 className="movie-title">{movie.title}</h1>
            <div className="show-info">
              <span>{show.theater?.name}</span>
              <span>•</span>
              <span>{show.screen?.name}</span>
              <span>•</span>
              <span>
                {(() => {
                  try {
                    const date = new Date(show.showDate);
                    if (isNaN(date.getTime())) return 'Date N/A';
                    return date.toLocaleDateString('en-US', { 
                      weekday: 'short', month: 'short', day: 'numeric' 
                    });
                  } catch (e) {
                    return 'Date N/A';
                  }
                })()}
              </span>
              <span>•</span>
              <span>{show.showTime}</span>
              <span>•</span>
              <span>{show.language}</span>
              <span>•</span>
              <span>{show.format}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="seat-selection-content">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="content-grid">
            {/* Seat Map */}
            <div className="seat-map-section">
              {/* Screen */}
              <div className="screen-container">
                <div className="screen">
                  <svg viewBox="0 0 200 20" className="screen-svg">
                    <path d="M 0 10 Q 100 0, 200 10" fill="none" stroke="#666" strokeWidth="2"/>
                  </svg>
                  <p className="screen-text">SCREEN THIS WAY</p>
                </div>
              </div>

              {/* Legend */}
              <div className="seat-legend">
                <div className="legend-item">
                  <div className="legend-seat available"></div>
                  <span>Available</span>
                </div>
                <div className="legend-item">
                  <div className="legend-seat selected"></div>
                  <span>Selected</span>
                </div>
                <div className="legend-item">
                  <div className="legend-seat booked"></div>
                  <span>Booked</span>
                </div>
                <div className="legend-item">
                  <div className="legend-seat blocked"></div>
                  <span>Blocked</span>
                </div>
              </div>

              {/* Seats Grid */}
              <div className="seats-grid">
                {seatMap.map((rowData) => (
                  <div key={rowData.row} className="seat-row">
                    <div className="row-label">{rowData.row}</div>
                    <div className="row-seats">
                      {rowData.seats.map((seat) => {
                        const isSelected = selectedSeats.some(s => s.seatId === seat.seatId);
                        const seatClass = `seat ${seat.status} ${seat.category.toLowerCase()} ${isSelected ? 'selected' : ''}`;
                        
                        return (
                          <button
                            key={seat.seatId}
                            className={seatClass}
                            onClick={() => handleSeatClick(seat)}
                            disabled={seat.status === 'booked' || seat.status === 'blocked'}
                            title={`${seat.seatId} - ${seat.category} - ₹${seat.price}`}
                          >
                            {seat.seatNumber}
                          </button>
                        );
                      })}
                    </div>
                    <div className="row-label">{rowData.row}</div>
                  </div>
                ))}
              </div>

              {/* Category Info */}
              <div className="category-info">
                {show.pricing?.map((price, index) => (
                  <div key={index} className="category-item">
                    <span className="category-name">{price.category}</span>
                    <span className="category-price">₹{price.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking Summary */}
            <div className="booking-summary">
              <div className="summary-card">
                <h3 className="summary-title">Booking Summary</h3>
                
                {selectedSeats.length === 0 ? (
                  <div className="empty-selection">
                    <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" 
                      />
                    </svg>
                    <p>Select seats to continue</p>
                  </div>
                ) : (
                  <>
                    <div className="selected-seats-list">
                      {Object.entries(groupedSeats).map(([category, seats]) => (
                        <div key={category} className="category-group">
                          <div className="category-header">
                            <span className="category-label">{category}</span>
                            <span className="seat-count">{seats.length} {seats.length === 1 ? 'Seat' : 'Seats'}</span>
                          </div>
                          <div className="seats-chips">
                            {seats.map(seat => (
                              <div key={seat.seatId} className="seat-chip">
                                <span>{seat.seatId}</span>
                                <button
                                  className="remove-seat"
                                  onClick={() => handleSeatClick(seat)}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="category-subtotal">
                            <span>Subtotal:</span>
                            <span>₹{seats.reduce((sum, seat) => sum + seat.price, 0)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="summary-divider"></div>

                    <div className="summary-total">
                      <div className="total-row">
                        <span>Subtotal:</span>
                        <span className="total-value">₹{calculatePriceBreakdown().subtotal}</span>
                      </div>
                      <div className="total-row">
                        <span>GST (18%):</span>
                        <span className="total-value">₹{calculatePriceBreakdown().taxes}</span>
                      </div>
                      <div className="total-row">
                        <span>Convenience Fee:</span>
                        <span className="total-value">₹{calculatePriceBreakdown().convenienceFee}</span>
                      </div>
                      <div className="summary-divider" style={{ margin: '0.75rem 0' }}></div>
                      <div className="total-row grand-total">
                        <span>Total Amount:</span>
                        <span className="total-value">₹{calculatePriceBreakdown().total}</span>
                      </div>
                    </div>

                    <button
                      className="proceed-button"
                      onClick={handleProceedToPayment}
                    >
                      Pay ₹{calculatePriceBreakdown().total}
                    </button>

                    <p className="booking-note">
                      <svg className="note-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Your seats will be reserved for 10 minutes
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;