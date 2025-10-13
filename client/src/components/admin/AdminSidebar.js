import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const AdminSidebar = ({ collapsed }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path);

  const menuItems = [
    {
      section: 'Overview',
      items: [
        { path: '/admin', label: 'Dashboard', icon: '📊' },
        { path: '/admin/analytics', label: 'Analytics', icon: '📈' },
      ]
    },
    {
      section: 'Content Management',
      items: [
        { path: '/admin/movies', label: 'Movies', icon: '🎬' },
        { path: '/admin/theaters', label: 'Theaters', icon: '🎭' },
        { path: '/admin/shows', label: 'Shows', icon: '🎟️' },
      ]
    },
    {
      section: 'User Management',
      items: [
        { path: '/admin/users', label: 'Users', icon: '👥' },
        { path: '/admin/bookings', label: 'Bookings', icon: '📋' },
        { path: '/admin/payments', label: 'Payments', icon: '💳' },
      ]
    },
    {
      section: 'Settings',
      items: [
        { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
        { path: '/admin/reports', label: 'Reports', icon: '📄' },
      ]
    }
  ];

  return (
    <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="admin-logo">
          BMS
        </div>
        {!collapsed && (
          <>
            <div className="admin-title">Admin Panel</div>
            <div className="admin-subtitle">BookMyShow</div>
          </>
        )}
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className="nav-section">
            {!collapsed && (
              <div className="nav-section-title">{section.section}</div>
            )}
            {section.items.map((item, itemIndex) => (
              <Link
                key={itemIndex}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                title={collapsed ? item.label : ''}
              >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;