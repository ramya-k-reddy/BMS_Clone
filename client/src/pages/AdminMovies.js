import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectIsAdmin } from '../store/slices/authSlice';
import { Navigate, Link } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import { selectUser } from '../store/slices/authSlice';
import '../styles/Admin.css';

const AdminMovies = () => {
  const isAdmin = useSelector(selectIsAdmin);
  const user = useSelector(selectUser);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Load movies - replace with actual API call
    const loadMovies = async () => {
      try {
        // Mock data - replace with actual API
        setTimeout(() => {
          setMovies([
            {
              _id: '1',
              title: 'Avengers: Endgame',
              genre: ['Action', 'Adventure', 'Drama'],
              duration: 181,
              rating: 8.4,
              language: 'English',
              releaseDate: '2019-04-26',
              status: 'active',
              poster: 'https://via.placeholder.com/300x450?text=Avengers'
            },
            {
              _id: '2',
              title: 'Spider-Man: No Way Home',
              genre: ['Action', 'Adventure', 'Sci-Fi'],
              duration: 148,
              rating: 8.2,
              language: 'English',
              releaseDate: '2021-12-17',
              status: 'active',
              poster: 'https://via.placeholder.com/300x450?text=Spider-Man'
            },
            {
              _id: '3',
              title: 'The Batman',
              genre: ['Action', 'Crime', 'Drama'],
              duration: 176,
              rating: 7.8,
              language: 'English',
              releaseDate: '2022-03-04',
              status: 'inactive',
              poster: 'https://via.placeholder.com/300x450?text=Batman'
            }
          ]);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error loading movies:', error);
        setLoading(false);
      }
    };

    loadMovies();
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleDeleteMovie = async (movieId) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      try {
        // Implement delete API call
        setMovies(movies.filter(movie => movie._id !== movieId));
        console.log('Movie deleted:', movieId);
      } catch (error) {
        console.error('Error deleting movie:', error);
      }
    }
  };

  const handleToggleStatus = async (movieId) => {
    try {
      // Implement toggle status API call
      setMovies(movies.map(movie => 
        movie._id === movieId 
          ? { ...movie, status: movie.status === 'active' ? 'inactive' : 'active' }
          : movie
      ));
    } catch (error) {
      console.error('Error toggling movie status:', error);
    }
  };

  const filteredMovies = movies.filter(movie =>
    movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movie.genre.some(g => g.toLowerCase().includes(searchTerm.toLowerCase())) ||
    movie.language.toLowerCase().includes(searchTerm.toLowerCase())
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
                  <Link to="/admin/movies/new" className="btn-primary">
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
                          <td>
                            <img 
                              src={movie.poster} 
                              alt={movie.title}
                              className="w-12 h-16 object-cover rounded"
                            />
                          </td>
                          <td className="font-semibold">{movie.title}</td>
                          <td>{movie.genre.join(', ')}</td>
                          <td>{movie.duration} min</td>
                          <td>
                            <div className="flex items-center">
                              ⭐ {movie.rating}
                            </div>
                          </td>
                          <td>{movie.language}</td>
                          <td>{new Date(movie.releaseDate).toLocaleDateString()}</td>
                          <td>
                            <span className={`status-badge ${movie.status}`}>
                              {movie.status}
                            </span>
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
                                onClick={() => handleToggleStatus(movie._id)}
                                className="btn-secondary text-xs px-3 py-1"
                              >
                                {movie.status === 'active' ? '⏸️ Deactivate' : '▶️ Activate'}
                              </button>
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