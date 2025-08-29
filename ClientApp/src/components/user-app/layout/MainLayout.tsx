import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar, HeaderBar } from './';
import { useAuth } from '../../../hooks/useAuth';
import { useThemeClasses } from '../../../contexts/ThemeContext';

export interface MainLayoutProps {
    dark?: boolean;
}

export function MainLayout({ dark = true }: MainLayoutProps) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const themeClasses = useThemeClasses();

    // Get the current page title from the pathname
    const getPageTitle = (pathname: string) => {
        switch (pathname) {
            case '/dashboard':
                return 'Dashboard';
            case '/accounts':
                return 'Accounts';
            case '/transactions':
                return 'Transactions';
            case '/transfer-pay':
                return 'Transfer & Pay';
            case '/settings':
                return 'Settings';
            default:
                return 'Dashboard';
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const currentTitle = getPageTitle(location.pathname);

    return (
        <div className={`min-h-screen p-6 font-sans ${themeClasses.bg.secondary}`}>
            <div className="flex h-full">
                <Sidebar
                    userName={user?.username || 'error'}
                    dark={dark}
                    onLogout={handleLogout}
                />
                <main className={`flex-1 ${themeClasses.bg.primary}`}>
                    <HeaderBar title={currentTitle} />
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
