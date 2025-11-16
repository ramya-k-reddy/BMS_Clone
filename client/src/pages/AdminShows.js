import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAdmin } from '../store/slices/authSlice';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import '../styles/Admin.css';

const AdminShows = () => {
  const navigate = useNavigate();
  const isAdmin = useSelector(selectIsAdmin);
  const [shows, setShows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('all');
  const [filterTheater, setFilterTheater] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    movie: '',
    theater: '',
    screen: '',
    date: '',
    time: '',
    language: '',
    format: '',
    pricing: {
      premium: '',
      gold: '',
      silver: ''
    }
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // Mock data - replace with API call
  useEffect(() => {
    const mockShows = [
      {
        id: 1,
        movie: 'Avengers: Endgame',
        theater: 'PVR Cinemas Phoenix Mall',
        screen: 'Screen 1 - Gold Class',
        date: '2024-11-16',
        time: '10:00 AM',
        language: 'English',
        format: '2D',
        totalSeats: 120,
        bookedSeats: 85,
        availableSeats: 35,
        status: 'active',
        pricing: { premium: 350, gold: 250, silver: 180 }
      },
      {
        id: 2,
        movie: 'RRR',
        theater: 'PVR Cinemas Phoenix Mall',
        screen: 'Screen 2 - IMAX',
        date: '2024-11-16',
        time: '02:30 PM',
        language: 'Telugu',
        format: 'IMAX',
        totalSeats: 200,
        bookedSeats: 150,
        availableSeats: 50,
        status: 'active',
        pricing: { executive: 450, premium: 350, gold: 250 }
      },
      {
        id: 3,
        movie: 'Spider-Man: No Way Home',
        theater: 'PVR Cinemas Phoenix Mall',
        screen: 'Screen 1 - Gold Class',
        date: '2024-11-16',
        time: '06:00 PM',
        language: 'English',
        format: '3D',
        totalSeats: 120,
        bookedSeats: 120,
        availableSeats: 0,
        status: 'sold-out',
        pricing: { premium: 400, gold: 300, silver: 230 }
      },
      {
        id: 4,
        movie: 'Avengers: Endgame',
        theater: 'PVR Cinemas Phoenix Mall',
        screen: 'Screen 2 - IMAX',
        date: '2024-11-17',
        time: '09:30 PM',
        language: 'Hindi',
        format: 'IMAX',
        totalSeats: 200,
        bookedSeats: 45,
        availableSeats: 155,
        status: 'active',
        pricing: { executive: 500, premium: 400, gold: 300 }
      }
    ];
    setShows(mockShows);
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDeleteShow = (showId) => {
    if (window.confirm('Are you sure you want to delete this show?')) {
      setShows(shows.filter(show => show.id !== showId));
      // Add API call here
    }
  };

  const handleAddShow = () => {
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setFormData({
      movie: '',
      theater: '',
      screen: '',
      date: '',
      time: '',
      language: '',
      format: '',
      pricing: {
        premium: '',
        gold: '',
        silver: ''
      }
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('pricing.')) {
      const pricingField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        pricing: {
          ...prev.pricing,
          [pricingField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add validation and API call here
    const newShow = {
      id: shows.length + 1,
      movie: formData.movie,
      theater: formData.theater,
      screen: formData.screen,
      date: formData.date,
      time: formData.time,
      language: formData.language,
      format: formData.format,
      totalSeats: 120,
      bookedSeats: 0,
      availableSeats: 120,
      status: 'active',
      pricing: formData.pricing
    };
    setShows([...shows, newShow]);
    handleCloseModal();
  };

  const handleToggleStatus = (showId) => {
    setShows(shows.map(show => {
      if (show.id === showId) {
        return {
          ...show,
          status: show.status === 'active' ? 'cancelled' : 'active'
        };
      }
      return show;
    }));
    // Add API call here
  };

  const filteredShows = shows.filter(show => {
    const matchesSearch = show.movie.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         show.theater.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = filterDate === 'all' || show.date === filterDate;
    const matchesTheater = filterTheater === 'all' || show.theater === filterTheater;
    return matchesSearch && matchesDate && matchesTheater;
  });

  const stats = {
    totalShows: shows.length,
    activeShows: shows.filter(s => s.status === 'active').length,
    soldOutShows: shows.filter(s => s.status === 'sold-out').length,
    totalBookings: shows.reduce((sum, s) => sum + s.bookedSeats, 0)
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
                  <option value="2024-11-16">Today</option>
                  <option value="2024-11-17">Tomorrow</option>
                </select>

                <select
                  value={filterTheater}
                  onChange={(e) => setFilterTheater(e.target.value)}
                  className="admin-select"
                >
                  <option value="all">All Theaters</option>
                  <option value="PVR Cinemas Phoenix Mall">PVR Cinemas Phoenix Mall</option>
                </select>

                <button
                  onClick={handleAddShow}
                  className="btn-primary"
                >
                  <span>➕</span> Add Show
                </button>
              </div>
            </div>
          </div>

          {/* Shows Table */}
          <div className="admin-card table-card">
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
                      const occupancyPercentage = Math.round((show.bookedSeats / show.totalSeats) * 100);
                      return (
                        <tr key={show.id}>
                          <td>
                            <div className="movie-title">{show.movie}</div>
                          </td>
                          <td>
                            <div className="theater-info">
                              <div className="theater-name">{show.theater}</div>
                              <div className="screen-name">{show.screen}</div>
                            </div>
                          </td>
                          <td>
                            <div className="datetime-info">
                              <div className="date-text">{show.date}</div>
                              <div className="time-text">{show.time}</div>
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
                                {show.bookedSeats}/{show.totalSeats} seats
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${show.status}`}>
                              {show.status}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                onClick={() => navigate(`/admin/shows/edit/${show.id}`)}
                                className="btn-icon btn-edit"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleToggleStatus(show.id)}
                                className={`btn-icon ${show.status === 'active' ? 'btn-pause' : 'btn-play'}`}
                                title={show.status === 'active' ? 'Cancel' : 'Activate'}
                              >
                                {show.status === 'active' ? '⏸️' : '▶️'}
                              </button>
                              <button
                                onClick={() => handleDeleteShow(show.id)}
                                className="btn-icon btn-delete"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
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
                    <option value="Avengers: Endgame">Avengers: Endgame</option>
                    <option value="RRR">RRR</option>
                    <option value="Spider-Man: No Way Home">Spider-Man: No Way Home</option>
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
                    <option value="PVR Cinemas Phoenix Mall">PVR Cinemas Phoenix Mall</option>
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
                  >
                    <option value="">Select Screen</option>
                    <option value="Screen 1 - Gold Class">Screen 1 - Gold Class</option>
                    <option value="Screen 2 - IMAX">Screen 2 - IMAX</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Time *</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
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

              <div className="pricing-section">
                <h3 className="section-title">Pricing</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Premium (₹)</label>
                    <input
                      type="number"
                      name="pricing.premium"
                      value={formData.pricing.premium}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="350"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Gold (₹)</label>
                    <input
                      type="number"
                      name="pricing.gold"
                      value={formData.pricing.gold}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="250"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Silver (₹)</label>
                    <input
                      type="number"
                      name="pricing.silver"
                      value={formData.pricing.silver}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="180"
                    />
                  </div>
                </div>
              </div>

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
};

export default AdminShows;
