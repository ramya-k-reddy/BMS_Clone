import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectIsAuthenticated, 
  selectIsAdmin,
  logout 
} from '../../store/slices/authSlice';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar shadow-lg sticky top-0 z-50" style={{ width: '100%', backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: '64px', flexWrap: 'nowrap' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <Link 
              to={isAuthenticated ? (isAdmin ? '/admin' : '/movies') : '/'} 
              className="navbar-logo"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="8" fill="url(#gradient1)"/>
                <path d="M12 20L18 26L28 14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="20" cy="20" r="14" stroke="white" strokeWidth="1.5" opacity="0.3"/>
                <defs>
                  <linearGradient id="gradient1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ef4444"/>
                    <stop offset="100%" stopColor="#dc2626"/>
                  </linearGradient>
                </defs>
              </svg>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                Book<span style={{ color: '#ef4444' }}>My</span>Show
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem', flexShrink: 0, flexWrap: 'nowrap' }}>
            {isAuthenticated ? (
              <>
                {isAdmin ? (
                  <Link
                    to="/admin"
                    className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                    style={{ 
                      padding: '0.625rem 1.25rem', 
                      borderRadius: '0.5rem', 
                      fontSize: '0.875rem', 
                      fontWeight: 600, 
                      whiteSpace: 'nowrap', 
                      backgroundColor: isActive('/admin') ? '#ef4444' : 'transparent', 
                      color: isActive('/admin') ? '#ffffff' : '#4b5563',
                      border: isActive('/admin') ? 'none' : '1px solid #e5e7eb',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm0 2c-3.866 0-7 1.343-7 3v1h14v-1c0-1.657-3.134-3-7-3z"/>
                    </svg>
                    Admin Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/movies"
                    className={`nav-link ${isActive('/movies') ? 'active' : ''}`}
                    style={{ 
                      padding: '0.625rem 1.25rem', 
                      borderRadius: '0.5rem', 
                      fontSize: '0.875rem', 
                      fontWeight: 600, 
                      whiteSpace: 'nowrap', 
                      backgroundColor: isActive('/movies') ? '#ef4444' : 'transparent', 
                      color: isActive('/movies') ? '#ffffff' : '#4b5563',
                      border: isActive('/movies') ? 'none' : '1px solid #e5e7eb',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8.707 1.5a1 1 0 00-1.414 0L.646 8.146a.5.5 0 00.708.708L2 8.207V13.5A1.5 1.5 0 003.5 15h9a1.5 1.5 0 001.5-1.5V8.207l.646.647a.5.5 0 00.708-.708L13 5.793V2.5a.5.5 0 00-.5-.5h-1a.5.5 0 00-.5.5v1.293L8.707 1.5z"/>
                    </svg>
                    Home
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="nav-link"
                  style={{ 
                    padding: '0.625rem 1.25rem', 
                    borderRadius: '0.5rem', 
                    fontSize: '0.875rem', 
                    fontWeight: 500, 
                    whiteSpace: 'nowrap', 
                    color: '#4b5563', 
                    background: 'transparent', 
                    border: '1px solid #e5e7eb', 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="login-btn"
                style={{ 
                  padding: '0.625rem 1.5rem', 
                  borderRadius: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  whiteSpace: 'nowrap', 
                  color: 'white', 
                  background: 'linear-gradient(45deg, #ef4444, #f97316)', 
                  boxShadow: '0 4px 6px rgba(239, 68, 68, 0.3)',
                  border: 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;