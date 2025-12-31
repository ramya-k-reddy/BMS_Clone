import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { selectIsAdmin } from '../store/slices/authSlice';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import '../styles/Admin.css';

const AdminShows = () => {
    // Form state for Add Show modal
    const [formData, setFormData] = useState({
      movie: '',
      theater: '',
      screen: '',
      showDate: '',
      showTime: '',
      language: '',
      format: '',
      pricing: []
    });

    // Modal visibility state
    const [showAddModal, setShowAddModal] = useState(false);

    // Handler for input changes
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handler to close modal
    const handleCloseModal = () => {
      setShowAddModal(false);
      setFormData({
        movie: '',
        theater: '',
        screen: '',
        showDate: '',
        showTime: '',
        language: '',
        format: '',
        pricing: []
      });
    };

    // Handler for search box
    const handleSearch = (e) => {
      setSearchTerm(e.target.value);
    };
  const navigate = useNavigate();
  const isAdmin = useSelector(selectIsAdmin);
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('all');
  const [filterTheater, setFilterTheater] = useState('all');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // Load movies, theaters, and shows on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const [moviesRes, theatersRes, showsRes] = await Promise.all([
          axios.get('/api/movies', { params: { limit: 50 }, headers }),
          axios.get('/api/theaters', { params: { limit: 50 }, headers }),
          axios.get('/api/shows', { params: { limit: 100 }, headers })
        ]);

        if (moviesRes.data.success) {
          setMovies(moviesRes.data.data.movies || []);
        }

        if (theatersRes.data.success) {
          const loadedTheaters = theatersRes.data.data.theaters || [];
          console.log('Loaded theaters:', loadedTheaters.length);
          console.log('First theater screens:', loadedTheaters[0]?.screens);
          setTheaters(loadedTheaters);
        }

        if (showsRes.data.success) {
          setShows(showsRes.data.data.shows || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        console.error('Error details:', error.response?.data);
        alert('Failed to load data. Please refresh the page.');
        // Example: set default pricing if error occurs (if needed)
        // const defaultPricing = [
        //   { category: 'Gold', price: 250 },
        //   { category: 'Silver', price: 180 }
        // ];
        // setFormData(prev => ({
        //   ...prev,
        //   [name]: value,
        //   pricing: defaultPricing
        // }));
        // return;
      }
    };
    loadData();
  }, []);
  const handlePricingChange = (index, value) => {
    const newPricing = [...formData.pricing];
    newPricing[index].price = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, pricing: newPricing }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.movie || !formData.theater || !formData.screen) {
        alert('Please fill in all required fields');
        return;
      }

      if (!formData.pricing || formData.pricing.length === 0) {
        alert('Please wait for pricing to load or select a screen again');
        return;
      }

      const token = localStorage.getItem('token');
      const selectedScreen = selectedTheaterScreens.find(s => s.screenNumber === parseInt(formData.screen));
      
      if (!selectedScreen) {
        alert('Please select a valid screen');
        return;
      }

      const showData = {
        movie: formData.movie,
        theater: formData.theater,
        screen: {
          screenNumber: selectedScreen.screenNumber,
          name: selectedScreen.name
        },
        showDate: formData.showDate,
        showTime: formData.showTime,
        language: formData.language,
        format: formData.format,
        pricing: formData.pricing
      };

      console.log('Submitting show data:', showData);
      console.log('Form data pricing:', formData.pricing);

      const response = await axios.post('/api/shows', showData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        alert('Show added successfully!');
        setShows([...shows, response.data.data.show]);
        handleCloseModal();
      }
    } catch (error) {
      console.error('Error adding show:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.errors 
        ? error.response.data.errors.map(e => `${e.param}: ${e.msg}`).join('\n')
        : error.response?.data?.message || 'Failed to add show. Please try again.';
      alert(errorMessage);
    }
  };

  const handleToggleStatus = async (showId) => {
    const show = shows.find(s => s._id === showId);
    const newStatus = !show.isActive;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/shows/${showId}`, 
        { isActive: newStatus },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      setShows(shows.map(s => 
        s._id === showId ? { ...s, isActive: newStatus } : s
      ));
      alert(`Show ${newStatus ? 'activated' : 'cancelled'} successfully!`);
    } catch (error) {
      console.error('Error toggling show status:', error);
      alert('Failed to update show status. Please try again.');
    }
  };

  const filteredShows = shows.filter(show => {
    const movieTitle = typeof show.movie === 'object' ? show.movie?.title?.toLowerCase() : '';
    const theaterName = typeof show.theater === 'object' ? show.theater?.name?.toLowerCase() : '';
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = movieTitle.includes(searchLower) || theaterName.includes(searchLower);
    const showDateStr = new Date(show.showDate).toISOString().split('T')[0];
    const matchesDate = filterDate === 'all' || showDateStr === filterDate;
    const matchesTheater = filterTheater === 'all' || show.theater?._id === filterTheater || show.theater === filterTheater;
    
    return matchesSearch && matchesDate && matchesTheater;
  });

  const stats = {
    totalShows: shows.length,
    activeShows: shows.filter(s => s.isActive).length,
    soldOutShows: shows.filter(s => s.seats?.available === 0).length,
    totalBookings: shows.reduce((sum, s) => sum + (s.seats?.booked?.length || 0), 0)
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="admin-container">
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-main">
          <AdminHeader title="Shows Management" />
          <div className="admin-content">
            <div className="admin-main-content">
          {/* Statistics Cards */}
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-icon stat-icon-blue">
                <span className="text-2xl">🎬</span>
              </div>
              <div className="stat-details">
                <p className="stat-label">Total Shows</p>
                <p className="stat-value">{stats.totalShows}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-green">
                <span className="text-2xl">✅</span>
              </div>
              <div className="stat-details">
                <p className="stat-label">Active Shows</p>
                <p className="stat-value">{stats.activeShows}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-red">
                <span className="text-2xl">🔥</span>
              </div>
              <div className="stat-details">
                <p className="stat-label">Sold Out</p>
                <p className="stat-value">{stats.soldOutShows}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-purple">
                <span className="text-2xl">🎟️</span>
              </div>
              <div className="stat-details">
                <p className="stat-label">Total Bookings</p>
                <p className="stat-value">{stats.totalBookings}</p>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="admin-card filters-card">
            <div className="filters-container">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="🔍 Search by movie or theater..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="admin-input"
                />
              </div>

              <div className="filter-group">
                <select
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="admin-select"
                >
                  <option value="all">All Dates</option>
                  {[...new Set(shows.map(s => new Date(s.showDate).toISOString().split('T')[0]))]
                    .sort()
                    .slice(0, 7)
                    .map(date => (
                      <option key={date} value={date}>
                        {new Date(date).toLocaleDateString()}
                      </option>
                    ))
                  }
                </select>

                <select
                  value={filterTheater}
                  onChange={(e) => setFilterTheater(e.target.value)}
                  className="admin-select"
                >
                  <option value="all">All Theaters</option>
                  {theaters.map(theater => (
                    <option key={theater._id} value={theater._id}>
                      {theater.name}
                    </option>
                  ))}
                </select>

              </div>
            </div>
          </div>

          {/* Shows Table */}
          <div className="admin-card table-card">
            {loading ? (
              <div className="text-center py-8">
                <div className="loading-spinner mx-auto mb-4"></div>
                <p className="text-gray-400">Loading shows...</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Movie</th>
                      <th>Theater & Screen</th>
                      <th>Date & Time</th>
                      <th>Language/Format</th>
                      <th>Occupancy</th>
                      <th>Status</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShows.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="empty-state">
                          <div className="empty-icon">📭</div>
                          <p>No shows found</p>
                        </td>
                      </tr>
                  ) : (
                    filteredShows.map((show) => {
                      const totalSeats = show.seats?.total || 0;
                      const bookedSeats = show.seats?.booked?.length || 0;
                      const occupancyPercentage = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;
                      const movieTitle = typeof show.movie === 'object' ? show.movie?.title : 'N/A';
                      const theaterName = typeof show.theater === 'object' ? show.theater?.name : 'N/A';
                      
                      return (
                        <tr key={show._id}>
                          <td>
                            <div className="movie-title">{movieTitle}</div>
                          </td>
                          <td>
                            <div className="theater-info">
                              <div className="theater-name">{theaterName}</div>
                              <div className="screen-name">{show.screen?.name || `Screen ${show.screen?.screenNumber}`}</div>
                            </div>
                          </td>
                          <td>
                            <div className="datetime-info">
                              <div className="date-text">{new Date(show.showDate).toLocaleDateString()}</div>
                              <div className="time-text">{show.showTime}</div>
                            </div>
                          </td>
                          <td>
                            <div className="format-info">
                              <div className="language-text">{show.language}</div>
                              <div className="format-badge">{show.format}</div>
                            </div>
                          </td>
                          <td>
                            <div className="occupancy-info">
                              <div className={`occupancy-percentage ${occupancyPercentage >= 80 ? 'high' : occupancyPercentage >= 50 ? 'medium' : 'low'}`}>
                                {occupancyPercentage}%
                              </div>
                              <div className="seats-count">
                                {bookedSeats}/{totalSeats} seats
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${show.isActive ? 'active' : 'cancelled'}`}>
                              {show.isActive ? 'Active' : 'Cancelled'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                onClick={() => navigate(`/admin/shows/edit/${show._id}`)}
                                className="btn-icon btn-edit"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleToggleStatus(show._id)}
                                className={`btn-icon ${show.isActive ? 'btn-pause' : 'btn-play'}`}
                                title={show.isActive ? 'Cancel' : 'Activate'}
                              >
                                {show.isActive ? '⏸️' : '▶️'}
                              </button>
                              {/* <button
                                onClick={() => handleDeleteShow(show._id)}
                                className="btn-icon btn-delete"
                                title="Delete"
                              >
                                🗑️
                              </button> */}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                  </tbody>
                </table>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Show Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Show</h2>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Movie *</label>
                  <select
                    name="movie"
                    value={formData.movie}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  >
                    <option value="">Select Movie</option>
                    {movies.map(movie => (
                      <option key={movie._id} value={movie._id}>
                        {movie.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Theater *</label>
                  <select
                    name="theater"
                    value={formData.theater}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  >
                    <option value="">Select Theater</option>
                    {theaters.map(theater => (
                      <option key={theater._id} value={theater._id}>
                        {theater.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Screen *</label>
                  <select
                    name="screen"
                    value={formData.screen}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                    disabled={!formData.theater}
                  >
                    <option value="">Select Screen</option>
                    {selectedTheaterScreens.map(screen => (
                      <option key={screen.screenNumber} value={screen.screenNumber}>
                        Screen {screen.screenNumber} - {screen.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    name="showDate"
                    value={formData.showDate}
                    onChange={handleInputChange}
                    className="form-control"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Time *</label>
                  <input
                    type="time"
                    name="showTime"
                    value={formData.showTime}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Language *</label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  >
                    <option value="">Select Language</option>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Telugu">Telugu</option>
                    <option value="Malayalam">Malayalam</option>
                    <option value="Kannada">Kannada</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Format *</label>
                  <select
                    name="format"
                    value={formData.format}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  >
                    <option value="">Select Format</option>
                    <option value="2D">2D</option>
                    <option value="3D">3D</option>
                    <option value="IMAX">IMAX</option>
                    <option value="4DX">4DX</option>
                  </select>
                </div>
              </div>

              {formData.pricing.length > 0 && (
                <div className="pricing-section">
                  <h3 className="section-title">Pricing (Auto-filled from Screen)</h3>
                  <div className="form-grid">
                    {formData.pricing.map((price, index) => (
                      <div key={index} className="form-group">
                        <label className="form-label">{price.category} (₹)</label>
                        <input
                          type="number"
                          value={price.price}
                          onChange={(e) => handlePricingChange(index, e.target.value)}
                          className="form-control"
                          placeholder="350"
                          min="0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" onClick={handleCloseModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Show
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default AdminShows;
