import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout, selectUser, silentVerifyToken } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

const PendingApproval = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const handleRefreshStatus = () => {
    dispatch(silentVerifyToken());
  };

  // Check for approval status every 30 seconds
  useEffect(() => {
    const checkApprovalStatus = () => {
      dispatch(silentVerifyToken());
    };

    // Check immediately when component mounts
    checkApprovalStatus();

    // Set up interval to check every 30 seconds
    const interval = setInterval(checkApprovalStatus, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [dispatch]);

  // Redirect if user gets approved
  useEffect(() => {
    console.log('PendingApproval redirect check:', {
      userRole: user?.role,
      userApproved: user?.approved,
      shouldRedirect: user?.role === 'partner' && user?.approved === true
    });
    
    if (user?.role === 'partner' && user?.approved === true) {
      console.log('PendingApproval: Redirecting to /partner/shows');
      navigate('/partner/shows', { replace: true });
    }
  }, [user?.approved, user?.role, navigate]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Approval Pending</h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Hi <span className="font-semibold text-gray-800">{user?.name}</span>, your partner account is currently pending approval from our admin team.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-yellow-800 mb-4">What happens next?</h2>
          <ul className="text-yellow-700 text-left space-y-3">
            <li className="flex items-start">
              <span className="text-yellow-600 mr-3 mt-1">•</span>
              <span>Our admin team will review your application</span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-600 mr-3 mt-1">•</span>
              <span>You'll receive an email once approved</span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-600 mr-3 mt-1">•</span>
              <span>This usually takes 24-48 hours</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="font-semibold text-gray-700 mb-2">Account Details:</div>
            <div className="space-y-1">
              <div><span className="font-medium">Email:</span> {user?.email || 'N/A'}</div>
              <div><span className="font-medium">Phone:</span> {user?.phone || user?.phoneNumber || 'N/A'}</div>
            </div>
          </div>

          <button
            onClick={handleRefreshStatus}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] mb-3"
          >
            Check Approval Status
          </button>

          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
          >
            Logout
          </button>

          <p className="text-sm text-gray-500 mt-6 leading-relaxed">
            Need help? Contact support at <span className="text-blue-600 font-medium">support@bookmyshow.com</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;