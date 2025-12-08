import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { selectUser, selectIsAuthenticated } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [seatUpdates, setSeatUpdates] = useState({});
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token && isAuthenticated) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        auth: {
          token: token
        },
        transports: ['websocket']
      });

      newSocket.on('connect', () => {
        console.log('Connected to socket server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from socket server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      // Listen for seat updates
      newSocket.on('seatUpdated', (data) => {
        setSeatUpdates(prev => ({
          ...prev,
          [`${data.showId}-${data.seatNumber}`]: {
            ...data,
            timestamp: Date.now()
          }
        }));

        // Show notification if it's not the current user's action
        if (data.userId !== user?.id) {
          if (data.isBooked) {
            toast.info(`Seat ${data.seatNumber} was just booked by another user`);
          } else if (data.isLocked) {
            toast.warning(`Seat ${data.seatNumber} is being selected by another user`);
          } else {
            toast.info(`Seat ${data.seatNumber} is now available`);
          }
        }
      });

      // Listen for booking confirmations
      newSocket.on('bookingConfirmed', (data) => {
        if (data.userId === user?.id) {
          toast.success('Your booking has been confirmed!');
        } else {
          // Update seat availability for other users
          setSeatUpdates(prev => ({
            ...prev,
            ...data.seats.reduce((acc, seat) => {
              acc[`${data.showId}-${seat}`] = {
                showId: data.showId,
                seatNumber: seat,
                isBooked: true,
                isLocked: false,
                userId: data.userId,
                timestamp: Date.now()
              };
              return acc;
            }, {})
          }));
        }
      });

      // Listen for booking cancellations
      newSocket.on('bookingCancelled', (data) => {
        if (data.userId === user?.id) {
          toast.success('Your booking has been cancelled');
        } else {
          // Update seat availability for other users
          setSeatUpdates(prev => ({
            ...prev,
            ...data.seats.reduce((acc, seat) => {
              acc[`${data.showId}-${seat}`] = {
                showId: data.showId,
                seatNumber: seat,
                isBooked: false,
                isLocked: false,
                userId: null,
                timestamp: Date.now()
              };
              return acc;
            }, {})
          }));
          toast.info('Some seats have become available');
        }
      });

      // Listen for seat lock expiry
      newSocket.on('seatLockExpired', (data) => {
        setSeatUpdates(prev => ({
          ...prev,
          ...data.seats.reduce((acc, seat) => {
            acc[`${data.showId}-${seat}`] = {
              showId: data.showId,
              seatNumber: seat,
              isBooked: false,
              isLocked: false,
              userId: null,
              timestamp: Date.now()
            };
            return acc;
          }, {})
        }));

        if (data.userId === user?.id) {
          toast.error('Your seat selection has expired. Please select seats again.');
        } else {
          toast.info('Some previously selected seats are now available');
        }
      });

      // Listen for show updates
      newSocket.on('showUpdated', (data) => {
        toast.info(`Show "${data.movieTitle}" has been updated`);
      });

      // Listen for new shows
      newSocket.on('newShow', (data) => {
        toast.success(`New show added: "${data.movieTitle}" at ${data.theaterName}`);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [token, user, isAuthenticated]);

  // Join a show room for real-time updates
  const joinShow = (showId) => {
    if (socket && isConnected) {
      socket.emit('joinShow', { showId });
      console.log(`Joined show room: ${showId}`);
    }
  };

  // Leave a show room
  const leaveShow = (showId) => {
    if (socket && isConnected) {
      socket.emit('leaveShow', { showId });
      console.log(`Left show room: ${showId}`);
    }
  };

  // Select seats (lock them temporarily)
  const selectSeats = (showId, seats) => {
    if (socket && isConnected) {
      socket.emit('selectSeats', { showId, seats });
    }
  };

  // Release selected seats
  const releaseSeats = (showId, seats) => {
    if (socket && isConnected) {
      socket.emit('releaseSeats', { showId, seats });
    }
  };

  // Get real-time seat status
  const getSeatStatus = (showId, seatNumber) => {
    const key = `${showId}-${seatNumber}`;
    return seatUpdates[key] || null;
  };

  // Clear seat updates for a specific show
  const clearSeatUpdates = (showId) => {
    setSeatUpdates(prev => {
      const filtered = {};
      Object.keys(prev).forEach(key => {
        if (!key.startsWith(`${showId}-`)) {
          filtered[key] = prev[key];
        }
      });
      return filtered;
    });
  };

  // Send typing indicator for chat (future feature)
  const sendTyping = (room) => {
    if (socket && isConnected) {
      socket.emit('typing', { room, user: user?.name });
    }
  };

  // Stop typing indicator
  const stopTyping = (room) => {
    if (socket && isConnected) {
      socket.emit('stopTyping', { room });
    }
  };

  const value = {
    socket,
    isConnected,
    seatUpdates,
    joinShow,
    leaveShow,
    selectSeats,
    releaseSeats,
    getSeatStatus,
    clearSeatUpdates,
    sendTyping,
    stopTyping
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;