import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { theaterAPI, showAPI } from '../../services/api';

// Async thunks
export const fetchTheaters = createAsyncThunk(
  'theaters/fetchTheaters',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await theaterAPI.getTheaters(params);
      if (response.data.success) {
        return {
          theaters: response.data.data.theaters,
          pagination: response.data.data.pagination
        };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch theaters';
      return rejectWithValue(message);
    }
  }
);

export const fetchTheaterById = createAsyncThunk(
  'theaters/fetchTheaterById',
  async (theaterId, { rejectWithValue }) => {
    try {
      const response = await theaterAPI.getTheaterById(theaterId);
      if (response.data.success) {
        return response.data.data.theater;
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch theater details';
      return rejectWithValue(message);
    }
  }
);

export const fetchTheaterShows = createAsyncThunk(
  'theaters/fetchTheaterShows',
  async ({ theaterId, date }, { rejectWithValue }) => {
    try {
      const response = await showAPI.getShows({ theater: theaterId, date });
      if (response.data.success) {
        return {
          theaterId,
          shows: response.data.data.shows
        };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch theater shows';
      return rejectWithValue(message);
    }
  }
);

export const searchTheaters = createAsyncThunk(
  'theaters/searchTheaters',
  async ({ query, city, location }, { rejectWithValue }) => {
    try {
      const response = await theaterAPI.searchTheaters(query, { city, location });
      if (response.data.success) {
        return response.data.data.theaters;
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Theater search failed';
      return rejectWithValue(message);
    }
  }
);

export const fetchNearbyTheaters = createAsyncThunk(
  'theaters/fetchNearbyTheaters',
  async ({ latitude, longitude, radius = 10 }, { rejectWithValue }) => {
    try {
      const response = await theaterAPI.getNearbyTheaters(latitude, longitude, radius);
      if (response.data.success) {
        return response.data.data.theaters;
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch nearby theaters';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  theaters: [],
  currentTheater: null,
  theaterShows: {}, // { theaterId: shows[] }
  searchResults: [],
  nearbyTheaters: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  },
  filters: {
    city: '',
    area: '',
    amenities: [],
    sortBy: 'name'
  },
  loading: false,
  showsLoading: false,
  searchLoading: false,
  nearbyLoading: false,
  error: null,
};

const theatersSlice = createSlice({
  name: 'theaters',
  initialState,
  reducers: {
    clearTheaters: (state) => {
      state.theaters = [];
      state.pagination = initialState.pagination;
    },
    
    clearCurrentTheater: (state) => {
      state.currentTheater = null;
    },
    
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    
    clearNearbyTheaters: (state) => {
      state.nearbyTheaters = [];
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
    
    updateTheaterInList: (state, action) => {
      const index = state.theaters.findIndex(theater => theater._id === action.payload._id);
      if (index !== -1) {
        state.theaters[index] = action.payload;
      }
    },
    
    setUserLocation: (state, action) => {
      state.userLocation = action.payload;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch theaters cases
      .addCase(fetchTheaters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTheaters.fulfilled, (state, action) => {
        state.loading = false;
        const { theaters, pagination } = action.payload;
        
        if (pagination.page === 1) {
          state.theaters = theaters;
        } else {
          state.theaters = [...state.theaters, ...theaters];
        }
        
        state.pagination = pagination;
      })
      .addCase(fetchTheaters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch theater by ID cases
      .addCase(fetchTheaterById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTheaterById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTheater = action.payload;
      })
      .addCase(fetchTheaterById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch theater shows cases
      .addCase(fetchTheaterShows.pending, (state) => {
        state.showsLoading = true;
      })
      .addCase(fetchTheaterShows.fulfilled, (state, action) => {
        state.showsLoading = false;
        const { theaterId, shows } = action.payload;
        state.theaterShows[theaterId] = shows;
      })
      .addCase(fetchTheaterShows.rejected, (state, action) => {
        state.showsLoading = false;
        state.error = action.payload;
      })
      
      // Search theaters cases
      .addCase(searchTheaters.pending, (state) => {
        state.searchLoading = true;
      })
      .addCase(searchTheaters.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchTheaters.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.payload;
      })
      
      // Fetch nearby theaters cases
      .addCase(fetchNearbyTheaters.pending, (state) => {
        state.nearbyLoading = true;
      })
      .addCase(fetchNearbyTheaters.fulfilled, (state, action) => {
        state.nearbyLoading = false;
        state.nearbyTheaters = action.payload;
      })
      .addCase(fetchNearbyTheaters.rejected, (state, action) => {
        state.nearbyLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearTheaters,
  clearCurrentTheater,
  clearSearchResults,
  clearNearbyTheaters,
  setFilters,
  resetFilters,
  clearError,
  updateTheaterInList,
  setUserLocation,
} = theatersSlice.actions;

// Selectors
export const selectTheaters = (state) => state.theaters.theaters;
export const selectCurrentTheater = (state) => state.theaters.currentTheater;
export const selectTheaterShows = (state) => (theaterId) => state.theaters.theaterShows[theaterId];
export const selectSearchResults = (state) => state.theaters.searchResults;
export const selectNearbyTheaters = (state) => state.theaters.nearbyTheaters;
export const selectTheatersPagination = (state) => state.theaters.pagination;
export const selectTheatersFilters = (state) => state.theaters.filters;
export const selectTheatersLoading = (state) => state.theaters.loading;
export const selectShowsLoading = (state) => state.theaters.showsLoading;
export const selectSearchLoading = (state) => state.theaters.searchLoading;
export const selectNearbyLoading = (state) => state.theaters.nearbyLoading;
export const selectTheatersError = (state) => state.theaters.error;
export const selectUserLocation = (state) => state.theaters.userLocation;

export default theatersSlice.reducer;