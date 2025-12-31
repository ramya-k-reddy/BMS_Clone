import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';
import { selectAuthLoading, selectAuthError, selectIsAuthenticated, selectIsAdmin, selectIsApprovedPartner, selectIsPendingPartner } from '../store/slices/authSlice';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import '../styles/Login.css';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);
  const isApprovedPartner = useSelector(selectIsApprovedPartner);
  const isPendingPartner = useSelector(selectIsPendingPartner);

  // Debug log to track component renders and state changes
  // console.log('Login render - isAuthenticated:', isAuthenticated, 'isAdmin:', isAdmin);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const from = location.state?.from?.pathname || null;

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('useEffect redirect - isAdmin:', isAdmin, 'isPendingPartner:', isPendingPartner, 'isApprovedPartner:', isApprovedPartner); // Debug log
      if (from && from !== '/') {
        navigate(from, { replace: true });
      } else if (isAdmin) {
        console.log('useEffect: Redirecting to admin'); // Debug log
        navigate('/admin', { replace: true });
      } else if (isPendingPartner) {
        console.log('useEffect: Redirecting to pending approval'); // Debug log
        navigate('/partner/pending-approval', { replace: true });
      } else if (isApprovedPartner) {
        console.log('useEffect: Redirecting to partner shows'); // Debug log
        navigate('/partner/shows', { replace: true });
      } else {
        console.log('useEffect: Redirecting to movies'); // Debug log
        navigate('/movies', { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, isPendingPartner, isApprovedPartner, from, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser(formData));
    
    if (loginUser.fulfilled.match(result)) {
      const user = result.payload.user;
      console.log('Login successful, user role:', user.role); // Debug log
      
      // If there's a return URL and it's not the home page, use it
      if (from && from !== '/') {
        navigate(from, { replace: true });
      } else {
        // Redirect based on user role
        if (user.role === 'admin') {
          console.log('Redirecting to admin dashboard'); // Debug log
          navigate('/admin', { replace: true });
        } else if (user.role === 'partner') {
          if (user.approved === false) {
            console.log('Redirecting to pending approval'); // Debug log
            navigate('/partner/pending-approval', { replace: true });
          } else {
            console.log('Redirecting to partner shows'); // Debug log
            navigate('/partner/shows', { replace: true });
          }
        } else {
          console.log('Redirecting to movies'); // Debug log
          navigate('/movies', { replace: true });
        }
      }
    }
  };

  return (
    <div className="login-container flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="login-card max-w-md w-full p-8">
        <div>
          <h2 className="login-title">
            Welcome Back
          </h2>
          <p className="login-subtitle">
            Sign in to your account or{' '}
            <Link
              to="/register"
              className="register-link"
            >
              create a new account
            </Link>
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your email address"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            {/* Removed duplicate 'Forgot your password?' button */}
          </div>

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <a href="/forgot-password" style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 500 }}>
              Forgot Password?
            </a>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="login-btn"
            >
              {loading ? (
                <LoadingSpinner size="small" />
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;