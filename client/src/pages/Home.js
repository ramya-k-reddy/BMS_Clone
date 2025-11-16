import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectIsAdmin } from '../store/slices/authSlice';
import '../styles/Home.css';

const Home = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);

  useEffect(() => {
    // Redirect authenticated users to their respective dashboards
    if (isAuthenticated) {
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/movies', { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, navigate]);

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section text-white">
        <div className="hero-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="hero-title">
            Book Your Entertainment
          </h1>
          <p className="hero-subtitle">
            Discover movies, events, and experiences. Book tickets instantly and enjoy the best entertainment in cinemas near you.
          </p>
          <Link
            to="/movies"
            className="hero-cta-button"
          >
            🎬 Explore Movies
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <h2 className="features-title">Why Choose BookMyShow?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎟️</div>
              <h3 className="feature-title">Easy Booking</h3>
              <p className="feature-description">
                Book your favorite movies and events with just a few clicks. Simple, fast, and secure.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎬</div>
              <h3 className="feature-title">Latest Movies</h3>
              <p className="feature-description">
                Access to the latest blockbusters and indie films from around the world.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎭</div>
              <h3 className="feature-title">Live Events</h3>
              <p className="feature-description">
                Discover and book tickets for concerts, theater shows, and live performances.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💺</div>
              <h3 className="feature-title">Best Seats</h3>
              <p className="feature-description">
                Choose your preferred seats with our interactive seat selection system.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💳</div>
              <h3 className="feature-title">Secure Payment</h3>
              <p className="feature-description">
                Multiple payment options with bank-grade security for safe transactions.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3 className="feature-title">Mobile Friendly</h3>
              <p className="feature-description">
                Book on the go with our responsive design that works perfectly on any device.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="cta-section">
        <div className="cta-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="cta-title">Ready to Start Booking?</h2>
          <p className="cta-subtitle">
            Join millions of users who trust BookMyShow for their entertainment needs
          </p>
          <div className="cta-buttons">
            <Link to="/register" className="cta-button-primary">
              Get Started
            </Link>
            <Link to="/movies" className="cta-button-secondary">
              Browse Movies
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;