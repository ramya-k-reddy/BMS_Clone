import React from 'react';
import { useParams } from 'react-router-dom';

const SeatSelection = () => {
  const { movieId, showId } = useParams();
  
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Seat Selection</h1>
        <div className="text-center py-16">
          <h2 className="text-xl font-medium text-gray-900 mb-2">Seat Selection Page</h2>
          <p className="text-gray-600">Movie ID: {movieId}</p>
          <p className="text-gray-600">Show ID: {showId}</p>
          <p className="text-gray-600 mt-2">Interactive seat map and real-time seat selection will be implemented here.</p>
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;