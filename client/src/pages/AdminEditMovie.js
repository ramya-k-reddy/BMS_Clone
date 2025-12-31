import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { selectIsAdmin } from '../store/slices/authSlice';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import '../styles/Admin.css';

const AdminEditMovie = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAdmin = useSelector(selectIsAdmin);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingMovie, setFetchingMovie] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: [],
    language: [],
    duration: '',
    releaseDate: '',
    director: '',
    cast: [{ name: '', role: '', image: '' }],
    poster: '',
    bannerImage: '',
    trailerUrl: '',
    certification: '',
    format: [],
    status: 'coming-soon',
    rating: {
      imdb: '',
      userRating: '',
      totalRatings: 0
    }
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    fetchMovie();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchMovie = async () => {
    try {
      setFetchingMovie(true);
      const response = await axios.get(`/api/movies/${id}`);
      const movie = response.data.data.movie;
      
      setFormData({
        title: movie.title || '',
        description: movie.description || '',
        genre: Array.isArray(movie.genre) ? movie.genre : [],
        language: Array.isArray(movie.language) ? movie.language : [],
        duration: movie.duration || '',
        releaseDate: movie.releaseDate ? new Date(movie.releaseDate).toISOString().split('T')[0] : '',
        director: movie.director || '',
        cast: movie.cast && movie.cast.length > 0 ? movie.cast : [{ name: '', role: '', image: '' }],
        poster: movie.poster || '',
        bannerImage: movie.bannerImage || '',
        trailerUrl: movie.trailerUrl || '',
        certification: movie.certification || '',
        format: Array.isArray(movie.format) ? movie.format : [],
        status: movie.status || 'coming-soon',
        rating: {
          imdb: movie.rating?.imdb || '',
          userRating: movie.rating?.userRating || '',
          totalRatings: movie.rating?.totalRatings || 0
        }
      });
    } catch (err) {
      console.error('Error fetching movie:', err);
      setError('Failed to load movie details');
      alert('Failed to load movie. Please try again.');
    } finally {
      setFetchingMovie(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRatingChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      rating: {
        ...prev.rating,
        [name]: value === '' ? '' : parseFloat(value)
      }
    }));
  };

  const handleMultiSelect = (field, value) => {
    setFormData(prev => {
      const currentValues = prev[field];
      return {
        ...prev,
        [field]: currentValues.includes(value)
          ? currentValues.filter(v => v !== value)
          : [...currentValues, value]
      };
    });
  };

  const handleCastChange = (index, field, value) => {
    const newCast = [...formData.cast];
    newCast[index][field] = value;
    setFormData(prev => ({
      ...prev,
      cast: newCast
    }));
  };

  const addCastMember = () => {
    setFormData(prev => ({
      ...prev,
      cast: [...prev.cast, { name: '', role: '', image: '' }]
    }));
  };

  const removeCastMember = (index) => {
    if (formData.cast.length > 1) {
      setFormData(prev => ({
        ...prev,
        cast: prev.cast.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required array fields
      if (formData.genre.length === 0) {
        setError('Please select at least one genre');
        setLoading(false);
        return;
      }
      if (formData.language.length === 0) {
        setError('Please select at least one language');
        setLoading(false);
        return;
      }
      if (formData.format.length === 0) {
        setError('Please select at least one format');
        setLoading(false);
        return;
      }

      // Get auth token
      const token = localStorage.getItem('token');
      
      // Prepare movie data
      const movieData = {
        ...formData,
        duration: parseInt(formData.duration),
        cast: formData.cast.filter(member => member.name.trim() !== ''),
        rating: {
          imdb: formData.rating.imdb ? parseFloat(formData.rating.imdb) : 0,
          userRating: formData.rating.userRating ? parseFloat(formData.rating.userRating) : 0,
          totalRatings: parseInt(formData.rating.totalRatings) || 0
        }
      };

      // Make API call
      const response = await axios.put(`/api/movies/${id}`, movieData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        alert('Movie updated successfully!');
        // Navigate with state to trigger reload
        navigate('/admin/movies', { state: { reload: true } });
      }
    } catch (err) {
      console.error('Update movie error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update movie. Please try again.';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (fetchingMovie) {
    return (
      <div className="admin-container">
        <div className="admin-layout">
          <AdminSidebar collapsed={sidebarCollapsed} />
          <div className={`admin-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <AdminHeader 
              onToggleSidebar={toggleSidebar} 
              sidebarCollapsed={sidebarCollapsed}
            />
            <div className="admin-content">
              <div className="admin-main-content">
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                  Loading movie details...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const genres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Animation', 'Biography', 'Crime', 'Documentary', 'Family', 'History', 'Music', 'Mystery', 'War', 'Western'];
  const languages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Marathi', 'Punjabi', 'Gujarati'];
  const formats = ['2D', '3D', 'IMAX', '4DX'];

  return (
    <div className="admin-container">
      <div className="admin-layout">
        <AdminSidebar collapsed={sidebarCollapsed} />
        <div className={`admin-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <AdminHeader 
            onToggleSidebar={toggleSidebar} 
            sidebarCollapsed={sidebarCollapsed}
          />
          <div className="admin-content">
            <div className="admin-main-content">
              <div className="page-header">
                <h2 className="page-title">Edit Movie</h2>
              </div>
              
              <div className="admin-card">
                <form onSubmit={handleSubmit} className="admin-form">
                  {error && (
                    <div className="error-message" style={{ 
                      background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.15), rgba(185, 28, 28, 0.1))',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#fca5a5',
                      padding: '1rem',
                      borderRadius: '12px',
                      marginBottom: '1.5rem',
                      fontSize: '0.875rem'
                    }}>
                      ⚠️ {error}
                    </div>
                  )}

                  {/* Basic Information */}
                  <div className="form-section">
                    <h3 className="section-title">Basic Information</h3>
                    
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Movie Title *</label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="form-input"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Director *</label>
                        <input
                          type="text"
                          name="director"
                          value={formData.director}
                          onChange={handleInputChange}
                          className="form-input"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Duration (minutes) *</label>
                        <input
                          type="number"
                          name="duration"
                          value={formData.duration}
                          onChange={handleInputChange}
                          className="form-input"
                          required
                          min="1"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Release Date *</label>
                        <input
                          type="date"
                          name="releaseDate"
                          value={formData.releaseDate}
                          onChange={handleInputChange}
                          className="form-input"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Certification *</label>
                        <select
                          name="certification"
                          value={formData.certification}
                          onChange={handleInputChange}
                          className="form-input"
                          required
                        >
                          <option value="">Select Certification</option>
                          <option value="U">U (Universal)</option>
                          <option value="U/A">U/A (Parental Guidance)</option>
                          <option value="A">A (Adults Only)</option>
                          <option value="S">S (Restricted)</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Status *</label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="form-input"
                          required
                        >
                          <option value="coming-soon">Coming Soon</option>
                          <option value="now-showing">Now Showing</option>
                          <option value="ended">Ended</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Description *</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="form-input"
                        rows="4"
                        required
                      />
                    </div>
                  </div>

                  {/* Rating Section */}
                  <div className="form-section">
                    <h3 className="section-title">Rating</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">IMDB Rating (0-10)</label>
                        <input
                          type="number"
                          name="imdb"
                          value={formData.rating.imdb}
                          onChange={handleRatingChange}
                          className="form-input"
                          min="0"
                          max="10"
                          step="0.1"
                          placeholder="e.g., 8.5"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">User Rating (0-5)</label>
                        <input
                          type="number"
                          name="userRating"
                          value={formData.rating.userRating}
                          onChange={handleRatingChange}
                          className="form-input"
                          min="0"
                          max="5"
                          step="0.1"
                          placeholder="e.g., 4.5"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Total Ratings</label>
                        <input
                          type="number"
                          name="totalRatings"
                          value={formData.rating.totalRatings}
                          onChange={handleRatingChange}
                          className="form-input"
                          min="0"
                          placeholder="e.g., 250"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Genre Selection */}
                  <div className="form-section">
                    <h3 className="section-title">Genre * (Select at least one)</h3>
                    <div className="multi-select-container">
                      <div className="multi-select-grid">
                        {genres.map(genre => (
                          <label key={genre} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={formData.genre.includes(genre)}
                              onChange={() => handleMultiSelect('genre', genre)}
                              className="checkbox-input"
                            />
                            <span>{genre}</span>
                          </label>
                        ))}
                      </div>
                      {formData.genre.length > 0 && (
                        <div className="selected-items">
                          <strong>Selected:</strong> {formData.genre.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Language Selection */}
                  <div className="form-section">
                    <h3 className="section-title">Languages * (Select at least one)</h3>
                    <div className="multi-select-container">
                      <div className="multi-select-grid">
                        {languages.map(language => (
                          <label key={language} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={formData.language.includes(language)}
                              onChange={() => handleMultiSelect('language', language)}
                              className="checkbox-input"
                            />
                            <span>{language}</span>
                          </label>
                        ))}
                      </div>
                      {formData.language.length > 0 && (
                        <div className="selected-items">
                          <strong>Selected:</strong> {formData.language.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Format Selection */}
                  <div className="form-section">
                    <h3 className="section-title">Format * (Select at least one)</h3>
                    <div className="multi-select-container">
                      <div className="multi-select-grid">
                        {formats.map(format => (
                          <label key={format} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={formData.format.includes(format)}
                              onChange={() => handleMultiSelect('format', format)}
                              className="checkbox-input"
                            />
                            <span>{format}</span>
                          </label>
                        ))}
                      </div>
                      {formData.format.length > 0 && (
                        <div className="selected-items">
                          <strong>Selected:</strong> {formData.format.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cast Members */}
                  <div className="form-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 className="section-title" style={{ marginBottom: 0 }}>Cast Members</h3>
                      <button
                        type="button"
                        onClick={addCastMember}
                        className="btn-secondary"
                      >
                        + Add Cast Member
                      </button>
                    </div>
                    
                    {formData.cast.map((member, index) => (
                      <div key={index} style={{ 
                        background: 'rgba(31, 41, 55, 0.5)', 
                        padding: '1rem', 
                        borderRadius: '8px', 
                        marginBottom: '1rem',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Cast Member {index + 1}</span>
                          {formData.cast.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCastMember(index)}
                              style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}
                            >
                              ×
                            </button>
                          )}
                        </div>
                        <div className="form-grid">
                          <div className="form-group">
                            <label className="form-label">Name</label>
                            <input
                              type="text"
                              value={member.name}
                              onChange={(e) => handleCastChange(index, 'name', e.target.value)}
                              className="form-input"
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Role</label>
                            <input
                              type="text"
                              value={member.role}
                              onChange={(e) => handleCastChange(index, 'role', e.target.value)}
                              className="form-input"
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Image URL</label>
                            <input
                              type="url"
                              value={member.image}
                              onChange={(e) => handleCastChange(index, 'image', e.target.value)}
                              className="form-input"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Media Links */}
                  <div className="form-section">
                    <h3 className="section-title">Media & Links</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Poster URL *</label>
                        <input
                          type="url"
                          name="poster"
                          value={formData.poster}
                          onChange={handleInputChange}
                          className="form-input"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Banner Image URL</label>
                        <input
                          type="url"
                          name="bannerImage"
                          value={formData.bannerImage}
                          onChange={handleInputChange}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Trailer URL</label>
                        <input
                          type="url"
                          name="trailerUrl"
                          value={formData.trailerUrl}
                          onChange={handleInputChange}
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                      style={{ flex: 1 }}
                    >
                      {loading ? 'Updating Movie...' : 'Update Movie'}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/admin/movies')}
                      className="btn-secondary"
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEditMovie;
