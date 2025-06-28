import React from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Demo mode - all routes are accessible without authentication
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Simply render children without any authentication checks
  return <>{children}</>;
};

export default ProtectedRoute;

export default ProtectedRoute;