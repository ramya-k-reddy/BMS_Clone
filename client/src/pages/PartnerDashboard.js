
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAdmin } from '../store/slices/authSlice';

const PartnerDashboard = () => {
  const navigate = useNavigate();
  const isAdmin = useSelector(selectIsAdmin);
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [selectedTheaterScreens, setSelectedTheaterScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
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

  useEffect(() => {
    // Only allow non-admin (partner) access
    if (isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

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
          setTheaters(theatersRes.data.data.theaters || []);
        }
        if (showsRes.data.success) {
          setShows(showsRes.data.data.shows || []);
        }
      } catch (error) {
        alert('Failed to load data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (formData.theater) {
      const selectedTheater = theaters.find(t => t._id === formData.theater);
      setSelectedTheaterScreens(selectedTheater?.screens || []);
      setFormData(prev => ({ ...prev, screen: '', pricing: [] }));
    } else {
      setSelectedTheaterScreens([]);
    }
  }, [formData.theater, theaters]);

  useEffect(() => {
    if (formData.screen && selectedTheaterScreens.length > 0) {
      const screen = selectedTheaterScreens.find(s => s.screenNumber === parseInt(formData.screen));
      if (screen?.seatLayout?.seatCategories && screen.seatLayout.seatCategories.length > 0) {
        const pricing = screen.seatLayout.seatCategories.map(cat => ({ category: cat.category, price: cat.price }));
        setFormData(prev => ({ ...prev, pricing }));
      } else {
        const defaultPricing = [
          { category: 'Premium', price: 350 },
          { category: 'Gold', price: 250 },
          { category: 'Silver', price: 180 }
        ];
        setFormData(prev => ({ ...prev, pricing: defaultPricing }));
      }
    }
  }, [formData.screen, selectedTheaterScreens]);

  const handleAddShow = () => setShowAddModal(true);
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
    setSelectedTheaterScreens([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'screen' && value) {
      const screen = selectedTheaterScreens.find(s => s.screenNumber === parseInt(value));
      if (screen?.seatLayout?.seatCategories && screen.seatLayout.seatCategories.length > 0) {
        const pricing = screen.seatLayout.seatCategories.map(cat => ({ category: cat.category, price: cat.price }));
        setFormData(prev => ({ ...prev, [name]: value, pricing }));
        return;
      } else {
        const defaultPricing = [
          { category: 'Premium', price: 350 },
          { category: 'Gold', price: 250 },
          { category: 'Silver', price: 180 }
        ];
        setFormData(prev => ({ ...prev, [name]: value, pricing: defaultPricing }));
        return;
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
      alert('Failed to add show. Please try again.');
    }
  };

  return (
    <div className="partner-dashboard">
      <h1>Partner Dashboard</h1>
      <button onClick={handleAddShow} className="btn-primary">Add Show</button>
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
                  <select name="movie" value={formData.movie} onChange={handleInputChange} className="form-control" required>
                    <option value="">Select Movie</option>
                    {movies.map(movie => (
                      <option key={movie._id} value={movie._id}>{movie.title}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Theater *</label>
                  <select name="theater" value={formData.theater} onChange={handleInputChange} className="form-control" required>
                    <option value="">Select Theater</option>
                    {theaters.map(theater => (
                      <option key={theater._id} value={theater._id}>{theater.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Screen *</label>
                  <select name="screen" value={formData.screen} onChange={handleInputChange} className="form-control" required disabled={!formData.theater}>
                    <option value="">Select Screen</option>
                    {selectedTheaterScreens.map(screen => (
                      <option key={screen.screenNumber} value={screen.screenNumber}>Screen {screen.screenNumber} - {screen.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input type="date" name="showDate" value={formData.showDate} onChange={handleInputChange} className="form-control" min={new Date().toISOString().split('T')[0]} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Time *</label>
                  <input type="time" name="showTime" value={formData.showTime} onChange={handleInputChange} className="form-control" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Language *</label>
                  <select name="language" value={formData.language} onChange={handleInputChange} className="form-control" required>
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
                  <select name="format" value={formData.format} onChange={handleInputChange} className="form-control" required>
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
                        <input type="number" value={price.price} onChange={(e) => handlePricingChange(index, e.target.value)} className="form-control" placeholder="350" min="0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="modal-footer">
                <button type="button" onClick={handleCloseModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Add Show</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerDashboard;
