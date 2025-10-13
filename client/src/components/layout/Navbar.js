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
    <nav className="navbar shadow-lg sticky top-0 z-50">
      <div className="nav-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="navbar-logo flex items-center group"
            >
              <span className="text-2xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                BookMyShow
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            <Link
              to="/"
              className={`nav-link px-4 py-2 rounded-lg text-sm font-medium ${
                isActive('/') 
                  ? 'active bg-red-50 text-red-600 shadow-sm' 
                  : 'text-gray-600 hover:text-red-600 hover:bg-gray-50'
              }`}
            >
              Home
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className={`nav-link px-4 py-2 rounded-lg text-sm font-medium ${
                    isActive('/profile') 
                      ? 'active bg-red-50 text-red-600 shadow-sm' 
                      : 'text-gray-600 hover:text-red-600 hover:bg-gray-50'
                  }`}
                >
                  Profile
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`nav-link px-4 py-2 rounded-lg text-sm font-medium ${
                      isActive('/admin') 
                        ? 'active bg-red-50 text-red-600 shadow-sm' 
                        : 'text-gray-600 hover:text-red-600 hover:bg-gray-50'
                    }`}
                  >
                    ⚙️ Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="nav-link ml-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-gray-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="login-btn ml-2 text-white px-6 py-2 rounded-lg text-sm font-medium transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
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