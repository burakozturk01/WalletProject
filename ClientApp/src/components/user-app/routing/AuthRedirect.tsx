import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

interface AuthRedirectProps {
    children: React.ReactNode;
}

export function AuthRedirect({ children }: AuthRedirectProps) {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}
