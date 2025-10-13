import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Navigation and layout
  sidebarOpen: false,
  mobileMenuOpen: false,
  
  // Modals and dialogs
  loginModalOpen: false,
  registerModalOpen: false,
  profileModalOpen: false,
  bookingModalOpen: false,
  paymentModalOpen: false,
  
  // Loading states for specific UI components
  globalLoading: false,
  buttonLoading: {},
  
  // Notifications and alerts
  notifications: [],
  alerts: [],
  
  // User preferences
  theme: localStorage.getItem('theme') || 'light',
  city: localStorage.getItem('city') || '',
  language: localStorage.getItem('language') || 'en',
  
  // Search and filters
  searchQuery: '',
  searchHistory: JSON.parse(localStorage.getItem('searchHistory') || '[]'),
  
  // Seat selection UI
  seatSelectionMode: false,
  seatLegendVisible: true,
  
  // Booking flow
  bookingStep: 1, // 1: seat selection, 2: booking details, 3: payment, 4: confirmation
  
  // Toast messages
  toasts: [],
  
  // Screen size
  isMobile: window.innerWidth < 768,
  isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
  
  // Connectivity
  isOnline: navigator.onLine,
  
  // Page metadata
  pageTitle: 'BookMyShow',
  breadcrumbs: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Navigation and layout
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    
    setMobileMenuOpen: (state, action) => {
      state.mobileMenuOpen = action.payload;
    },
    
    // Modals
    openModal: (state, action) => {
      const modalName = `${action.payload}ModalOpen`;
      if (state.hasOwnProperty(modalName)) {
        state[modalName] = true;
      }
    },
    
    closeModal: (state, action) => {
      const modalName = `${action.payload}ModalOpen`;
      if (state.hasOwnProperty(modalName)) {
        state[modalName] = false;
      }
    },
    
    closeAllModals: (state) => {
      state.loginModalOpen = false;
      state.registerModalOpen = false;
      state.profileModalOpen = false;
      state.bookingModalOpen = false;
      state.paymentModalOpen = false;
    },
    
    // Loading states
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload;
    },
    
    setButtonLoading: (state, action) => {
      const { buttonId, loading } = action.payload;
      state.buttonLoading[buttonId] = loading;
    },
    
    clearButtonLoading: (state) => {
      state.buttonLoading = {};
    },
    
    // Notifications
    addNotification: (state, action) => {
      const notification = {
        id: Date.now() + Math.random(),
        timestamp: Date.now(),
        ...action.payload
      };
      state.notifications.unshift(notification);
      
      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    
    markNotificationAsRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // Alerts
    addAlert: (state, action) => {
      const alert = {
        id: Date.now() + Math.random(),
        timestamp: Date.now(),
        ...action.payload
      };
      state.alerts.push(alert);
    },
    
    removeAlert: (state, action) => {
      state.alerts = state.alerts.filter(a => a.id !== action.payload);
    },
    
    clearAlerts: (state) => {
      state.alerts = [];
    },
    
    // User preferences
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    
    setCity: (state, action) => {
      state.city = action.payload;
      localStorage.setItem('city', action.payload);
    },
    
    setLanguage: (state, action) => {
      state.language = action.payload;
      localStorage.setItem('language', action.payload);
    },
    
    // Search
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    
    addToSearchHistory: (state, action) => {
      const query = action.payload;
      if (query && query.trim()) {
        // Remove if already exists
        state.searchHistory = state.searchHistory.filter(item => item !== query);
        // Add to beginning
        state.searchHistory.unshift(query);
        // Keep only last 10 searches
        state.searchHistory = state.searchHistory.slice(0, 10);
        localStorage.setItem('searchHistory', JSON.stringify(state.searchHistory));
      }
    },
    
    clearSearchHistory: (state) => {
      state.searchHistory = [];
      localStorage.removeItem('searchHistory');
    },
    
    // Seat selection
    setSeatSelectionMode: (state, action) => {
      state.seatSelectionMode = action.payload;
    },
    
    toggleSeatLegend: (state) => {
      state.seatLegendVisible = !state.seatLegendVisible;
    },
    
    // Booking flow
    setBookingStep: (state, action) => {
      state.bookingStep = action.payload;
    },
    
    nextBookingStep: (state) => {
      if (state.bookingStep < 4) {
        state.bookingStep += 1;
      }
    },
    
    previousBookingStep: (state) => {
      if (state.bookingStep > 1) {
        state.bookingStep -= 1;
      }
    },
    
    resetBookingFlow: (state) => {
      state.bookingStep = 1;
    },
    
    // Toast messages
    addToast: (state, action) => {
      const toast = {
        id: Date.now() + Math.random(),
        ...action.payload
      };
      state.toasts.push(toast);
    },
    
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    },
    
    clearToasts: (state) => {
      state.toasts = [];
    },
    
    // Screen size
    setScreenSize: (state, action) => {
      const { width } = action.payload;
      state.isMobile = width < 768;
      state.isTablet = width >= 768 && width < 1024;
    },
    
    // Connectivity
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
    },
    
    // Page metadata
    setPageTitle: (state, action) => {
      state.pageTitle = action.payload;
      document.title = action.payload;
    },
    
    setBreadcrumbs: (state, action) => {
      state.breadcrumbs = action.payload;
    },
    
    addBreadcrumb: (state, action) => {
      state.breadcrumbs.push(action.payload);
    },
    
    clearBreadcrumbs: (state) => {
      state.breadcrumbs = [];
    },
  },
});

