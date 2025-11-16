import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../store/slices/authSlice';
import axios from 'axios';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import '../styles/Movies.css';

const Movies = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedFormat, setSelectedFormat] = useState('All');

  const genres = ['All', 'Action', 'Adventure', 'Sci-Fi', 'Drama', 'Comedy', 'Horror', 'Thriller', 'Romance', 'History'];
  const languages = ['All', 'English', 'Hindi', 'Tamil', 'Telugu'];
  const formats = ['All', '2D', '3D', 'IMAX'];

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/movies');
      // API returns data in structure: { success, data: { movies, pagination } }
      setMovies(response.data?.data?.movies || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching movies:', err);
      setError('Failed to load movies. Please try again.');
      setMovies([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const filteredMovies = Array.isArray(movies) ? movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         movie.director.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || movie.genre.includes(selectedGenre);
    const matchesLanguage = selectedLanguage === 'All' || movie.language.includes(selectedLanguage);
    const matchesFormat = selectedFormat === 'All' || movie.format.includes(selectedFormat);
    
    return matchesSearch && matchesGenre && matchesLanguage && matchesFormat;
  }) : [];

  const formatDuration = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="movies-loading">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="movies-container">
      {/* Hero Section */}
      <section className="movies-hero">
        <div className="movies-hero-content">
          <h1 className="movies-hero-title">
            🎬 Discover Amazing Movies
          </h1>
          <p className="movies-hero-subtitle">
            Book tickets for the latest blockbusters and indie films
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="movies-filters-section">
        <div className="movies-filters-container">
          {/* Search Bar */}
          <div className="movies-search-bar">
            <svg className="movies-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="movies-search-input"
              placeholder="Search movies by title or director..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Buttons */}
          <div className="movies-filters-grid">
            {/* Genre Filter */}
            <div className="movies-filter-group">
              <label className="movies-filter-label">Genre</label>
              <div className="movies-filter-buttons">
                {genres.map(genre => (
                  <button
                    key={genre}
                    className={`movies-filter-btn ${selectedGenre === genre ? 'active' : ''}`}
                    onClick={() => setSelectedGenre(genre)}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Filter */}
            <div className="movies-filter-group">
              <label className="movies-filter-label">Language</label>
              <div className="movies-filter-buttons">
                {languages.map(language => (
                  <button
                    key={language}
                    className={`movies-filter-btn ${selectedLanguage === language ? 'active' : ''}`}
                    onClick={() => setSelectedLanguage(language)}
                  >
                    {language}
                  </button>
                ))}
              </div>
            </div>

            {/* Format Filter */}
            <div className="movies-filter-group">
              <label className="movies-filter-label">Format</label>
              <div className="movies-filter-buttons">
                {formats.map(format => (
                  <button
                    key={format}
                    className={`movies-filter-btn ${selectedFormat === format ? 'active' : ''}`}
                    onClick={() => setSelectedFormat(format)}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Movies Grid Section */}
      <section className="movies-grid-section">
        <div className="movies-grid-container">
          <div className="movies-grid-header">
            <h2 className="movies-grid-title">
              {filteredMovies.length} {filteredMovies.length === 1 ? 'Movie' : 'Movies'} Available
            </h2>
            {(searchQuery || selectedGenre !== 'All' || selectedLanguage !== 'All' || selectedFormat !== 'All') && (
              <button
                className="movies-clear-filters"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGenre('All');
                  setSelectedLanguage('All');
                  setSelectedFormat('All');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>

          {error && (
            <div className="movies-error-message">
              <svg className="movies-error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>{error}</p>
            </div>
          )}

          {filteredMovies.length === 0 ? (
            <div className="movies-empty-state">
              <div className="movies-empty-icon">🎬</div>
              <h3 className="movies-empty-title">No movies found</h3>
              <p className="movies-empty-text">
                Try adjusting your filters or search query
              </p>
            </div>
          ) : (
            <div className="movies-grid">
              {filteredMovies.map(movie => (
                <div key={movie._id} className="movie-card">
                  <div className="movie-card-image-container">
                    <img
                      src={movie.poster || 'https://via.placeholder.com/300x450?text=No+Poster'}
                      alt={movie.title}
                      className="movie-card-image"
                    />
                    <div className="movie-card-overlay">
                      <div className="movie-card-rating">
                        <svg className="movie-rating-icon" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {movie.rating?.imdb || 'N/A'}
                      </div>
                      <Link to={`/movie/${movie._id}`} className="movie-card-play-btn">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </Link>
                    </div>
                    <div className="movie-card-status-badge">
                      {movie.status === 'now-showing' ? 'Now Showing' : 'Coming Soon'}
                    </div>
                  </div>

                  <div className="movie-card-content">
                    <h3 className="movie-card-title">{movie.title}</h3>
                    
                    <div className="movie-card-meta">
                      <span className="movie-card-meta-item">
                        <svg className="movie-meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDuration(movie.duration)}
                      </span>
                      <span className="movie-card-meta-item">
                        {movie.certification}
                      </span>
                    </div>

                    <div className="movie-card-genres">
                      {movie.genre.slice(0, 3).map((genre, index) => (
                        <span key={index} className="movie-card-genre-badge">{genre}</span>
                      ))}
                    </div>

                    <div className="movie-card-languages">
                      {movie.language.map((lang, index) => (
                        <span key={index} className="movie-card-language">{lang}</span>
                      ))}
                    </div>

                    <Link 
                      to={`/movie/${movie._id}`} 
                      className="movie-card-book-btn"
                    >
                      {isAuthenticated ? 'Book Now' : 'View Details'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Movies;
