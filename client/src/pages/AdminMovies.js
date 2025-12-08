import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectIsAdmin } from '../store/slices/authSlice';
import { Navigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import { selectUser } from '../store/slices/authSlice';
import '../styles/Admin.css';

const AdminMovies = () => {
  const isAdmin = useSelector(selectIsAdmin);
  const user = useSelector(selectUser);
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Load movies from API
    const loadMovies = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        console.log('AdminMovies: Fetching movies...');
        
        // Build params object without empty values
        const params = {
          limit: 50,
          page: 1
        };
        // Don't include status filter to get all movies
        
        const response = await axios.get('/api/movies', {
          params,
          headers: token ? {
            'Authorization': `Bearer ${token}`
          } : {}
        });

        console.log('AdminMovies: API Response:', response.data);
        
        if (response.data.success) {
          const moviesData = response.data.data.movies || [];
          console.log('AdminMovies: Setting movies:', moviesData);
          setMovies(moviesData);
        } else {
          console.error('AdminMovies: API returned success=false');
        }
      } catch (error) {
        console.error('Error loading movies:', error);
        console.error('Error details:', error.response?.data);
        alert('Failed to load movies. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    loadMovies();
  }, [refreshTrigger]);

  // Reload movies when navigating back from add/edit pages
  useEffect(() => {
    if (location.state?.reload) {
      console.log('Reloading movies due to navigation state');
      setRefreshTrigger(prev => prev + 1);
      // Clear the state to prevent reload on future navigations
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleDeleteMovie = async (movieId) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      try {
        const token = localStorage.getItem('token');
        
        await axios.delete(`/api/movies/${movieId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setMovies(movies.filter(movie => movie._id !== movieId));
        alert('Movie deleted successfully!');
      } catch (error) {
        console.error('Error deleting movie:', error);
        alert('Failed to delete movie. Please try again.');
      }
    }
  };

  const handleStatusChange = async (movieId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.put(`/api/movies/${movieId}`, 
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setMovies(movies.map(m => 
        m._id === movieId 
          ? { ...m, status: newStatus }
          : m
      ));
      alert('Movie status updated successfully!');
    } catch (error) {
      console.error('Error updating movie status:', error);
      alert('Failed to update movie status. Please try again.');
    }
  };

  const filteredMovies = movies.filter(movie =>
    movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (movie.genre && movie.genre.some(g => g.toLowerCase().includes(searchTerm.toLowerCase()))) ||
    (movie.language && Array.isArray(movie.language) 
      ? movie.language.some(l => l.toLowerCase().includes(searchTerm.toLowerCase()))
      : movie.language && movie.language.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Redirect if not admin
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-container">
      <div className="admin-layout">
        <AdminSidebar collapsed={sidebarCollapsed} />
        <div className={`admin-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <AdminHeader 
            user={user} 
            onToggleSidebar={toggleSidebar} 
            sidebarCollapsed={sidebarCollapsed}
          />
          <div className="admin-content">
            <div className="admin-table-section">
              <div className="table-header">
                <h2 className="table-title">Movies Management</h2>
                <div className="table-actions">
                  <input
                    type="text"
                    placeholder="Search movies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input w-64"
                  />
                  <Link to="/admin/movies/add" className="btn-primary">
                    ➕ Add New Movie
                  </Link>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="loading-spinner mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading movies...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Poster</th>
                        <th>Title</th>
                        <th>Genre</th>
                        <th>Duration</th>
                        <th>Rating</th>
                        <th>Language</th>
                        <th>Release Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMovies.map((movie) => (
                        <tr key={movie._id}>
                          <td style={{ width: '80px', padding: '0.5rem' }}>
                            <img 
                              src={movie.poster} 
                              alt={movie.title}
                              style={{ 
                                width: '50px', 
                                height: '70px', 
                                objectFit: 'cover', 
                                borderRadius: '4px',
                                display: 'block'
                              }}
                            />
                          </td>
                          <td className="font-semibold">{movie.title}</td>
                          <td>{Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre}</td>
                          <td>{movie.duration} min</td>
                          <td>
                            <div className="flex items-center">
                              ⭐ {movie.rating?.imdb || movie.rating?.userRating || 'N/A'}
                            </div>
                          </td>
                          <td>{Array.isArray(movie.language) ? movie.language.join(', ') : movie.language}</td>
                          <td>{new Date(movie.releaseDate).toLocaleDateString()}</td>
                          <td>
                            <select 
                              value={movie.status}
                              onChange={(e) => handleStatusChange(movie._id, e.target.value)}
                              className="status-select"
                              style={{
                                padding: '0.375rem 0.75rem',
                                borderRadius: '6px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                background: 'rgba(31, 41, 55, 0.8)',
                                color: '#ffffff',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                outline: 'none'
                              }}
                            >
                              <option value="now-showing">Now Showing</option>
                              <option value="coming-soon">Coming Soon</option>
                              <option value="ended">Ended</option>
                            </select>
                          </td>
                          <td>
                            <div className="flex space-x-2">
                              <Link 
                                to={`/admin/movies/edit/${movie._id}`}
                                className="btn-secondary text-xs px-3 py-1"
                              >
                                ✏️ Edit
                              </Link>
                              <button 
                                onClick={() => handleDeleteMovie(movie._id)}
                                className="btn-danger text-xs px-3 py-1"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {filteredMovies.length === 0 && !loading && (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No movies found</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="stat-card">
                <div className="stat-icon">🎬</div>
                <div className="stat-value">{movies.length}</div>
                <div className="stat-label">Total Movies</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-value">{movies.filter(m => m.status === 'active').length}</div>
                <div className="stat-label">Active Movies</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏸️</div>
                <div className="stat-value">{movies.filter(m => m.status === 'inactive').length}</div>
                <div className="stat-label">Inactive Movies</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMovies;