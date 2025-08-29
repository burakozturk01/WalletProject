import React, { useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { LoginForm } from '../../auth/LoginForm';
import { useAuth } from '../../../../hooks/useAuth';

export function LoginPage() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Get the intended destination from location state, default to dashboard
    const from = location.state?.from?.pathname || '/dashboard';

    // Redirect to intended destination if already authenticated
    if (isAuthenticated) {
        return <Navigate to={from} replace />;
    }

    const handleSwitchToRegister = () => {
        navigate('/register', { state: { from: location.state?.from } });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <LoginForm onSwitchToRegister={handleSwitchToRegister} />
            </div>
        </div>
    );
}
