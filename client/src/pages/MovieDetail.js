import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMovieById } from '../store/slices/moviesSlice';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const MovieDetail = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentMovie, loading: movieLoading } = useSelector((state) => state.movies);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (movieId) {
      dispatch(fetchMovieById(movieId));
    }
  }, [dispatch, movieId]);

  const handleBookNow = () => {
    if (!user) {
      navigate('/login', { state: { from: `/movie/${movieId}` } });
      return;
    }
    // For simple demo, just show alert
    alert('Booking functionality will be implemented soon!');
  };

  // Sample show times for demo
  const sampleShowTimes = [
    '10:00 AM', '1:00 PM', '4:00 PM', '7:00 PM', '10:00 PM'
  ];

  const sampleTheaters = [
    'PVR Cinemas',
    'INOX Movies',
    'Cinepolis',
    'MovieMax'
  ];

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
                        {currentMovie.rating ? currentMovie.rating.toFixed(1) : 'N/A'}/5
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
                      {currentMovie.releaseDate 
                        ? new Date(currentMovie.releaseDate).toLocaleDateString()
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Cast:</span>
                    <p className="text-gray-600">{currentMovie.cast?.join(', ') || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Certificate:</span>
                    <p className="text-gray-600">{currentMovie.certificate || 'N/A'}</p>
                  </div>
                </div>

                {/* Simple Book Now Button */}
                <div className="pt-4">
                  <button
                    onClick={handleBookNow}
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Show Times</h2>
          
          {/* Show times for different theaters */}
          <div className="space-y-6">
            {sampleTheaters.map((theater, theaterIndex) => (
              <div key={theaterIndex} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{theater}</h4>
                    <p className="text-sm text-gray-600">Sample Theater Address</p>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <span>Mobile Ticket</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {sampleShowTimes.map((time, timeIndex) => (
                    <button
                      key={timeIndex}
                      onClick={handleBookNow}
                      className="border border-green-500 text-green-600 hover:bg-green-50 px-4 py-2 rounded text-sm font-medium transition-colors"
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Simple info message */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-blue-700 text-sm">
                This is a demo project. Show times and theaters are sample data for demonstration purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;