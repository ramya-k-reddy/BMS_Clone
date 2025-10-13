import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './store';
import { verifyToken, setInitialized } from './store/slices/authSlice';
import { selectIsInitialized, selectAuthLoading } from './store/slices/authSlice';

// Context Providers (for Socket.IO)
import { SocketProvider } from './context/SocketContext';

// Components
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Pages
import Home from './pages/Home';
import Movies from './pages/Movies';
import MovieDetails from './pages/MovieDetails';
import SeatSelection from './pages/SeatSelection';
import Payment from './pages/Payment';
import BookingConfirmation from './pages/BookingConfirmation';
import BookingHistory from './pages/BookingHistory';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import AdminDashboard from './pages/AdminDashboard';
import AdminMovies from './pages/AdminMovies';
import AdminTheaters from './pages/AdminTheaters';

function AppContent() {
  const dispatch = useDispatch();
  const isInitialized = useSelector(selectIsInitialized);
  const authLoading = useSelector(selectAuthLoading);

  useEffect(() => {
    // Check if user is authenticated on app load
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(verifyToken());
    } else {
      // Mark as initialized if no token
      dispatch(setInitialized());
    }
  }, [dispatch]);

  // Show loading spinner while initializing auth
  if (!isInitialized || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <SocketProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
          
          <Navbar />
          
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/movie/:id" element={<MovieDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes - Require Authentication */}
              <Route path="/movie/:movieId/book/:showId" element={
                <ProtectedRoute>
                  <SeatSelection />
                </ProtectedRoute>
              } />
              <Route path="/payment/:bookingId" element={
                <ProtectedRoute>
                  <Payment />
                </ProtectedRoute>
              } />
              <Route path="/booking/confirmation/:bookingId" element={
                <ProtectedRoute>
                  <BookingConfirmation />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/bookings" element={
                <ProtectedRoute>
                  <BookingHistory />
                </ProtectedRoute>
              } />
              
              {/* Admin Routes - Require Admin Role */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/movies" element={<AdminMovies />} />
              <Route path="/admin/theaters" element={<AdminTheaters />} />
              
              {/* 404 Page */}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </SocketProvider>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;