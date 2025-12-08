import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectIsAuthenticated, 
  selectIsAdmin,
  selectIsPartner,
  selectUser,
  logout 
} from '../../store/slices/authSlice';
import '../../styles/Navbar.css';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);
  const isPartner = useSelector(selectIsPartner);
  const user = useSelector(selectUser);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
      <nav className="navbar shadow-lg">
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: '64px', flexWrap: 'nowrap' }}>
          {/* Logo */}
            <div className="navbar-logo-container">
            <Link 
              to={isAuthenticated ? (isAdmin ? '/admin' : '/movies') : '/'} 
              className="navbar-logo"
              
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
                <span className="navbar-title">
                  Book<span className="navbar-title-highlight">My</span>Show
                </span>
            </Link>
          </div>

          {/* Hamburger for mobile */}
            <button className="navbar-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span style={{ display: 'block', width: 24, height: 2, background: '#ef4444', marginBottom: 5 }}></span>
            <span style={{ display: 'block', width: 24, height: 2, background: '#ef4444', marginBottom: 5 }}></span>
            <span style={{ display: 'block', width: 24, height: 2, background: '#ef4444' }}></span>
          </button>

          {/* Navigation Links */}
          <div className={`navbar-links${mobileMenuOpen ? ' open' : ''}`}>
            {isAuthenticated ? (
              <>
                {/* User Info Display */}
                {user && (
                  <div className="user-info">
                    <span className="user-name">{user.name}</span>
                    <span className="user-role">({user.role})</span>
                  </div>
                )}
                {isAdmin ? (
                  <Link
                    to="/admin"
                    className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                    
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm0 2c-3.866 0-7 1.343-7 3v1h14v-1c0-1.657-3.134-3-7-3z"/>
                    </svg>
                    Admin Dashboard
                  </Link>
) : isPartner ? (
                  // Partners have no additional navigation links
                  null
                ) : (
                  <>
                    <Link
                      to="/movies"
                      className={`nav-link ${isActive('/movies') ? 'active' : ''}`}
                      
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8.707 1.5a1 1 0 00-1.414 0L.646 8.146a.5.5 0 00.708.708L2 8.207V13.5A1.5 1.5 0 003.5 15h9a1.5 1.5 0 001.5-1.5V8.207l.646.647a.5.5 0 00.708-.708L13 5.793V2.5a.5.5 0 00-.5-.5h-1a.5.5 0 00-.5.5v1.293L8.707 1.5z"/>
                      </svg>
                      Home
                    </Link>
                    <Link
                      to="/bookings"
                      className={`nav-link ${isActive('/bookings') ? 'active' : ''}`}
                      
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M2.5 4A1.5 1.5 0 001 5.5v1A1.5 1.5 0 002.5 8h1A1.5 1.5 0 005 6.5v-1A1.5 1.5 0 003.5 4h-1zm6 0A1.5 1.5 0 007 5.5v1A1.5 1.5 0 008.5 8h1A1.5 1.5 0 0011 6.5v-1A1.5 1.5 0 009.5 4h-1zM1 11.5A1.5 1.5 0 012.5 10h1A1.5 1.5 0 015 11.5v1A1.5 1.5 0 013.5 14h-1A1.5 1.5 0 011 12.5v-1zm6 0A1.5 1.5 0 018.5 10h1a1.5 1.5 0 011.5 1.5v1a1.5 1.5 0 01-1.5 1.5h-1A1.5 1.5 0 017 12.5v-1z"/>
                      </svg>
                      My Bookings
                    </Link>
                  </>
                )}
                  <button
                    onClick={handleLogout}
                    className="nav-link logout-btn"
                  >
                    Logout
                  </button>
              </>
            ) : (
                <Link
                  to="/login"
                  className="login-btn"
                >
                  Login
                </Link>
            )}
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
            <div className="navbar-mobile-menu">
            {/* Repeat nav links for mobile */}
            {isAuthenticated ? (
              <>
                {/* Mobile User Info */}
                {user && (
                  <div className="user-info mobile">
                    <span className="user-name">{user.name}</span>
                    <span className="user-role">({user.role})</span>
                  </div>
                )}
                {isAdmin ? (
                    <Link to="/admin" className="nav-link">Admin Dashboard</Link>
                ) : isPartner ? (
                    // Partners have no additional navigation links in mobile
                    null
                ) : (
                  <>
                      <Link to="/movies" className="nav-link">Home</Link>
                      <Link to="/bookings" className="nav-link">My Bookings</Link>
                  </>
                )}
                  <button onClick={handleLogout} className="nav-link logout-btn">Logout</button>
              </>
            ) : (
                <Link to="/login" className="login-btn">Login</Link>
            )}
          </div>
        )}
      </div>
      <style>{`
        @media (max-width: 900px) {
          .navbar-links { display: none !important; }
          .navbar-hamburger { display: block !important; }
        }
        @media (min-width: 901px) {
          .navbar-mobile-menu { display: none !important; }
        }
      `}</style>
    </nav>
  );
}

export default Navbar;