import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bookingAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Async thunks
export const createBooking = createAsyncThunk(
  'bookings/createBooking',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await bookingAPI.createBooking(bookingData);
      if (response.data.success) {
        toast.success('Booking created successfully!');
        return response.data.data.booking;
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create booking';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchUserBookings = createAsyncThunk(
  'bookings/fetchUserBookings',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await bookingAPI.getUserBookings(params);
      if (response.data.success) {
        return {
          bookings: response.data.data.bookings,
          pagination: response.data.data.pagination
        };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch bookings';
      return rejectWithValue(message);
    }
  }
);

export const fetchBookingById = createAsyncThunk(
  'bookings/fetchBookingById',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await bookingAPI.getBookingById(bookingId);
      if (response.data.success) {
        return response.data.data.booking;
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch booking details';
      return rejectWithValue(message);
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'bookings/cancelBooking',
  async ({ bookingId, reason }, { rejectWithValue }) => {
    try {
      const response = await bookingAPI.cancelBooking(bookingId, reason);
      if (response.data.success) {
        toast.success('Booking cancelled successfully');
        return response.data.data.booking;
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to cancel booking';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const downloadTicket = createAsyncThunk(
  'bookings/downloadTicket',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await bookingAPI.downloadTicket(bookingId);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket-${bookingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Ticket downloaded successfully');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to download ticket';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const rateBooking = createAsyncThunk(
  'bookings/rateBooking',
  async ({ bookingId, rating, review }, { rejectWithValue }) => {
    try {
      const response = await bookingAPI.rateBooking(bookingId, { rating, review });
      if (response.data.success) {
        toast.success('Thank you for your feedback!');
        return response.data.data.booking;
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit rating';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  bookings: [],
  currentBooking: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  },
  filters: {
    status: '',
    dateFrom: '',
    dateTo: '',
    movie: '',
    theater: ''
  },
  loading: false,
  creating: false,
  cancelling: false,
  downloading: false,
  error: null,
  stats: {
    total: 0,
    upcoming: 0,
    past: 0,
    cancelled: 0
  }
};

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    clearBookings: (state) => {
      state.bookings = [];
      state.pagination = initialState.pagination;
    },
    
    clearCurrentBooking: (state) => {
      state.currentBooking = null;
    },
    
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    updateBookingInList: (state, action) => {
      const index = state.bookings.findIndex(booking => booking._id === action.payload._id);
      if (index !== -1) {
        state.bookings[index] = action.payload;
      }
    },
    
    addNewBooking: (state, action) => {
      state.bookings.unshift(action.payload);
      state.stats.total += 1;
      
      // Update stats based on booking status and show date
      const showDate = new Date(action.payload.show.date);
      const now = new Date();
      
      if (showDate > now) {
        state.stats.upcoming += 1;
      } else {
        state.stats.past += 1;
      }
    },
    
    updateStats: (state, action) => {
      state.stats = { ...state.stats, ...action.payload };
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Create booking cases
      .addCase(createBooking.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.creating = false;
        state.currentBooking = action.payload;
        state.bookings.unshift(action.payload);
        
        // Update stats
        state.stats.total += 1;
        const showDate = new Date(action.payload.show.date);
        const now = new Date();
        if (showDate > now) {
          state.stats.upcoming += 1;
        } else {
          state.stats.past += 1;
        }
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })
      
      // Fetch user bookings cases
      .addCase(fetchUserBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserBookings.fulfilled, (state, action) => {
        state.loading = false;
        const { bookings, pagination } = action.payload;
        
        if (pagination.page === 1) {
          state.bookings = bookings;
        } else {
          state.bookings = [...state.bookings, ...bookings];
        }
        
        state.pagination = pagination;
        
        // Calculate stats
        const now = new Date();
        const stats = bookings.reduce((acc, booking) => {
          const showDate = new Date(booking.show.date);
          
          if (booking.status === 'cancelled') {
            acc.cancelled += 1;
          } else if (showDate > now) {
            acc.upcoming += 1;
          } else {
            acc.past += 1;
          }
          
          return acc;
        }, { total: bookings.length, upcoming: 0, past: 0, cancelled: 0 });
        
        state.stats = stats;
      })
      .addCase(fetchUserBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch booking by ID cases
      .addCase(fetchBookingById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload;
      })
      .addCase(fetchBookingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Cancel booking cases
      .addCase(cancelBooking.pending, (state) => {
        state.cancelling = true;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.cancelling = false;
        const updatedBooking = action.payload;
        
        // Update in bookings list
        const index = state.bookings.findIndex(b => b._id === updatedBooking._id);
        if (index !== -1) {
          state.bookings[index] = updatedBooking;
        }
        
        // Update current booking if it's the same
        if (state.currentBooking && state.currentBooking._id === updatedBooking._id) {
          state.currentBooking = updatedBooking;
        }
        
        // Update stats
        state.stats.cancelled += 1;
        if (state.stats.upcoming > 0) {
          state.stats.upcoming -= 1;
        }
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.cancelling = false;
        state.error = action.payload;
      })
      
      // Download ticket cases
      .addCase(downloadTicket.pending, (state) => {
        state.downloading = true;
      })
      .addCase(downloadTicket.fulfilled, (state) => {
        state.downloading = false;
      })
      .addCase(downloadTicket.rejected, (state, action) => {
        state.downloading = false;
        state.error = action.payload;
      })
      
      // Rate booking cases
      .addCase(rateBooking.fulfilled, (state, action) => {
        const updatedBooking = action.payload;
        
        // Update in bookings list
        const index = state.bookings.findIndex(b => b._id === updatedBooking._id);
        if (index !== -1) {
          state.bookings[index] = updatedBooking;
        }
        
        // Update current booking if it's the same
        if (state.currentBooking && state.currentBooking._id === updatedBooking._id) {
          state.currentBooking = updatedBooking;
        }
      });
  },
});

export const {
  clearBookings,
  clearCurrentBooking,
  setFilters,
  resetFilters,
  clearError,
  updateBookingInList,
  addNewBooking,
  updateStats,
} = bookingsSlice.actions;

// Selectors
export const selectBookings = (state) => state.bookings.bookings;
export const selectCurrentBooking = (state) => state.bookings.currentBooking;
export const selectBookingsPagination = (state) => state.bookings.pagination;
export const selectBookingsFilters = (state) => state.bookings.filters;
export const selectBookingsLoading = (state) => state.bookings.loading;
export const selectBookingsCreating = (state) => state.bookings.creating;
export const selectBookingsCancelling = (state) => state.bookings.cancelling;
export const selectBookingsDownloading = (state) => state.bookings.downloading;
export const selectBookingsError = (state) => state.bookings.error;
export const selectBookingsStats = (state) => state.bookings.stats;

// Helper selectors
export const selectUpcomingBookings = (state) => {
  const now = new Date();
  return state.bookings.bookings.filter(booking => {
    const showDate = new Date(booking.show.date);
    return showDate > now && booking.status !== 'cancelled';
  });
};

export const selectPastBookings = (state) => {
  const now = new Date();
  return state.bookings.bookings.filter(booking => {
    const showDate = new Date(booking.show.date);
    return showDate <= now && booking.status !== 'cancelled';
  });
};

export const selectCancelledBookings = (state) => {
  return state.bookings.bookings.filter(booking => booking.status === 'cancelled');
};

export default bookingsSlice.reducer;