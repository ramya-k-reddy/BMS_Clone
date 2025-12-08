import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectIsPartner, selectIsApprovedPartner, selectIsPendingPartner } from '../../store/slices/authSlice';

const PartnerRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isPartner = useSelector(selectIsPartner);
  const isApprovedPartner = useSelector(selectIsApprovedPartner);
  const isPendingPartner = useSelector(selectIsPendingPartner);
  const user = useSelector(state => state.auth.user);
  const location = useLocation();
  
  // Debug logging
  console.log('PartnerRoute DEBUG:', {
    isAuthenticated,
    isPartner,
    isApprovedPartner,
    isPendingPartner,
    user,
    userRole: user?.role,
    userApproved: user?.approved,
    location: location.pathname
  });

  if (!isAuthenticated) {
    // Redirect to login with return path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isPartner) {
    // Redirect to home if not a partner
    return <Navigate to="/" replace />;
  }

  if (isPendingPartner) {
    // Redirect to pending approval page if not approved
    return <Navigate to="/partner/pending-approval" replace />;
  }

  return children;
};

export default PartnerRoute;