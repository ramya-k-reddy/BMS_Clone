import React, { useState, useEffect } from 'react';

const AdminStats = () => {
  const [stats, setStats] = useState({
    totalMovies: 0,
    totalTheaters: 0,
    totalUsers: 0,
    totalBookings: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    activeShows: 0,
    pendingApprovals: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading stats - replace with actual API call
    const loadStats = async () => {
      try {
        // Mock data - replace with actual API calls
        setTimeout(() => {
          setStats({
            totalMovies: 156,
            totalTheaters: 45,
            totalUsers: 12547,
            totalBookings: 8923,
            todayRevenue: 45680,
            monthlyRevenue: 1234567,
            activeShows: 89,
            pendingApprovals: 12
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error loading stats:', error);
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const statCards = [
    {
      title: 'Total Movies',
      value: stats.totalMovies,
      icon: '🎬',
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      change: '+5.2%',
      changeType: 'positive'
    },
    {
      title: 'Total Theaters',
      value: stats.totalTheaters,
      icon: '🎭',
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      change: '+2.1%',
      changeType: 'positive'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: '👥',
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      change: '+12.5%',
      changeType: 'positive'
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings.toLocaleString(),
      icon: '📋',
      color: 'bg-gradient-to-r from-orange-500 to-orange-600',
      change: '+8.3%',
      changeType: 'positive'
    },
    {
      title: 'Today Revenue',
      value: `₹${stats.todayRevenue.toLocaleString()}`,
      icon: '💰',
      color: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      change: '+15.8%',
      changeType: 'positive'
    },
    {
      title: 'Monthly Revenue',
      value: `₹${stats.monthlyRevenue.toLocaleString()}`,
      icon: '📊',
      color: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
      change: '+23.1%',
      changeType: 'positive'
    },
    {
      title: 'Active Shows',
      value: stats.activeShows,
      icon: '🎟️',
      color: 'bg-gradient-to-r from-pink-500 to-pink-600',
      change: '+7.4%',
      changeType: 'positive'
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: '⏳',
      color: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
      change: '-2.1%',
      changeType: 'negative'
    }
  ];

  if (loading) {
    return (
      <div className="dashboard-stats">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="stat-card">
            <div className="loading-shimmer h-4 w-12 rounded mb-2"></div>
            <div className="loading-shimmer h-8 w-16 rounded mb-2"></div>
            <div className="loading-shimmer h-3 w-20 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="dashboard-stats">
      {statCards.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className="stat-icon" style={{background: stat.color}}>
            {stat.icon}
          </div>
          <div className="stat-value">{stat.value}</div>
          <div className="stat-label">{stat.title}</div>
          <div className={`stat-change ${stat.changeType}`}>
            <span>{stat.changeType === 'positive' ? '↗️' : '↘️'}</span>
            {stat.change}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminStats;