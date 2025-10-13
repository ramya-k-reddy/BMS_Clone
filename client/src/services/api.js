import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token to requests if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    
    return response;
  },
  (error) => {
    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.data || error.message);
    }
    
    // Handle common error scenarios
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      
      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    
    if (error.response?.status === 403) {
      // Forbidden - show access denied message
      console.warn('Access denied');
    }
    
    if (error.response?.status >= 500) {
      // Server error
      console.error('Server error:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (currentPassword, newPassword) => 
    api.post('/auth/change-password', { currentPassword, newPassword }),
  verifyToken: () => api.post('/auth/verify-token'),
};

export const movieAPI = {
  getMovies: (params) => api.get('/movies', { params }),
  getMovie: (id) => api.get(`/movies/${id}`),
  addReview: (movieId, rating, comment) => 
    api.post(`/movies/${movieId}/reviews`, { rating, comment }),
  getGenres: () => api.get('/movies/genres/list'),
  getLanguages: () => api.get('/movies/languages/list'),
  
  // Admin only
  createMovie: (movieData) => api.post('/movies', movieData),
  updateMovie: (id, movieData) => api.put(`/movies/${id}`, movieData),
  deleteMovie: (id) => api.delete(`/movies/${id}`),
};

export const theaterAPI = {
  getTheaters: (params) => api.get('/theaters', { params }),
  getTheater: (id) => api.get(`/theaters/${id}`),
  getScreen: (theaterId, screenNumber) => 
    api.get(`/theaters/${theaterId}/screens/${screenNumber}`),
  getCities: () => api.get('/theaters/cities/list'),
  
  // Theater owner only
  createTheater: (theaterData) => api.post('/theaters', theaterData),
  updateTheater: (id, theaterData) => api.put(`/theaters/${id}`, theaterData),
  deleteTheater: (id) => api.delete(`/theaters/${id}`),
  getMyTheaters: () => api.get('/theaters/owner/my-theaters'),
  
  // Admin only
  verifyTheater: (id, status) => api.put(`/theaters/${id}/verify`, { verificationStatus: status }),
};

export const showAPI = {
  getShows: (params) => api.get('/shows', { params }),
  getShow: (id) => api.get(`/shows/${id}`),
  getShowsForMovie: (movieId, params) => api.get(`/shows/movie/${movieId}`, { params }),
  getShowsForTheater: (theaterId, params) => api.get(`/shows/theater/${theaterId}`, { params }),
  
  // Theater owner only
  createShow: (showData) => api.post('/shows', showData),
  updateShow: (id, showData) => api.put(`/shows/${id}`, showData),
  deleteShow: (id) => api.delete(`/shows/${id}`),
};

export const bookingAPI = {
  initiateBooking: (bookingData) => api.post('/bookings/initiate', bookingData),
  getBookings: (params) => api.get('/bookings', { params }),
  getBooking: (id) => api.get(`/bookings/${id}`),
  cancelBooking: (id, reason) => api.post(`/bookings/${id}/cancel`, { reason }),
  getTicket: (id) => api.get(`/bookings/${id}/ticket`),
};

export const paymentAPI = {
  createPaymentIntent: (bookingId, paymentMethod) => 
    api.post('/payments/create-payment-intent', { bookingId, paymentMethod }),
  confirmPayment: (paymentIntentId, bookingId) => 
    api.post('/payments/confirm-payment', { paymentIntentId, bookingId }),
  processRefund: (bookingId, reason) => 
    api.post('/payments/refund', { bookingId, reason }),
  getPaymentMethods: () => api.get('/payments/payment-methods'),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;