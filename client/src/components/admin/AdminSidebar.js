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
      ]
    },
    {
      section: 'Content Management',
      items: [
        { path: '/admin/movies', label: 'Movies', icon: '🎬' },
        { path: '/admin/theaters', label: 'Theaters', icon: '🎭' },
        { path: '/admin/shows', label: 'Shows', icon: '🎟️' },
      ]
    }
  ];

  return (
    <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo-container">
          <div className="bms-logo">
            <span className="logo-book">book</span>
            <span className="logo-my">my</span>
            <span className="logo-show">show</span>
          </div>
        </div>
        {!collapsed && (
          <div className="admin-subtitle">Admin Panel</div>
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