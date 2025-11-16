import React from 'react';

const AdminHeader = ({ onToggleSidebar, sidebarCollapsed }) => {
  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <h1 className="admin-header-title">Dashboard</h1>
      </div>
    </header>
  );
};

export default AdminHeader;