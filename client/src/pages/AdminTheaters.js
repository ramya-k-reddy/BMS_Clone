import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectIsAdmin, selectUser } from '../store/slices/authSlice';
import { Navigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import '../styles/Admin.css';

const AdminTheaters = () => {
  const isAdmin = useSelector(selectIsAdmin);
  const user = useSelector(selectUser);
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const loadTheaters = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await axios.get('/api/theaters', {
          params: { limit: 50 },
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        if (response.data.success) {
          const theatersData = response.data.data.theaters || [];
          setTheaters(theatersData);
        }
      } catch (error) {
        console.error('Error loading theaters:', error);
        alert('Failed to load theaters. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    loadTheaters();
  }, [refreshTrigger]);

  useEffect(() => {
    if (location.state?.reload) {
      setRefreshTrigger(prev => prev + 1);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleDeleteTheater = async (theaterId) => {
    if (window.confirm('Are you sure you want to delete this theater?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/theaters/${theaterId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setTheaters(theaters.filter(theater => theater._id !== theaterId));
        alert('Theater deleted successfully!');
      } catch (error) {
        console.error('Error deleting theater:', error);
        alert('Failed to delete theater. Please try again.');
      }
    }
  };

  const handleVerifyTheater = async (theaterId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/theaters/${theaterId}`, 
        { verificationStatus: 'verified', isActive: true },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      setTheaters(theaters.map(theater => 
        theater._id === theaterId 
          ? { ...theater, verificationStatus: 'verified', isActive: true }
          : theater
      ));
      alert('Theater verified successfully!');
    } catch (error) {
      console.error('Error verifying theater:', error);
      alert('Failed to verify theater. Please try again.');
    }
  };

  const handleToggleStatus = async (theaterId) => {
    const theater = theaters.find(t => t._id === theaterId);
    const newStatus = !theater.isActive;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/theaters/${theaterId}`,
        { isActive: newStatus },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      setTheaters(theaters.map(t => 
        t._id === theaterId ? { ...t, isActive: newStatus } : t
      ));
      alert(`Theater ${newStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error toggling theater status:', error);
      alert('Failed to update theater status. Please try again.');
    }
  };

  const filteredTheaters = theaters.filter(theater =>
    theater.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    theater.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    theater.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
                <h2 className="table-title">Theater Management</h2>
                <div className="table-actions">
                  <input
                    type="text"
                    placeholder="Search theaters..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input w-64"
                  />
                  <Link to="/admin/theaters/add" className="btn-primary">
                    ➕ Add New Theater
                  </Link>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="loading-spinner mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading theaters...</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Theater Name</th>
                        <th>Location</th>
                        <th>Screens</th>
                        <th>Capacity</th>
                        <th>Facilities</th>
                        <th>Owner</th>
                        <th>Verified</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTheaters.map((theater) => (
                        <tr key={theater._id}>
                          <td className="table-cell-bold">{theater.name}</td>
                          <td>{theater.address?.city}, {theater.address?.state}</td>
                          <td className="text-center">{theater.screens?.length || 0}</td>
                          <td className="text-center">{theater.screens?.reduce((sum, s) => sum + (s.capacity || 0), 0) || 0}</td>
                          <td>
                            <div className="facilities-container">
                              {theater.amenities?.slice(0, 3).map((amenity, index) => (
                                <span key={index} className="facility-badge">
                                  {amenity}
                                </span>
                              ))}
                              {theater.amenities?.length > 3 && <span className="facility-badge">+{theater.amenities.length - 3}</span>}
                            </div>
                          </td>
                          <td>
                            <div className="owner-info">
                              <div className="owner-name">{theater.owner?.name || 'N/A'}</div>
                              <div className="owner-email">{theater.owner?.email || 'N/A'}</div>
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${theater.verificationStatus === 'verified' ? 'active' : 'pending'}`}>
                              {theater.verificationStatus === 'verified' ? '✅ Verified' : '⏳ Pending'}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${theater.isActive ? 'active' : 'inactive'}`}>
                              {theater.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <Link 
                                to={`/admin/theaters/edit/${theater._id}`}
                                className="action-btn-edit"
                              >
                                ✏️ Edit
                              </Link>
                              {theater.verificationStatus !== 'verified' && (
                                <button 
                                  onClick={() => handleVerifyTheater(theater._id)}
                                  className="action-btn-verify"
                                >
                                  ✅ Verify
                                </button>
                              )}
                              <button 
                                onClick={() => handleToggleStatus(theater._id)}
                                className="action-btn-toggle"
                              >
                                {theater.isActive ? '⏸️' : '▶️'}
                              </button>
                              <button 
                                onClick={() => handleDeleteTheater(theater._id)}
                                className="action-btn-delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {filteredTheaters.length === 0 && !loading && (
                    <div className="empty-state">
                      <p>No theaters found</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
              <div className="stat-card">
                <div className="stat-icon">🎭</div>
                <div className="stat-value">{theaters.length}</div>
                <div className="stat-label">Total Theaters</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-value">{theaters.filter(t => t.verificationStatus === 'verified').length}</div>
                <div className="stat-label">Verified Theaters</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-value">{theaters.filter(t => t.verificationStatus !== 'verified').length}</div>
                <div className="stat-label">Pending Verification</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎬</div>
                <div className="stat-value">{theaters.reduce((total, t) => total + (t.screens?.length || 0), 0)}</div>
                <div className="stat-label">Total Screens</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTheaters;