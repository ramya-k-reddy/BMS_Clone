import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import AdminStats from '../components/admin/AdminStats';
import api from '../services/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pendingPartners, setPendingPartners] = useState([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [approveStatus, setApproveStatus] = useState({});
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    const fetchPendingPartners = async () => {
      setLoadingPartners(true);
      try {
        const response = await api.get('/auth/partners/pending');
        if (response.data.success) {
          setPendingPartners(response.data.partners);
        }
      } catch (err) {
        console.error('Error fetching pending partners:', err);
        toast.error('Failed to load pending partners');
      }
      setLoadingPartners(false);
    };
    fetchPendingPartners();
  }, []);

  const handleApprove = async (id) => {
    setApproveStatus((prev) => ({ ...prev, [id]: 'loading' }));
    try {
      const response = await api.post(`/auth/partners/${id}/approve`);
      if (response.data.success) {
        setApproveStatus((prev) => ({ ...prev, [id]: 'approved' }));
        setPendingPartners((prev) => prev.filter((p) => p._id !== id));
        toast.success('Partner approved successfully!');
      } else {
        setApproveStatus((prev) => ({ ...prev, [id]: 'error' }));
        toast.error(response.data.message || 'Failed to approve partner');
      }
    } catch (err) {
      console.error('Error approving partner:', err);
      setApproveStatus((prev) => ({ ...prev, [id]: 'error' }));
      toast.error('Failed to approve partner');
    }
  };

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

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
            {/* Partner Approval Section - moved to top */}
            <div className="admin-table-section mt-8">
              <div className="table-header">
                <h2 className="table-title">Pending Partner Approvals</h2>
              </div>
              {loadingPartners ? (
                <div>Loading...</div>
              ) : pendingPartners.length === 0 ? (
                <div className="text-gray-400">No pending partners.</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPartners.map((partner) => (
                      <tr key={partner._id}>
                        <td>{partner.name}</td>
                        <td>{partner.email}</td>
                        <td>{partner.phone}</td>
                        <td>
                          <button
                            className="btn-primary"
                            disabled={approveStatus[partner._id] === 'loading'}
                            onClick={() => handleApprove(partner._id)}
                          >
                            {approveStatus[partner._id] === 'loading'
                              ? 'Approving...'
                              : approveStatus[partner._id] === 'approved'
                              ? 'Approved'
                              : 'Approve'}
                          </button>
                          {approveStatus[partner._id] === 'error' && (
                            <span className="text-red-500 ml-2">Error</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <AdminStats />
            {/* Dashboard Activity Section */}
            <div className="admin-activity-section mt-8">
              <div className="dashboard-activity-cards">
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">🎬</div>
                    <div>
                      <p className="text-white font-medium">New movie "Avengers: Endgame" added</p>
                      <p className="text-gray-400 text-sm">2 hours ago</p>
                    </div>
                  </div>
                  <span className="status-badge active">Success</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">🎭</div>
                    <div>
                      <p className="text-white font-medium">PVR Cinemas theater verified</p>
                      <p className="text-gray-400 text-sm">5 hours ago</p>
                    </div>
                  </div>
                  <span className="status-badge pending">Pending</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">👤</div>
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