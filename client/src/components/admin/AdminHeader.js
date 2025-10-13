import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

const AdminHeader = ({ user, onToggleSidebar, sidebarCollapsed }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <button 
          className="sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          {sidebarCollapsed ? '☰' : '✕'}
        </button>
        <h1 className="admin-header-title">Dashboard</h1>
      </div>

      <div className="admin-header-right">
        <form className="admin-search" onSubmit={handleSearch}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search movies, theaters, users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <div className="relative">
          <button 
            className="admin-profile"
            onClick={() => setShowProfile(!showProfile)}
          >
            <div className="admin-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-medium text-white">{user?.name}</div>
              <div className="text-xs text-gray-400">{user?.role}</div>
            </div>
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50">
              <div className="py-1">
                <button 
                  onClick={() => navigate('/profile')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                >
                  👤 View Profile
                </button>
                <button 
                  onClick={() => navigate('/admin/settings')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                >
                  ⚙️ Settings
                </button>
                <hr className="border-gray-700 my-1" />
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;