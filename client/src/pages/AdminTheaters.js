import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectIsAdmin, selectUser } from '../store/slices/authSlice';
import { Navigate, Link } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import '../styles/Admin.css';

const AdminTheaters = () => {
  const isAdmin = useSelector(selectIsAdmin);
  const user = useSelector(selectUser);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Load theaters - replace with actual API call
    const loadTheaters = async () => {
      try {
        // Mock data - replace with actual API
        setTimeout(() => {
          setTheaters([
            {
              _id: '1',
              name: 'PVR Cinemas',
              location: 'Mumbai, Maharashtra',
              address: '123 Mall Road, Mumbai 400001',
              capacity: 250,
              screens: 8,
              facilities: ['IMAX', 'Dolby Atmos', '4DX'],
              isVerified: true,
              status: 'active',
              owner: {
                name: 'John Doe',
                email: 'john@pvr.com'
              }
            },
            {
              _id: '2',
              name: 'INOX Multiplex',
              location: 'Delhi, NCR',
              address: '456 Central Plaza, Delhi 110001',
              capacity: 180,
              screens: 6,
              facilities: ['IMAX', 'Dolby Atmos'],
              isVerified: true,
              status: 'active',
              owner: {
                name: 'Jane Smith',
                email: 'jane@inox.com'
              }
            },
            {
              _id: '3',
              name: 'Fun Cinemas',
              location: 'Bangalore, Karnataka',
              address: '789 Tech Park, Bangalore 560001',
              capacity: 120,
              screens: 4,
              facilities: ['Dolby Atmos'],
              isVerified: false,
              status: 'pending',
              owner: {
                name: 'Mike Johnson',
                email: 'mike@funcinemas.com'
              }
            }
          ]);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error loading theaters:', error);
        setLoading(false);
      }
    };

    loadTheaters();
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleDeleteTheater = async (theaterId) => {
    if (window.confirm('Are you sure you want to delete this theater?')) {
      try {
        // Implement delete API call
        setTheaters(theaters.filter(theater => theater._id !== theaterId));
        console.log('Theater deleted:', theaterId);
      } catch (error) {
        console.error('Error deleting theater:', error);
      }
    }
  };

  const handleVerifyTheater = async (theaterId) => {
    try {
      // Implement verify API call
      setTheaters(theaters.map(theater => 
        theater._id === theaterId 
          ? { ...theater, isVerified: true, status: 'active' }
          : theater
      ));
    } catch (error) {
      console.error('Error verifying theater:', error);
    }
  };

  const handleToggleStatus = async (theaterId) => {
    try {
      // Implement toggle status API call
      setTheaters(theaters.map(theater => 
        theater._id === theaterId 
          ? { ...theater, status: theater.status === 'active' ? 'inactive' : 'active' }
          : theater
      ));
    } catch (error) {
      console.error('Error toggling theater status:', error);
    }
  };

  const filteredTheaters = theaters.filter(theater =>
    theater.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    theater.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    theater.owner.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                  <Link to="/admin/theaters/new" className="btn-primary">
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
                <div className="overflow-x-auto">
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
                          <td className="font-semibold">{theater.name}</td>
                          <td>{theater.location}</td>
                          <td className="text-center">{theater.screens}</td>
                          <td className="text-center">{theater.capacity}</td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              {theater.facilities.map((facility, index) => (
                                <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {facility}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="font-medium">{theater.owner.name}</div>
                              <div className="text-sm text-gray-400">{theater.owner.email}</div>
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${theater.isVerified ? 'active' : 'pending'}`}>
                              {theater.isVerified ? '✅ Verified' : '⏳ Pending'}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${theater.status}`}>
                              {theater.status}
                            </span>
                          </td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              <Link 
                                to={`/admin/theaters/edit/${theater._id}`}
                                className="btn-secondary text-xs px-2 py-1"
                              >
                                ✏️ Edit
                              </Link>
                              {!theater.isVerified && (
                                <button 
                                  onClick={() => handleVerifyTheater(theater._id)}
                                  className="btn-primary text-xs px-2 py-1"
                                >
                                  ✅ Verify
                                </button>
                              )}
                              <button 
                                onClick={() => handleToggleStatus(theater._id)}
                                className="btn-secondary text-xs px-2 py-1"
                              >
                                {theater.status === 'active' ? '⏸️' : '▶️'}
                              </button>
                              <button 
                                onClick={() => handleDeleteTheater(theater._id)}
                                className="btn-danger text-xs px-2 py-1"
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
                    <div className="text-center py-8">
                      <p className="text-gray-400">No theaters found</p>
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
                <div className="stat-value">{theaters.filter(t => t.isVerified).length}</div>
                <div className="stat-label">Verified Theaters</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-value">{theaters.filter(t => !t.isVerified).length}</div>
                <div className="stat-label">Pending Verification</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎬</div>
                <div className="stat-value">{theaters.reduce((total, t) => total + t.screens, 0)}</div>
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