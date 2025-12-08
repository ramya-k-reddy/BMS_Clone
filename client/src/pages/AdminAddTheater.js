import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { selectIsAdmin } from '../store/slices/authSlice';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import '../styles/Admin.css';

const AdminAddTheater = () => {
  const navigate = useNavigate();
  const isAdmin = useSelector(selectIsAdmin);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      landmark: ''
    },
    location: {
      coordinates: ['', ''] // [longitude, latitude]
    },
    contact: {
      phone: '',
      email: ''
    },
    screens: [{
      screenNumber: 1,
      name: '',
      capacity: '',
      screenType: 'Regular',
      seatLayout: {
        rows: '',
        seatsPerRow: '',
        seatCategories: [
          { category: 'Premium', price: '', rows: { from: '', to: '' } }
        ]
      },
      amenities: []
    }],
    amenities: [],
    images: [''],
    verificationStatus: 'pending'
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
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [field]: value }
      }));
    } else if (name.startsWith('contact.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contact: { ...prev.contact, [field]: value }
      }));
    } else if (name.startsWith('location.')) {
      const index = parseInt(name.split('.')[1]);
      const newCoordinates = [...formData.location.coordinates];
      newCoordinates[index] = value;
      setFormData(prev => ({
        ...prev,
        location: { coordinates: newCoordinates }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleArrayChange = (field, value) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({
      ...prev,
      [field]: items
    }));
  };

  const handleImageChange = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const addImage = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

  const removeImage = (index) => {
    if (formData.images.length > 1) {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    }
  };

  const handleScreenChange = (index, field, value) => {
    const newScreens = [...formData.screens];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      newScreens[index][parent][child] = value;
    } else {
      newScreens[index][field] = value;
    }
    setFormData(prev => ({
      ...prev,
      screens: newScreens
    }));
  };

  const handleScreenAmenities = (index, value) => {
    const amenities = value.split(',').map(item => item.trim()).filter(item => item);
    const newScreens = [...formData.screens];
    newScreens[index].amenities = amenities;
    setFormData(prev => ({
      ...prev,
      screens: newScreens
    }));
  };

  const addScreen = () => {
    setFormData(prev => ({
      ...prev,
      screens: [...prev.screens, {
        screenNumber: prev.screens.length + 1,
        name: '',
        capacity: '',
        screenType: 'Regular',
        seatLayout: {
          rows: '',
          seatsPerRow: '',
          seatCategories: [
            { category: 'Premium', price: '', rows: { from: '', to: '' } }
          ]
        },
        amenities: []
      }]
    }));
  };

  const removeScreen = (index) => {
    if (formData.screens.length > 1) {
      setFormData(prev => ({
        ...prev,
        screens: prev.screens.filter((_, i) => i !== index)
      }));
    }
  };

  const addSeatCategory = (screenIndex) => {
    const newScreens = [...formData.screens];
    newScreens[screenIndex].seatLayout.seatCategories.push({
      category: '',
      price: '',
      rows: { from: '', to: '' }
    });
    setFormData(prev => ({
      ...prev,
      screens: newScreens
    }));
  };

  const removeSeatCategory = (screenIndex, categoryIndex) => {
    const newScreens = [...formData.screens];
    if (newScreens[screenIndex].seatLayout.seatCategories.length > 1) {
      newScreens[screenIndex].seatLayout.seatCategories = 
        newScreens[screenIndex].seatLayout.seatCategories.filter((_, i) => i !== categoryIndex);
      setFormData(prev => ({
        ...prev,
        screens: newScreens
      }));
    }
  };

  const handleSeatCategoryChange = (screenIndex, categoryIndex, field, value) => {
    const newScreens = [...formData.screens];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      newScreens[screenIndex].seatLayout.seatCategories[categoryIndex][parent][child] = value;
    } else {
      newScreens[screenIndex].seatLayout.seatCategories[categoryIndex][field] = value;
    }
    setFormData(prev => ({
      ...prev,
      screens: newScreens
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validation
      if (!formData.name || !formData.address.city || !formData.contact.phone) {
        alert('Please fill in all required fields');
        return;
      }

      if (formData.screens.length === 0) {
        alert('Please add at least one screen');
        return;
      }

      const token = localStorage.getItem('token');
      
      const response = await axios.post('/api/theaters', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        alert('Theater added successfully!');
        navigate('/admin/theaters', { state: { reload: true } });
      }
    } catch (error) {
      console.error('Error adding theater:', error);
      alert(error.response?.data?.message || 'Failed to add theater. Please try again.');
    }
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
                <h2 className="page-title">Add New Theater</h2>
              </div>
              
              <div className="admin-card">
                <form onSubmit={handleSubmit} className="admin-form">
              {/* Basic Information */}
              <div className="form-section">
                <h3 className="section-title">Basic Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Theater Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                      placeholder="PVR Cinemas Phoenix Mall"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Verification Status</label>
                    <select
                      name="verificationStatus"
                      value={formData.verificationStatus}
                      onChange={handleInputChange}
                      className="form-control"
                    >
                      <option value="pending">Pending</option>
                      <option value="verified">Verified</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="form-section">
                <h3 className="section-title">Address</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Street *</label>
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                      placeholder="Phoenix Mall, Senapati Bapat Road"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                      placeholder="Mumbai"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">State *</label>
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                      placeholder="Maharashtra"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pincode *</label>
                    <input
                      type="text"
                      name="address.pincode"
                      value={formData.address.pincode}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                      placeholder="400013"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Landmark</label>
                    <input
                      type="text"
                      name="address.landmark"
                      value={formData.address.landmark}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="Lower Parel"
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      name="location.0"
                      value={formData.location.coordinates[0]}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                      placeholder="72.8311"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      name="location.1"
                      value={formData.location.coordinates[1]}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                      placeholder="19.0137"
                    />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="form-section">
                <h3 className="section-title">Contact Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input
                      type="tel"
                      name="contact.phone"
                      value={formData.contact.phone}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                      placeholder="9876543220"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      name="contact.email"
                      value={formData.contact.email}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                      placeholder="theater@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="form-section">
                <h3 className="section-title">Theater Amenities</h3>
                <div className="form-group">
                  <label className="form-label">Amenities</label>
                  <input
                    type="text"
                    value={formData.amenities.join(', ')}
                    onChange={(e) => handleArrayChange('amenities', e.target.value)}
                    className="form-control"
                    placeholder="Parking, Food Court, ATM, Wheelchair Accessible (comma-separated)"
                  />
                  <small className="form-hint">Separate multiple amenities with commas</small>
                </div>
              </div>

              {/* Screens */}
              <div className="form-section">
                <div className="section-header">
                  <h3 className="section-title">Screens</h3>
                  <button type="button" onClick={addScreen} className="btn-add-item">
                    + Add Screen
                  </button>
                </div>

                {formData.screens.map((screen, screenIndex) => (
                  <div key={screenIndex} className="screen-item">
                    <div className="screen-header">
                      <h4>Screen {screen.screenNumber}</h4>
                      {formData.screens.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeScreen(screenIndex)}
                          className="btn-remove-item"
                        >
                          Remove Screen
                        </button>
                      )}
                    </div>

                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Screen Name *</label>
                        <input
                          type="text"
                          value={screen.name}
                          onChange={(e) => handleScreenChange(screenIndex, 'name', e.target.value)}
                          className="form-control"
                          required
                          placeholder="Screen 1 - Gold Class"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Capacity *</label>
                        <input
                          type="number"
                          value={screen.capacity}
                          onChange={(e) => handleScreenChange(screenIndex, 'capacity', e.target.value)}
                          className="form-control"
                          required
                          placeholder="120"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Screen Type *</label>
                        <select
                          value={screen.screenType}
                          onChange={(e) => handleScreenChange(screenIndex, 'screenType', e.target.value)}
                          className="form-control"
                          required
                        >
                          <option value="Regular">Regular</option>
                          <option value="IMAX">IMAX</option>
                          <option value="4DX">4DX</option>
                          <option value="Dolby">Dolby</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Rows *</label>
                        <input
                          type="number"
                          value={screen.seatLayout.rows}
                          onChange={(e) => handleScreenChange(screenIndex, 'seatLayout.rows', e.target.value)}
                          className="form-control"
                          required
                          placeholder="10"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Seats Per Row *</label>
                        <input
                          type="number"
                          value={screen.seatLayout.seatsPerRow}
                          onChange={(e) => handleScreenChange(screenIndex, 'seatLayout.seatsPerRow', e.target.value)}
                          className="form-control"
                          required
                          placeholder="12"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Screen Amenities</label>
                        <input
                          type="text"
                          value={screen.amenities.join(', ')}
                          onChange={(e) => handleScreenAmenities(screenIndex, e.target.value)}
                          className="form-control"
                          placeholder="AC, Recliner, Food Service (comma-separated)"
                        />
                      </div>
                    </div>

                    {/* Seat Categories */}
                    <div className="seat-categories">
                      <div className="section-header">
                        <h5>Seat Categories</h5>
                        <button
                          type="button"
                          onClick={() => addSeatCategory(screenIndex)}
                          className="btn-add-small"
                        >
                          + Add Category
                        </button>
                      </div>

                      {screen.seatLayout.seatCategories.map((category, categoryIndex) => (
                        <div key={categoryIndex} className="category-item">
                          <div className="form-grid">
                            <div className="form-group">
                              <label className="form-label">Category *</label>
                              <input
                                type="text"
                                value={category.category}
                                onChange={(e) => handleSeatCategoryChange(screenIndex, categoryIndex, 'category', e.target.value)}
                                className="form-control"
                                required
                                placeholder="Premium"
                              />
                            </div>

                            <div className="form-group">
                              <label className="form-label">Price (₹) *</label>
                              <input
                                type="number"
                                value={category.price}
                                onChange={(e) => handleSeatCategoryChange(screenIndex, categoryIndex, 'price', e.target.value)}
                                className="form-control"
                                required
                                placeholder="350"
                              />
                            </div>

                            <div className="form-group">
                              <label className="form-label">From Row *</label>
                              <input
                                type="text"
                                value={category.rows.from}
                                onChange={(e) => handleSeatCategoryChange(screenIndex, categoryIndex, 'rows.from', e.target.value)}
                                className="form-control"
                                required
                                placeholder="A"
                              />
                            </div>

                            <div className="form-group">
                              <label className="form-label">To Row *</label>
                              <input
                                type="text"
                                value={category.rows.to}
                                onChange={(e) => handleSeatCategoryChange(screenIndex, categoryIndex, 'rows.to', e.target.value)}
                                className="form-control"
                                required
                                placeholder="C"
                              />
                            </div>
                          </div>

                          {screen.seatLayout.seatCategories.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSeatCategory(screenIndex, categoryIndex)}
                              className="btn-remove-small"
                            >
                              Remove Category
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Images */}
              <div className="form-section">
                <div className="section-header">
                  <h3 className="section-title">Images</h3>
                  <button type="button" onClick={addImage} className="btn-add-item">
                    + Add Image
                  </button>
                </div>
                {formData.images.map((image, index) => (
                  <div key={index} className="image-item">
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                      className="form-control"
                      placeholder="https://images.example.com/theater.jpg"
                    />
                    {formData.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="btn-remove-inline"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="form-actions">
                <button type="button" onClick={() => navigate('/admin/theaters')} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Add Theater
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

export default AdminAddTheater;
