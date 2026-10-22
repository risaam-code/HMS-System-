import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { UserRole, PermissionName } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { LoadingPage } from './LoadingPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: PermissionName;
}

/**
 * Route protection wrapper enforcing authentication and role-based permissions (RBAC).
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  requiredPermission,
}: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading, role, hasPermission, hasRole } = useAuth();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check granular permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <Navigate
        to="/unauthorized"
        state={{
          requiredPermission,
          userRole: role,
          attemptedPath: location.pathname,
        }}
        replace
      />
    );
  }

  // Check role requirement
  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return (
      <Navigate
        to="/unauthorized"
        state={{
          allowedRoles,
          userRole: role,
          attemptedPath: location.pathname,
        }}
        replace
      />
    );
  }

  return <>{children}</>;
}
