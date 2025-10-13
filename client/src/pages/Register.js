import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../store/slices/authSlice';
import { selectAuthLoading, selectAuthError } from '../store/slices/authSlice';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import '../styles/Register.css';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });

  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Clear validation error when user starts typing
    if (validationErrors[e.target.name]) {
      setValidationErrors({
        ...validationErrors,
        [e.target.name]: ''
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const { confirmPassword, ...userData } = formData;
    const result = await dispatch(registerUser(userData));
    
    if (registerUser.fulfilled.match(result)) {
      navigate('/');
    }
  };

  return (
    <div className="register-container flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="register-card max-w-md w-full p-8">
        <div>
          <div className="flex justify-center">
            <div className="register-logo">
              <div className="logo-icon">
                <span className="text-white font-bold text-xl">BMS</span>
              </div>
            </div>
          </div>
          <h2 className="register-title">
            Join BookMyShow
          </h2>
          <p className="register-subtitle">
            Create your account or{' '}
            <Link
              to="/login"
              className="register-login-link"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          {error && (
            <div className="register-error-message">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="register-form-group">
              <label htmlFor="name" className="register-form-label">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className={`register-form-input ${
                  validationErrors.name ? 'invalid' : formData.name ? 'valid' : ''
                }`}
                placeholder="Enter your full name"
              />
              {validationErrors.name && (
                <p className="register-validation-error">{validationErrors.name}</p>
              )}
            </div>

            <div className="register-form-group">
              <label htmlFor="email" className="register-form-label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`register-form-input ${
                  validationErrors.email ? 'invalid' : formData.email ? 'valid' : ''
                }`}
                placeholder="Enter your email address"
              />
              {validationErrors.email && (
                <p className="register-validation-error">{validationErrors.email}</p>
              )}
            </div>

            <div className="register-form-group">
              <label htmlFor="phone" className="register-form-label">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                className={`register-form-input ${
                  validationErrors.phone ? 'invalid' : formData.phone ? 'valid' : ''
                }`}
                placeholder="Enter your phone number"
              />
              {validationErrors.phone && (
                <p className="register-validation-error">{validationErrors.phone}</p>
              )}
            </div>

            <div className="register-form-group">
              <label htmlFor="password" className="register-form-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`register-form-input ${
                  validationErrors.password ? 'invalid' : formData.password ? 'valid' : ''
                }`}
                placeholder="Create a strong password"
              />
              {validationErrors.password && (
                <p className="register-validation-error">{validationErrors.password}</p>
              )}
            </div>

            <div className="register-form-group">
              <label htmlFor="confirmPassword" className="register-form-label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`register-form-input ${
                  validationErrors.confirmPassword ? 'invalid' : 
                  (formData.confirmPassword && formData.password === formData.confirmPassword) ? 'valid' : ''
                }`}
                placeholder="Confirm your password"
              />
              {validationErrors.confirmPassword && (
                <p className="register-validation-error">{validationErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="register-btn"
            >
              {loading ? (
                <LoadingSpinner size="small" />
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          <div className="register-terms">
            By creating an account, you agree to our{' '}
            <button onClick={() => alert('Terms of Service coming soon!')}>
              Terms of Service
            </button>{' '}
            and{' '}
            <button onClick={() => alert('Privacy Policy coming soon!')}>
              Privacy Policy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;