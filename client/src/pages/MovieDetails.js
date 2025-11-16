import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../store/slices/authSlice';
import axios from 'axios';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import '../styles/MovieDetails.css';

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const fetchMovieAndShows = useCallback(async () => {
    try {
      setLoading(true);
      const [movieRes, showsRes] = await Promise.all([
        axios.get(`/api/movies/${id}`),
        axios.get(`/api/shows/movie/${id}`)
      ]);
      
      setMovie(movieRes.data.data);
      setShows(showsRes.data.data || []);
      
      // Set first available date as selected
      if (showsRes.data.data && showsRes.data.data.length > 0) {
        const dates = getUniqueDates(showsRes.data.data);
        setSelectedDate(dates[0]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching movie details:', err);
      setError('Failed to load movie details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMovieAndShows();
  }, [fetchMovieAndShows]);

  const getUniqueDates = (showsArray) => {
    if (!Array.isArray(showsArray) || showsArray.length === 0) {
      return [];
    }
    const dates = [...new Set(showsArray.map(show => 
      new Date(show.showDate).toDateString()
    ))];
    return dates.sort((a, b) => new Date(a) - new Date(b));
  };

  const getShowsForDate = (date) => {
    if (!Array.isArray(shows)) {
      return [];
    }
    return shows.filter(show => 
      new Date(show.showDate).toDateString() === date
    );
  };

  const groupShowsByTheater = (showsArray) => {
    if (!Array.isArray(showsArray)) {
      return {};
    }
    const grouped = {};
    showsArray.forEach(show => {
      const theaterName = show.theater?.name || 'Unknown Theater';
      if (!grouped[theaterName]) {
        grouped[theaterName] = {
          theater: show.theater,
          shows: []
        };
      }
      grouped[theaterName].shows.push(show);
    });
    return grouped;
  };

  const handleShowSelect = (showId) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/movie/${id}` } });
      return;
    }
    navigate(`/movie/${id}/book/${showId}`);
  };

  const formatDuration = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="movie-details-loading">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="movie-details-error">
        <div className="error-content">
          <h2>Movie Not Found</h2>
          <p>{error || "The movie you're looking for doesn't exist."}</p>
          <button onClick={() => navigate('/movies')} className="back-button">
            Back to Movies
          </button>
        </div>
      </div>
    );
  }

  const uniqueDates = getUniqueDates(shows);
  const selectedDateShows = selectedDate ? getShowsForDate(selectedDate) : [];
  const groupedShows = groupShowsByTheater(selectedDateShows);

  return (
    <div className="movie-details-container">
      {/* Movie Banner */}
      <div className="movie-banner">
        <div className="banner-overlay"></div>
        <img src={movie.poster} alt={movie.title} className="banner-image" />
        <div className="banner-content">
          <div className="banner-info">
            <h1 className="movie-title">{movie.title}</h1>
            <div className="movie-meta">
              <span className="rating">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                {movie.rating?.imdb || 'N/A'}/10
              </span>
              <span>•</span>
              <span>{formatDuration(movie.duration)}</span>
              <span>•</span>
              <span>{movie.certification}</span>
              <span>•</span>
              <span>{movie.genre?.join(', ')}</span>
            </div>
            <div className="movie-languages">
              {movie.language?.map((lang, index) => (
                <span key={index} className="language-badge">{lang}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Movie Description */}
      <div className="movie-description-section">
        <div className="description-container">
          <h2>About the Movie</h2>
          <p>{movie.description}</p>
          <div className="movie-details-grid">
            <div className="detail-item">
              <span className="detail-label">Director</span>
              <span className="detail-value">{movie.director}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Release Date</span>
              <span className="detail-value">
                {new Date(movie.releaseDate).toLocaleDateString('en-US', { 
                  year: 'numeric', month: 'long', day: 'numeric' 
                })}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Cast</span>
              <span className="detail-value">
                {movie.cast?.slice(0, 3).map(c => c.name).join(', ') || 'N/A'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Formats</span>
              <span className="detail-value">{movie.format?.join(', ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shows Section */}
      <div className="shows-section">
        <div className="shows-container">
          <h2 className="shows-title">Select Date & Show Time</h2>
          
          {shows.length === 0 ? (
            <div className="no-shows">
              <p>No shows available for this movie at the moment.</p>
              <button onClick={() => navigate('/movies')} className="back-to-movies-btn">
                Browse Other Movies
              </button>
            </div>
          ) : (
            <>
              {/* Date Selection */}
              <div className="date-selection">
                {uniqueDates.map((date, index) => (
                  <button
                    key={index}
                    className={`date-btn ${selectedDate === date ? 'active' : ''}`}
                    onClick={() => setSelectedDate(date)}
                  >
                    <span className="date-label">{formatDate(date)}</span>
                    <span className="date-value">
                      {new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                    </span>
                  </button>
                ))}
              </div>

              {/* Theater Shows */}
              <div className="theaters-list">
                {Object.keys(groupedShows).length === 0 ? (
                  <p className="no-shows-message">No shows available for this date.</p>
                ) : (
                  Object.entries(groupedShows).map(([theaterName, data]) => (
                    <div key={theaterName} className="theater-card">
                      <div className="theater-info">
                        <h3 className="theater-name">{theaterName}</h3>
                        <p className="theater-address">
                          {data.theater?.address?.street}, {data.theater?.address?.city}
                        </p>
                        <div className="theater-amenities">
                          {data.theater?.amenities?.slice(0, 3).map((amenity, idx) => (
                            <span key={idx} className="amenity-badge">{amenity}</span>
                          ))}
                        </div>
                      </div>
                      <div className="show-times">
                        {data.shows.map((show) => (
                          <button
                            key={show._id}
                            className="show-time-btn"
                            onClick={() => handleShowSelect(show._id)}
                            disabled={show.seats?.available === 0}
                          >
                            <span className="show-time">{show.showTime}</span>
                            <span className="show-format">{show.format}</span>
                            <span className="show-language">{show.language}</span>
                            <span className="seats-available">
                              {show.seats?.available > 0 
                                ? `${show.seats.available} seats` 
                                : 'Sold Out'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;