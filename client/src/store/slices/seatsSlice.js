import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { showAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Async thunks
export const fetchShowSeats = createAsyncThunk(
  'seats/fetchShowSeats',
  async (showId, { rejectWithValue }) => {
    try {
      const response = await showAPI.getShowById(showId);
      if (response.data.success) {
        return {
          showId,
          show: response.data.data.show,
          seats: response.data.data.show.seats || []
        };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch seat layout';
      return rejectWithValue(message);
    }
  }
);

export const lockSeats = createAsyncThunk(
  'seats/lockSeats',
  async ({ showId, seats }, { rejectWithValue }) => {
    try {
      const response = await showAPI.lockSeats(showId, seats);
      if (response.data.success) {
        return {
          showId,
          seats: response.data.data.lockedSeats,
          lockExpiry: response.data.data.lockExpiry
        };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to lock seats';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const releaseSeats = createAsyncThunk(
  'seats/releaseSeats',
  async ({ showId, seats }, { rejectWithValue }) => {
    try {
      const response = await showAPI.releaseSeats(showId, seats);
      if (response.data.success) {
        return { showId, seats };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to release seats';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  showSeats: {}, // { showId: { seats: [], layout: {}, pricing: {} } }
  selectedSeats: {}, // { showId: ['A1', 'A2'] }
  lockedSeats: {}, // { showId: { seats: ['B1'], expiry: timestamp } }
  seatUpdates: {}, // Real-time updates from socket
  loading: false,
  error: null,
  lockTimer: null,
};

const seatsSlice = createSlice({
  name: 'seats',
  initialState,
  reducers: {
    selectSeat: (state, action) => {
      const { showId, seatNumber } = action.payload;
      if (!state.selectedSeats[showId]) {
        state.selectedSeats[showId] = [];
      }
      
      const seatIndex = state.selectedSeats[showId].indexOf(seatNumber);
      if (seatIndex === -1) {
        state.selectedSeats[showId].push(seatNumber);
      } else {
        state.selectedSeats[showId].splice(seatIndex, 1);
      }
    },
    
    clearSelectedSeats: (state, action) => {
      const { showId } = action.payload;
      if (showId) {
        delete state.selectedSeats[showId];
      } else {
        state.selectedSeats = {};
      }
    },
    
    setSeatUpdate: (state, action) => {
      const { showId, seatNumber, update } = action.payload;
      const key = `${showId}-${seatNumber}`;
      state.seatUpdates[key] = {
        ...update,
        timestamp: Date.now()
      };
    },
    
    clearSeatUpdates: (state, action) => {
      const { showId } = action.payload;
      if (showId) {
        // Clear updates for specific show
        Object.keys(state.seatUpdates).forEach(key => {
          if (key.startsWith(`${showId}-`)) {
            delete state.seatUpdates[key];
          }
        });
      } else {
        // Clear all updates
        state.seatUpdates = {};
      }
    },
    
    updateSeatStatus: (state, action) => {
      const { showId, seatNumber, status } = action.payload;
      if (state.showSeats[showId]) {
        const seat = state.showSeats[showId].seats.find(s => s.number === seatNumber);
        if (seat) {
          seat.status = status;
        }
      }
    },
    
    setLockTimer: (state, action) => {
      state.lockTimer = action.payload;
    },
    
    clearLockTimer: (state) => {
      if (state.lockTimer) {
        clearTimeout(state.lockTimer);
        state.lockTimer = null;
      }
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    resetSeatsState: (state) => {
      state.selectedSeats = {};
      state.lockedSeats = {};
      state.seatUpdates = {};
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch show seats cases
      .addCase(fetchShowSeats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShowSeats.fulfilled, (state, action) => {
        state.loading = false;
        const { showId, show, seats } = action.payload;
        state.showSeats[showId] = {
          show,
          seats,
          layout: show.theater?.screens?.[0]?.layout || {},
          pricing: show.pricing || {}
        };
      })
      .addCase(fetchShowSeats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Lock seats cases
      .addCase(lockSeats.pending, (state) => {
        state.loading = true;
      })
      .addCase(lockSeats.fulfilled, (state, action) => {
        state.loading = false;
        const { showId, seats, lockExpiry } = action.payload;
        state.lockedSeats[showId] = { seats, expiry: lockExpiry };
        
        // Update seat status in show seats
        if (state.showSeats[showId]) {
          seats.forEach(seatNumber => {
            const seat = state.showSeats[showId].seats.find(s => s.number === seatNumber);
            if (seat) {
              seat.isLocked = true;
            }
          });
        }
        
        toast.success(`${seats.length} seat(s) locked for 10 minutes`);
      })
      .addCase(lockSeats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Release seats cases
      .addCase(releaseSeats.fulfilled, (state, action) => {
        const { showId, seats } = action.payload;
        
        // Remove from locked seats
        if (state.lockedSeats[showId]) {
          state.lockedSeats[showId].seats = state.lockedSeats[showId].seats.filter(
            seat => !seats.includes(seat)
          );
          if (state.lockedSeats[showId].seats.length === 0) {
            delete state.lockedSeats[showId];
          }
        }
        
        // Update seat status in show seats
        if (state.showSeats[showId]) {
          seats.forEach(seatNumber => {
            const seat = state.showSeats[showId].seats.find(s => s.number === seatNumber);
            if (seat) {
              seat.isLocked = false;
            }
          });
        }
        
        // Remove from selected seats
        if (state.selectedSeats[showId]) {
          state.selectedSeats[showId] = state.selectedSeats[showId].filter(
            seat => !seats.includes(seat)
          );
        }
      });
  },
});

export const {
  selectSeat,
  clearSelectedSeats,
  setSeatUpdate,
  clearSeatUpdates,
  updateSeatStatus,
  setLockTimer,
  clearLockTimer,
  clearError,
  resetSeatsState,
} = seatsSlice.actions;

// Selectors
export const selectShowSeats = (state) => (showId) => state.seats.showSeats[showId];
export const selectSelectedSeats = (state) => (showId) => state.seats.selectedSeats[showId] || [];
export const selectLockedSeats = (state) => (showId) => state.seats.lockedSeats[showId];
export const selectSeatUpdates = (state) => state.seats.seatUpdates;
export const selectSeatUpdate = (state) => (showId, seatNumber) => {
  return state.seats.seatUpdates[`${showId}-${seatNumber}`];
};
export const selectSeatsLoading = (state) => state.seats.loading;
export const selectSeatsError = (state) => state.seats.error;

// Helper selectors
export const selectTotalSelectedSeats = (state) => (showId) => {
  return state.seats.selectedSeats[showId]?.length || 0;
};

export const selectSelectedSeatsPrice = (state) => (showId) => {
  const selectedSeats = state.seats.selectedSeats[showId] || [];
  const showData = state.seats.showSeats[showId];
  
  if (!selectedSeats.length || !showData) return 0;
  
  return selectedSeats.reduce((total, seatNumber) => {
    const seat = showData.seats.find(s => s.number === seatNumber);
    return total + (seat?.price || 0);
  }, 0);
};

export const selectSeatStatus = (state) => (showId, seatNumber) => {
  const showData = state.seats.showSeats[showId];
  if (!showData) return 'available';
  
  const seat = showData.seats.find(s => s.number === seatNumber);
  if (!seat) return 'unavailable';
  
  // Check real-time updates first
  const update = state.seats.seatUpdates[`${showId}-${seatNumber}`];
  if (update) {
    if (update.isBooked) return 'booked';
    if (update.isLocked) return 'locked';
  }
  
  // Check if seat is selected by current user
  const selectedSeats = state.seats.selectedSeats[showId] || [];
  if (selectedSeats.includes(seatNumber)) return 'selected';
  
  // Return seat's original status
  if (seat.isBooked) return 'booked';
  if (seat.isLocked) return 'locked';
  
  return 'available';
};

export default seatsSlice.reducer;