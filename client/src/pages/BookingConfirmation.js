import React from 'react';
import { useParams } from 'react-router-dom';

const BookingConfirmation = () => {
  const { bookingId } = useParams();
  
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Booking Confirmation</h1>
        <div className="text-center py-16">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-600">Booking ID: {bookingId}</p>
            <p className="text-gray-600 mt-2">Your tickets have been booked successfully. Confirmation details and ticket download options will be available here.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;