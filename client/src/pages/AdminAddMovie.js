import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAdmin } from '../store/slices/authSlice';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import '../styles/Admin.css';

const AdminAddMovie = () => {
  const navigate = useNavigate();
  const isAdmin = useSelector(selectIsAdmin);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
    status: 'coming-soon'
  });

  React.useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

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

  const handleArrayChange = (field, value) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({
      ...prev,
      [field]: items
    }));
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

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add API call here
    console.log('Movie data:', formData);
    alert('Movie added successfully!');
    navigate('/admin/movies');
  };

  if (!isAdmin) {
    return null;
  }

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
                <h2 className="page-title">Add New Movie</h2>
              </div>
              
              <div className="admin-card">
                <form onSubmit={handleSubmit} className="admin-form">
              {/* Basic Information */}
              <div className="form-section">
                <h3 className="section-title">Basic Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                      placeholder="Enter movie title"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Duration (minutes) *</label>
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                      placeholder="180"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Release Date *</label>
                    <input
                      type="date"
                      name="releaseDate"
                      value={formData.releaseDate}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Certification *</label>
                    <select
                      name="certification"
                      value={formData.certification}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    >
                      <option value="">Select Certification</option>
                      <option value="U">U - Universal</option>
                      <option value="U/A">U/A - Parental Guidance</option>
                      <option value="A">A - Adults Only</option>
                      <option value="S">S - Restricted</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status *</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    >
                      <option value="coming-soon">Coming Soon</option>
                      <option value="now-showing">Now Showing</option>
                      <option value="ended">Ended</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Director *</label>
                    <input
                      type="text"
                      name="director"
                      value={formData.director}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                      placeholder="Director name"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="form-control"
                    rows="4"
                    required
                    placeholder="Enter movie description"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="form-section">
                <h3 className="section-title">Categories</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Genre *</label>
                    <input
                      type="text"
                      value={formData.genre.join(', ')}
                      onChange={(e) => handleArrayChange('genre', e.target.value)}
                      className="form-control"
                      placeholder="Action, Drama, Thriller (comma-separated)"
                      required
                    />
                    <small className="form-hint">Separate multiple genres with commas</small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Languages *</label>
                    <input
                      type="text"
                      value={formData.language.join(', ')}
                      onChange={(e) => handleArrayChange('language', e.target.value)}
                      className="form-control"
                      placeholder="English, Hindi, Tamil (comma-separated)"
                      required
                    />
                    <small className="form-hint">Separate multiple languages with commas</small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Format *</label>
                    <input
                      type="text"
                      value={formData.format.join(', ')}
                      onChange={(e) => handleArrayChange('format', e.target.value)}
                      className="form-control"
                      placeholder="2D, 3D, IMAX (comma-separated)"
                      required
                    />
                    <small className="form-hint">Separate multiple formats with commas</small>
                  </div>
                </div>
              </div>

              {/* Cast & Crew */}
              <div className="form-section">
                <div className="section-header">
                  <h3 className="section-title">Cast & Crew</h3>
                  <button type="button" onClick={addCastMember} className="btn-add-item">
                    + Add Cast Member
                  </button>
                </div>
                {formData.cast.map((member, index) => (
                  <div key={index} className="cast-item">
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Actor Name</label>
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => handleCastChange(index, 'name', e.target.value)}
                          className="form-control"
                          placeholder="Actor name"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Role</label>
                        <input
                          type="text"
                          value={member.role}
                          onChange={(e) => handleCastChange(index, 'role', e.target.value)}
                          className="form-control"
                          placeholder="Character name"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Image URL</label>
                        <input
                          type="text"
                          value={member.image}
                          onChange={(e) => handleCastChange(index, 'image', e.target.value)}
                          className="form-control"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    {formData.cast.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCastMember(index)}
                        className="btn-remove-item"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Media */}
              <div className="form-section">
                <h3 className="section-title">Media</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Poster URL *</label>
                    <input
                      type="url"
                      name="poster"
                      value={formData.poster}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                      placeholder="https://image.example.com/poster.jpg"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Banner Image URL *</label>
                    <input
                      type="url"
                      name="bannerImage"
                      value={formData.bannerImage}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                      placeholder="https://image.example.com/banner.jpg"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Trailer URL</label>
                    <input
                      type="url"
                      name="trailerUrl"
                      value={formData.trailerUrl}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="form-actions">
                <button type="button" onClick={() => navigate('/admin/movies')} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Add Movie
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

export default AdminAddMovie;
