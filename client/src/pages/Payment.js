import React from 'react';
import { useParams } from 'react-router-dom';

const Payment = () => {
  const { bookingId } = useParams();
  
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Payment</h1>
        <div className="text-center py-16">
          <h2 className="text-xl font-medium text-gray-900 mb-2">Payment Page</h2>
          <p className="text-gray-600">Booking ID: {bookingId}</p>
          <p className="text-gray-600 mt-2">Stripe payment integration will be implemented here.</p>
        </div>
      </div>
    </div>
  );
};

export default Payment;