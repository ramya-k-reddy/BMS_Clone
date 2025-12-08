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
  const [theaters, setTheaters] = useState([]);
  const [searchType, setSearchType] = useState('movie'); // 'movie' or 'theater'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedFormat, setSelectedFormat] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // Show 6 movies per page

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [moviesRes, theatersRes] = await Promise.all([
        axios.get('/api/movies'),
        axios.get('/api/theaters')
      ]);
      
      setMovies(moviesRes.data?.data?.movies || []);
      setTheaters(theatersRes.data?.data?.theaters || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
      setMovies([]);
      setTheaters([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMovies = Array.isArray(movies) ? movies.filter(movie => {
    const searchLower = searchQuery.toLowerCase().trim();
    const titleLower = movie.title?.toLowerCase() || '';
    const directorLower = movie.director?.toLowerCase() || '';
    
    if (searchQuery === '') return true;
    
    // Split title into words and check if any word starts with search query
    const titleWords = titleLower.split(/\s+/);
    const directorWords = directorLower.split(/\s+/);
    
    const titleWordStarts = titleWords.some(word => word.startsWith(searchLower));
    const directorWordStarts = directorWords.some(word => word.startsWith(searchLower));
    
    // Match if any word starts with the search query
    const matchesSearch = titleWordStarts || directorWordStarts;
    
    const matchesGenre = selectedGenre === 'All' || movie.genre?.includes(selectedGenre);
    const matchesLanguage = selectedLanguage === 'All' || movie.language?.includes(selectedLanguage);
    const matchesFormat = selectedFormat === 'All' || movie.format?.includes(selectedFormat);
    
    return matchesSearch && matchesGenre && matchesLanguage && matchesFormat;
  }).sort((a, b) => {
    // Sort results: movies starting with search query appear first
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase().trim();
      const aTitleStarts = a.title?.toLowerCase().startsWith(searchLower);
      const bTitleStarts = b.title?.toLowerCase().startsWith(searchLower);
      
      if (aTitleStarts && !bTitleStarts) return -1;
      if (!aTitleStarts && bTitleStarts) return 1;
    }
    return 0;
  }) : [];

  const filteredTheaters = Array.isArray(theaters) ? theaters.filter(theater => {
    const searchLower = searchQuery.toLowerCase().trim();
    const nameLower = theater.name?.toLowerCase() || '';
    const cityLower = theater.address?.city?.toLowerCase() || '';
    const streetLower = theater.address?.street?.toLowerCase() || '';
    
    if (searchQuery === '') return true;
    
    // Split into words and check if any word starts with search query
    const nameWords = nameLower.split(/\s+/);
    const cityWords = cityLower.split(/\s+/);
    const streetWords = streetLower.split(/\s+/);
    
    const matchesSearch = nameWords.some(word => word.startsWith(searchLower)) ||
                         cityWords.some(word => word.startsWith(searchLower)) ||
                         streetWords.some(word => word.startsWith(searchLower));
    
    return matchesSearch;
  }).sort((a, b) => {
    // Sort results: theaters starting with search query appear first
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase().trim();
      const aNameStarts = a.name?.toLowerCase().startsWith(searchLower);
      const bNameStarts = b.name?.toLowerCase().startsWith(searchLower);
      
      if (aNameStarts && !bNameStarts) return -1;
      if (!aNameStarts && bNameStarts) return 1;
    }
    return 0;
  }) : [];

  // Pagination calculations
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMovies = filteredMovies.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGenre, selectedLanguage, selectedFormat]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="pagination-container">
        <button
          className="pagination-button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="pagination-icon">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        <div className="pagination-numbers">
          {startPage > 1 && (
            <>
              <button
                className="pagination-number"
                onClick={() => handlePageChange(1)}
              >
                1
              </button>
              {startPage > 2 && <span className="pagination-ellipsis">...</span>}
            </>
          )}

          {pageNumbers.map(number => (
            <button
              key={number}
              className={`pagination-number ${currentPage === number ? 'active' : ''}`}
              onClick={() => handlePageChange(number)}
            >
              {number}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
              <button
                className="pagination-number"
                onClick={() => handlePageChange(totalPages)}
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        <button
          className="pagination-button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="pagination-icon">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  };

  console.log('Movies state:', movies);
  console.log('Theaters state:', theaters);
  console.log('Filtered movies:', filteredMovies);
  console.log('Filtered theaters:', filteredTheaters);
  console.log('Search query:', searchQuery);
  console.log('Selected genre:', selectedGenre);
  console.log('Selected language:', selectedLanguage);
  console.log('Selected format:', selectedFormat);

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
            🎬 Discover Entertainment
          </h1>
          <p className="movies-hero-subtitle">
            Search for movies and theaters near you
          </p>
        </div>
      </section>

      {/* Search Type Tabs */}
      <section className="search-type-section">
        <div className="movies-filters-container">
          <div className="search-type-tabs">
            <button
              className={`tab-button ${searchType === 'movie' ? 'active' : ''}`}
              onClick={() => setSearchType('movie')}
            >
              🎬 Movies
            </button>
            <button
              className={`tab-button ${searchType === 'theater' ? 'active' : ''}`}
              onClick={() => setSearchType('theater')}
            >
              🎭 Theaters
            </button>
          </div>
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
              placeholder={searchType === 'movie' ? 'Search movies by title or director...' : 'Search theaters by name or location...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Movies Grid Section */}
      {searchType === 'movie' ? (
      <section className="movies-grid-section">
        <div className="movies-grid-container">
          <div className="movies-grid-header">
            <h2 className="movies-grid-title">
              {filteredMovies.length} {filteredMovies.length === 1 ? 'Movie' : 'Movies'} Available
              {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
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
              {currentMovies.map(movie => (
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

          {/* Pagination */}
          {renderPagination()}
        </div>
      </section>
      ) : (
      <section className="theaters-list-section">
        <div className="movies-grid-container">
          <div className="movies-grid-header">
            <h2 className="movies-grid-title">
              {filteredTheaters.length} {filteredTheaters.length === 1 ? 'Theater' : 'Theaters'} Available
            </h2>
          </div>

          {filteredTheaters.length === 0 ? (
            <div className="movies-empty-state">
              <div className="movies-empty-icon">🎭</div>
              <h3 className="movies-empty-title">No theaters found</h3>
              <p className="movies-empty-text">
                Try adjusting your search query
              </p>
            </div>
          ) : (
            <div className="theaters-list">
              {filteredTheaters.map(theater => (
                <div key={theater._id} className="theater-card">
                  <div className="theater-card-header">
                    <h3 className="theater-card-title">{theater.name}</h3>
                    <span className="theater-card-screens">{theater.screens?.length || 0} Screens</span>
                  </div>
                  <div className="theater-card-body">
                    <div className="theater-card-address">
                      <svg className="theater-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p>{theater.address?.street}</p>
                        <p>{theater.address?.city}, {theater.address?.state} {theater.address?.zipCode}</p>
                      </div>
                    </div>
                    {theater.amenities && theater.amenities.length > 0 && (
                      <div className="theater-card-amenities">
                        {theater.amenities.slice(0, 4).map((amenity, index) => (
                          <span key={index} className="theater-amenity-badge">{amenity}</span>
                        ))}
                      </div>
                    )}
                    <Link 
                      to={`/theater/${theater._id}`} 
                      className="movie-card-book-btn"
                    >
                      View Shows
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      )}
    </div>
  );
};

export default Movies;
