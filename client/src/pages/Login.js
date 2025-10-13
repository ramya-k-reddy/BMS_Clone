import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';
import { selectAuthLoading, selectAuthError } from '../store/slices/authSlice';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import '../styles/Login.css';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const from = location.state?.from?.pathname || '/';

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
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="login-container flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="login-card max-w-md w-full p-8">
        <div>
          <div className="flex justify-center">
            <div className="login-logo">
              <div className="logo-icon">
                <span className="text-white font-bold text-xl">BMS</span>
              </div>
            </div>
          </div>
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
            <div className="text-sm">
              <button 
                type="button" 
                className="forgot-password"
                onClick={() => alert('Forgot password functionality coming soon!')}
              >
                Forgot your password?
              </button>
            </div>
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