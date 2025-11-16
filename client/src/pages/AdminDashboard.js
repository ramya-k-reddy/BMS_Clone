import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser, selectIsAdmin } from '../store/slices/authSlice';
import { Navigate } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import AdminStats from '../components/admin/AdminStats';
import '../styles/Admin.css';

const AdminDashboard = () => {
  const user = useSelector(selectUser);
  const isAdmin = useSelector(selectIsAdmin);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Redirect if not admin
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="admin-container">
      <div className="admin-layout">
        <AdminSidebar collapsed={sidebarCollapsed} />
        <div className={`admin-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <AdminHeader 
            user={user} 
            onToggleSidebar={toggleSidebar} 
            sidebarCollapsed={sidebarCollapsed}
          />
          <div className="admin-content">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">Dashboard Overview</h1>
              <p className="text-gray-400">Welcome back, {user?.name}! Here's what's happening today.</p>
            </div>
            
            <AdminStats />

            {/* Recent Activity */}
            <div className="admin-table-section">
              <div className="table-header">
                <h2 className="table-title">Recent Activity</h2>
                <a href="/admin/activity" className="btn-secondary">View All</a>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      ✓
                    </div>
                    <div>
                      <p className="text-white font-medium">New movie "Avengers: Endgame" added</p>
                      <p className="text-gray-400 text-sm">2 hours ago</p>
                    </div>
                  </div>
                  <span className="status-badge active">Success</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      🎭
                    </div>
                    <div>
                      <p className="text-white font-medium">PVR Cinemas theater verified</p>
                      <p className="text-gray-400 text-sm">5 hours ago</p>
                    </div>
                  </div>
                  <span className="status-badge pending">Pending</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      👤
                    </div>
                    <div>
                      <p className="text-white font-medium">15 new user registrations</p>
                      <p className="text-gray-400 text-sm">1 day ago</p>
                    </div>
                  </div>
                  <span className="status-badge active">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;