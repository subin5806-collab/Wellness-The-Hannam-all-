import React from 'react';
import { PermissionScope } from '../types';
import { authService } from '../services/authService';

interface ProtectedActionProps {
  scope: PermissionScope;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedAction: React.FC<ProtectedActionProps> = ({ scope, children, fallback = null }) => {
  if (authService.hasPermission(scope)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
};
