import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import moviesReducer from './slices/moviesSlice';
import theatersReducer from './slices/theatersSlice';
import bookingsReducer from './slices/bookingsSlice';
import seatsReducer from './slices/seatsSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    movies: moviesReducer,
    theaters: theatersReducer,
    bookings: bookingsReducer,
    seats: seatsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Export store for use in components
export default store;