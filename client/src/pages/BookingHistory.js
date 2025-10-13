import React from 'react';

const BookingHistory = () => {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Bookings</h1>
        <div className="text-center py-16">
          <h2 className="text-xl font-medium text-gray-900 mb-2">Booking History</h2>
          <p className="text-gray-600">Your past and upcoming bookings will be displayed here.</p>
        </div>
      </div>
    </div>
  );
};

export default BookingHistory;