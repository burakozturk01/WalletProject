import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

interface AuthRedirectProps {
  children: React.ReactNode;
}

export function AuthRedirect({ children }: AuthRedirectProps) {
  const { isAuthenticated } = useAuth();

  // If user is already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated, show the auth page (login/register)
  return <>{children}</>;
}