export const {
  // Navigation
  toggleSidebar,
  setSidebarOpen,
  toggleMobileMenu,
  setMobileMenuOpen,
  
  // Modals
  openModal,
  closeModal,
  closeAllModals,
  
  // Loading
  setGlobalLoading,
  setButtonLoading,
  clearButtonLoading,
  
  // Notifications
  addNotification,
  removeNotification,
  markNotificationAsRead,
  clearNotifications,
  
  // Alerts
  addAlert,
  removeAlert,
  clearAlerts,
  
  // Preferences
  setTheme,
  setCity,
  setLanguage,
  
  // Search
  setSearchQuery,
  addToSearchHistory,
  clearSearchHistory,
  
  // Seat selection
  setSeatSelectionMode,
  toggleSeatLegend,
  
  // Booking flow
  setBookingStep,
  nextBookingStep,
  previousBookingStep,
  resetBookingFlow,
  
  // Toasts
  addToast,
  removeToast,
  clearToasts,
  
  // Screen size
  setScreenSize,
  
  // Connectivity
  setOnlineStatus,
  
  // Page metadata
  setPageTitle,
  setBreadcrumbs,
  addBreadcrumb,
  clearBreadcrumbs,
} = uiSlice.actions;

// Selectors
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectMobileMenuOpen = (state) => state.ui.mobileMenuOpen;
export const selectModalOpen = (state) => (modalName) => state.ui[`${modalName}ModalOpen`];
export const selectGlobalLoading = (state) => state.ui.globalLoading;
export const selectButtonLoading = (state) => (buttonId) => state.ui.buttonLoading[buttonId] || false;
export const selectNotifications = (state) => state.ui.notifications;
export const selectUnreadNotifications = (state) => state.ui.notifications.filter(n => !n.read);
export const selectAlerts = (state) => state.ui.alerts;
export const selectTheme = (state) => state.ui.theme;
export const selectCity = (state) => state.ui.city;
export const selectLanguage = (state) => state.ui.language;
export const selectSearchQuery = (state) => state.ui.searchQuery;
export const selectSearchHistory = (state) => state.ui.searchHistory;
export const selectSeatSelectionMode = (state) => state.ui.seatSelectionMode;
export const selectSeatLegendVisible = (state) => state.ui.seatLegendVisible;
export const selectBookingStep = (state) => state.ui.bookingStep;
export const selectToasts = (state) => state.ui.toasts;
export const selectIsMobile = (state) => state.ui.isMobile;
export const selectIsTablet = (state) => state.ui.isTablet;
export const selectIsOnline = (state) => state.ui.isOnline;
export const selectPageTitle = (state) => state.ui.pageTitle;
export const selectBreadcrumbs = (state) => state.ui.breadcrumbs;

export default uiSlice.reducer;