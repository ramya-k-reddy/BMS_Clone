import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './store';
import { verifyToken, setInitialized } from './store/slices/authSlice';
import { selectIsInitialized, selectAuthLoading, selectIsAuthenticated, selectIsAdmin, selectIsPartner, selectIsApprovedPartner, selectIsPendingPartner, selectUser } from './store/slices/authSlice';

// Context Providers (for Socket.IO)
import { SocketProvider } from './context/SocketContext';

// Components
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import PartnerRoute from './components/auth/PartnerRoute';
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
import AdminShows from './pages/AdminShows';
import AdminAddMovie from './pages/AdminAddMovie';
import AdminEditMovie from './pages/AdminEditMovie';
import AdminAddTheater from './pages/AdminAddTheater';
import PartnerShows from './pages/PartnerShows';
import PartnerAddShows from './pages/PartnerAddShows';
import PendingApproval from './pages/PendingApproval';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Component to handle role-based home page redirects
function RoleBasedHome() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);
  const isApprovedPartner = useSelector(selectIsApprovedPartner);
  const isPendingPartner = useSelector(selectIsPendingPartner);
  const user = useSelector(selectUser);
  
  // Debug logging
  console.log('RoleBasedHome DEBUG:', {
    isAuthenticated,
    isAdmin,
    isApprovedPartner,
    isPendingPartner,
    user,
    userRole: user?.role,
    userApproved: user?.approved
  });

  if (isAuthenticated) {
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    } else if (isPendingPartner) {
      return <Navigate to="/partner/pending-approval" replace />;
    } else if (isApprovedPartner) {
      return <Navigate to="/partner/shows" replace />;
    } else {
      return <Navigate to="/movies" replace />;
    }
  }
  
  // Not authenticated, show public home page
  return <Home />;
}

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
          
          <main style={{ paddingTop: '64px' }}>
            <Routes>
              {/* Public Routes with role-based redirects */}
              <Route path="/" element={<RoleBasedHome />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/movie/:id" element={<MovieDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
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
              <Route path="/booking-confirmation/:bookingId" element={
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
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
              <Route path="/admin/movies" element={
                <AdminRoute>
                  <AdminMovies />
                </AdminRoute>
              } />
              <Route path="/admin/movies/add" element={
                <AdminRoute>
                  <AdminAddMovie />
                </AdminRoute>
              } />
              <Route path="/admin/movies/edit/:id" element={
                <AdminRoute>
                  <AdminEditMovie />
                </AdminRoute>
              } />
              <Route path="/admin/theaters" element={
                <AdminRoute>
                  <AdminTheaters />
                </AdminRoute>
              } />
              <Route path="/admin/theaters/add" element={
                <AdminRoute>
                  <AdminAddTheater />
                </AdminRoute>
              } />
              <Route path="/admin/shows" element={
                <AdminRoute>
                  <AdminShows />
                </AdminRoute>
              } />
              
              {/* Partner Routes - Require Partner Role */}
              <Route path="/partner/add-shows" element={
                <PartnerRoute>
                  <PartnerAddShows />
                </PartnerRoute>
              } />
              
              {/* Partner Shows Management */}
              <Route path="/partner/shows" element={
                <PartnerRoute>
                  <PartnerShows />
                </PartnerRoute>
              } />
              
              {/* Partner Pending Approval */}
              <Route path="/partner/pending-approval" element={
                <ProtectedRoute>
                  <PendingApproval />
                </ProtectedRoute>
              } />
              
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