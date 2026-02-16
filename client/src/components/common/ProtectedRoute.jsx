import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../context/AuthContext.jsx';

function ProtectedRoute({ roles }) {
  const { user, loading, isAuthenticated, setupRequired } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    if (setupRequired) {
      return <Navigate to="/setup" replace />;
    }
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user?.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
