import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { movieAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Async thunks
export const fetchMovies = createAsyncThunk(
  'movies/fetchMovies',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await movieAPI.getMovies(params);
      if (response.data.success) {
        return {
          movies: response.data.data.movies,
          pagination: response.data.data.pagination,
          params
        };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch movies';
      return rejectWithValue(message);
    }
  }
);

export const fetchMovieById = createAsyncThunk(
  'movies/fetchMovieById',
  async (movieId, { rejectWithValue }) => {
    try {
      const response = await movieAPI.getMovieById(movieId);
      if (response.data.success) {
        return response.data.data.movie;
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch movie details';
      return rejectWithValue(message);
    }
  }
);

export const searchMovies = createAsyncThunk(
  'movies/searchMovies',
  async (query, { rejectWithValue }) => {
    try {
      const response = await movieAPI.searchMovies(query);
      if (response.data.success) {
        return response.data.data.movies;
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Search failed';
      return rejectWithValue(message);
    }
  }
);

export const addMovieReview = createAsyncThunk(
  'movies/addMovieReview',
  async ({ movieId, rating, comment }, { rejectWithValue }) => {
    try {
      const response = await movieAPI.addReview(movieId, rating, comment);
      if (response.data.success) {
        toast.success('Review added successfully');
        return response.data.data.movie;
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add review';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchMovieShows = createAsyncThunk(
  'movies/fetchMovieShows',
  async ({ movieId, city, date }, { rejectWithValue }) => {
    try {
      const response = await movieAPI.getMovieShows(movieId, { city, date });
      if (response.data.success) {
        return {
          movieId,
          shows: response.data.data.shows,
          theaters: response.data.data.theaters
        };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch shows';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  movies: [],
  currentMovie: null,
  searchResults: [],
  movieShows: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  },
  filters: {
    genre: '',
    language: '',
    city: '',
    rating: 0,
    sortBy: 'popularity'
  },
  loading: false,
  searchLoading: false,
  showsLoading: false,
  error: null,
  searchQuery: '',
};

const moviesSlice = createSlice({
  name: 'movies',
  initialState,
  reducers: {
    clearMovies: (state) => {
      state.movies = [];
      state.pagination = initialState.pagination;
    },
    clearCurrentMovie: (state) => {
      state.currentMovie = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchQuery = '';
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
    updateMovieInList: (state, action) => {
      const index = state.movies.findIndex(movie => movie._id === action.payload._id);
      if (index !== -1) {
        state.movies[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch movies cases
      .addCase(fetchMovies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMovies.fulfilled, (state, action) => {
        state.loading = false;
        const { movies, pagination, params } = action.payload;
        
        // If it's a new search/filter, replace movies, otherwise append for pagination
        if (params.page === 1) {
          state.movies = movies;
        } else {
          state.movies = [...state.movies, ...movies];
        }
        
        state.pagination = pagination;
      })
      .addCase(fetchMovies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch movie by ID cases
      .addCase(fetchMovieById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMovieById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMovie = action.payload;
      })
      .addCase(fetchMovieById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Search movies cases
      .addCase(searchMovies.pending, (state) => {
        state.searchLoading = true;
      })
      .addCase(searchMovies.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchMovies.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.payload;
      })
      
      // Add review cases
      .addCase(addMovieReview.fulfilled, (state, action) => {
        if (state.currentMovie && state.currentMovie._id === action.payload._id) {
          state.currentMovie = action.payload;
        }
        // Update in movies list as well
        const index = state.movies.findIndex(movie => movie._id === action.payload._id);
        if (index !== -1) {
          state.movies[index] = action.payload;
        }
      })
      
      // Fetch movie shows cases
      .addCase(fetchMovieShows.pending, (state) => {
        state.showsLoading = true;
      })
      .addCase(fetchMovieShows.fulfilled, (state, action) => {
        state.showsLoading = false;
        const { movieId, shows, theaters } = action.payload;
        state.movieShows[movieId] = { shows, theaters };
      })
      .addCase(fetchMovieShows.rejected, (state, action) => {
        state.showsLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearMovies,
  clearCurrentMovie,
  clearSearchResults,
  setFilters,
  resetFilters,
  clearError,
  updateMovieInList,
} = moviesSlice.actions;

// Selectors
export const selectMovies = (state) => state.movies.movies;
export const selectCurrentMovie = (state) => state.movies.currentMovie;
export const selectSearchResults = (state) => state.movies.searchResults;
export const selectMovieShows = (state) => (movieId) => state.movies.movieShows[movieId];
export const selectMoviesPagination = (state) => state.movies.pagination;
export const selectMoviesFilters = (state) => state.movies.filters;
export const selectMoviesLoading = (state) => state.movies.loading;
export const selectSearchLoading = (state) => state.movies.searchLoading;
export const selectShowsLoading = (state) => state.movies.showsLoading;
export const selectMoviesError = (state) => state.movies.error;

export default moviesSlice.reducer;