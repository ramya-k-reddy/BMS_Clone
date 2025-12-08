import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectUser } from '../store/slices/authSlice';
import { selectMovies, fetchMovies } from '../store/slices/moviesSlice';
import { selectTheaters, fetchTheaters } from '../store/slices/theatersSlice';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { showAPI } from '../services/api';
import toast from 'react-hot-toast';
import '../styles/Partner.css';

const PartnerAddShows = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const movies = useSelector(selectMovies);
  const theaters = useSelector(selectTheaters);
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    movie: '',
    theater: '',
    screen: '',
    date: '',
    time: ''
  });
  const [availableScreens, setAvailableScreens] = useState([]);

  useEffect(() => {
    dispatch(fetchMovies());
    dispatch(fetchTheaters());
  }, [dispatch]);

  useEffect(() => {
    console.log('Theaters data in PartnerAddShows:', theaters);
  }, [theaters]);

  useEffect(() => {
    if (formData.theater) {
      const selectedTheater = theaters.find(t => t._id === formData.theater);
      if (selectedTheater) {
        setAvailableScreens(selectedTheater.screens || []);
      }
    } else {
      setAvailableScreens([]);
    }
  }, [formData.theater, theaters]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset screen selection when theater changes
    if (name === 'theater') {
      setFormData(prev => ({
        ...prev,
        screen: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.movie || !formData.theater || !formData.screen || !formData.date || !formData.time) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const showData = {
        ...formData
      };

      await showAPI.createShow(showData);
      toast.success('Show added successfully!');
      
      // Reset form
      setFormData({
        movie: '',
        theater: '',
        screen: '',
        date: '',
        time: ''
      });
    } catch (error) {
      console.error('Error adding show:', error);
      toast.error(error.response?.data?.message || 'Failed to add show');
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="partner-container">
      <div className="partner-header">
        <h1>Add New Show</h1>
        <p>Welcome, {user?.name}! Add a new show to your theater.</p>
      </div>

      <div className="add-show-form-container">
        <form onSubmit={handleSubmit} className="add-show-form">
          <div className="form-group">
            <label htmlFor="movie">Movie *</label>
            <select
              id="movie"
              name="movie"
              value={formData.movie}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a movie</option>
              {movies.map(movie => (
                <option key={movie._id} value={movie._id}>
                  {movie.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="theater">Theater *</label>
            <select
              id="theater"
              name="theater"
              value={formData.theater}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a theater</option>
              {theaters.map(theater => (
                <option key={theater._id} value={theater._id}>
                  {theater.name} - {theater.address?.city || 'Location not specified'}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="screen">Screen *</label>
            <select
              id="screen"
              name="screen"
              value={formData.screen}
              onChange={handleInputChange}
              required
              disabled={!formData.theater}
            >
              <option value="">Select a screen</option>
              {availableScreens.map(screen => (
                <option key={screen._id} value={screen._id}>
                  {screen.name} (Seats: {screen.totalSeats})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Date *</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                min={getMinDate()}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="time">Time *</label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>



          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Adding Show...' : 'Add Show'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/partner/shows')}
            >
              View All Shows
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PartnerAddShows;