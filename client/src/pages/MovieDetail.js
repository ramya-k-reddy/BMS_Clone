import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMovieById } from '../store/slices/moviesSlice';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import axios from 'axios';

const MovieDetail = () => {
  const { id: movieId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  console.log('=== MovieDetail Component Loaded ===');
  console.log('Movie ID:', movieId);
  
  const { currentMovie, loading: movieLoading } = useSelector((state) => state.movies);
  const { user } = useSelector((state) => state.auth);
  const [shows, setShows] = useState([]);
  const [theaters, setTheaters] = useState({});
  const [loadingShows, setLoadingShows] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  console.log('Current Movie:', currentMovie);
  console.log('Shows State:', shows);

  const fetchShows = async () => {
    try {
      setLoadingShows(true);
      const response = await axios.get('/api/shows', {
        params: { movie: movieId }
      });
      
      if (response.data.success) {
        const showsData = response.data.data.shows || [];
        console.log('Fetched shows:', showsData);
        
        setShows(showsData);
        
        // Group theaters
        const theaterMap = {};
        showsData.forEach(show => {
          if (show.theater && show.theater._id) {
            theaterMap[show.theater._id] = show.theater;
          }
        });
        setTheaters(theaterMap);
        
        // Set first available date as selected if we have shows
        if (showsData.length > 0) {
          const firstShowDate = showsData[0].showDate;
          console.log('First show date from API:', firstShowDate);
          
          // Parse the date properly - handle both ISO string and Date object
          let dateStr;
          if (typeof firstShowDate === 'string') {
            dateStr = firstShowDate.split('T')[0];
          } else {
            dateStr = new Date(firstShowDate).toISOString().split('T')[0];
          }
          console.log('Setting selected date to:', dateStr);
          setSelectedDate(dateStr);
        }
      }
    } catch (error) {
      console.error('Error fetching shows:', error);
    } finally {
      setLoadingShows(false);
    }
  };

  useEffect(() => {
    if (movieId) {
      dispatch(fetchMovieById(movieId));
      fetchShows();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, movieId]);

  const handleBookShow = (showId) => {
    if (!user) {
      navigate('/login', { state: { from: `/movie/${movieId}` } });
      return;
    }
    navigate(`/movie/${movieId}/book/${showId}`);
  };

  // Group shows by theater and date
  const groupedShows = shows.reduce((acc, show) => {
    // Parse show date properly
    let showDateStr;
    if (typeof show.showDate === 'string') {
      showDateStr = show.showDate.split('T')[0];
    } else {
      showDateStr = new Date(show.showDate).toISOString().split('T')[0];
    }
    
    console.log('Comparing - Show date:', showDateStr, 'Selected date:', selectedDate, 'Match:', showDateStr === selectedDate);
    
    if (showDateStr !== selectedDate) return acc;
    
    const theaterId = show.theater?._id || 'unknown';
    if (!acc[theaterId]) {
      acc[theaterId] = [];
    }
    acc[theaterId].push(show);
    return acc;
  }, {});

  console.log('Total shows:', shows.length, 'Grouped shows:', Object.keys(groupedShows).length, 'Selected date:', selectedDate);

  // Get unique dates from shows
  const availableDates = [...new Set(shows.map(show => {
    if (typeof show.showDate === 'string') {
      return show.showDate.split('T')[0];
    }
    return new Date(show.showDate).toISOString().split('T')[0];
  }))].sort();

  if (movieLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!currentMovie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Movie Not Found</h2>
          <p className="text-gray-600">The movie you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Movie Header */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Movie Poster */}
            <div className="lg:col-span-1">
              <div className="aspect-w-2 aspect-h-3 rounded-lg overflow-hidden shadow-lg">
                <img
                  src={currentMovie.poster || '/api/placeholder/400/600'}
                  alt={currentMovie.title}
                  className="w-full h-96 object-cover"
                />
              </div>
            </div>

            {/* Movie Info */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    {currentMovie.title}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <span className="font-medium">
                        {currentMovie.rating?.userRating ? currentMovie.rating.userRating.toFixed(1) : 'N/A'}/5
                      </span>
                    </div>
                    <span>•</span>
                    <span>{currentMovie.duration} mins</span>
                    <span>•</span>
                    <span>{currentMovie.genre?.join(', ')}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {currentMovie.language?.map((lang, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                        {lang}
                      </span>
                    ))}
                  </div>
                  {currentMovie.format && currentMovie.format.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="text-sm font-medium text-gray-900 mr-2">Formats:</span>
                      {currentMovie.format.map((fmt, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                          {fmt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">About the Movie</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {currentMovie.description || 'No description available.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-900">Director:</span>
                    <p className="text-gray-600">{currentMovie.director || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Release Date:</span>
                    <p className="text-gray-600">
                      {(() => {
                        if (!currentMovie.releaseDate) return 'N/A';
                        try {
                          const date = new Date(currentMovie.releaseDate);
                          if (isNaN(date.getTime())) return 'N/A';
                          return date.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          });
                        } catch (e) {
                          return 'N/A';
                        }
                      })()}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Cast:</span>
                    <p className="text-gray-600">
                      {currentMovie.cast?.slice(0, 3).map(c => c.name).join(', ') || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Certificate:</span>
                    <p className="text-gray-600">{currentMovie.certification || 'N/A'}</p>
                  </div>
                </div>

                {/* Simple Book Now Button */}
                <div className="pt-4">
                  <button
                    onClick={() => {
                      const showsSection = document.getElementById('shows-section');
                      showsSection?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-red-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Book Tickets
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Show Times Section */}
      <div id="shows-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Date & Show Time</h2>
          
          {loadingShows ? (
            <div className="text-center py-8">
              <LoadingSpinner />
              <p className="text-gray-600 mt-2">Loading available shows...</p>
            </div>
          ) : availableDates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No shows available for this movie.</p>
            </div>
          ) : (
            <>
              {/* Date selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {availableDates.map((date) => {
                    const dateObj = new Date(date);
                    const isSelected = date === selectedDate;
                    return (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                          isSelected
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {dateObj.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          weekday: 'short'
                        })}
                      </button>
                    );
                  })}
                </div>
              </div>

              {Object.keys(groupedShows).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No shows available for this date.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedShows).map(([theaterId, theaterShows]) => {
                    const theater = theaters[theaterId];
                    if (!theater) return null;

                    return (
                      <div key={theaterId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{theater.name}</h4>
                            <p className="text-sm text-gray-600">
                              {theater.address?.street}, {theater.address?.city}
                            </p>
                          </div>
                          <div className="text-right text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                              <span>M-Ticket</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          {theaterShows.sort((a, b) => a.showTime.localeCompare(b.showTime)).map((show) => (
                            <button
                              key={show._id}
                              onClick={() => handleBookShow(show._id)}
                              disabled={show.seats.available === 0}
                              className={`border px-4 py-2 rounded text-sm font-medium transition-colors ${
                                show.seats.available === 0
                                  ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                                  : 'border-green-500 text-green-600 hover:bg-green-50'
                              }`}
                            >
                              <div>{show.showTime}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {show.seats.available} seats
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;